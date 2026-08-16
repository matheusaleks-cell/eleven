"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth-guard";
import { weaponStatusForOrder } from "@/lib/order-status";

// Lista de administradores que podem ser selecionados como vendedor responsável
// por uma venda (ao inves de assumir sempre quem esta logado no momento).
export async function getSellers() {
  const session = await requireSession("ADMIN");
  if (!session) return [];

  try {
    return await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Erro ao buscar vendedores:", error);
    return [];
  }
}

export async function getCustomersForSale() {
  const session = await requireSession("ADMIN");
  if (!session) return [];

  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        cpfCnpj: true,
        state: true,
        crNumber: true,
        crValidityDate: true,
        phone: true,
        email: true,
      },
      orderBy: { name: "asc" },
    });
    return customers;
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return [];
  }
}

export async function getProductsForSale() {
  const session = await requireSession("ADMIN");
  if (!session) return [];

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
        species: true,
        caliber: true,
        actionType: true,
        barrelLength: true,
        finish: true,
        originCountry: true,
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
  const session = await requireSession("ADMIN");
  if (!session) return [];

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

// Dados para gerar o Anexo P / Pedido de um pedido JÁ CONCLUÍDO. O snapshot salvo em `products`
// (SalesOrder.products) tem nome/sku/preço/quantidade — as specs técnicas (espécie, calibre etc.)
// usadas no documento vêm sempre do cadastro atual do Product, buscado aqui por id.
export async function getSalesOrderPdfData(orderId: string) {
  const session = await requireSession("ADMIN");
  if (!session) return null;

  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: { customer: true, seller: true },
    });
    if (!order) return null;

    const items: { id: string; name: string; quantity: number; price?: number }[] = JSON.parse(order.products || "[]");
    const productIds = items.map(i => i.id);
    const productSpecs = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        species: true,
        brand: true,
        model: true,
        caliber: true,
        actionType: true,
        finish: true,
        originCountry: true,
        barrelLength: true,
        capacity: true,
        technicalDescription: true,
      },
    });
    const specsById = new Map(productSpecs.map(p => [p.id, p]));

    const addressParts = [
      order.customer.address,
      order.customer.addressNumber ? `nº ${order.customer.addressNumber}` : null,
      order.customer.addressComplement,
      order.customer.neighborhood ? `– ${order.customer.neighborhood}` : null,
      order.customer.city ? `– ${order.customer.city}` : null,
      order.customer.state ? `/ ${order.customer.state}` : null,
      order.customer.cep ? `– CEP: ${order.customer.cep}` : null,
    ].filter(Boolean);

    return {
      orderNumber: order.orderNumber,
      orderDate: (order.proposedDate || order.createdAt).toLocaleDateString("pt-BR"),
      sellerName: order.seller?.name || "Raul Fiuza",
      paymentMethod: order.paymentMethod,
      totalValue: order.totalValue,
      buyer: {
        name: order.customer.name,
        document: order.customer.cpfCnpj,
        crNumber: order.customer.crNumber,
        crValidity: order.customer.crValidityDate ? order.customer.crValidityDate.toLocaleDateString("pt-BR") : null,
        phone: order.customer.phone,
        email: order.customer.email,
        address: addressParts.length > 0 ? addressParts.join(" ") : null,
        contactName: order.customer.responsibleName || null,
      },
      items: items.map(item => {
        const specs = specsById.get(item.id);
        const unitPrice = item.price ?? 0;
        return {
          quantity: item.quantity,
          name: item.name,
          unitPrice,
          totalPrice: unitPrice * item.quantity,
          species: specs?.species,
          brand: specs?.brand,
          model: specs?.model,
          caliber: specs?.caliber,
          actionType: specs?.actionType,
          finish: specs?.finish,
          originCountry: specs?.originCountry,
          barrelLength: specs?.barrelLength,
          capacity: specs?.capacity,
          technicalDescription: specs?.technicalDescription,
        };
      }),
    };
  } catch (error) {
    console.error("Erro ao buscar dados do pedido para o PDF:", error);
    return null;
  }
}

