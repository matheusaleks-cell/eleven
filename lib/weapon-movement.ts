import "server-only";
import { prisma } from "@/lib/prisma";

export type WeaponMovementType = "ENTRADA" | "RESERVA" | "VENDA" | "DEVOLUCAO_ESTOQUE";

// Best-effort: nunca deve derrubar a operação principal (venda, cadastro de série etc.)
// por causa de uma falha ao gravar o log de movimentação.
export async function logWeaponMovement(weaponId: string, type: WeaponMovementType, description: string) {
  try {
    await prisma.weaponMovement.create({
      data: { weaponId, type, description },
    });
  } catch (error) {
    console.error("Erro ao registrar movimentação da arma:", error);
  }
}

export async function logWeaponMovements(weaponIds: string[], type: WeaponMovementType, description: string) {
  await Promise.all(weaponIds.map(id => logWeaponMovement(id, type, description)));
}
