"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getImportLots() {
  try {
    const lots = await prisma.importLot.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: true,
        products: true,
        documents: true,
        _count: {
          select: { products: true }
        }
      }
    });
    
    // Mapear campos do banco para o que a UI espera
    return lots.map(lot => ({
      ...lot,
      lotId: lot.batchCode,
      supplier: lot.supplier.name,
      originCountry: lot.countryOrigin,
      fobTotal: lot.fobValue,
      freightTotal: lot.freight,
      insuranceTotal: lot.insurance,
      items_count: lot.quantityItems,
      eta: lot.expectedNationalityDate?.toLocaleDateString('pt-BR') || "A definir"
    }));
  } catch (error) {
    console.error("Erro ao buscar lotes:", error);
    return [];
  }
}

// ... (createImportLot, updateLotStatus, deleteImportLot mantidos)

export async function addLotDocument(lotId: string, name: string, category: string, base64: string) {
  try {
    const doc = await prisma.document.create({
      data: {
        name,
        type: "PDF",
        category,
        size: `${(base64.length / 1024 / 1.33).toFixed(1)} KB`,
        base64Data: base64,
        lotId
      }
    });
    revalidatePath("/admin/importacao/lotes");
    return { success: true, doc };
  } catch (error) {
    console.error("Erro ao adicionar documento:", error);
    return { success: false };
  }
}

export async function deleteLotDocument(id: string) {
  try {
    await prisma.document.delete({
      where: { id }
    });
    revalidatePath("/admin/importacao/lotes");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir documento:", error);
    return { success: false };
  }
}

export async function getSuppliers() {
  try {
    return await prisma.supplier.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error);
    return [];
  }
}

export async function createImportLot(data: any) {
  try {
    // Buscar um fornecedor padrão se não houver ID
    let supplierId = data.supplierId;
    if (!supplierId) {
      const firstSupplier = await prisma.supplier.findFirst();
      supplierId = firstSupplier?.id;
    }

    if (!supplierId) {
      return { success: false, error: "Nenhum fornecedor cadastrado no sistema." };
    }

    const lot = await prisma.importLot.create({
      data: {
        batchCode: `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        supplierId: supplierId,
        countryOrigin: data.originCountry || "Turquia",
        purchaseDate: new Date(),
        currency: data.currency || "USD",
        exchangeRate: Number(data.exchangeRate) || 5.25,
        fobValue: Number(data.fobTotal) || 0,
        freight: Number(data.freightTotal) || 0,
        insurance: Number(data.insuranceTotal) || 0,
        customsTaxes: (Number(data.fobTotal) || 0) * 0.35, // Estimativa inicial
        customsFees: 2500,
        totalCostNationalized: (Number(data.fobTotal) || 0) * (Number(data.exchangeRate) || 5.25) * 1.48,
        quantityItems: data.items?.reduce((acc: number, i: any) => acc + i.quantity, 0) || 0,
        status: "PEDIDO_FEITO",
        expectedMarginPct: 0.35,
        investmentProjectId: data.projectId || null,
        products: {
          connect: data.items?.map((i: any) => ({ id: i.productId })) || []
        }
      }
    });

    revalidatePath("/admin/importacao/lotes");
    return { success: true, lot };
  } catch (error) {
    console.error("Erro ao criar lote:", error);
    return { success: false, error: "Falha ao criar lote de importação." };
  }
}

export async function updateLotStatus(id: string, newStatus: string) {
  try {
    const lot = await prisma.importLot.update({
      where: { id },
      data: { status: newStatus }
    });
    revalidatePath("/admin/importacao/lotes");
    return { success: true, lot };
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    return { success: false };
  }
}

export async function deleteImportLot(id: string) {
  try {
    await prisma.importLot.delete({
      where: { id }
    });

    revalidatePath("/admin/importacao/lotes");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir lote:", error);
    return { success: false };
  }
}
