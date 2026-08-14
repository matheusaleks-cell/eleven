// Helpers compartilhados pelos geradores de PDF (Anexo P / Pedido) do SaleModal, LeadWorkspace e da tela de Vendas.
import { jsPDF } from "jspdf";

// Aceita Date, string ISO ou vazio (formatos que variam conforme a origem do dado: perfil x seletor do PDV)
export const fmtDate = (v: unknown) => {
  if (!v) return "N/A";
  const d = v instanceof Date ? v : new Date(v as string);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("pt-BR");
};

// Carrega um PNG estático em base64 sob demanda, evitando embutir a imagem no bundle JS
export const loadImageAsDataURL = async (src: string): Promise<string> => {
  const res = await fetch(src);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Desenha uma imagem dentro de uma caixa preservando a proporção original (evita esticar o logo,
// já que a caixa do cabeçalho do Anexo P não tem a mesma proporção do PNG de origem).
export const addContainedImage = (
  doc: jsPDF,
  dataUrl: string,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number
) => {
  const { width, height } = doc.getImageProperties(dataUrl);
  const ratio = width / height;

  let drawW = boxW;
  let drawH = drawW / ratio;
  if (drawH > boxH) {
    drawH = boxH;
    drawW = drawH * ratio;
  }

  const x = boxX + (boxW - drawW) / 2;
  const y = boxY + (boxH - drawH) / 2;
  doc.addImage(dataUrl, "PNG", x, y, drawW, drawH, undefined, "MEDIUM");
};

// Campos do Product usados no corpo do Anexo P — quando ausentes, o documento sai com "N/A".
const ANEXO_P_SPEC_FIELDS: { key: string; label: string }[] = [
  { key: "species", label: "Espécie" },
  { key: "caliber", label: "Calibre" },
  { key: "actionType", label: "Sistema de Ação" },
  { key: "barrelLength", label: "Comprimento do Cano" },
  { key: "finish", label: "Acabamento" },
  { key: "originCountry", label: "País de Origem" },
];

// Retorna os rótulos das specs do produto que estão vazias/zeradas e por isso sairão como "N/A" no Anexo P.
export const getMissingAnexoPSpecs = (product: Record<string, unknown> | undefined): string[] => {
  if (!product) return ANEXO_P_SPEC_FIELDS.map(f => f.label);
  return ANEXO_P_SPEC_FIELDS.filter(f => !product[f.key]).map(f => f.label);
};

export interface AnexoPBuyer {
  name?: string | null;
  document?: string | null;
  crNumber?: string | null;
  crValidity?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface AnexoPItemSpec {
  quantity: number;
  name: string;
  species?: string | null;
  brand?: string | null;
  model?: string | null;
  caliber?: string | null;
  actionType?: string | null;
  finish?: string | null;
  originCountry?: string | null;
  barrelLength?: number | null;
}

const ANEXO_P_SUPPLIER = {
  name: "ELEVEN FIREARMS REPRESENTAÇÃO LTDA",
  cnpj: "36.312.424/0001-39",
  crNumber: "550771",
  crValidity: "13/07/2027",
};

// Cabeçalho de marca (fundo preto + logo) — usado SOMENTE no documento PEDIDO.
// O Anexo P oficial vai para o Exército e precisa sair sem identidade visual da empresa (sem logo, sem cor).
export const drawBrandedHeader = async (doc: jsPDF, logoSrc: string) => {
  doc.setFillColor(15, 15, 15);
  doc.rect(0, 0, 210, 35, "F");
  const logoData = await loadImageAsDataURL(logoSrc);
  addContainedImage(doc, logoData, (210 - 60) / 2, 5, 60, 25);
};

// Corpo do documento (adquirente, produtos, fornecedor, declarações, assinatura) — idêntico entre
// Anexo P e Pedido, o que muda é o título e o `titleY` (o Anexo P não tem cabeçalho de marca acima).
export const drawAnexoPBody = (
  doc: jsPDF,
  opts: {
    title: string;
    titleY: number;
    buyer: AnexoPBuyer;
    items: AnexoPItemSpec[];
    timestamp: string;
  }
) => {
  const { title, titleY: T, buyer, items, timestamp } = opts;
  const buyerName = buyer.name || "CLIENTE NÃO INFORMADO";

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(title, 105, T, { align: "center" });
  doc.setFontSize(9);
  const subtitle = "PEDIDO DE AQUISIÇÃO DE PCE (tipo arma de fogo e munição) NA INDÚSTRIA PELO COMÉRCIO VAREJISTA DE ARMAS E MUNIÇÕES";
  const splitTitle = doc.splitTextToSize(subtitle, 180);
  doc.text(splitTitle, 105, T + 7, { align: "center" });

  doc.setFillColor(240, 240, 240);
  doc.rect(10, T + 20, 190, 7, "F");
  doc.text("ADQUIRENTE", 12, T + 25);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Razão social: ${buyerName.toUpperCase()}`, 10, T + 33);
  doc.text(`CNPJ: ${buyer.document || "N/A"}`, 130, T + 33);
  doc.text(`Nº CR: ${buyer.crNumber || "N/A"}`, 10, T + 40);
  doc.text(`Validade do CR: ${buyer.crValidity || "N/A"}`, 130, T + 40);
  doc.text(`Telefone/e-mail: ${buyer.phone || "N/A"} / ${buyer.email || "N/A"}`, 10, T + 47);

  doc.setFont("helvetica", "bold");
  doc.setFillColor(240, 240, 240);
  doc.rect(10, T + 55, 190, 7, "F");
  doc.text("PRODUTOS E QUANTIDADES A SEREM ADQUIRIDOS", 12, T + 60);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text("(conforme lista de PCE Port 118-COLOG/2019)", 198, T + 60, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");

  let y = T + 67;
  items.forEach((item, index) => {
    const especie = item.species || "N/A";
    const marca = item.brand || item.name.split(" ")[0] || "N/A";
    const modelo = item.model || item.name.split(" ").slice(1).join(" ") || "N/A";
    const calibre = item.caliber || "N/A";
    const acao = item.actionType || "N/A";
    const acabamento = item.finish || "N/A";
    const origem = item.originCountry || "N/A";
    const cano = item.barrelLength
      ? `${item.barrelLength}" (${(item.barrelLength * 25.4).toFixed(2)}mm)`
      : "N/A";

    const productText = `(${index + 1}.1.0020) ${item.quantity.toString().padStart(2, "0")} (unidades) Espécie: ${especie} - Marca: ${marca} - Modelo: ${modelo} - Calibre: ${calibre} - Comprimento do Cano: ${cano} - Quantidade de cano: 01 - Tipo de alma: Lisa - Funcionamento: Repetição - Sistema de Ação: ${acao} - Quantidade de carregadores: N/A - Acabamento: ${acabamento} - País de Origem: ${origem} - Arma de repetição de uso permitido.`;
    const splitProduct = doc.splitTextToSize(productText, 185);
    doc.setFont("helvetica", "normal");
    doc.text(splitProduct, 10, y);
    y += splitProduct.length * 4 + 5;

    if (y > 260 && index < items.length - 1) {
      doc.addPage();
      y = 20;
    }
  });

  // O bloco fixo abaixo (fornecedor + anexos + declaracoes + assinatura) consome
  // exatamente 141mm de y (offsets fixos, texto das declaracoes nao varia) + margem de seguranca.
  if (y > 297 - 141 - 10) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFillColor(240, 240, 240);
  doc.rect(10, y, 190, 7, "F");
  doc.text("FORNECEDOR", 12, y + 5);
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.text(`Razão social: ${ANEXO_P_SUPPLIER.name}`, 10, y);
  doc.text(`CNPJ: ${ANEXO_P_SUPPLIER.cnpj}`, 130, y);
  y += 7;
  doc.text(`Nº CR: ${ANEXO_P_SUPPLIER.crNumber}`, 10, y);
  doc.text(`Validade do CR: ${ANEXO_P_SUPPLIER.crValidity}`, 130, y);

  y += 15;
  doc.setFont("helvetica", "bold");
  doc.text("ANEXOS", 10, y);
  doc.setFont("helvetica", "normal");
  doc.text("- cópia de Registro no Exército e suas apostilas", 15, y + 6);
  doc.text("- comprovante de pagamento da taxa de aquisição de PCE", 15, y + 12);
  doc.text("- outros:", 15, y + 18);

  y += 35;
  const dec1 = "DECLARO que a aquisição solicitada não ultrapassa os quantitativos máximos autorizados para depósito previstos na apostila ao meu Registro no Exército.";
  doc.text(doc.splitTextToSize(dec1, 185), 10, y);

  y += 12;
  const dec2 = "DECLARO, ainda, sob as penas da lei, a veracidade das informações prestadas e responsabilizo-me pela destinação do produto adquirido, sem prejuízo das possíveis sanções administrativas.";
  doc.text(doc.splitTextToSize(dec2, 185), 10, y);

  y += 30;
  doc.text(`SÃO PAULO/ SP, ${timestamp}`, 105, y, { align: "center" });

  y += 25;
  doc.line(60, y, 150, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text(buyerName.toUpperCase(), 105, y, { align: "center" });
};

// Anexo P oficial — SEM logo/marca (documento entregue ao Exército). Título fica próximo do topo
// já que não há cabeçalho de marca acima consumindo espaço.
export const generateAnexoPPdf = (buyer: AnexoPBuyer, items: AnexoPItemSpec[], fileNameBase: string) => {
  const doc = new jsPDF();
  const timestamp = new Date().toLocaleDateString("pt-BR");
  drawAnexoPBody(doc, { title: "ANEXO P", titleY: 20, buyer, items, timestamp });
  doc.save(`Anexo_P_${(fileNameBase || "Cliente").replace(/\s+/g, "_")}.pdf`);
};

// PEDIDO — mesmo corpo do Anexo P, mas com o cabeçalho de marca (logo) usado anteriormente pelo Anexo P.
export const generatePedidoPdf = async (
  buyer: AnexoPBuyer,
  items: AnexoPItemSpec[],
  fileNameBase: string,
  logoSrc: string
) => {
  const doc = new jsPDF();
  const timestamp = new Date().toLocaleDateString("pt-BR");
  await drawBrandedHeader(doc, logoSrc);
  drawAnexoPBody(doc, { title: "PEDIDO", titleY: 45, buyer, items, timestamp });
  doc.save(`Pedido_${(fileNameBase || "Cliente").replace(/\s+/g, "_")}.pdf`);
};
