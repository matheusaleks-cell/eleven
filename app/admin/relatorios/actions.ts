"use server";

import { prisma } from "@/lib/prisma";

export async function getInventoryReportData() {
  try {
    const products = await prisma.product.findMany({
      include: {
        weapons: true
      }
    });

    const data = products.map(p => ({
      SKU: p.sku,
      Produto: p.commercialName,
      Marca: p.brand,
      Estoque_Disponivel: p.stockAvailable,
      Estoque_Reservado: p.stockReserved,
      Preco_B2C: p.priceB2C,
      Armas_Total: p.weapons.length,
      Armas_Vendidas: p.weapons.filter(w => w.currentStatus === "VENDIDA").length,
      Armas_Em_Estoque: p.weapons.filter(w => w.currentStatus === "ESTOQUE").length
    }));

    return { success: true, data };
  } catch (error) {
    console.error("Erro ao gerar relatório de estoque:", error);
    return { success: false, data: [] };
  }
}

export async function getFinancialReportData() {
  try {
    const orders = await prisma.salesOrder.findMany({
      include: { customer: true }
    });

    const data = orders.map(o => ({
      Pedido: o.orderNumber,
      Data: o.createdAt.toLocaleDateString("pt-BR"),
      Cliente: o.customer.name,
      Documento: o.customer.cpfCnpj,
      Valor_Total: o.totalValue,
      Status: o.status,
      Metodo_Pagamento: o.paymentMethod || "Não Informado"
    }));

    return { success: true, data };
  } catch (error) {
    console.error("Erro ao gerar relatório financeiro:", error);
    return { success: false, data: [] };
  }
}

export async function getWeaponsMapReportData() {
  try {
    const weapons = await prisma.weaponMap.findMany({
      include: { product: true, customer: true }
    });

    const data = weapons.map(w => ({
      Numero_Serie: w.serialNumber,
      Produto: w.product.commercialName,
      Status: w.currentStatus,
      Custo_Unitario: w.unitCost,
      Data_Entrada: w.entryDate.toLocaleDateString("pt-BR"),
      Cliente_Venda: w.customer?.name || "",
      Data_Venda: w.saleDate ? w.saleDate.toLocaleDateString("pt-BR") : "",
      Valor_Venda: w.saleValue || 0
    }));

    return { success: true, data };
  } catch (error) {
    console.error("Erro ao gerar mapa de armas:", error);
    return { success: false, data: [] };
  }
}
