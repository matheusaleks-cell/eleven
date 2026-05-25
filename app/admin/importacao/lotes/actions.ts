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
        weapons: {
          include: {
            product: true,
            customer: true
          }
        },
        _count: {
          select: { products: true }
        }
      } as any
    }) as any[];
    
    const STATUS_PROGRESS: Record<string, number> = {
      PEDIDO_FEITO: 15,
      TRANSITO: 40,
      NACIONALIZANDO: 70,
      DISPONIVEL: 90,
      LIQUIDADO: 100,
    };

    // Mapear campos do banco para o que a UI espera
    return lots.map(lot => ({
      ...lot,
      lotId: lot.batchCode,
      supplier: lot.supplier?.name || "Fornecedor",
      origin: lot.countryOrigin,
      originCountry: lot.countryOrigin,
      value: lot.fobValue,
      fobTotal: lot.fobValue,
      freightTotal: lot.freight,
      insuranceTotal: lot.insurance,
      items_count: lot.quantityItems,
      progress: STATUS_PROGRESS[lot.status] ?? 0,
      eta: lot.expectedNationalityDate?.toLocaleDateString('pt-BR') || "A definir"
    }));
  } catch (error) {
    console.error("Erro ao buscar lotes:", error);
    return [];
  }
}

// ... (createImportLot, updateLotStatus, deleteImportLot mantidos)

export async function addLotDocument(
  lotId: string, 
  name: string, 
  category: string, 
  base64: string,
  realizedValue?: number | null,
  realizedDate?: string | null
) {
  try {
    const lot = (await prisma.importLot.findUnique({
      where: { id: lotId },
      include: {
        investmentProject: true
      }
    })) as any;

    const projectId = lot?.investmentProjectId || null;
    const userId = lot?.investmentProject?.investorId || null;

    const doc = await prisma.document.create({
      data: {
        name,
        type: name.toUpperCase().endsWith(".PDF") ? "PDF" : "IMAGE",
        category,
        size: `${(base64.length / 1024 / 1.33).toFixed(1)} KB`,
        base64Data: base64,
        lotId,
        projectId,
        userId,
        realizedValue: realizedValue ?? null,
        realizedDate: realizedDate ? new Date(realizedDate) : null
      } as any
    });
    revalidatePath("/admin/importacao/lotes");
    if (userId) {
      revalidatePath(`/admin/investidores/${userId}`);
      revalidatePath(`/investidor/documentos`);
    }
    return { success: true, doc };
  } catch (error) {
    console.error("Erro ao adicionar documento:", error);
    return { success: false };
  }
}

