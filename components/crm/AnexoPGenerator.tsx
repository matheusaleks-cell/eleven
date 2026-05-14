"use client";

import { jsPDF } from "jspdf";
import { toast } from "sonner";

interface AnexoPData {
  orderNumber: string;
  date: string;
  seller: {
    name: string;
    cnpj: string;
    address: string;
    cr: string;
  };
  buyer: {
    name: string;
    document: string;
    address: string;
    cr: string;
    phone: string;
    email: string;
  };
  products: Array<{
    name: string;
    quantity: number;
    value: number;
  }>;
}

export const generateAnexoP = async (data: AnexoPData) => {
  try {
    const doc = new jsPDF();
    const margin = 20;
    let y = 30;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("ANEXO P", 105, y, { align: "center" });
    y += 10;
    doc.setFontSize(10);
    doc.text("(Declaração de Compra e Venda de Armas de Fogo e Munições entre Empresas)", 105, y, { align: "center" });
    
    y += 20;
    doc.setFontSize(11);
    doc.text("IDENTIFICAÇÃO DO VENDEDOR", margin, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Razão Social: ${data.seller.name}`, margin, y);
    y += 5;
    doc.text(`CNPJ: ${data.seller.cnpj}`, margin, y);
    y += 5;
    doc.text(`Endereço: ${data.seller.address}`, margin, y);
    y += 5;
    doc.text(`CR: ${data.seller.cr}`, margin, y);

    y += 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("IDENTIFICAÇÃO DO COMPRADOR", margin, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Razão Social/Nome: ${data.buyer.name}`, margin, y);
    y += 5;
    doc.text(`CPF/CNPJ: ${data.buyer.document}`, margin, y);
    y += 5;
    doc.text(`Endereço: ${data.buyer.address}`, margin, y);
    y += 5;
    doc.text(`CR: ${data.buyer.cr}`, margin, y);
    y += 5;
    doc.text(`Contato: ${data.buyer.phone} / ${data.buyer.email}`, margin, y);

    y += 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("DETALHAMENTO DO PEDIDO", margin, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Pedido Nº: ${data.orderNumber}`, margin, y);
    doc.text(`Data: ${data.date}`, 150, y);

    y += 10;
    // Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, 170, 7, "F");
    doc.text("PRODUTO", margin + 2, y + 5);
    doc.text("QTD", 140, y + 5);
    doc.text("VALOR UNIT.", 160, y + 5);
    y += 12;

    data.products.forEach(p => {
      doc.text(p.name, margin + 2, y);
      doc.text(p.quantity.toString(), 140, y);
      doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.value), 160, y);
      y += 7;
    });

    y += 20;
    doc.setFontSize(9);
    doc.text("Declaramos para os devidos fins que a transação comercial acima descrita foi realizada", margin, y);
    y += 5;
    doc.text("em conformidade com a legislação vigente de controle de produtos controlados.", margin, y);

    y += 30;
    doc.line(margin, y, 90, y);
    doc.line(110, y, 190, y);
    y += 5;
    doc.text("Assinatura Vendedor", margin + 20, y);
    doc.text("Assinatura Comprador", 130 + 10, y);

    doc.save(`AnexoP_Eleven_${data.orderNumber}.pdf`);
    toast.success("Anexo P gerado com sucesso!");
  } catch (error) {
    console.error(error);
    toast.error("Erro ao gerar PDF.");
  }
};
