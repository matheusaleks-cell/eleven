"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guard";
import { getActiveFinancialRates, ratesFromCycleOrDefault, computeUnitFinancials } from "@/lib/financial-calc";

export async function getDashboardStats(filters?: { investorId?: string; startDate?: string; endDate?: string }) {
  const session = await requireSession("ADMIN");
  if (!session) {
    return {
      activeProjects: 0, completedProjects: 0, totalRevenue: 0, totalInvestorShare: 0,
      totalCompanyShare: 0, totalTaxes: 0, totalOperationalCosts: 0, totalUnitCosts: 0,
      weaponsSold: 0, weaponsInStock: 0, weaponsReserved: 0, weaponsImported: 0,
      activeLotsProgress: [] as any[], dataMode: "LEGACY",
    };
  }

  let projects: any[] = [];
  let projectsWhere: any = {};
  if (filters?.investorId && filters.investorId !== "ALL") {
    projectsWhere.investorId = filters.investorId;
  }

  try {
    projects = await prisma.investmentProject.findMany({
      where: projectsWhere,
      include: {
        cycles: true,
        importLots: { include: { weapons: true } }
      }
    });
  } catch (error) {
    console.error("[Stats] Erro ao buscar projetos:", error);
  }

  const activeProjects = projects.filter(p => p.status === "ACTIVE").length;
  const completedProjects = projects.filter(p => p.status === "COMPLETED").length;

  let totalRevenue = 0;
  let totalInvestorShare = 0;
  let totalCompanyShare = 0;
  let totalTaxes = 0;
  let totalOperationalCosts = 0;
  let totalUnitCosts = 0;

  // Mesmo breakdown financeiro dos totais acima, mas por lote — pra mostrar no
  // Dashboard quanto cada lote vendeu e como foi redistribuído (investidor/empresa),
  // não só a % de unidades que já existia em activeLotsProgress.
  const lotFinancials = new Map<string, { grossRevenue: number; investorShare: number; companyShare: number; taxAmount: number; operationalAmount: number }>();
  const addToLot = (lotId: string | null | undefined, fin: { saleValue: number; investorShare: number; companyShare: number; taxAmount: number; operationalAmount: number }) => {
    if (!lotId) return;
    const cur = lotFinancials.get(lotId) || { grossRevenue: 0, investorShare: 0, companyShare: 0, taxAmount: 0, operationalAmount: 0 };
    cur.grossRevenue += fin.saleValue;
    cur.investorShare += fin.investorShare;
    cur.companyShare += fin.companyShare;
    cur.taxAmount += fin.taxAmount;
    cur.operationalAmount += fin.operationalAmount;
    lotFinancials.set(lotId, cur);
  };

  let startDateObj = filters?.startDate ? new Date(filters.startDate) : null;
  let endDateObj = filters?.endDate ? new Date(filters.endDate) : null;
  if (endDateObj) endDateObj.setHours(23, 59, 59, 999);

  // Verificar se há armas físicas VENDIDAS
  const totalPhysicalSold = projects.reduce((acc, p) =>
    acc + p.importLots.reduce((a: number, lot: any) =>
      a + lot.weapons.filter((w: any) => w.currentStatus === "VENDIDA").length, 0
    ), 0
  );

  const financialDefaults = await getActiveFinancialRates();

  // ── MODO FÍSICO EXCLUSIVO: cada arma vendida contabilizada individualmente ──
  projects.forEach(p => {
    const splitPct = p.profitSplitPct || 0.50;
    p.importLots?.forEach((lot: any) => {
      const uCostAvg = lot.quantityItems > 0 ? (lot.totalCostNationalized / lot.quantityItems) : 0;
      const lotCycle = p.cycles?.find((c: any) => c.importLotId === lot.id);
      const rates = ratesFromCycleOrDefault(lotCycle, financialDefaults);
      lot.weapons?.forEach((w: any) => {
        if (w.currentStatus !== "VENDIDA") return;
        const wDate = w.saleDate ? new Date(w.saleDate) : new Date(w.updatedAt || w.createdAt);
        if (startDateObj && wDate < startDateObj) return;
        if (endDateObj && wDate > endDateObj) return;
        const uCost = w.unitCost || uCostAvg;
        const sValue = w.saleValue || 0;
        const fin = computeUnitFinancials(sValue, uCost, splitPct, rates);
        totalRevenue += fin.saleValue;
        totalInvestorShare += fin.investorShare;
        totalCompanyShare += fin.companyShare;
        totalTaxes += fin.taxAmount;
        totalOperationalCosts += fin.operationalAmount;
        totalUnitCosts += fin.unitCost;
        addToLot(lot.id, fin);
      });
    });
  });

  // Status de armas
  let weaponsSold = 0;
  let weaponsInStock = 0;
  let weaponsReserved = 0;
  let weaponsImported = 0;

  try {
    // Só entram armas de lotes vinculados a um projeto de investidor real —
    // lotes "próprios" (sem investmentProjectId) não aparecem no dashboard do investidor.
    let weaponsWhere: any = { importLot: { investmentProjectId: { not: null } } };
    if (filters?.investorId && filters.investorId !== "ALL") {
      weaponsWhere.importLot.investmentProject = { investorId: filters.investorId };
    }
    const allWeapons = await prisma.weaponMap.findMany({
      where: weaponsWhere,
      select: { currentStatus: true }
    });
    allWeapons.forEach(w => {
      if (w.currentStatus === "VENDIDA") weaponsSold++;
      else if (w.currentStatus === "ESTOQUE") weaponsInStock++;
      else if (w.currentStatus === "RESERVADA") weaponsReserved++;
      else if (w.currentStatus === "IMPORTADA") weaponsImported++;
    });
  } catch (err) {
    console.error("Erro ao computar status de armas:", err);
  }

  // Progresso de liquidação de lotes
  const activeLotsProgress: any[] = [];
  try {
    // Idem: só lotes vinculados a um projeto de investidor real entram no
    // painel de liquidação do dashboard. Lotes próprios ficam só na Importação.
    let lotsWhere: any = { status: { not: "LIQUIDADO" }, investmentProjectId: { not: null } };
    if (filters?.investorId && filters.investorId !== "ALL") {
      lotsWhere.investmentProject = { investorId: filters.investorId };
    }
    const activeLots = await prisma.importLot.findMany({
      where: lotsWhere,
      include: {
        weapons: true,
        investmentProject: { include: { investor: true } }
      }
    });

    activeLots.forEach(lot => {
      const sold = lot.weapons.filter(w => w.currentStatus === "VENDIDA").length;
      const total = lot.quantityItems || lot.weapons.length || 1;
      const pct = total > 0 ? (sold / total) * 100 : 0;
      const lotFin = lotFinancials.get(lot.id);
      activeLotsProgress.push({
        id: lot.id,
        batchCode: lot.batchCode,
        projectName: lot.investmentProject?.name || "Lote Próprio",
        investorName: lot.investmentProject?.investor?.name || "Eleven Armas",
        sold,
        total,
        percentage: parseFloat(pct.toFixed(1)),
        grossRevenue: lotFin?.grossRevenue || 0,
        investorShare: lotFin?.investorShare || 0,
        companyShare: lotFin?.companyShare || 0,
        taxAmount: lotFin?.taxAmount || 0,
        operationalAmount: lotFin?.operationalAmount || 0,
      });
    });
  } catch (err) {
    console.error("Erro ao buscar progresso dos lotes:", err);
  }

  return {
    activeProjects,
    completedProjects,
    totalRevenue,
    totalInvestorShare,
    totalCompanyShare,
    totalTaxes,
    totalOperationalCosts,
    totalUnitCosts,
    weaponsSold,
    weaponsInStock,
    weaponsReserved,
    weaponsImported,
    activeLotsProgress,
    dataMode: "PHYSICAL"
  };
}

