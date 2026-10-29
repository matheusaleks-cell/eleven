// Texto do aviso exibido antes de excluir um projeto de investimento. A exclusão apaga
// ciclos e documentos e solta os lotes (viram estoque "próprio"); o admin precisa ver
// isso antes de confirmar, e não depois.

export interface ProjectDeletionImpact {
  name: string;
  cycles: number;
  documents: number;
  lots: { batchCode: string; weapons: number; sold: number; soldValue: number }[];
}

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function buildProjectDeletionMessage(impact: ProjectDeletionImpact): string {
  const lines = [
    `Excluir o projeto "${impact.name}"?`,
    "",
    "SERÁ APAGADO E NÃO VOLTA:",
    `• ${impact.cycles} ciclo(s) (histórico de lucro e reinvestimento)`,
    `• ${impact.documents} documento(s) do projeto`,
  ];

  if (impact.lots.length > 0) {
    lines.push(
      "",
      "Os lotes abaixo NÃO são apagados, mas ficam SEM investidor (viram estoque próprio) e somem do painel dele:"
    );
    for (const lot of impact.lots) {
      lines.push(`• ${lot.batchCode}: ${lot.weapons} arma(s), ${lot.sold} vendida(s) (${brl(lot.soldValue)})`);
    }
    lines.push(
      "",
      'Dá para religar um lote depois em "Vincular lote", na página de um projeto, mas os ciclos e documentos acima não são recriados.'
    );
  }

  lines.push("", "Deseja continuar?");
  return lines.join("\n");
}
