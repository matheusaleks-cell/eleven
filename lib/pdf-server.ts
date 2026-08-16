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