// Gera o Anexo P automaticamente a cada venda registrada, salva como Document vinculado
// ao pedido (fica acessível no histórico do cliente) e envia por e-mail com instruções de
// preenchimento. Nunca deve derrubar a venda em si — qualquer erro aqui é só logado.
export async function generateAndSendAnexoP(orderId: string) {
  const session = await requireSession("ADMIN");
  if (!session) return;

  try {
    const data = await getSalesOrderPdfData(orderId);
    if (!data) return;

    const { generateAnexoPBuffer } = await import("@/lib/pdf-server");
    const pdfBuffer = generateAnexoPBuffer(data.buyer, data.items);

    await prisma.document.create({
      data: {
        name: `Anexo_P_${data.orderNumber}.pdf`,
        type: "PDF",
        category: "Anexo P (gerado automaticamente)",
        size: `${(pdfBuffer.length / 1024).toFixed(1)} KB`,
        base64Data: pdfBuffer.toString("base64"),
        salesOrderId: orderId,
      },
    });

    if (data.buyer.email) {
      const { sendAnexoPEmail } = await import("@/lib/email");
      await sendAnexoPEmail(data.buyer.email, data.buyer.name || "Cliente", data.orderNumber, pdfBuffer);
    }
  } catch (error) {
    console.error("Erro ao gerar/enviar Anexo P automático:", error);
  }
}

// Documentos vinculados ao pedido — Anexo P (gerado automaticamente), Anexo P assinado,
// nota fiscal, guia de tráfego etc. Ficam acessíveis no histórico da venda para eventuais
// fiscalizações futuras.
export async function getOrderDocuments(salesOrderId: string) {
  const session = await requireSession("ADMIN");
  if (!session) return [];

  try {
    return await prisma.document.findMany({
      where: { salesOrderId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Erro ao buscar documentos do pedido:", error);
    return [];
  }
}

export async function uploadOrderDocument(
  salesOrderId: string,
  data: { name: string; type: string; category: string; size: string; base64Data: string }
) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

  try {
    const document = await prisma.document.create({
      data: {
        name: data.name,
        type: data.type,
        category: data.category,
        size: data.size,
        base64Data: data.base64Data,
        salesOrderId,
      },
    });
    revalidatePath("/admin/vendas");
    return { success: true, document };
  } catch (error) {
    console.error("Erro ao fazer upload de documento do pedido:", error);
    return { success: false, error: "Falha ao salvar documento." };
  }
}

export async function deleteOrderDocument(documentId: string) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

  try {
    await prisma.document.delete({ where: { id: documentId } });
    revalidatePath("/admin/vendas");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir documento do pedido:", error);
    return { success: false, error: "Falha ao excluir documento." };
  }
}

export async function getLotOptionsForCart(productIds: string[]) {
  const session = await requireSession("ADMIN");
  if (!session) return [];

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
  items: { 
    id: string; 
    name: string; 
    sku: string; 
    price: number; 
    quantity: number; 
    serialNumbers?: string[];
    lotPreference?: "AUTO" | "PROPRIO" | "INVESTIDOR";
    investmentProjectId?: string;
  }[];
  totalValue: number;
  discount?: number;
  paymentMethod: string;
  notes?: string;
  status?: string;
  sellerId?: string;
  lotPreference?: "AUTO" | "PROPRIO" | "INVESTIDOR";
  investmentProjectId?: string;
}) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

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
    const { lotPreference: globalLotPreference = "AUTO", investmentProjectId: globalInvestmentProjectId } = data;

    for (const item of data.items) {
      await prisma.product.updateMany({
        where: { id: item.id, stockAvailable: { gte: item.quantity } },
        data: { stockAvailable: { decrement: item.quantity } },
      });

      // Monta filtro de lote conforme preferência (item prioritário sobre o global)
      const itemPref = item.lotPreference || globalLotPreference;
      const itemProjId = item.investmentProjectId || globalInvestmentProjectId;

      let lotFilter: any = {};
      if (itemPref === "PROPRIO") {
        lotFilter = { importLot: { investmentProjectId: null } };
      } else if (itemPref === "INVESTIDOR" && itemProjId) {
        lotFilter = { importLot: { investmentProjectId: itemProjId } };
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
            currentStatus: weaponStatusForOrder(data.status),
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

    await generateAndSendAnexoP(order.id);

    return { success: true, orderId: order.id, orderNumber };
  } catch (error: any) {
    console.error("Erro ao criar venda direta:", error);
    return { success: false, error: error.message || "Erro desconhecido ao criar venda." };
  }
}

