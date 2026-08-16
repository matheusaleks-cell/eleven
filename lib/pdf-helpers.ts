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

// Desenha uma imagem dentro de uma caixa preservando a proporção original
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
  address?: string | null;
  contactName?: string | null;
}

export interface AnexoPItemSpec {
  quantity: number;
  name: string;
  unitPrice?: number | null;
  totalPrice?: number | null;
  species?: string | null;
  brand?: string | null;
  model?: string | null;
  caliber?: string | null;
  actionType?: string | null;
  finish?: string | null;
  originCountry?: string | null;
  barrelLength?: number | null;
  capacity?: number | null;
  technicalDescription?: string | null;
}

export interface PedidoExtraOptions {
  sellerName?: string | null;
  orderDate?: string | null;
  orderNumber?: string | null;
  paymentMethod?: string | null;
  downPayment?: number | null;
  totalValue?: number | null;
  logoSrc?: string;
}

const ANEXO_P_SUPPLIER = {
  name: "ELEVEN FIREARMS REPRESENTAÇÃO LTDA",
  cnpj: "36.312.424/0001-39",
  crNumber: "550771",
  crValidity: "13/07/2027",
  address: "Av. Nova Cantareira, 2855 - Tucuruvi /SP - CEP 02341-000",
  phone: "11 99889-9777",
  email: "elevenfirearms@gmail.com",
  instagram: "eleven.firearms",
};

// ==========================================
// 1. ANEXO P OFICIAL (Para o Exército)
// ==========================================

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

export const generateAnexoPPdf = (buyer: AnexoPBuyer, items: AnexoPItemSpec[], fileNameBase: string) => {
  const doc = new jsPDF();
  const timestamp = new Date().toLocaleDateString("pt-BR");
  drawAnexoPBody(doc, { title: "ANEXO P", titleY: 20, buyer, items, timestamp });
  doc.save(`Anexo_P_${(fileNameBase || "Cliente").replace(/\s+/g, "_")}.pdf`);
};

// ==========================================
// 2. PEDIDO COMERCIAL OFICIAL (Layout Eleven Firearms)
// ==========================================

const GOLD_COLOR: [number, number, number] = [235, 184, 0];   // #EBB800
const GRAY_COLOR: [number, number, number] = [112, 112, 112]; // #707070
const BORDER_COLOR: [number, number, number] = [210, 210, 210];

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
};

