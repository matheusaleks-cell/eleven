"use server";

import { prisma } from "@/lib/prisma";

export async function getInventoryReportData() {
  try {
    const products = await prisma.product.findMany({ include: { weapons: true } });
    const data = products.map(p => ({
      SKU: p.sku || "",
      Produto: p.commercialName || "",
      Marca: p.brand || "",
      Estoque_Disponivel: p.stockAvailable ?? 0,
      Estoque_Reservado: p.stockReserved ?? 0,
      Preco_B2C: p.priceB2C ?? 0,
      Armas_Total: p.weapons?.length ?? 0,
      Armas_Vendidas: p.weapons ? p.weapons.filter(w => w.currentStatus === "VENDIDA").length : 0,
      Armas_Em_Estoque: p.weapons ? p.weapons.filter(w => w.currentStatus === "ESTOQUE").length : 0,
    }));
    return { success: true, data };
  } catch (error) {
    console.error("Erro em getInventoryReportData:", error);
    return { success: false, data: [] };
  }
}

export async function getFinancialReportData() {
  try {
    const orders = await prisma.salesOrder.findMany({ include: { customer: true, seller: true } });
    const data = orders.map(o => ({
      Pedido: o.orderNumber || "",
      Data: o.createdAt ? new Date(o.createdAt).toLocaleDateString("pt-BR") : "",
      Cliente: o.customer?.name || "Cliente removido",
      Documento: o.customer?.cpfCnpj || "S/D",
      Vendedor: o.seller?.name || "Vendedor removido",
      Valor_Total: o.totalValue ?? 0,
      Status: o.status || "",
      Metodo_Pagamento: o.paymentMethod || "Não Informado",
    }));
    return { success: true, data };
  } catch (error) {
    console.error("Erro em getFinancialReportData:", error);
    return { success: false, data: [] };
  }
}

export async function getWeaponsMapReportData() {
  try {
    const weapons = await prisma.weaponMap.findMany({ include: { product: true, customer: true } });
    const data = weapons.map(w => ({
      Numero_Serie: w.serialNumber || "",
      Produto: w.product?.commercialName || "Produto Não Encontrado",
      Status: w.currentStatus || "",
      Custo_Unitario: w.unitCost ?? 0,
      Data_Entrada: w.entryDate ? new Date(w.entryDate).toLocaleDateString("pt-BR") : "",
      Cliente_Venda: w.customer?.name || "",
      Data_Venda: w.saleDate ? new Date(w.saleDate).toLocaleDateString("pt-BR") : "",
      Valor_Venda: w.saleValue || 0,
    }));
    return { success: true, data };
  } catch (error) {
    console.error("Erro em getWeaponsMapReportData:", error);
    return { success: false, data: [] };
  }
}

export async function getLotTraceabilityData() {
  try {
    const lots = await prisma.importLot.findMany({
      include: { supplier: true, weapons: true },
    });
    const data = lots.map(l => ({
      Lote: l.batchCode || "",
      Fornecedor: l.supplier?.name || "Sem Fornecedor",
      Pais_Origem: l.countryOrigin || "",
      Data_Compra: l.purchaseDate ? new Date(l.purchaseDate).toLocaleDateString("pt-BR") : "",
      Quantidade_Itens: l.quantityItems ?? 0,
      Status: l.status || "",
      Custo_Total_BRL: l.totalCostNationalized ?? 0,
      Armas_Mapeadas: l.weapons?.length ?? 0,
      Armas_Vendidas: l.weapons ? l.weapons.filter(w => w.currentStatus === "VENDIDA").length : 0,
    }));
    return { success: true, data };
  } catch (error) {
    console.error("Erro em getLotTraceabilityData:", error);
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
      Serie: w.serialNumber || "",
      Produto: w.product?.commercialName || "Produto Não Encontrado",
      SKU: w.product?.sku || "N/A",
      Lote: w.importLot?.batchCode || "N/A",
      Status: w.currentStatus || "",
      Localizacao: w.warehouseLocation || "",
      Custo_Unitario: w.unitCost ?? 0,
      Divergencia: w.hasDivergence ? "SIM" : "NAO",
    }));
    return { success: true, data };
  } catch (error) {
    console.error("Erro em getInventoryConferenceData:", error);
    return { success: false, data: [] };
  }
}

export async function getSellerPerformanceData() {
  try {
    const orders = await prisma.salesOrder.findMany({ include: { seller: true } });
    const map = new Map<string, { Vendedor: string; Total_Pedidos: number; Valor_Total: number }>();
    for (const o of orders) {
      if (!o.sellerId) continue;
      const entry = map.get(o.sellerId) ?? { Vendedor: o.seller?.name || "Vendedor removido", Total_Pedidos: 0, Valor_Total: 0 };
      entry.Total_Pedidos += 1;
      entry.Valor_Total += o.totalValue ?? 0;
      map.set(o.sellerId, entry);
    }
    const data = Array.from(map.values()).map(s => ({
      ...s,
      Ticket_Medio: s.Total_Pedidos > 0 ? +(s.Valor_Total / s.Total_Pedidos).toFixed(2) : 0,
    }));
    return { success: true, data };
  } catch (error) {
    console.error("Erro em getSellerPerformanceData:", error);
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
      Pedido: o.orderNumber || "",
      Cliente: o.customer?.name || "Cliente removido",
      Documento: o.customer?.cpfCnpj || "S/D",
      Estado: o.customer?.state || "",
      Valor: o.totalValue ?? 0,
      Status: o.status || "",
      Data_Pedido: o.createdAt ? new Date(o.createdAt).toLocaleDateString("pt-BR") : "",
    }));
    return { success: true, data };
  } catch (error) {
    console.error("Erro em getDefaultersData:", error);
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
      Projeto: c.project?.name || "Sem Projeto",
      Investidor: c.project?.investor?.name || "Sem Investidor",
      Ciclo: c.cycleName || "",
      Status: c.status || "",
      Capital_Reinvestimento: c.reinvestmentShare ?? 0,
      Share_Investidor: c.investorShare ?? 0,
      Share_Empresa: c.companyShare ?? 0,
      Reserva: c.reserveShare ?? 0,
      Lucro_Bruto: c.grossProfit ?? 0,
    }));
    return { success: true, data };
  } catch (error) {
    console.error("Erro em getReinvestmentProjectionData:", error);
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
      Data_Movimento: w.lastMovementDate ? new Date(w.lastMovementDate).toLocaleDateString("pt-BR") : "",
      Serie: w.serialNumber || "",
      Produto: w.product?.commercialName || "Produto Não Encontrado",
      Status: w.currentStatus || "",
      Cliente: w.customer?.name || "",
      Valor_Venda: w.saleValue || 0,
      Data_Venda: w.saleDate ? new Date(w.saleDate).toLocaleDateString("pt-BR") : "",
    }));
    return { success: true, data };
  } catch (error) {
    console.error("Erro em getMovementHistoryData:", error);
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
      Data_Hora: l.createdAt ? new Date(l.createdAt).toLocaleString("pt-BR") : "",
      Acao: l.action || "",
      Usuario: l.user || "Sistema",
      Lead: l.lead?.name || "Lead removido",
    }));
    return { success: true, data };
  } catch (error) {
    console.error("Erro em getAccessLogsData:", error);
    return { success: false, data: [] };
  }
}

