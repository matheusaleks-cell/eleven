"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth-guard";
import { weaponStatusForOrder } from "@/lib/order-status";
import { logWeaponMovements, logWeaponMovement } from "@/lib/weapon-movement";

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
      where: { status: "ACTIVE" },
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

    return products
      .map((p) => {
        const lot = lotMap.get(p.id) ?? { investor: 0, own: 0 };
        const serializedStock = lot.investor + lot.own;
        // Se houver armas com número de série em ESTOQUE, o estoque disponível é a contagem de séries.
        // Caso contrário, utiliza o estoque cadastrado no produto.
        const effectiveStock = serializedStock > 0 ? serializedStock : (p.stockAvailable || 0);

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
          stockAvailable: effectiveStock,
          hasSerials: serializedStock > 0,
          investorLotStock: lot.investor,
          ownLotStock: lot.own,
          lotSource,
        };
      })
      .filter((p) => p.stockAvailable > 0);
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
            id: true,
            serialNumber: true,
            productId: true,
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
      // O vendedor salvo no pedido é obrigatório no banco e, quando ninguém é escolhido,
      // vira o primeiro admin (createDirectSale). Não vai impresso no pedido do cliente.
      sellerName: "",
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
      // Atualiza o saldo de estoque do produto de forma segura
      const prod = await prisma.product.findUnique({ where: { id: item.id }, select: { stockAvailable: true } });
      if (prod) {
        const nextStock = Math.max(0, prod.stockAvailable - item.quantity);
        await prisma.product.update({
          where: { id: item.id },
          data: { stockAvailable: nextStock },
        });
      }

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

        // Mesmos dados para todas as armas do item: uma única query em vez de uma por arma.
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
        const movType = weaponStatusForOrder(data.status) === "VENDIDA" ? "VENDA" : "RESERVA";
        await logWeaponMovements(weaponsToSell.map(w => w.id), movType, `Pedido ${orderNumber}`);
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
      await logWeaponMovements(weapons.map(w => w.id), "DEVOLUCAO_ESTOQUE", "Pedido excluído — arma devolvida ao estoque");

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

    // Documentos do pedido (Anexo P automático, NF, guia...) precisam sair antes: no banco real
    // a FK documents.sales_order_id é NO ACTION (o schema.prisma diz Cascade, mas o Turso não),
    // e todo pedido tem ao menos o Anexo P — sem isso a exclusão falha com FOREIGN KEY constraint.
    await prisma.document.deleteMany({ where: { salesOrderId: id } });

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
        await logWeaponMovements(weapons.map(w => w.id), "DEVOLUCAO_ESTOQUE", `Pedido ${currentOrder.orderNumber} cancelado — arma devolvida ao estoque`);

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
          const movType = weaponStatusForOrder(data.status) === "VENDIDA" ? "VENDA" : "RESERVA";
          await logWeaponMovements(weaponsToSell.map(w => w.id), movType, `Pedido ${currentOrder.orderNumber} reativado`);
        }
      }
    }

    // 2.5. Transição entre RESERVADA e VENDIDA quando o status muda sem passar por CANCELADO
    // (ex: pedido PENDENTE com armas reservadas vira PAGO ao confirmar o pagamento, ou vice-versa).
    if (!isCancelling && !wasCancelled && data.status !== undefined && data.status !== currentOrder.status) {
      const targetWeaponStatus = weaponStatusForOrder(data.status);
      const transitioningWeapons = await prisma.weaponMap.findMany({
        where: { salesOrderId: id, currentStatus: { in: ["RESERVADA", "VENDIDA"] } },
        select: { id: true },
      });
      await prisma.weaponMap.updateMany({
        where: { salesOrderId: id, currentStatus: { in: ["RESERVADA", "VENDIDA"] } },
        data: { currentStatus: targetWeaponStatus, lastMovementDate: new Date() },
      });
      if (transitioningWeapons.length > 0) {
        const movType = targetWeaponStatus === "VENDIDA" ? "VENDA" : "RESERVA";
        await logWeaponMovements(transitioningWeapons.map(w => w.id), movType, `Pedido ${currentOrder.orderNumber} — status alterado para ${data.status}`);
      }
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

        // O valor depende só do produto: uma query por produto em vez de uma por arma.
        const valueByProduct = new Map<string, number>();
        for (const w of weapons) {
          if (valueByProduct.has(w.productId)) continue;
          const orderItem = items.find((item: any) => item.id === w.productId);
          const originalPrice = orderItem ? orderItem.price : (w.product?.priceB2C || 0);
          valueByProduct.set(w.productId, Number((originalPrice * discountFactor).toFixed(2)));
        }
        await Promise.all(
          [...valueByProduct].map(([productId, saleValue]) =>
            prisma.weaponMap.updateMany({
              where: { salesOrderId: id, productId },
              data: { saleValue },
            })
          )
        );
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

// Troca o número de série de uma unidade dentro de um pedido já lançado (correção
// manual — ex: entregou a arma errada ao cliente). Mesma dança de devolver/alocar já
// usada em deleteSalesOrder/updateSalesOrder, mas escopada a UMA arma dentro do pedido
// em vez do pedido inteiro: devolve a antiga pro estoque e aloca a nova com os mesmos
// dados de venda que a antiga tinha (não recalcula nada, só troca qual peça física saiu).
export async function swapWeaponSerial(salesOrderId: string, oldWeaponId: string, newWeaponId: string) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

  try {
    const oldWeapon = await prisma.weaponMap.findUnique({ where: { id: oldWeaponId } });
    if (!oldWeapon || oldWeapon.salesOrderId !== salesOrderId) {
      return { success: false, error: "Essa arma não pertence a este pedido." };
    }

    const newWeapon = await prisma.weaponMap.findUnique({ where: { id: newWeaponId } });
    if (!newWeapon || newWeapon.currentStatus !== "ESTOQUE") {
      return { success: false, error: "O número de série escolhido não está disponível em estoque." };
    }
    if (newWeapon.productId !== oldWeapon.productId) {
      return { success: false, error: "A troca só pode ser feita entre unidades do mesmo produto." };
    }

    const order = await prisma.salesOrder.findUnique({ where: { id: salesOrderId } });
    const orderLabel = order?.orderNumber || salesOrderId;

    await prisma.weaponMap.update({
      where: { id: oldWeaponId },
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
    await logWeaponMovement(oldWeaponId, "DEVOLUCAO_ESTOQUE", `Pedido ${orderLabel} — série trocada, devolvida ao estoque`);

    await prisma.weaponMap.update({
      where: { id: newWeaponId },
      data: {
        currentStatus: oldWeapon.currentStatus,
        salesOrderId: oldWeapon.salesOrderId,
        saleDate: oldWeapon.saleDate,
        saleValue: oldWeapon.saleValue,
        customerId: oldWeapon.customerId,
        sellingUserId: oldWeapon.sellingUserId,
        lastMovementDate: new Date(),
      },
    });
    const movType = oldWeapon.currentStatus === "VENDIDA" ? "VENDA" : "RESERVA";
    await logWeaponMovement(newWeaponId, movType, `Pedido ${orderLabel} — série trocada, assumiu a venda`);

    revalidatePath("/admin/vendas");
    revalidatePath("/admin");
    revalidatePath("/admin/mapa-de-armas");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao trocar número de série:", error);
    return { success: false, error: error.message || "Falha ao trocar número de série." };
  }
}

// Altera a quantidade de UM item de um pedido já lançado (ex.: o cliente pediu para diminuir).
// Mantém o preço unitário e o mesmo percentual de desconto: o total é refeito proporcionalmente.
// Diminuir devolve ao estoque as unidades que passam do novo total; aumentar reserva/vende mais
// unidades do estoque (mesma preferência de lote do item) e informa se faltar estoque.
export async function updateOrderItemQuantity(orderId: string, productId: string, newQuantity: number) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

  if (!Number.isInteger(newQuantity) || newQuantity < 1) {
    return {
      success: false,
      error: "A quantidade deve ser um número inteiro maior que zero. Para remover o item, cancele ou exclua o pedido.",
    };
  }

  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: { weapons: { select: { id: true, productId: true, serialNumber: true, lastMovementDate: true } } },
    });
    if (!order) return { success: false, error: "Pedido não encontrado." };
    if (order.status === "CANCELADO") {
      return { success: false, error: "Pedido cancelado. Reative o pedido antes de alterar a quantidade." };
    }

    const items: any[] = JSON.parse(order.products || "[]");
    const item = items.find((i) => i.id === productId);
    if (!item) return { success: false, error: "Item não encontrado neste pedido." };

    const oldQuantity = Number(item.quantity) || 0;
    if (newQuantity === oldQuantity) {
      return { success: true, oldQuantity, newQuantity, released: 0, allocated: 0, shortage: 0, newTotal: order.totalValue };
    }

    // Mesmo percentual de desconto do pedido: total novo proporcional ao bruto.
    const oldBruto = items.reduce((acc, i) => acc + (i.price || 0) * (i.quantity || 0), 0);
    const factor = oldBruto > 0 ? order.totalValue / oldBruto : 1;

    const allocated = order.weapons.filter((w) => w.productId === productId);

    // Diminuir: libera as unidades que passam do novo total (as últimas a entrar no pedido).
    const toRelease = [...allocated]
      .sort((a, b) => b.lastMovementDate.getTime() - a.lastMovementDate.getTime() || b.serialNumber.localeCompare(a.serialNumber))
      .slice(0, Math.max(0, allocated.length - newQuantity));

    // Aumentar: reserva/vende mais do estoque, respeitando a preferência de lote do item.
    const wantExtra = newQuantity > oldQuantity ? newQuantity - oldQuantity : 0;
    let extras: { id: string; serialNumber: string }[] = [];
    if (wantExtra > 0) {
      let lotFilter: any = {};
      if (item.lotPreference === "PROPRIO") {
        lotFilter = { importLot: { investmentProjectId: null } };
      } else if (item.lotPreference === "INVESTIDOR" && item.investmentProjectId) {
        lotFilter = { importLot: { investmentProjectId: item.investmentProjectId } };
      }

      extras = await prisma.weaponMap.findMany({
        where: { productId, currentStatus: "ESTOQUE", ...lotFilter },
        take: wantExtra,
        orderBy: { entryDate: "asc" },
        select: { id: true, serialNumber: true },
      });

      if (extras.length < wantExtra && Object.keys(lotFilter).length > 0) {
        const taken = extras.map((w) => w.id);
        const backup = await prisma.weaponMap.findMany({
          where: { productId, currentStatus: "ESTOQUE", id: taken.length > 0 ? { notIn: taken } : undefined },
          take: wantExtra - extras.length,
          orderBy: { entryDate: "asc" },
          select: { id: true, serialNumber: true },
        });
        extras = [...extras, ...backup];
      }
    }

    const now = new Date();

    if (toRelease.length > 0) {
      const ids = toRelease.map((w) => w.id);
      await prisma.weaponMap.updateMany({
        where: { id: { in: ids } },
        data: {
          currentStatus: "ESTOQUE",
          salesOrderId: null,
          saleDate: null,
          saleValue: null,
          customerId: null,
          sellingUserId: null,
          lastMovementDate: now,
        },
      });
      await logWeaponMovements(ids, "DEVOLUCAO_ESTOQUE", `Pedido ${order.orderNumber} — quantidade reduzida, devolvida ao estoque`);
      await prisma.product.update({
        where: { id: productId },
        data: { stockAvailable: { increment: ids.length } },
      });
    }

    if (extras.length > 0) {
      const ids = extras.map((w) => w.id);
      await prisma.weaponMap.updateMany({
        where: { id: { in: ids } },
        data: {
          currentStatus: weaponStatusForOrder(order.status),
          salesOrderId: order.id,
          saleDate: now,
          saleValue: Number(((item.price || 0) * factor).toFixed(2)),
          customerId: order.customerId,
          sellingUserId: order.sellerId,
          lastMovementDate: now,
        },
      });
      const movType = weaponStatusForOrder(order.status) === "VENDIDA" ? "VENDA" : "RESERVA";
      await logWeaponMovements(ids, movType, `Pedido ${order.orderNumber} — quantidade aumentada`);
      const prod = await prisma.product.findUnique({ where: { id: productId }, select: { stockAvailable: true } });
      if (prod) {
        await prisma.product.update({
          where: { id: productId },
          data: { stockAvailable: Math.max(0, prod.stockAvailable - ids.length) },
        });
      }
    }

    // Atualiza o snapshot do pedido (itens, séries escolhidas, total e uma nota de rastreio).
    item.quantity = newQuantity;
    if (Array.isArray(item.serialNumbers) && item.serialNumbers.length > 0) {
      const released = new Set(toRelease.map((w) => w.id));
      item.serialNumbers = [
        ...allocated.filter((w) => !released.has(w.id)).map((w) => w.serialNumber),
        ...extras.map((w) => w.serialNumber),
      ];
    }
    const newBruto = items.reduce((acc, i) => acc + (i.price || 0) * (i.quantity || 0), 0);
    const newTotal = Number((newBruto * factor).toFixed(2));
    const trace = `[Quantidade de "${item.name || "item"}" alterada de ${oldQuantity} para ${newQuantity} em ${now.toLocaleDateString("pt-BR")}]`;

    await prisma.salesOrder.update({
      where: { id: orderId },
      data: {
        products: JSON.stringify(items),
        totalValue: newTotal,
        notes: order.notes ? `${order.notes}\n${trace}` : trace,
      },
    });

    revalidatePath("/admin/vendas");
    revalidatePath("/admin");
    revalidatePath("/admin/mapa-de-armas");
    revalidatePath("/admin/erp/produtos");
    return {
      success: true,
      oldQuantity,
      newQuantity,
      released: toRelease.length,
      allocated: extras.length,
      shortage: wantExtra - extras.length,
      newTotal,
    };
  } catch (error: any) {
    console.error("Erro ao alterar quantidade do pedido:", error);
    return { success: false, error: error.message || "Falha ao alterar a quantidade." };
  }
}

