// Fonte única dos documentos exigidos por lote de importação e da etapa a que cada um
// pertence. Antes cada tela (BatchWorkspace, actions) reimplementava essa lista e o
// agrupamento por etapa era só uma constante do componente cliente, nunca persistida —
// então "etapa do documento" não existia de fato no banco, só na comparação de string
// feita na hora de renderizar.
export const REQUIRED_DOCUMENTS = [
  "INVOICE",
  "PACKING LIST",
  "LICENÇA DE IMPORTAÇÃO / LPCO",
  "SWIFT – COMPROVANTE DE PAGTO/CÂMBIO",
  "AWB EMBARQUE",
  "TERMO DE VISTORIA EXÉRCITO BRASILEIRO",
  "PAGTO TRIBUTOS FEDERAIS",
  "PAGTO GARE ICMS",
  "PGTO ARMAZENAGEM",
  "NFe ENTRADA",
];

export interface ImportStage {
  id: string;
  title: string;
  description: string;
  items: string[];
}

export const DOCUMENT_STAGES: ImportStage[] = [
  {
    id: "pagamento",
    title: "1. PAGAMENTO & INÍCIO (FOB)",
    description: "Invoice, Packing List e Swift de Câmbio",
    items: ["INVOICE", "PACKING LIST", "SWIFT – COMPROVANTE DE PAGTO/CÂMBIO"],
  },
  {
    id: "embarque",
    title: "2. EMBARQUE & TRÂNSITO",
    description: "Conhecimento de embarque internacional",
    items: ["AWB EMBARQUE"],
  },
  {
    id: "aduana",
    title: "3. ADUANA & DESEMBARAÇO",
    description: "Licenças, vistorias e recolhimento de impostos federais/estaduais",
    items: [
      "LICENÇA DE IMPORTAÇÃO / LPCO",
      "TERMO DE VISTORIA EXÉRCITO BRASILEIRO",
      "PAGTO TRIBUTOS FEDERAIS",
      "PAGTO GARE ICMS",
      "PGTO ARMAZENAGEM",
    ],
  },
  {
    id: "recebido",
    title: "4. RECEBIDO & ESTOQUE",
    description: "NFe de entrada no depósito nacional",
    items: ["NFe ENTRADA"],
  },
];

// Categoria do documento -> id da etapa (usado pra persistir Document.stage no upload).
export const CATEGORY_TO_STAGE: Record<string, string> = Object.fromEntries(
  DOCUMENT_STAGES.flatMap(stage => stage.items.map(item => [item, stage.id]))
);