export async function getRecentProjects(investorId?: string) {
  const session = await requireSession("ADMIN");
  if (!session) return [];

  try {
    let projectsWhere: any = {};
    if (investorId && investorId !== "ALL") {
      projectsWhere.investorId = investorId;
    }
    const projects = await prisma.investmentProject.findMany({
      where: projectsWhere,
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        investor: true,
        cycles: true,
        importLots: {
          include: {
            weapons: true
          }
        }
      }
    });

    const financialDefaults = await getActiveFinancialRates();

    return projects.map(p => {
      let realizedInvestorProfit = 0;
      const splitPct = p.profitSplitPct || 0.50;

      p.importLots?.forEach((lot: any) => {
        const uCostAvg = lot.quantityItems > 0 ? (lot.totalCostNationalized / lot.quantityItems) : 0;
        const lotCycle = p.cycles?.find((c: any) => c.importLotId === lot.id);
        const rates = ratesFromCycleOrDefault(lotCycle, financialDefaults);

        lot.weapons?.forEach((w: any) => {
          if (w.currentStatus === "VENDIDA") {
            const uCost = w.unitCost || uCostAvg;
            const sValue = w.saleValue || 0;
            const fin = computeUnitFinancials(sValue, uCost, splitPct, rates);
            realizedInvestorProfit += fin.investorShare;
          }
        });
      });

      return {
        id: p.id,
        name: p.name,
        product_name: p.productName,
        investorName: p.investor?.name ?? "Investidor",
        currentCycle: p.cycles.length,
        max_cycles: p.maxCycles,
        currentCapital: (p.initialCapital || 0) + realizedInvestorProfit,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
        cycles: p.cycles,
        importLots: p.importLots
      };
    });
  } catch (error) {
    console.error("Erro ao buscar projetos recentes:", error);
    return [];
  }
}
export async function getGlobalHeaderStats() {
  const session = await requireSession("ADMIN");
  if (!session) return { monthlySales: 0, inventoryValue: 0, averageMargin: 0, lastUsdRate: 5.82 };

  try {
    const now = new Date();
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Vendas do Mês
    const monthOrders = await prisma.salesOrder.findMany({
      where: {
        createdAt: { gte: firstDayMonth }
      }
    });
    const monthlySales = monthOrders.reduce((acc, o) => acc + (o.totalValue || 0), 0);

    // 2. Patrimônio em Estoque (Custo Imobilizado)
    const stockWeapons = await prisma.weaponMap.findMany({
      where: {
        currentStatus: { in: ["ESTOQUE", "RESERVADA"] }
      }
    });
    const inventoryValue = stockWeapons.reduce((acc, w) => acc + (w.unitCost || 0), 0);

    // 3. Margem Média Real (Lucro sobre o que já foi vendido)
    const soldWeapons = await prisma.weaponMap.findMany({
      where: {
        currentStatus: "VENDIDA"
      }
    });
    
    let totalSaleValue = 0;
    let totalCostValue = 0;
    
    soldWeapons.forEach(w => {
      totalSaleValue += (w.saleValue || 0);
      totalCostValue += (w.unitCost || 0);
    });

    const averageMargin = totalSaleValue > 0 
      ? ((totalSaleValue - totalCostValue) / totalSaleValue) * 100 
      : 32.5; // Fallback para margem projetada se não houver vendas

    // 4. Cotação do Dólar em Tempo Real (via AwesomeAPI)
    let lastUsdRate = 5.82;
    try {
      const response = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL", { next: { revalidate: 3600 } });
      const data = await response.json();
      lastUsdRate = parseFloat(data.USDBRL.bid);
    } catch (apiError) {
      console.warn("[USD API] Falha ao buscar cotação real, tentando banco de dados...");
      const lastLot = await prisma.importLot.findFirst({
        where: { currency: "USD" },
        orderBy: { createdAt: "desc" }
      });
      lastUsdRate = lastLot?.exchangeRate || 5.82;
    }

    return {
      monthlySales,
      inventoryValue,
      averageMargin: parseFloat(averageMargin.toFixed(1)),
      lastUsdRate
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas do header:", error);
    return { monthlySales: 0, inventoryValue: 0, averageMargin: 0, lastUsdRate: 5.82 };
  }
}
