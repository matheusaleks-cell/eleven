"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardStats(filters?: { investorId?: string; startDate?: string; endDate?: string }) {
  // Buscar projetos com ciclos e lotes (fonte principal de dados)
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
        importLots: {
          include: {
            weapons: true
          }
        }
      }
    });
  } catch (error) {
    console.error("[Stats] Erro ao buscar projetos:", error);
  }

  const activeProjects = projects.filter(p => p.status === "ACTIVE").length;
  const completedProjects = projects.filter(p => p.status === "COMPLETED").length;

  // Calcular totais
  let totalRevenue = 0;
  let totalInvestorShare = 0;
  let totalCompanyShare = 0;

  // Datas
  let startDateObj = filters?.startDate ? new Date(filters.startDate) : null;
  let endDateObj = filters?.endDate ? new Date(filters.endDate) : null;
  if (endDateObj) {
    endDateObj.setHours(23, 59, 59, 999);
  }

  projects.forEach(p => {
    // 1. Somar ciclos legados adicionais (que não possuem lote associado com armas)
    p.cycles?.forEach((c: any) => {
      if (c.status === "COMPLETED") {
        const hasAssociatedLotWithWeapons = p.importLots?.some((l: any) => l.id === c.importLotId && l.weapons && l.weapons.length > 0);
        if (!hasAssociatedLotWithWeapons) {
          const cDate = new Date(c.updatedAt || c.createdAt);
          if (startDateObj && cDate < startDateObj) return;
          if (endDateObj && cDate > endDateObj) return;

          totalRevenue += Number(c.grossRevenue) || 0;
          totalInvestorShare += Number(c.investorShare) || 0;
          totalCompanyShare += Number(c.companyShare) || 0;
        }
      }
    });

    // 2. Somar vendas reais de todas as armas de todos os lotes do projeto (ativos ou liquidados)
    p.importLots?.forEach((lot: any) => {
      const lotCycle = p.cycles?.find((c: any) => c.importLotId === lot.id);
      let deductionRate = 0.23; // fallback 23%
      let uCostAvg = lot.quantityItems > 0 ? (lot.totalCostNationalized / lot.quantityItems) : 0;
      let splitPct = p.profitSplitPct || 0.50;

      if (lotCycle && lotCycle.grossRevenue > 0) {
        deductionRate = ((lotCycle.salesTax || 0) + (lotCycle.salesOperationalCost || 0)) / lotCycle.grossRevenue;
      }

      // Se o lote tem armas cadastradas, calculamos o faturamento real com base nas armas vendidas
      if (lot.weapons && lot.weapons.length > 0) {
        lot.weapons.forEach((w: any) => {
          if (w.currentStatus === "VENDIDA") {
            const wDate = w.saleDate ? new Date(w.saleDate) : new Date(w.updatedAt || w.createdAt);
            if (startDateObj && wDate < startDateObj) return;
            if (endDateObj && wDate > endDateObj) return;

            const uCost = w.unitCost || uCostAvg;
            const sValue = w.saleValue || 0;
            const weaponDeductions = sValue * deductionRate;
            const netProfit = sValue - uCost - weaponDeductions;

            const invShare = netProfit > 0 ? netProfit * splitPct : 0;
            const compShare = netProfit > 0 ? netProfit * (1 - splitPct) : 0;

            totalRevenue += sValue;
            totalInvestorShare += invShare;
            totalCompanyShare += compShare;
          }
        });
      } else {
        // Fallback para lotes legados sem armas mapeadas no banco
        if (lotCycle && lotCycle.status === "COMPLETED") {
          const cDate = new Date(lotCycle.updatedAt || lotCycle.createdAt);
          if (startDateObj && cDate < startDateObj) return;
          if (endDateObj && cDate > endDateObj) return;

          totalRevenue += Number(lotCycle.grossRevenue) || 0;
          totalInvestorShare += Number(lotCycle.investorShare) || 0;
          totalCompanyShare += Number(lotCycle.companyShare) || 0;
        }
      }
    });
  });

  // Margem e status de armas
  let weaponsSold = 0;
  let weaponsInStock = 0;
  let weaponsReserved = 0;
  let weaponsImported = 0;
  
  try {
    let weaponsWhere: any = {};
    if (filters?.investorId && filters.investorId !== "ALL") {
      weaponsWhere.importLot = {
        investmentProject: {
          investorId: filters.investorId
        }
      };
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
    let lotsWhere: any = { status: { not: "LIQUIDADO" } };
    if (filters?.investorId && filters.investorId !== "ALL") {
      lotsWhere.investmentProject = {
        investorId: filters.investorId
      };
    }
    const activeLots = await prisma.importLot.findMany({
      where: lotsWhere,
      include: {
        weapons: true,
        investmentProject: {
          include: { investor: true }
        }
      }
    });

    activeLots.forEach(lot => {
      const sold = lot.weapons.filter(w => w.currentStatus === "VENDIDA").length;
      const total = lot.quantityItems || lot.weapons.length || 1;
      const pct = (sold / total) * 100;
      activeLotsProgress.push({
        id: lot.id,
        batchCode: lot.batchCode,
        projectName: lot.investmentProject?.name || "Lote Próprio",
        investorName: lot.investmentProject?.investor?.name || "Eleven Armas",
        sold,
        total,
        percentage: parseFloat(pct.toFixed(1))
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
    weaponsSold,
    weaponsInStock,
    weaponsReserved,
    weaponsImported,
    activeLotsProgress
  };
}

export async function getRecentProjects(investorId?: string) {
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
        cycles: true
      }
    });

    return projects.map(p => ({
      id: p.id,
      name: p.name,
      product_name: p.productName,
      investorName: p.investor?.name ?? "Investidor",
      currentCycle: p.cycles.length,
      max_cycles: p.maxCycles,
      currentCapital: p.initialCapital,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      cycles: p.cycles
    }));
  } catch (error) {
    console.error("Erro ao buscar projetos recentes:", error);
    return [];
  }
}
export async function getGlobalHeaderStats() {
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