// Mini-dashboard mensal de Vendas: mês vigente (com clientes únicos) x mês anterior x
// meta cadastrada pro mês seguinte. Mesmo padrão de filtro por createdAt já usado em
// getFinancialStats (app/admin/financeiro/actions.ts).
export async function getSalesMonthlySnapshot() {
  const session = await requireSession("ADMIN");
  if (!session) return { currentMonth: 0, currentMonthCustomers: 0, previousMonth: 0, nextMonthGoal: 0 };

  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    const currentStart = new Date(year, month, 1);
    const currentEnd = new Date(year, month + 1, 1);
    const previousStart = new Date(year, month - 1, 1);
    const previousEnd = currentStart;

    const [currentOrders, previousAgg, goal] = await Promise.all([
      prisma.salesOrder.findMany({
        where: { status: "PAGO", createdAt: { gte: currentStart, lt: currentEnd } },
        select: { totalValue: true, customerId: true },
      }),
      prisma.salesOrder.aggregate({
        where: { status: "PAGO", createdAt: { gte: previousStart, lt: previousEnd } },
        _sum: { totalValue: true },
      }),
      prisma.salesGoal.findUnique({
        where: { month_year: { month: month + 2 > 12 ? 1 : month + 2, year: month + 2 > 12 ? year + 1 : year } },
      }),
    ]);

    const currentMonth = currentOrders.reduce((acc, o) => acc + (o.totalValue || 0), 0);
    const currentMonthCustomers = new Set(currentOrders.map(o => o.customerId)).size;

    return {
      currentMonth,
      currentMonthCustomers,
      previousMonth: Number(previousAgg._sum.totalValue) || 0,
      nextMonthGoal: goal?.targetValue || 0,
    };
  } catch (error) {
    console.error("Erro ao buscar snapshot mensal de vendas:", error);
    return { currentMonth: 0, currentMonthCustomers: 0, previousMonth: 0, nextMonthGoal: 0 };
  }
}

export async function saveSalesGoal(month: number, year: number, targetValue: number) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

  try {
    await prisma.salesGoal.upsert({
      where: { month_year: { month, year } },
      create: { month, year, targetValue },
      update: { targetValue },
    });
    revalidatePath("/admin/vendas");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao salvar meta de vendas:", error);
    return { success: false, error: error.message || "Falha ao salvar meta." };
  }
}