export const generatePedidoPdf = async (
  buyer: AnexoPBuyer,
  items: AnexoPItemSpec[],
  fileNameBase: string,
  logoSrc: string = "/logos/logo-alta-preto.png",
  options?: PedidoExtraOptions
) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const timestamp = options?.orderDate || new Date().toLocaleDateString("pt-BR");
  const orderNumber = options?.orderNumber || "N/A";
  const sellerName = (options?.sellerName || "RAUL").toUpperCase();
  const paymentMethod = options?.paymentMethod || "ENTRADA 50% DO VALOR - RESTANTE EM 6X NO CARTÃO DE CRÉDITO";

  const totalCalculated = items.reduce((sum, i) => sum + ((i.unitPrice ?? 0) * (i.quantity ?? 1)), 0);
  const totalValue = options?.totalValue ?? totalCalculated;
  const downPayment = options?.downPayment ?? (totalValue * 0.5);
  const remainingBalance = totalValue - downPayment;

  // --- CABEÇALHO DA EMPRESA (Topo) ---
  const headerY = 12;
  try {
    const logoData = await loadImageAsDataURL(logoSrc || "/logos/logo-alta-preto.png");
    addContainedImage(doc, logoData, 10, headerY, 52, 14);
  } catch {
    // Fallback caso a imagem não carregue
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("ELEVEN FIREARMS", 10, headerY + 10);
  }

  // Dados da Empresa
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text("ELEVEN FIREARMS REPRESENTAÇÃO LTDA", 10, headerY + 19);

  doc.setFontSize(7.5);
  doc.setTextColor(90, 90, 90);
  doc.text(`CNPJ ${ANEXO_P_SUPPLIER.cnpj}                    CR ${ANEXO_P_SUPPLIER.crNumber}`, 10, headerY + 23.5);

  // Lista de Contatos com ícones/bolinhas douradas
  const contacts = [
    ANEXO_P_SUPPLIER.address,
    ANEXO_P_SUPPLIER.phone,
    ANEXO_P_SUPPLIER.email,
    ANEXO_P_SUPPLIER.instagram,
  ];

  let contactY = headerY + 27.5;
  contacts.forEach((text) => {
    // Bolinha amarela
    doc.setFillColor(...GOLD_COLOR);
    doc.circle(11.5, contactY - 0.8, 1.2, "F");

    doc.setFontSize(7);
    doc.setTextColor(50, 50, 50);
    if (text === ANEXO_P_SUPPLIER.email) {
      doc.setTextColor(0, 85, 170); // Cor de link azul
    }
    doc.text(text, 14.5, contactY);
    contactY += 3.8;
  });

  // --- TABELA DE INFORMAÇÕES DO PEDIDO E CLIENTE ---
  let gridY = contactY + 2;
  const leftX = 10;
  const tableW = 190;

  // Helper para desenhar célula com cabeçalho amarelo e valor
  const drawFieldCell = (
    x: number,
    y: number,
    w: number,
    headerH: number,
    dataH: number,
    headerText: string,
    valueText: string,
    align: "left" | "center" | "right" = "center",
    isLink = false
  ) => {
    // Header Amarelo
    doc.setFillColor(...GOLD_COLOR);
    doc.setDrawColor(...BORDER_COLOR);
    doc.rect(x, y, w, headerH, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text(headerText, x + w / 2, y + headerH - 1.5, { align: "center" });

    // Data Branco
    doc.setFillColor(255, 255, 255);
    doc.rect(x, y + headerH, w, dataH, "FD");

    doc.setFont("helvetica", isLink ? "normal" : "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(isLink ? 0 : 0, isLink ? 85 : 0, isLink ? 170 : 0);

    const posX = align === "center" ? x + w / 2 : align === "right" ? x + w - 3 : x + 3;
    doc.text(valueText || "N/A", posX, y + headerH + dataH - 1.8, { align });
  };

  // Linha 1: Vendedor (65mm) | Data Pedido (60mm) | Nº do Pedido (65mm)
  drawFieldCell(leftX, gridY, 65, 4.5, 5.5, "Vendedor / Representante", sellerName);
  drawFieldCell(leftX + 65, gridY, 60, 4.5, 5.5, "Data Pedido", timestamp);
  drawFieldCell(leftX + 125, gridY, 65, 4.5, 5.5, "Nº do Pedido", orderNumber);
  gridY += 10;

  // Linha 2: Razão Social / Nome Completo (125mm) | CNPJ / CPF (65mm)
  const buyerName = (buyer.name || "CLIENTE NÃO INFORMADO").toUpperCase();
  const buyerDoc = buyer.document || "N/A";
  drawFieldCell(leftX, gridY, 125, 4.5, 5.5, "Razão Social / Nome Completo", buyerName);
  drawFieldCell(leftX + 125, gridY, 65, 4.5, 5.5, "CNPJ / CPF", buyerDoc);
  gridY += 10;

  // Linha 3: Endereço (190mm)
  const buyerAddress = buyer.address || "Endereço não informado";
  drawFieldCell(leftX, gridY, 190, 4.5, 5.5, "Endereço", buyerAddress);
  gridY += 10;

  // Linha 4: Contato (40mm) | E-MAIL (85mm) | TELEFONE (65mm)
  const contactName = (buyer.contactName || "N/A").toUpperCase();
  const buyerEmail = buyer.email || "N/A";
  const buyerPhone = buyer.phone || "N/A";
  drawFieldCell(leftX, gridY, 40, 4.5, 5.5, "Contato", contactName);
  drawFieldCell(leftX + 40, gridY, 85, 4.5, 5.5, "E-MAIL", buyerEmail, "center", true);
  drawFieldCell(leftX + 125, gridY, 65, 4.5, 5.5, "TELEFONE", buyerPhone);
  gridY += 12;

  // --- TABELA DE PRODUTOS ---
  const colQtdW = 12;
  const colDescW = 118;
  const colUnitPriceW = 30;
  const colTotalW = 30;

  // Cabeçalho da Tabela
  doc.setFillColor(...GOLD_COLOR);
  doc.setDrawColor(...BORDER_COLOR);
  doc.rect(leftX, gridY, colQtdW, 5.5, "FD");
  doc.rect(leftX + colQtdW, gridY, colDescW, 5.5, "FD");
  doc.rect(leftX + colQtdW + colDescW, gridY, colUnitPriceW, 5.5, "FD");
  doc.rect(leftX + colQtdW + colDescW + colUnitPriceW, gridY, colTotalW, 5.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text("Qtd", leftX + colQtdW / 2, gridY + 3.8, { align: "center" });
  doc.text("Descrição", leftX + colQtdW + colDescW / 2, gridY + 3.8, { align: "center" });
  doc.text("Preço unitário", leftX + colQtdW + colDescW + colUnitPriceW / 2, gridY + 3.8, { align: "center" });
  doc.text("Total", leftX + colQtdW + colDescW + colUnitPriceW + colTotalW / 2, gridY + 3.8, { align: "center" });
  gridY += 5.5;

  // Itens da Tabela
  items.forEach((item) => {
    const qty = item.quantity || 1;
    const unitPrice = item.unitPrice ?? (totalValue / items.length);
    const itemTotal = item.totalPrice ?? (unitPrice * qty);

    // Monta descrição técnica detalhada
    let desc = "";
    if (item.technicalDescription) {
      desc = item.technicalDescription;
    } else {
      const especie = item.species || "Arma de Fogo";
      const marca = item.brand || item.name.split(" ")[0] || "N/A";
      const modelo = item.model || item.name.split(" ").slice(1).join(" ") || item.name;
      const calibre = item.caliber || "N/A";
      const cano = item.barrelLength
        ? `${item.barrelLength}" (${(item.barrelLength * 25.4).toFixed(2)}mm)`
        : "N/A";
      const acao = item.actionType || "N/A";
      const acabamento = item.finish || "N/A";
      const origem = item.originCountry || "Turquia";
      const cap = item.capacity ? `02 (${item.capacity} tiros)` : "02 carregadores";

      desc = `Espécie: ${especie} - Marca: ${marca} - Modelo: ${modelo} - Calibre: ${calibre} - Comprimento do Cano: ${cano} - Quantidade de cano: 01 - Tipo de alma: ${especie.toLowerCase().includes("espingarda") ? "Lisa" : "Raiada"} - Funcionamento: ${especie.toLowerCase().includes("pistola") ? "Semi-Automatico" : "Repetição"} - Sistema de Ação: ${acao} - Quantidade de carregadores: ${cap} - Acabamento: ${acabamento} - País de Origem: ${origem} - Arma de repetição de uso permitido (1.1.0020)`;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const splitDesc = doc.splitTextToSize(desc, colDescW - 6);
    const rowH = Math.max(splitDesc.length * 3.2 + 6, 12);

    // Verifica se precisa de nova página
    if (gridY + rowH > 240) {
      doc.addPage();
      gridY = 20;
    }

    // Desenha bordas da linha
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...BORDER_COLOR);
    doc.rect(leftX, gridY, colQtdW, rowH, "FD");
    doc.rect(leftX + colQtdW, gridY, colDescW, rowH, "FD");
    doc.rect(leftX + colQtdW + colDescW, gridY, colUnitPriceW, rowH, "FD");
    doc.rect(leftX + colQtdW + colDescW + colUnitPriceW, gridY, colTotalW, rowH, "FD");

    // Qtd
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(qty.toString(), leftX + colQtdW / 2, gridY + rowH / 2 + 1, { align: "center" });

    // Descrição
    doc.setFontSize(7);
    doc.text(splitDesc, leftX + colQtdW + 3, gridY + 4.5);

    // Preço Unitário
    doc.setFontSize(7.5);
    doc.text(formatCurrency(unitPrice), leftX + colQtdW + colDescW + colUnitPriceW - 3, gridY + rowH / 2 + 1, { align: "right" });

    // Total
    doc.text(formatCurrency(itemTotal), leftX + colQtdW + colDescW + colUnitPriceW + colTotalW - 3, gridY + rowH / 2 + 1, { align: "right" });

    gridY += rowH;
  });

  // --- FORMA DE PAGAMENTO (Banner) ---
  gridY += 2;
  doc.setFillColor(...GOLD_COLOR);
  doc.setDrawColor(...BORDER_COLOR);
  doc.rect(leftX, gridY, tableW, 5.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text(`FORMA DE PAGAMENTO: ${paymentMethod.toUpperCase()}`, leftX + tableW / 2, gridY + 3.8, { align: "center" });
  gridY += 7.5;

  // --- TOTAIS (Alinhado à direita) ---
  const totalsBoxW = 75;
  const totalsBoxX = leftX + tableW - totalsBoxW;
  const totalsLabelW = 35;
  const totalsValW = 40;
  const rowH = 5.2;

  const drawTotalRow = (label: string, val: number) => {
    // Label cinza
    doc.setFillColor(...GRAY_COLOR);
    doc.setDrawColor(...BORDER_COLOR);
    doc.rect(totalsBoxX, gridY, totalsLabelW, rowH, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(label, totalsBoxX + totalsLabelW / 2, gridY + 3.6, { align: "center" });

    // Valor amarelo
    doc.setFillColor(...GOLD_COLOR);
    doc.rect(totalsBoxX + totalsLabelW, gridY, totalsValW, rowH, "FD");

    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(formatCurrency(val), totalsBoxX + totalsLabelW + totalsValW - 3, gridY + 3.6, { align: "right" });

    gridY += rowH;
  };

  drawTotalRow("Total", totalValue);
  drawTotalRow("Entrada", downPayment);
  drawTotalRow("Saldo Remanescente", remainingBalance);

  // --- OBRIGADO PELA PREFERÊNCIA (Banner) ---
  gridY += 3;
  doc.setFillColor(...GOLD_COLOR);
  doc.setDrawColor(...BORDER_COLOR);
  doc.rect(leftX, gridY, tableW, 5.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text("Obrigado pela preferência!", leftX + tableW / 2, gridY + 3.8, { align: "center" });

  // --- BLOCO DE ASSINATURAS (Rodapé da página) ---
  let sigY = Math.max(gridY + 16, 260);
  if (sigY > 275) {
    doc.addPage();
    sigY = 40;
  }

  // Linhas de assinatura
  const sigCol1X = leftX;
  const sigCol1W = 85;
  const sigCol2X = leftX + 105;
  const sigCol2W = 85;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(sigCol1X, sigY, sigCol1X + sigCol1W, sigY);
  doc.line(sigCol2X, sigY, sigCol2X + sigCol2W, sigY);

  // Textos Vendedora (Esquerda)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text(`CNPJ: ${ANEXO_P_SUPPLIER.cnpj}`, sigCol1X, sigY + 4);
  doc.text("VENDEDORA:", sigCol1X, sigY + 8);
  doc.text(ANEXO_P_SUPPLIER.name, sigCol1X, sigY + 12);

  // Textos Comprador (Direita)
  doc.text(`CNPJ / CPF: ${buyerDoc}`, sigCol2X, sigY + 4);
  doc.text("COMPRADOR:", sigCol2X, sigY + 8);
  doc.text(buyerName, sigCol2X, sigY + 12);

  doc.save(`Pedido_${(fileNameBase || "Cliente").replace(/\s+/g, "_")}.pdf`);
};
