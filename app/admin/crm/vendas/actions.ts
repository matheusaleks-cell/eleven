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
      if (w.importLot?.investmentProjectId) {
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
      include: {
        customer: true,
        weapons: {
          select: {
            importLot: {
              select: {
                investmentProjectId: true,
                investmentProject: {
                  select: {
                    name: true,
                    investor: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
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
      weapons.map(w => w.importLot?.investmentProjectId).filter(Boolean) as string[]
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
  items: { id: string; name: string; sku: string; price: number; quantity: number; serialNumbers?: string[] }[];
  totalValue: number;
  discount?: number;
  paymentMethod: string;
  notes?: string;
  status?: string;
  sellerId?: string;
  lotPreference?: "AUTO" | "PROPRIO" | "INVESTIDOR";
  investmentProjectId?: string;
}) {
  try {
    const orderNumber = `ORD-${Date.now()}`;
    const discount = data.discount || 0;
    const totalBruto = data.totalValue;
    const totalLiquido = Math.max(0, totalBruto - discount);

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
        totalValue: totalLiquido,
        status: data.status || "PAGO",
        paymentMethod: data.paymentMethod || null,
        products: JSON.stringify(data.items),
        notes: discount > 0
          ? `[Desconto aplicado: R$ ${discount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}]${data.notes ? `\n${data.notes}` : ""}`
          : data.notes,
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

      let weaponsToSell: { id: string }[] = [];
      
      if (item.serialNumbers && item.serialNumbers.length > 0) {
        weaponsToSell = await prisma.weaponMap.findMany({
          where: {
            productId: item.id,
            currentStatus: "ESTOQUE",
            serialNumber: { in: item.serialNumbers }
          },
          select: { id: true }
        });
      }

      if (weaponsToSell.length < item.quantity) {
        const alreadyIds = weaponsToSell.map(w => w.id);
        const needed = item.quantity - weaponsToSell.length;

        let extras = await prisma.weaponMap.findMany({
          where: {
            productId: item.id,
            currentStatus: "ESTOQUE",
            id: alreadyIds.length > 0 ? { notIn: alreadyIds } : undefined,
            ...lotFilter
          },
          take: needed,
          orderBy: { entryDate: "asc" },
          select: { id: true },
        });

        if (extras.length < needed && Object.keys(lotFilter).length > 0) {
          const allAlreadyIds = [...alreadyIds, ...extras.map(w => w.id)];
          const backupExtras = await prisma.weaponMap.findMany({
            where: {
              productId: item.id,
              currentStatus: "ESTOQUE",
              id: allAlreadyIds.length > 0 ? { notIn: allAlreadyIds } : undefined,
            },
            take: needed - extras.length,
            orderBy: { entryDate: "asc" },
            select: { id: true },
          });
          extras = [...extras, ...backupExtras];
        }

        weaponsToSell = [...weaponsToSell, ...extras];
      }

      if (weaponsToSell.length > 0) {
        const discountFactor = totalBruto > 0 ? (totalLiquido / totalBruto) : 1;
        const finalSaleValue = Number((item.price * discountFactor).toFixed(2));

        await prisma.weaponMap.updateMany({
          where: { id: { in: weaponsToSell.map((w) => w.id) } },
          data: {
            currentStatus: "VENDIDA",
            salesOrderId: order.id,
            saleDate,
            saleValue: finalSaleValue,
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

export async function deleteSalesOrder(id: string) {
  try {
    // Encontra armas vinculadas ao pedido
    const weapons = await prisma.weaponMap.findMany({
      where: { salesOrderId: id },
      select: { id: true, productId: true },
    });

    if (weapons.length > 0) {
      // Reverte armas para ESTOQUE
      await prisma.weaponMap.updateMany({
        where: { salesOrderId: id },
        data: {
          currentStatus: "ESTOQUE",
          salesOrderId: null,
          saleDate: null,
          saleValue: null,
          customerId: null,
          sellingUserId: null,
          lastMovementDate: new Date(),
        },
      });

      // Restaura estoque por produto
      const byProduct: Record<string, number> = {};
      for (const w of weapons) byProduct[w.productId] = (byProduct[w.productId] || 0) + 1;
      for (const [productId, count] of Object.entries(byProduct)) {
        await prisma.product.update({
          where: { id: productId },
          data: { stockAvailable: { increment: count } },
        });
      }
    }

    await prisma.salesOrder.delete({ where: { id } });

    revalidatePath("/admin/vendas");
    revalidatePath("/admin");
    revalidatePath("/admin/mapa-de-armas");
    revalidatePath("/admin/erp/produtos");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao excluir pedido:", error);
    return { success: false, error: error.message || "Falha ao excluir pedido." };
  }
}

export async function updateSalesOrder(
  id: string,
  data: { status?: string; paymentMethod?: string; notes?: string; totalValue?: number }
) {
  try {
    await prisma.salesOrder.update({
      where: { id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.paymentMethod !== undefined && { paymentMethod: data.paymentMethod }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.totalValue !== undefined && { totalValue: data.totalValue }),
      },
    });
    revalidatePath("/admin/vendas");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao atualizar pedido:", error);
    return { success: false, error: error.message || "Falha ao atualizar pedido." };
  }
}

export async function getAvailableSerialsForProduct(
  productId: string,
  lotPreference: "AUTO" | "PROPRIO" | "INVESTIDOR",
  investmentProjectId?: string
) {
  try {
    let lotFilter: any = {};
    if (lotPreference === "PROPRIO") {
      lotFilter = { importLot: { investmentProjectId: null } };
    } else if (lotPreference === "INVESTIDOR" && investmentProjectId) {
      lotFilter = { importLot: { investmentProjectId } };
    }

    const weapons = await prisma.weaponMap.findMany({
      where: {
        productId,
        currentStatus: "ESTOQUE",
        ...lotFilter
      },
      select: {
        id: true,
        serialNumber: true,
        importLot: {
          select: {
            batchCode: true
          }
        }
      },
      orderBy: { entryDate: "asc" }
    });

    return weapons.map(w => ({
      id: w.id,
      serial: w.serialNumber,
      batchCode: w.importLot?.batchCode || "S/L"
    }));
  } catch (error) {
    console.error("Erro ao buscar números de série disponíveis:", error);
    return [];
  }
}