export async function updateDocumentRealizedFields(
  docId: string,
  realizedValue: number | null,
  realizedDate: string | null
) {
  try {
    const doc = await prisma.document.update({
      where: { id: docId },
      data: {
        realizedValue: realizedValue !== null ? Number(realizedValue) : null,
        realizedDate: realizedDate ? new Date(realizedDate) : null
      } as any,
      include: {
        importLot: true
      } as any
    }) as any;

    revalidatePath("/admin/importacao/lotes");
    if (doc?.userId) {
      revalidatePath(`/admin/investidores/${doc.userId}`);
      revalidatePath(`/investidor/documentos`);
    }

    return { success: true, doc };
  } catch (error) {
    console.error("Erro ao atualizar campos realizados do documento:", error);
    return { success: false, error: "Falha ao atualizar dados de pagamento." };
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

    const fob = Number(data.fobTotal) || 0;
    const freightTotal = Number(data.freightTotal) || 0;
    const insuranceTotal = Number(data.insuranceTotal) || 0;
    const exchangeRate = Number(data.exchangeRate) || 5.25;

    // Fórmulas exatas do preset VR12_PUMP_PRESET (Turquia)
    const iiRate = 0.18;
    const ipiRate = 0.55;
    const pisRate = 0.021;
    const cofinsRate = 0.0965;
    const icmsFactor = 0.75;
    const icmsRate = 0.25;
    const siscomexFixed = 154.23;
    const custoOpFixed = 7884;

    const va = (fob + freightTotal + insuranceTotal) * exchangeRate;
    const ii = va * iiRate;
    const ipi = (va + ii) * ipiRate;
    const pis = va * pisRate;
    const cofins = va * cofinsRate;
    const siscomex = siscomexFixed;
    const baseNormal = va + ii + ipi + pis + cofins + siscomex;
    const baseAlterada = baseNormal / icmsFactor;
    const icms = baseAlterada * icmsRate;
    const custoOp = custoOpFixed;

    const customsTaxes = ii + ipi + pis + cofins + icms;
    const customsFees = siscomex + custoOp;
    const totalCostNationalized = baseAlterada + custoOp;

    const lot = await prisma.importLot.create({
      data: {
        batchCode: `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        supplierId: supplierId,
        countryOrigin: data.originCountry || "Turquia",
        purchaseDate: new Date(),
        currency: data.currency || "USD",
        exchangeRate,
        fobValue: fob,
        freight: freightTotal,
        insurance: insuranceTotal,
        customsTaxes,
        customsFees,
        totalCostNationalized,
        quantityItems: data.items?.reduce((acc: number, i: any) => acc + i.quantity, 0) || 0,
        status: "PEDIDO_FEITO",
        expectedMarginPct: 0.35,
        investmentProjectId: data.projectId || null,
        products: {
          connect: data.items
            ?.filter((i: any) => i.productId && i.productId !== "generic-id")
            .map((i: any) => ({ id: i.productId })) || []
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
    const weaponCount = await prisma.weaponMap.count({ where: { importLotId: id } });
    if (weaponCount > 0) {
      return {
        success: false,
        error: `Este lote possui ${weaponCount} arma(s) vinculada(s) e não pode ser excluído.`,
      };
    }
    // Null out Cycle.importLotId references before delete (field is nullable, no cascade)
    await prisma.cycle.updateMany({ where: { importLotId: id }, data: { importLotId: null } });
    // Documents auto-cascade via schema onDelete: Cascade
    await prisma.importLot.delete({ where: { id } });

    revalidatePath("/admin/importacao/lotes");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir lote:", error);
    return { success: false, error: "Falha ao excluir lote de importação." };
  }
}

export async function registerLotSerials(lotId: string, productId: string, serials: string[]) {
  try {
    const lot = await prisma.importLot.findUnique({
      where: { id: lotId }
    });

    if (!lot) {
      return { success: false, error: "Lote de importação não encontrado." };
    }

    const cleanSerials = serials
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (cleanSerials.length === 0) {
      return { success: false, error: "Nenhum número de série válido fornecido." };
    }

    const existing = await prisma.weaponMap.findMany({
      where: {
        serialNumber: { in: cleanSerials }
      },
      select: { serialNumber: true }
    });

    if (existing.length > 0) {
      const dups = existing.map(e => e.serialNumber).join(", ");
      return {
        success: false,
        error: `Os seguintes números de série já estão cadastrados no sistema: ${dups}`
      };
    }

    const creations = cleanSerials.map(serial => {
      return prisma.weaponMap.create({
        data: {
          serialNumber: serial,
          productId: productId,
          supplierId: lot.supplierId,
          importLotId: lot.id,
          currentStatus: "ESTOQUE",
          unitCost: (lot.totalCostNationalized / (lot.quantityItems || 1)),
          entryDate: new Date(),
        }
      });
    });

    await prisma.$transaction(creations);

    revalidatePath("/admin/importacao/lotes");
    revalidatePath("/admin/mapa-de-armas");
    revalidatePath("/admin/erp/produtos");

    return { success: true, count: cleanSerials.length };
  } catch (error) {
    console.error("Erro ao registrar números de série:", error);
    return { success: false, error: "Falha interna ao registrar números de série." };
  }
}
