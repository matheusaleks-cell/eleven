"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCustomersForSale() {
  try {
    const customers = await prisma.customer.findMany({
      select: { id: true, name: true, type: true, cpfCnpj: true, state: true },
      orderBy: { name: "asc" },
    });
    return customers;
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return [];
  }
}

export async function getProductsForSale() {
  try {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE", stockAvailable: { gt: 0 } },
      select: {
        id: true,
        commercialName: true,
        sku: true,
        priceB2C: true,
        priceB2B: true,
        brand: true,
        model: true,
        stockAvailable: true,
      },
      orderBy: { commercialName: "asc" },
    });
    return products;
  } catch (error) {
    console.error("Erro ao buscar produtos para venda:", error);
    return [];
  }
}

export async function getSalesOrders() {
  try {
    const orders = await prisma.salesOrder.findMany({
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    });
    return orders;
  } catch (error) {
    console.error("Erro ao buscar pedidos de venda:", error);
    return [];
  }
}

export async function createDirectSale(data: {
  customerId: string;
  items: { id: string; name: string; sku: string; price: number; quantity: number }[];
  totalValue: number;
  paymentMethod: string;
  notes?: string;
  status?: string;
  sellerId?: string;
}) {
  try {
    const orderNumber = `ORD-${Date.now()}`;

    let sellerId = data.sellerId;
    if (!sellerId || sellerId === "system-admin") {
      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
      sellerId = admin?.id;
    }
    if (!sellerId) return { success: false, error: "Nenhum usuário administrador encontrado." };

    const order = await prisma.salesOrder.create({
      data: {
        orderNumber,
        customerId: data.customerId,
        sellerId,
        totalValue: data.totalValue,
        status: data.status || "PAGO",
        products: JSON.stringify(data.items),
        notes: data.notes,
        proposedDate: new Date(),
      },
    });

    // Decrementar estoque de cada produto vendido
    for (const item of data.items) {
      await prisma.product.updateMany({
        where: { id: item.id, stockAvailable: { gte: item.quantity } },
        data: { stockAvailable: { decrement: item.quantity } },
      });
    }

    revalidatePath("/admin");
    revalidatePath("/admin/vendas");
    revalidatePath("/admin/financeiro");
    revalidatePath("/admin/crm/clientes");
    revalidatePath("/admin/erp/produtos");

    return { success: true, orderId: order.id, orderNumber };
  } catch (error: any) {
    console.error("Erro ao criar venda direta:", error);
    return { success: false, error: error.message || "Erro desconhecido ao criar venda." };
  }
}
