"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  // Buscar projetos com ciclos (fonte principal de dados)
  let projects: any[] = [];
  try {
    projects = await prisma.investmentProject.findMany({
      include: { cycles: true }
    });
  } catch (error) {
    console.error("[Stats] Erro ao buscar projetos:", error);
  }

  const activeProjects = projects.filter(p => p.status === "ACTIVE").length;
  const completedProjects = projects.filter(p => p.status === "COMPLETED").length;

  // Calcular totais a partir dos ciclos
  let totalRevenue = 0;
  let totalInvestorShare = 0;
  let totalCompanyShare = 0;

  projects.forEach(p => {
    p.cycles?.forEach((c: any) => {
      totalRevenue += Number(c.grossRevenue) || 0;
      totalInvestorShare += Number(c.investorShare) || 0;
      totalCompanyShare += Number(c.companyShare) || 0;
    });
  });

  // Tentar adicionar ordens de venda (tabela opcional - não bloqueia se falhar)
  try {
    const orders = await prisma.salesOrder.findMany();
    orders.forEach(o => {
      totalRevenue += Number(o.totalValue) || 0;
    });
  } catch {
    // Tabela de ordens pode não ter dados ainda — ignora silenciosamente
  }

  return {
    activeProjects,
    completedProjects,
    totalRevenue,
    totalInvestorShare,
    totalCompanyShare,
  };
}

export async function getRecentProjects() {
  try {
    const projects = await prisma.investmentProject.findMany({
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
      investorName: p.investor.name,
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

    // 4. Última Taxa de Câmbio (USD)
    const lastLot = await prisma.importLot.findFirst({
      where: { currency: "USD" },
      orderBy: { createdAt: "desc" }
    });
    const lastUsdRate = lastLot?.exchangeRate || 5.82;

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
