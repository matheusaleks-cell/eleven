"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth-guard";

export async function getWeapons() {
  const session = await requireSession("ADMIN");
  if (!session) return [];

  try {
    const weapons = await prisma.weaponMap.findMany({
      include: {
        product: true,
        customer: true,
      },
      orderBy: [
        { serialNumber: "asc" },
        { entryDate: "desc" }
      ],
    });

    return weapons.map(w => ({
      serial: w.serialNumber,
      product: w.product.commercialName,
      status: w.currentStatus,
      location: w.warehouseLocation || "S/L",
      entryDate: w.entryDate.toLocaleDateString("pt-BR"),
      lot: (w.importLotId ?? '').substring(0, 8).toUpperCase(),
      customer: w.customer?.name || "ESTOQUE ELEVEN",
      id: w.id,
      di: w.diNumber || "24/0988712-0",
      caliber: w.product.caliber,
      brand: w.product.brand,
    }));
  } catch (error) {
    console.error("Erro ao buscar armas:", error);
    return [];
  }
}

export async function getWeaponStats() {
  const session = await requireSession("ADMIN");
  if (!session) return { total: 0, available: 0, reserved: 0, sold: 0, divergence: 0 };

  try {
    const total = await prisma.weaponMap.count();
    const available = await prisma.weaponMap.count({ where: { currentStatus: "ESTOQUE" } });
    const reserved = await prisma.weaponMap.count({ where: { currentStatus: "RESERVADA" } });
    const sold = await prisma.weaponMap.count({ where: { currentStatus: "VENDIDA" } });
    const divergence = await prisma.weaponMap.count({ where: { hasDivergence: true } });

    return {
      total,
      available,
      reserved,
      sold,
      divergence
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas de armas:", error);
    return { total: 0, available: 0, reserved: 0, sold: 0, divergence: 0 };
  }
}

export async function updateWeaponStatus(id: string, status: string) {
  const session = await requireSession("ADMIN");
  if (!session) throw new Error("Não autorizado");

  try {
    const weapon = await prisma.weaponMap.update({
      where: { id },
      data: {
        currentStatus: status,
        lastMovementDate: new Date(),
      },
    });
    revalidatePath("/admin/mapa-de-armas");
    return weapon;
  } catch (error) {
    console.error("Erro ao atualizar status da arma:", error);
    throw new Error("Falha ao atualizar arma");
  }
}

export async function createWeapon(data: any) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

  try {
    let supplierId = data.supplierId;
    if (!supplierId) {
      const firstSupplier = await prisma.supplier.findFirst();
      supplierId = firstSupplier?.id;
    }

    let importLotId = data.importLotId;
    if (!importLotId) {
      const firstLot = await prisma.importLot.findFirst();
      importLotId = firstLot?.id;
    }

    if (!supplierId || !importLotId) {
      return { success: false, error: "Fornecedor ou Lote base não encontrados para vincular a arma." };
    }

    const weapon = await prisma.weaponMap.create({
      data: {
        serialNumber: data.serialNumber,
        productId: data.productId,
        supplierId: supplierId,
        importLotId: importLotId,
        warehouseLocation: data.location,
        currentStatus: "ESTOQUE",
        unitCost: Number(data.unitCost) || 0,
        diNumber: data.diNumber,
        entryDate: new Date(),
      }
    });
    revalidatePath("/admin/mapa-de-armas");
    return { success: true, weapon };
  } catch (error) {
    console.error("Erro ao cadastrar arma:", error);
    return { success: false, error: "Número de série já cadastrado ou erro interno." };
  }
}

export async function deleteWeapon(id: string) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

  try {
    await prisma.weaponMap.delete({
      where: { id }
    });
    revalidatePath("/admin/mapa-de-armas");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir arma:", error);
    return { success: false, error: "Não é possível excluir uma arma com histórico de vendas." };
  }
}

export async function getProducts() {
  const session = await requireSession("ADMIN");
  if (!session) return [];

  try {
    return await prisma.product.findMany({
      orderBy: { commercialName: "asc" }
    });
  } catch (error) {
    return [];
  }
}
