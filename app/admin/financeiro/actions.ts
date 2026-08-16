"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth-guard";

export async function getFinancialStats(filters?: { month?: number; year?: number }) {
  const session = await requireSession("ADMIN");
  if (!session) return { custody: 0, distributed: 0, reinvestment: 0, taxes: 0, transitCapital: 0 };

  try {
    let periodWhere: { createdAt?: { gte: Date; lt: Date } } = {};
    if (filters?.month || filters?.year) {
      const now = new Date();
      const year = filters?.year ?? now.getFullYear();
      const month = filters?.month ?? now.getMonth() + 1;
      periodWhere = { createdAt: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) } };
    }

    const totalSales = await prisma.salesOrder.aggregate({
      where: { status: "PAGO", ...periodWhere },
      _sum: { totalValue: true }
    });

    const batchesInTransit = await prisma.importLot.aggregate({
      where: { status: { not: "LIQUIDADO" } },
      _sum: { totalCostNationalized: true }
    });

    // "Distribuído", "reinvestimento" e "impostos" refletem os ciclos REALMENTE fechados
    // (mesmos valores que aparecem no projeto/dashboard de cada investidor), em vez de uma
    // estimativa sobre o faturamento bruto total com um percentual global — que não tinha
    // nenhuma relação com o que de fato foi apurado e distribuído por projeto.
    const closedCycles = await prisma.cycle.aggregate({
      where: { status: "COMPLETED", ...periodWhere },
      _sum: { investorShare: true, reinvestmentShare: true, salesTax: true },
    });

    const totalRevenue = Number(totalSales._sum.totalValue) || 0;
    const transitCapital = Number(batchesInTransit._sum.totalCostNationalized) || 0;

    return {
      custody: totalRevenue,
      distributed: Number(closedCycles._sum.investorShare) || 0,
      reinvestment: Number(closedCycles._sum.reinvestmentShare) || 0,
      taxes: Number(closedCycles._sum.salesTax) || 0,
      transitCapital,
    };
  } catch (error) {
    console.error("Erro ao buscar stats financeiros:", error);
    return { custody: 0, distributed: 0, reinvestment: 0, taxes: 0, transitCapital: 0 };
  }
}

export async function getSplitRules() {
  const session = await requireSession("ADMIN");
  if (!session) return null;

  try {
    const rule = await prisma.financialDistributionRule.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });
    if (!rule) return null;
    return {
      investor: rule.investorPct,
      company: rule.companyPct,
      reserve: rule.reservePct,
      reinvest: rule.reinvestmentPct,
      operationalCost: rule.operationalCost,
    };
  } catch {
    return null;
  }
}

export async function saveSplitRules(data: {
  investor: number;
  company: number;
  reserve: number;
  reinvest: number;
  operationalCost: number;
}) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

  try {
    const existing = await prisma.financialDistributionRule.findFirst({
      where: { isActive: true },
    });
    if (existing) {
      await prisma.financialDistributionRule.update({
        where: { id: existing.id },
        data: {
          investorPct: data.investor,
          companyPct: data.company,
          reservePct: data.reserve,
          reinvestmentPct: data.reinvest,
          operationalCost: data.operationalCost,
        },
      });
    } else {
      await prisma.financialDistributionRule.create({
        data: {
          name: "Regra Padrão",
          investorPct: data.investor,
          companyPct: data.company,
          reservePct: data.reserve,
          reinvestmentPct: data.reinvest,
          operationalCost: data.operationalCost,
          salesCommission: 0,
          minBalanceNewPurchase: 0,
          newBatchCriteria: "MANUAL",
          isActive: true,
        },
      });
    }
    revalidatePath("/admin/financeiro");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao salvar regras de distribuição:", error);
    return { success: false, error: error.message || "Falha ao salvar regras." };
  }
}

export async function getMonthlyRevenue(year: number) {
  const session = await requireSession("ADMIN");
  if (!session) return [];

  try {
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    const orders = await prisma.salesOrder.findMany({
      where: { status: "PAGO", createdAt: { gte: start, lt: end } },
      select: { createdAt: true, totalValue: true },
    });
    const NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const months = NAMES.map((name, i) => ({ month: i + 1, name, value: 0 }));
    orders.forEach(o => { months[o.createdAt.getMonth()].value += o.totalValue; });
    return months;
  } catch {
    return [];
  }
}

export async function getRecentTransactions(filters?: { type?: string; month?: number; year?: number }) {
  const session = await requireSession("ADMIN");
  if (!session) return [];

  try {
    const where: any = {};

    if (filters?.month || filters?.year) {
      const now = new Date();
      const year = filters?.year ?? now.getFullYear();
      const month = filters?.month ?? now.getMonth() + 1;
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      where.createdAt = { gte: start, lt: end };
    }

    const orders = await prisma.salesOrder.findMany({
      where,
      take: 50,
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    });

    return orders.map((order) => ({
      id: order.orderNumber,
      type: "VENDA",
      investor: order.customer?.name || "Cliente removido",
      value: order.totalValue,
      date: order.createdAt.toLocaleDateString("pt-BR"),
      status: order.status,
    }));
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    return [];
  }
}
