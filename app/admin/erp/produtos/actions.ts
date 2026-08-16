"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth-guard";

export async function getProducts() {
  const session = await requireSession("ADMIN");
  if (!session) return [];

  try {
    const products = await prisma.product.findMany({
      orderBy: { commercialName: "asc" }
    });

    // stockReserved no banco é um campo morto (nunca escrito por nenhuma venda) — o
    // reservado de verdade é contado ao vivo a partir das armas com pedido tirado
    // (status RESERVADA), a mesma fonte usada no Mapa de Armas.
    const reservedCounts = await prisma.weaponMap.groupBy({
      by: ["productId"],
      where: { currentStatus: "RESERVADA" },
      _count: { _all: true },
    });
    const reservedByProduct = new Map(reservedCounts.map(r => [r.productId, r._count._all]));

    return products.map(p => ({
      ...p,
      stockReserved: reservedByProduct.get(p.id) || 0,
    }));
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return [];
  }
}

export async function createProduct(data: any) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

  try {
    // Validação de SKU único
    const existing = await prisma.product.findUnique({
      where: { sku: data.sku }
    });

    if (existing) {
      return { success: false, error: "Este SKU já está cadastrado no sistema." };
    }

    const product = await prisma.product.create({
      data: {
        sku: data.sku,
        commercialName: data.name,
        brand: data.brand || "N/A",
        model: data.model || "N/A",
        caliber: data.caliber || "N/A",
        species: data.species || "Espingarda",
        actionType: data.actionType || "Semiautomática",
        capacity: Number(data.capacity) || 0,
        barrelLength: Number(data.barrelLength) || 0,
        finish: data.finish || "Oxidado",
        originCountry: data.originCountry || "Turquia",
        ncm: data.ncm || "9303.20.00",
        priceB2C: Number(data.priceB2C) || 0,
        priceB2B: Number(data.priceB2B) || 0,
        stockAvailable: Number(data.stockInitial) || 0,
        technicalDescription: data.technicalDescription || "",
        photos: data.photos || "",
        status: "ACTIVE"
      }
    });

    revalidatePath("/admin/erp/produtos");
    return { success: true, product };
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return { success: false, error: "Falha interna ao salvar produto." };
  }
}

export async function updateProduct(id: string, data: any) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        commercialName: data.name,
        brand: data.brand,
        model: data.model,
        caliber: data.caliber,
        species: data.species,
        actionType: data.actionType,
        capacity: Number(data.capacity) || 0,
        barrelLength: Number(data.barrelLength) || 0,
        finish: data.finish,
        originCountry: data.originCountry,
        ncm: data.ncm,
        priceB2C: Number(data.priceB2C) || 0,
        priceB2B: Number(data.priceB2B) || 0,
        stockAvailable: Number(data.stockAvailable) || 0,
        technicalDescription: data.technicalDescription || "",
        photos: data.photos || "",
        status: data.status || "ACTIVE"
      }
    });

    revalidatePath("/admin/erp/produtos");
    return { success: true, product };
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return { success: false, error: "Falha ao atualizar dados do produto." };
  }
}

export async function deleteProduct(id: string) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

  try {
    await prisma.product.delete({
      where: { id }
    });
    revalidatePath("/admin/erp/produtos");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Não é possível excluir produtos com histórico de estoque." };
  }
}
