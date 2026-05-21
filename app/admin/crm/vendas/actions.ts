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

    // Busca armas em ESTOQUE com info do lote (investidor ou próprio)
    const weaponsInStock = await prisma.weaponMap.findMany({
      where: { currentStatus: "ESTOQUE" },
      select: {
        productId: true,
        importLot: { select: { investmentProjectId: true } },
      },
    });

    // Monta mapa productId → { investor, own }
    const lotMap = new Map<string, { investor: number; own: number }>();
    for (const w of weaponsInStock) {
      const cur = lotMap.get(w.productId) ?? { investor: 0, own: 0 };
      if (w.importLot.investmentProjectId) {
        cur.investor++;
      } else {
        cur.own++;
      }
      lotMap.set(w.productId, cur);
    }

    return products.map((p) => {
      const lot = lotMap.get(p.id) ?? { investor: 0, own: 0 };
      const lotSource =
        lot.investor === 0 && lot.own === 0
          ? "SEM_RASTREIO"
          : lot.investor > 0 && lot.own === 0
          ? "INVESTIDOR"
          : lot.investor === 0
          ? "PROPRIO"
          : "MISTO";
      return {
        ...p,
        investorLotStock: lot.investor,
        ownLotStock: lot.own,
        lotSource,
      };
    });
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

export async function getLotOptionsForCart(productIds: string[]) {
  try {
    if (productIds.length === 0) return [];

    const weapons = await prisma.weaponMap.findMany({
      where: {
        productId: { in: productIds },
        currentStatus: "ESTOQUE",
        importLot: { investmentProjectId: { not: null } },
      },
      select: { importLot: { select: { investmentProjectId: true } } },
    });

    const projectIds = [...new Set(
      weapons.map(w => w.importLot.investmentProjectId).filter(Boolean) as string[]
    )];

    if (projectIds.length === 0) return [];

    const projects = await prisma.investmentProject.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true, investor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return projects.map(p => ({
      id: p.id,
      name: p.name,
      investorName: p.investor.name,
    }));
  } catch (error) {
    console.error("Erro ao buscar opções de lote:", error);
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
  lotPreference?: "AUTO" | "PROPRIO" | "INVESTIDOR";
  investmentProjectId?: string;
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
        paymentMethod: data.paymentMethod || null,
        products: JSON.stringify(data.items),
        notes: data.notes,
        proposedDate: new Date(),
      },
    });

    const saleDate = new Date();
    const { lotPreference = "AUTO", investmentProjectId } = data;

    for (const item of data.items) {
      await prisma.product.updateMany({
        where: { id: item.id, stockAvailable: { gte: item.quantity } },
        data: { stockAvailable: { decrement: item.quantity } },
      });

      // Monta filtro de lote conforme preferência
      let lotFilter: any = {};
      if (lotPreference === "PROPRIO") {
        lotFilter = { importLot: { investmentProjectId: null } };
      } else if (lotPreference === "INVESTIDOR" && investmentProjectId) {
        lotFilter = { importLot: { investmentProjectId } };
      }

      // Busca armas do lote preferido primeiro (FIFO por data de entrada)
      let weaponsToSell = await prisma.weaponMap.findMany({
        where: { productId: item.id, currentStatus: "ESTOQUE", ...lotFilter },
        take: item.quantity,
        orderBy: { entryDate: "asc" },
        select: { id: true },
      });

      // Se faltaram armas no lote preferido, complementa com FIFO geral
      if (weaponsToSell.length < item.quantity && Object.keys(lotFilter).length > 0) {
        const alreadyIds = weaponsToSell.map(w => w.id);
        const extras = await prisma.weaponMap.findMany({
          where: {
            productId: item.id,
            currentStatus: "ESTOQUE",
            id: alreadyIds.length > 0 ? { notIn: alreadyIds } : undefined,
          },
          take: item.quantity - weaponsToSell.length,
          orderBy: { entryDate: "asc" },
          select: { id: true },
        });
        weaponsToSell = [...weaponsToSell, ...extras];
      }

      if (weaponsToSell.length > 0) {
        await prisma.weaponMap.updateMany({
          where: { id: { in: weaponsToSell.map((w) => w.id) } },
          data: {
            currentStatus: "VENDIDA",
            salesOrderId: order.id,
            saleDate,
            saleValue: item.price,
            customerId: data.customerId,
            sellingUserId: sellerId,
            lastMovementDate: saleDate,
          },
        });
      }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/vendas");
    revalidatePath("/admin/financeiro");
    revalidatePath("/admin/crm/clientes");
    revalidatePath("/admin/erp/produtos");
    revalidatePath("/admin/mapa-de-armas");

    return { success: true, orderId: order.id, orderNumber };
  } catch (error: any) {
    console.error("Erro ao criar venda direta:", error);
    return { success: false, error: error.message || "Erro desconhecido ao criar venda." };
  }
}
