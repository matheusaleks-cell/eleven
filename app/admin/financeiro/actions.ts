"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getFinancialStats() {
  try {
    // 1. Saldo em Custódia (Total de vendas pagas)
    const totalSales = await prisma.salesOrder.aggregate({
      where: { status: "PAGO" },
      _sum: { totalValue: true }
    });

    // 3. Capital em Trânsito (Lotes não liquidados)
    const batchesInTransit = await prisma.importLot.aggregate({
      where: { 
        status: { not: "LIQUIDADO" } 
      },
      _sum: { fobValue: true }
    });

    const totalRevenue = totalSales._sum.totalValue || 0;
    const transitCapital = (batchesInTransit._sum.fobValue || 0);
    
    // Simulação de regras de split (buscaremos de uma config no futuro)
    const investorShare = totalRevenue * 0.50;
    const companyShare = totalRevenue * 0.35;
    const taxesShare = totalRevenue * 0.05;

    return {
      custody: totalRevenue,
      distributed: investorShare,
      reinvestment: companyShare,
      taxes: taxesShare,
      transitCapital
    };
  } catch (error) {
    console.error("Erro ao buscar stats financeiros:", error);
    return { custody: 0, distributed: 0, reinvestment: 0, taxes: 0, transitCapital: 0 };
  }
}

export async function getRecentTransactions(filters?: { type?: string, month?: number, year?: number }) {
  try {
    const where: any = {};
    if (filters?.type) where.type = filters.type;
    
    const orders = await prisma.salesOrder.findMany({
      where,
      take: 50, // Aumentamos para o histórico
      orderBy: { createdAt: "desc" },
      include: {
        customer: true
      }
    });

    return orders.map(order => ({
      id: order.orderNumber,
      type: "VENDA",
      investor: order.customer.name,
      value: order.totalValue,
      date: order.createdAt.toLocaleDateString("pt-BR"),
      status: order.status
    }));
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    return [];
  }
}
