import "server-only";

import { prisma } from "@/lib/prisma";

// Regra de negócio: o lote só fica LIQUIDADO quando TODAS as armas dele foram vendidas.
// Enquanto houver arma em estoque, reservada ou importada, ele não pode estar liquidado — mesmo
// que já exista ciclo registrado ou outro lote depois dele.
//
// Chamada ao fim de toda ação que muda status de arma (venda, reserva, devolução, exclusão de
// pedido, cadastro de séries...). Reconcilia os lotes que têm armas:
//  - todas vendidas            -> LIQUIDADO
//  - LIQUIDADO com arma à venda -> DISPONIVEL (volta a vender)
// Lotes sem nenhuma arma cadastrada não são tocados. Nunca lança erro (não derruba a venda).
export async function syncLotLiquidation(): Promise<void> {
  try {
    const groups = await prisma.weaponMap.groupBy({
      by: ["importLotId", "currentStatus"],
      _count: { _all: true },
    });

    const lots = new Map<string, { total: number; unsold: number }>();
    for (const g of groups) {
      const cur = lots.get(g.importLotId) || { total: 0, unsold: 0 };
      cur.total += g._count._all;
      if (g.currentStatus !== "VENDIDA") cur.unsold += g._count._all;
      lots.set(g.importLotId, cur);
    }

    const soldOut: string[] = [];
    const stillSelling: string[] = [];
    for (const [id, c] of lots) {
      if (c.total > 0 && c.unsold === 0) soldOut.push(id);
      else if (c.unsold > 0) stillSelling.push(id);
    }

    if (soldOut.length > 0) {
      await prisma.importLot.updateMany({
        where: { id: { in: soldOut }, status: { not: "LIQUIDADO" } },
        data: { status: "LIQUIDADO" },
      });
    }
    if (stillSelling.length > 0) {
      await prisma.importLot.updateMany({
        where: { id: { in: stillSelling }, status: "LIQUIDADO" },
        data: { status: "DISPONIVEL" },
      });
    }
  } catch (error) {
    console.error("[Lotes] Falha ao sincronizar liquidação:", error);
  }
}

// Quantas armas do lote ainda não foram vendidas (estoque, reservada, importada).
export async function countUnsoldWeapons(lotId: string): Promise<number> {
  return prisma.weaponMap.count({ where: { importLotId: lotId, currentStatus: { not: "VENDIDA" } } });
}
