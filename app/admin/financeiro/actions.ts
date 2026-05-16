"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getFinancialStats() {
  try {
    const totalSales = await prisma.salesOrder.aggregate({
      where: { status: "PAGO" },
      _sum: { totalValue: true }
    });

    const batchesInTransit = await prisma.importLot.aggregate({
      where: { status: { not: "LIQUIDADO" } },
      _sum: { fobValue: true }
    });

    const totalRevenue = Number(totalSales._sum.totalValue) || 0;
    const transitCapital = Number(batchesInTransit._sum.fobValue) || 0;

    // Read split percentages from FinancialDistributionRule
    let investorPct = 0.50;
    let companyPct = 0.35;
    let taxPct = 0.05;

    try {
      const rule = await prisma.financialDistributionRule.findFirst({
        where: { isActive: true },
      });
      if (rule) {
        investorPct = Number(rule.investorPct) / 100;
        companyPct = Number(rule.companyPct) / 100;
      }
    } catch {
      // Table may not exist yet; fall back to defaults above
    }

    return {
      custody: totalRevenue,
      distributed: totalRevenue * investorPct,
      reinvestment: totalRevenue * companyPct,
      taxes: totalRevenue * taxPct,
      transitCapital,
    };
  } catch (error) {
    console.error("Erro ao buscar stats financeiros:", error);
    return { custody: 0, distributed: 0, reinvestment: 0, taxes: 0, transitCapital: 0 };
  }
}

export async function getRecentTransactions(filters?: { type?: string; month?: number; year?: number }) {
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
      investor: order.customer.name,
      value: order.totalValue,
      date: order.createdAt.toLocaleDateString("pt-BR"),
      status: order.status,
    }));
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    return [];
  }
}
