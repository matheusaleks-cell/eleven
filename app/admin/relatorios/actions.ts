"use server";

import { prisma } from "@/lib/prisma";

export async function getInventoryReportData() {
  try {
    const products = await prisma.product.findMany({ include: { weapons: true } });
    const data = products.map(p => ({
      SKU: p.sku,
      Produto: p.commercialName,
      Marca: p.brand,
      Estoque_Disponivel: p.stockAvailable,
      Estoque_Reservado: p.stockReserved,
      Preco_B2C: p.priceB2C,
      Armas_Total: p.weapons.length,
      Armas_Vendidas: p.weapons.filter(w => w.currentStatus === "VENDIDA").length,
      Armas_Em_Estoque: p.weapons.filter(w => w.currentStatus === "ESTOQUE").length,
    }));
    return { success: true, data };
  } catch {
    return { success: false, data: [] };
  }
}

export async function getFinancialReportData() {
  try {
    const orders = await prisma.salesOrder.findMany({ include: { customer: true, seller: true } });
    const data = orders.map(o => ({
      Pedido: o.orderNumber,
      Data: o.createdAt.toLocaleDateString("pt-BR"),
      Cliente: o.customer.name,
      Documento: o.customer.cpfCnpj,
      Vendedor: o.seller.name,
      Valor_Total: o.totalValue,
      Status: o.status,
      Metodo_Pagamento: o.paymentMethod || "Não Informado",
    }));
    return { success: true, data };
  } catch {
    return { success: false, data: [] };
  }
}

export async function getWeaponsMapReportData() {
  try {
    const weapons = await prisma.weaponMap.findMany({ include: { product: true, customer: true } });
    const data = weapons.map(w => ({
      Numero_Serie: w.serialNumber,
      Produto: w.product.commercialName,
      Status: w.currentStatus,
      Custo_Unitario: w.unitCost,
      Data_Entrada: w.entryDate.toLocaleDateString("pt-BR"),
      Cliente_Venda: w.customer?.name || "",
      Data_Venda: w.saleDate ? w.saleDate.toLocaleDateString("pt-BR") : "",
      Valor_Venda: w.saleValue || 0,
    }));
    return { success: true, data };
  } catch {
    return { success: false, data: [] };
  }
}

export async function getLotTraceabilityData() {
  try {
    const lots = await prisma.importLot.findMany({
      include: { supplier: true, weapons: true },
    });
    const data = lots.map(l => ({
      Lote: l.batchCode,
      Fornecedor: l.supplier.name,
      Pais_Origem: l.countryOrigin,
      Data_Compra: l.purchaseDate.toLocaleDateString("pt-BR"),
      Quantidade_Itens: l.quantityItems,
      Status: l.status,
      Custo_Total_BRL: l.totalCostNationalized,
      Armas_Mapeadas: l.weapons.length,
      Armas_Vendidas: l.weapons.filter(w => w.currentStatus === "VENDIDA").length,
    }));
    return { success: true, data };
  } catch {
    return { success: false, data: [] };
  }
}

export async function getInventoryConferenceData() {
  try {
    const weapons = await prisma.weaponMap.findMany({
      include: { product: true, importLot: true },
      orderBy: { currentStatus: "asc" },
    });
    const data = weapons.map(w => ({
      Serie: w.serialNumber,
      Produto: w.product.commercialName,
      SKU: w.product.sku,
      Lote: w.importLot.batchCode,
      Status: w.currentStatus,
      Localizacao: w.warehouseLocation || "",
      Custo_Unitario: w.unitCost,
      Divergencia: w.hasDivergence ? "SIM" : "NAO",
    }));
    return { success: true, data };
  } catch {
    return { success: false, data: [] };
  }
}

export async function getSellerPerformanceData() {
  try {
    const orders = await prisma.salesOrder.findMany({ include: { seller: true } });
    const map = new Map<string, { Vendedor: string; Total_Pedidos: number; Valor_Total: number }>();
    for (const o of orders) {
      const entry = map.get(o.sellerId) ?? { Vendedor: o.seller.name, Total_Pedidos: 0, Valor_Total: 0 };
      entry.Total_Pedidos += 1;
      entry.Valor_Total += o.totalValue;
      map.set(o.sellerId, entry);
    }
    const data = Array.from(map.values()).map(s => ({
      ...s,
      Ticket_Medio: s.Total_Pedidos > 0 ? +(s.Valor_Total / s.Total_Pedidos).toFixed(2) : 0,
    }));
    return { success: true, data };
  } catch {
    return { success: false, data: [] };
  }
}

export async function getDefaultersData() {
  try {
    const orders = await prisma.salesOrder.findMany({
      where: { status: { notIn: ["PAGO", "CANCELADO"] } },
      include: { customer: true },
    });
    const data = orders.map(o => ({
      Pedido: o.orderNumber,
      Cliente: o.customer.name,
      Documento: o.customer.cpfCnpj,
      Estado: o.customer.state,
      Valor: o.totalValue,
      Status: o.status,
      Data_Pedido: o.createdAt.toLocaleDateString("pt-BR"),
    }));
    return { success: true, data };
  } catch {
    return { success: false, data: [] };
  }
}

export async function getReinvestmentProjectionData() {
  try {
    const cycles = await prisma.cycle.findMany({
      include: { project: { include: { investor: true } } },
      orderBy: { createdAt: "desc" },
    });
    const data = cycles.map(c => ({
      Projeto: c.project.name,
      Investidor: c.project.investor.name,
      Ciclo: c.cycleName,
      Status: c.status,
      Capital_Reinvestimento: c.reinvestmentShare,
      Share_Investidor: c.investorShare,
      Share_Empresa: c.companyShare,
      Reserva: c.reserveShare,
      Lucro_Bruto: c.grossProfit,
    }));
    return { success: true, data };
  } catch {
    return { success: false, data: [] };
  }
}

export async function getMovementHistoryData() {
  try {
    const weapons = await prisma.weaponMap.findMany({
      include: { product: true, customer: true },
      orderBy: { lastMovementDate: "desc" },
    });
    const data = weapons.map(w => ({
      Data_Movimento: w.lastMovementDate.toLocaleDateString("pt-BR"),
      Serie: w.serialNumber,
      Produto: w.product.commercialName,
      Status: w.currentStatus,
      Cliente: w.customer?.name || "",
      Valor_Venda: w.saleValue || 0,
      Data_Venda: w.saleDate ? w.saleDate.toLocaleDateString("pt-BR") : "",
    }));
    return { success: true, data };
  } catch {
    return { success: false, data: [] };
  }
}

export async function getAccessLogsData() {
  try {
    const logs = await prisma.leadLog.findMany({
      include: { lead: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    const data = logs.map(l => ({
      Data_Hora: l.createdAt.toLocaleString("pt-BR"),
      Acao: l.action,
      Usuario: l.user,
      Lead: l.lead.name,
    }));
    return { success: true, data };
  } catch {
    return { success: false, data: [] };
  }
}
