import "server-only";
import { jsPDF } from "jspdf";
import { drawAnexoPBody, AnexoPBuyer, AnexoPItemSpec } from "@/lib/pdf-helpers";

// Gera o Anexo P inteiramente no servidor (sem depender do navegador) para poder
// anexar o PDF a um e-mail automático assim que uma venda é registrada. O Anexo P
// não leva logo/identidade visual (documento entregue ao Exército), então não
// precisa de nenhuma imagem — só reaproveita o mesmo corpo desenhado no client.
export function generateAnexoPBuffer(buyer: AnexoPBuyer, items: AnexoPItemSpec[]): Buffer {
  const doc = new jsPDF();
  const timestamp = new Date().toLocaleDateString("pt-BR");
  drawAnexoPBody(doc, { title: "ANEXO P", titleY: 20, buyer, items, timestamp });
  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}

export interface WeaponMovementRow {
  occurredAt: string;
  type: string;
  serial: string;
  product: string;
  description: string;
}

const MOVEMENT_TYPE_LABEL: Record<string, string> = {
  ENTRADA: "Entrada",
  RESERVA: "Reserva",
  VENDA: "Venda",
  DEVOLUCAO_ESTOQUE: "Devolução",
};

// Relatório real de movimentação de armas (entrada/saída) em PDF — antes o botão de
// exportação do Mapa de Armas era um toast falso, sem gerar nenhum arquivo.
export function generateWeaponMovementsBuffer(rows: WeaponMovementRow[], periodLabel: string): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marginX = 12;
  const colX = { data: marginX, tipo: 50, serie: 75, produto: 105, desc: 150 };
  const pageWidth = 210;
  const pageBottom = 285;

  let y = 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("ELEVEN FIREARMS — MOVIMENTAÇÃO DE ARMAS", marginX, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text(`Período: ${periodLabel} · Gerado em ${new Date().toLocaleString("pt-BR")}`, marginX, y);
  y += 8;

  const drawHeader = () => {
    doc.setFillColor(235, 184, 0);
    doc.rect(marginX, y, pageWidth - marginX * 2, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("DATA/HORA", colX.data + 1, y + 4.2);
    doc.text("TIPO", colX.tipo + 1, y + 4.2);
    doc.text("SÉRIE", colX.serie + 1, y + 4.2);
    doc.text("PRODUTO", colX.produto + 1, y + 4.2);
    doc.text("DESCRIÇÃO", colX.desc + 1, y + 4.2);
    y += 7;
  };

  drawHeader();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(20, 20, 20);

  rows.forEach((row, i) => {
    if (y > pageBottom) {
      doc.addPage();
      y = 18;
      drawHeader();
    }
    if (i % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(marginX, y - 4, pageWidth - marginX * 2, 5.5, "F");
    }
    doc.setTextColor(20, 20, 20);
    doc.text(row.occurredAt, colX.data + 1, y);
    doc.text(MOVEMENT_TYPE_LABEL[row.type] || row.type, colX.tipo + 1, y);
    doc.text(row.serial, colX.serie + 1, y);
    doc.text(doc.splitTextToSize(row.product, 42)[0] || "", colX.produto + 1, y);
    doc.text(doc.splitTextToSize(row.description, 55)[0] || "", colX.desc + 1, y);
    y += 5.5;
  });

  if (rows.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.text("Nenhuma movimentação registrada neste período.", marginX, y);
  }

  return Buffer.from(doc.output("arraybuffer"));
}