export async function deleteSalesOrder(id: string) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

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
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

  try {
    const currentOrder = await prisma.salesOrder.findUnique({
      where: { id },
      include: { weapons: true }
    });

    if (!currentOrder) {
      return { success: false, error: "Pedido não encontrado." };
    }

    const wasCancelled = currentOrder.status === "CANCELADO";
    const isCancelling = data.status === "CANCELADO";

    // 1. Se o pedido está sendo CANCELADO e não era cancelado antes
    if (isCancelling && !wasCancelled) {
      // Reverter as armas vinculadas para ESTOQUE
      const weapons = await prisma.weaponMap.findMany({
        where: { salesOrderId: id },
        select: { id: true, productId: true },
      });

      if (weapons.length > 0) {
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

        // Restaura estoque
        const byProduct: Record<string, number> = {};
        for (const w of weapons) byProduct[w.productId] = (byProduct[w.productId] || 0) + 1;
        for (const [productId, count] of Object.entries(byProduct)) {
          await prisma.product.update({
            where: { id: productId },
            data: { stockAvailable: { increment: count } },
          });
        }
      }
    }

    // 2. Se o pedido era CANCELADO e está voltando a ser ativo (PAGO ou PENDENTE ou RASCUNHO)
    if (wasCancelled && data.status && data.status !== "CANCELADO") {
      // Precisamos alocar as armas de volta!
      const items = JSON.parse(currentOrder.products || "[]");
      const saleDate = new Date();

      for (const item of items) {
        // Decrementa o estoque
        await prisma.product.updateMany({
          where: { id: item.id, stockAvailable: { gte: item.quantity } },
          data: { stockAvailable: { decrement: item.quantity } },
        });

        // Busca armas em estoque
        let weaponsToSell = await prisma.weaponMap.findMany({
          where: {
            productId: item.id,
            currentStatus: "ESTOQUE",
          },
          take: item.quantity,
          orderBy: { entryDate: "asc" },
          select: { id: true },
        });

        if (weaponsToSell.length > 0) {
          const totalBruto = items.reduce((acc: number, it: any) => acc + (it.price * it.quantity), 0);
          const totalLiquido = data.totalValue !== undefined ? data.totalValue : currentOrder.totalValue;
          const discountFactor = totalBruto > 0 ? (totalLiquido / totalBruto) : 1;
          const finalSaleValue = Number((item.price * discountFactor).toFixed(2));

          await prisma.weaponMap.updateMany({
            where: { id: { in: weaponsToSell.map(w => w.id) } },
            data: {
              currentStatus: weaponStatusForOrder(data.status),
              salesOrderId: currentOrder.id,
              saleDate,
              saleValue: finalSaleValue,
              customerId: currentOrder.customerId,
              sellingUserId: currentOrder.sellerId,
              lastMovementDate: saleDate,
            },
          });
        }
      }
    }

    // 2.5. Transição entre RESERVADA e VENDIDA quando o status muda sem passar por CANCELADO
    // (ex: pedido PENDENTE com armas reservadas vira PAGO ao confirmar o pagamento, ou vice-versa).
    if (!isCancelling && !wasCancelled && data.status !== undefined && data.status !== currentOrder.status) {
      const targetWeaponStatus = weaponStatusForOrder(data.status);
      await prisma.weaponMap.updateMany({
        where: { salesOrderId: id, currentStatus: { in: ["RESERVADA", "VENDIDA"] } },
        data: { currentStatus: targetWeaponStatus, lastMovementDate: new Date() },
      });
    }

    // 3. Se o valor total do pedido mudou e o pedido continua ativo, devemos recalcular e atualizar o saleValue das armas
    if (data.totalValue !== undefined && data.totalValue !== currentOrder.totalValue && data.status !== "CANCELADO" && currentOrder.status !== "CANCELADO") {
      const weapons = await prisma.weaponMap.findMany({
        where: { salesOrderId: id },
        include: { product: true }
      });

      if (weapons.length > 0) {
        const items = JSON.parse(currentOrder.products || "[]");
        const totalBruto = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
        const totalLiquido = data.totalValue;
        const discountFactor = totalBruto > 0 ? (totalLiquido / totalBruto) : 1;

        for (const w of weapons) {
          const orderItem = items.find((item: any) => item.id === w.productId);
          const originalPrice = orderItem ? orderItem.price : (w.product?.priceB2C || 0);
          const finalSaleValue = Number((originalPrice * discountFactor).toFixed(2));

          await prisma.weaponMap.update({
            where: { id: w.id },
            data: { saleValue: finalSaleValue }
          });
        }
      }
    }

    // E finalmente, atualiza o pedido
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
    revalidatePath("/admin/mapa-de-armas");
    revalidatePath("/admin/erp/produtos");
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
  const session = await requireSession("ADMIN");
  if (!session) return [];

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
