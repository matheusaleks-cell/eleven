"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth-guard";
import { logWeaponMovement } from "@/lib/weapon-movement";

// Extrato real de movimentação (entrada/reserva/venda/devolução) — usado no relatório
// mensal/anual do Mapa de Armas. Antes disso não existia nenhum registro histórico real,
// só o status atual de cada arma.
export async function getWeaponMovements(filters?: { month?: number; year?: number }) {
  const session = await requireSession("ADMIN");
  if (!session) return [];

  try {
    let dateWhere: { occurredAt?: { gte: Date; lt: Date } } = {};
    if (filters?.month || filters?.year) {
      const now = new Date();
      const year = filters?.year ?? now.getFullYear();
      const month = filters?.month ?? now.getMonth() + 1;
      dateWhere = { occurredAt: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) } };
    }

    const movements = await prisma.weaponMovement.findMany({
      where: dateWhere,
      include: { weapon: { include: { product: true } } },
      orderBy: { occurredAt: "desc" },
      take: 500,
    });

    return movements.map(m => ({
      id: m.id,
      type: m.type,
      description: m.description,
      occurredAt: m.occurredAt.toLocaleString("pt-BR"),
      serial: m.weapon.serialNumber,
      product: m.weapon.product.commercialName,
    }));
  } catch (error) {
    console.error("Erro ao buscar movimentações:", error);
    return [];
  }
}

// Gera o PDF real de movimentação (mensal/anual) e devolve em base64 pro client baixar.
export async function exportWeaponMovementsPdf(filters: { month?: number; year?: number; periodLabel: string }) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

  try {
    const movements = await getWeaponMovements(filters);
    const { generateWeaponMovementsBuffer } = await import("@/lib/pdf-server");
    const buffer = generateWeaponMovementsBuffer(movements, filters.periodLabel);
    return { success: true, base64: buffer.toString("base64") };
  } catch (error) {
    console.error("Erro ao exportar PDF de movimentações:", error);
    return { success: false, error: "Falha ao gerar PDF." };
  }
}

export async function getWeapons() {
  const session = await requireSession("ADMIN");
  if (!session) return [];

  try {
    const weapons = await prisma.weaponMap.findMany({
      include: {
        product: true,
        customer: true,
        importLot: true,
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
      lot: w.importLot?.batchCode || "—",
      customer: w.customer?.name || "ESTOQUE ELEVEN",
      id: w.id,
      di: w.diNumber || "N/A",
      diDate: w.diDate ? w.diDate.toLocaleDateString("pt-BR") : null,
      customsClearanceDate: w.customsClearanceDate ? w.customsClearanceDate.toLocaleDateString("pt-BR") : null,
      saleDate: w.saleDate ? w.saleDate.toLocaleDateString("pt-BR") : null,
      hasDivergence: w.hasDivergence,
      observations: w.observations,
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
    await prisma.product.update({
      where: { id: data.productId },
      data: { stockAvailable: { increment: 1 } },
    });
    await logWeaponMovement(weapon.id, "ENTRADA", "Entrada em estoque via cadastro manual");
    revalidatePath("/admin/mapa-de-armas");
    revalidatePath("/admin/erp/produtos");
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
    const weapon = await prisma.weaponMap.findUnique({ where: { id }, select: { productId: true, currentStatus: true } });
    await prisma.weaponMap.delete({
      where: { id }
    });
    // Só desconta do estoque disponível se a peça ainda não tinha sido vendida/reservada
    // (nesses casos o estoque já foi descontado no momento da venda).
    if (weapon && weapon.currentStatus === "ESTOQUE") {
      await prisma.product.update({
        where: { id: weapon.productId },
        data: { stockAvailable: { decrement: 1 } },
      });
    }
    revalidatePath("/admin/mapa-de-armas");
    revalidatePath("/admin/erp/produtos");
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
