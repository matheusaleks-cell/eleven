"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LeadForm, LeadFormData } from "./LeadForm";
import { 
  User, 
  Phone, 
  Mail, 
  ShoppingBag, 
  Clock, 
  FileText, 
  ArrowRight, 
  Edit3, 
  Trash2,
  Plus,
  ChevronRight,
  Package,
  History,
  Settings,
  Save,
  Calendar,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { jsPDF } from "jspdf";
import { loadImageAsDataURL } from "@/lib/pdf-helpers";
import { convertToOrder, convertToCustomer, addLeadLog } from "@/app/admin/crm/funil/actions";

interface LeadWorkspaceProps {
  lead: any;
  products?: any[];
  onUpdate: (data: any) => void;
  onClose: () => void;
}

const MOCK_PRODUCTS = [
  { id: "1", name: "Vezir Arms Carrera VR-12P", price: 8500, caliber: "12 Gauge", sku: "VZ-VR12P" },
  { id: "2", name: "Canik TP9 SFx Rival", price: 9200, caliber: "9mm", sku: "CK-TP9R" },
  { id: "3", name: "Derya MK-12 AS-250", price: 11500, caliber: "12 Gauge", sku: "DR-MK12" },
  { id: "4", name: "Glock G17 Gen5", price: 7800, caliber: "9mm", sku: "GK-G17G5" },
  { id: "5", name: "Sig Sauer P320 M17", price: 10500, caliber: "9mm", sku: "SS-P320" },
  { id: "6", name: "Taurus TS9 Graphene", price: 5400, caliber: "9mm", sku: "TR-TS9G" },
];

export function LeadWorkspace({ lead, products = [], onUpdate, onClose }: LeadWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "products" | "history">("products");
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  
  const isB2B = lead.customerType === "PJ";
  const normalizedProducts = products.length > 0
    ? products.map(p => ({
        id: p.id,
        name: p.commercialName,
        price: isB2B && p.priceB2B ? p.priceB2B : p.priceB2C,
        caliber: p.caliber || "N/A",
        sku: p.sku || ""
      }))
    : MOCK_PRODUCTS;

  // Inicializar itens com base nos dados do lead ou criar padrão se não houver
  const [dealItems, setDealItems] = useState<any[]>(() => {
    if (lead.items && lead.items.length > 0) {
      return lead.items.map((item: any) => {
        const matchingProduct = products.find(p => p.id === item.product.id);
        if (matchingProduct) {
          const itemPrice = isB2B && matchingProduct.priceB2B ? matchingProduct.priceB2B : matchingProduct.priceB2C;
          return {
            ...item,
            product: {
              ...item.product,
              price: itemPrice
            }
          };
        }
        return item;
      });
    }
    
    // Tentar encontrar o produto pelo nome de interesse (usando busca flexível)
    const leadInterest = (Array.isArray(lead.interests) ? lead.interests[0] : lead.interests) || "";
    const initialProduct = normalizedProducts.find(p => 
      leadInterest ? p.name.toLowerCase().includes(leadInterest.toLowerCase()) : false
    ) || normalizedProducts[0];
    
    // Se o lead já tem um valor definido no banco, vamos ajustar o preço do item inicial para bater
    const adjustedProduct = { ...initialProduct };
    if (lead.value && lead.value > 0) {
      adjustedProduct.price = lead.value;
    }
    
    return [{ id: "item-init", product: adjustedProduct, quantity: 1 }];
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const totalValue = dealItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  const filteredProducts = normalizedProducts.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.caliber.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleUpdateQuantity = (id: string, qty: number) => {
    if (qty < 1) return;
    const updatedItems = dealItems.map(item => 
      item.id === id ? { ...item, quantity: qty } : item
    );
    setDealItems(updatedItems);
    
    // Sincronizar com o Kanban externo, incluindo os itens persistentes
    const total = updatedItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    onUpdate({ ...lead, value: total, items: updatedItems });
    
    toast.success("Valor total atualizado!");
  };

  const handleSelectProduct = (product: any) => {
    let updatedItems;
    const existingItem = dealItems.find(item => item.product.id === product.id);
    
    if (existingItem) {
      updatedItems = dealItems.map(item => 
        item.id === existingItem.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updatedItems = [...dealItems, {
        id: `item-${Date.now()}`,
        product: product,
        quantity: 1
      }];
    }
    
    setDealItems(updatedItems);
    const total = updatedItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    
    // Atualizar o interesse externo com o nome do primeiro produto + extras se houver
    const interestLabel = updatedItems.length > 1 
      ? `${updatedItems[0].product.name} (+${updatedItems.length - 1})`
      : updatedItems[0].product.name;

    onUpdate({ ...lead, value: total, interest: interestLabel, items: updatedItems });
    setIsProductModalOpen(false);
    toast.success(`${product.name} sincronizado na proposta!`);
  };

  const handleRemoveItem = (id: string) => {
    if (dealItems.length <= 1) {
      toast.error("A proposta deve ter pelo menos um item.");
      return;
    }
    const updatedItems = dealItems.filter(item => item.id !== id);
    setDealItems(updatedItems);
    
    const total = updatedItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    const interestLabel = updatedItems.length > 1 
      ? `${updatedItems[0].product.name} (+${updatedItems.length - 1})`
      : updatedItems[0].product.name;

    onUpdate({ ...lead, value: total, interest: interestLabel, items: updatedItems });
    toast.info("Item removido.");
  };

  const handleUpdateInfo = async (data: any) => {
    try {
      onUpdate({ ...lead, ...data });
      if (data.status && data.status !== lead.status) {
        await addLeadLog(lead.id, `Status alterado para ${data.status}`, lead.assignedTo || "Admin Eleven");
      }
      setIsEditingInfo(false);
      toast.success("Dados do lead sincronizados com o Kanban!");
    } catch (error) {
      console.error(error);
    }
  };

  const handleGenerateProposal = async () => {
    setIsGenerating(true);
    toast.info("Gerando proposta PDF oficial...");
    
    try {
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleDateString('pt-BR');
      
      // Estilo Eleven
      doc.setFillColor(15, 15, 15);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(245, 196, 0);
      doc.setFontSize(22);
      doc.text("ELEVEN FIREARMS", 10, 25);
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text("PROPOSTA COMERCIAL EXCLUSIVA", 10, 32);
      doc.text(`DATA: ${timestamp}`, 160, 25);

      // Dados do Lead
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text(`CLIENTE: ${lead.name.toUpperCase()}`, 10, 60);
      doc.setFontSize(10);
      doc.text(`CONTATO: ${lead.phone || "N/A"} | EMAIL: ${lead.email || "N/A"}`, 10, 67);
      
      // Tabela de Itens
      doc.line(10, 75, 200, 75);
      doc.setFont("helvetica", "bold");
      doc.text("PRODUTO", 10, 82);
      doc.text("QTD", 120, 82);
      doc.text("VALOR UN.", 145, 82);
      doc.text("SUBTOTAL", 175, 82);
      doc.line(10, 85, 200, 85);
      
      doc.setFont("helvetica", "normal");
      let y = 92;
      dealItems.forEach(item => {
        doc.text(item.product.name.substring(0, 40), 10, y);
        doc.text(item.quantity.toString(), 122, y);
        doc.text(`R$ ${item.product.price.toLocaleString()}`, 145, y);
        doc.text(`R$ ${(item.product.price * item.quantity).toLocaleString()}`, 175, y);
        y += 10;
      });

      doc.line(10, y, 200, y);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(245, 196, 0);
      doc.text(`TOTAL DA PROPOSTA: R$ ${totalValue.toLocaleString()}`, 105, y + 15, { align: 'right' });

      // Rodapé
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("Esta proposta tem validade de 5 dias úteis. Sujeito a disponibilidade de estoque.", 10, 280);
      
      doc.save(`Proposta_Eleven_${lead.name.replace(/\s+/g, '_')}.pdf`);
      
      await addLeadLog(lead.id, "Proposta Comercial B2C gerada via sistema", lead.assignedTo || "Admin Eleven");

      setTimeout(() => {
        setIsGenerating(false);
        toast.success("PDF gerado e pronto para envio!");
      }, 1000);
    } catch (error) {
      console.error(error);
      setIsGenerating(false);
      toast.error("Erro ao gerar PDF.");
    }
  };

  const handleGenerateAnexoP = async () => {
    setIsGenerating(true);
    toast.info("Gerando Anexo P Oficial (PCE)...");
    
    try {
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleDateString('pt-BR');
      
      // LOGO / CABEÇALHO ELEVEN
      doc.setFillColor(15, 15, 15);
      doc.rect(0, 0, 210, 35, 'F');

      // Centralizando o logo no cabeçalho (35mm de altura)
      // Ajustamos a largura e altura para não ficar "apertado" (proporção sugerida 60x20 ou similar)
      const logoW = 60;
      const logoH = 25;
      const logoData = await loadImageAsDataURL("/logos/logo-alta-branco.png");
      doc.addImage(logoData, 'PNG', (210 - logoW) / 2, 5, logoW, logoH, undefined, 'MEDIUM');
      
      // TÍTULO DO DOCUMENTO
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("ANEXO P", 105, 45, { align: 'center' });
      doc.setFontSize(9);
      const title = "PEDIDO DE AQUISIÇÃO DE PCE (tipo arma de fogo e munição) NA INDÚSTRIA PELO COMÉRCIO VAREJISTA DE ARMAS E MUNIÇÕES";
      const splitTitle = doc.splitTextToSize(title, 180);
      doc.text(splitTitle, 105, 52, { align: 'center' });

      // ADQUIRENTE
      doc.setFillColor(240, 240, 240);
      doc.rect(10, 65, 190, 7, 'F');
      doc.text("ADQUIRENTE", 12, 70);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Razão social: ${lead.name.toUpperCase()}`, 10, 78);
      doc.text(`CNPJ: ${lead.taxId || "N/A"}`, 130, 78);
      doc.text(`Nº CR: ${lead.crNumber || "N/A"}`, 10, 85);
      doc.text(`Validade do CR: ${lead.crValidity || "N/A"}`, 130, 85);
      doc.text(`Telefone/e-mail: ${lead.phone || "N/A"} / ${lead.email || "N/A"}`, 10, 92);

      // PRODUTOS E QUANTIDADES
      doc.setFont("helvetica", "bold");
      doc.setFillColor(240, 240, 240);
      doc.rect(10, 100, 190, 7, 'F');
      doc.text("PRODUTOS E QUANTIDADES A SEREM ADQUIRIDOS", 12, 105);
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.text("(conforme lista de PCE Port 118-COLOG/2019)", 198, 105, { align: 'right' });
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");

      let y = 112;
      dealItems.forEach((item, index) => {
        const fullProduct = products.find(p => p.id === item.product.id) || {};
        const especie = fullProduct.species || "N/A";
        const marca = fullProduct.brand || item.product.name.split(' ')[0] || "N/A";
        const modelo = fullProduct.model || item.product.name.split(' ').slice(1).join(' ') || "N/A";
        const calibre = fullProduct.caliber || item.product.caliber || "N/A";
        const acao = fullProduct.actionType || "N/A";
        const acabamento = fullProduct.finish || "N/A";
        const origem = fullProduct.originCountry || "N/A";
        const cano = fullProduct.barrelLength
          ? `${fullProduct.barrelLength}" (${(fullProduct.barrelLength * 25.4).toFixed(2)}mm)`
          : "N/A";

        const productText = `(${index + 1}.1.0020) ${item.quantity.toString().padStart(2, '0')} (unidades) Espécie: ${especie} - Marca: ${marca} - Modelo: ${modelo} - Calibre: ${calibre} - Comprimento do Cano: ${cano} - Quantidade de cano: 01 - Tipo de alma: Lisa - Funcionamento: Repetição - Sistema de Ação: ${acao} - Quantidade de carregadores: N/A - Acabamento: ${acabamento} - País de Origem: ${origem} - Arma de repetição de uso permitido.`;
        const splitProduct = doc.splitTextToSize(productText, 185);
        doc.setFont("helvetica", "normal");
        doc.text(splitProduct, 10, y);
        y += (splitProduct.length * 4) + 5;

        if (y > 260 && index < dealItems.length - 1) {
          doc.addPage();
          y = 20;
        }
      });

      // O bloco fixo abaixo (fornecedor + anexos + declaracoes + assinatura) precisa de ~155mm;
      // garante espaco suficiente antes de comecar, senao pula para uma nova pagina.
      if (y > 297 - 155) {
        doc.addPage();
        y = 20;
      }

      // FORNECEDOR
      doc.setFont("helvetica", "bold");
      doc.setFillColor(240, 240, 240);
      doc.rect(10, y, 190, 7, 'F');
      doc.text("FORNECEDOR", 12, y + 5);
      y += 12;
      doc.setFont("helvetica", "normal");
      doc.text("Razão social: ELEVEN FIREARMS REPRESENTAÇÃO LTDA", 10, y);
      doc.text("CNPJ: 36.312.424/0001-39", 130, y);
      y += 7;
      doc.text("Nº CR: 550771", 10, y);
      doc.text("Validade do CR: 13/07/2027", 130, y);

      // ANEXOS E DECLARAÇÕES
      y += 15;
      doc.setFont("helvetica", "bold");
      doc.text("ANEXOS", 10, y);
      doc.setFont("helvetica", "normal");
      doc.text("- cópia de Registro no Exército e suas apostilas", 15, y + 6);
      doc.text("- comprovante de pagamento da taxa de aquisição de PCE", 15, y + 12);
      doc.text("- outros:", 15, y + 18);

      y += 35;
      const dec1 = "DECLARO que a aquisição solicitada não ultrapassa os quantitativos máximos autorizados para depósito previstos na apostila ao meu Registro no Exército.";
      const splitDec1 = doc.splitTextToSize(dec1, 185);
      doc.text(splitDec1, 10, y);
      
      y += 12;
      const dec2 = "DECLARO, ainda, sob as penas da lei, a veracidade das informações prestadas e responsabilizo-me pela destinação do produto adquirido, sem prejuízo das possíveis sanções administrativas.";
      const splitDec2 = doc.splitTextToSize(dec2, 185);
      doc.text(splitDec2, 10, y);

      // ASSINATURA
      y += 30;
      doc.text(`SÃO PAULO/ SP, ${timestamp}`, 105, y, { align: 'center' });
      
      y += 25;
      doc.line(60, y, 150, y);
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.text(lead.name.toUpperCase(), 105, y, { align: 'center' });
      
      doc.save(`Anexo_P_${lead.name.replace(/\s+/g, '_')}.pdf`);
      
      await addLeadLog(lead.id, "Anexo P Oficial (PCE) gerado via sistema", lead.assignedTo || "Admin Eleven");

      setTimeout(() => {
        setIsGenerating(false);
        toast.success("Anexo P Oficial gerado!");
      }, 1000);
    } catch (error) {
      console.error(error);
      setIsGenerating(false);
      toast.error("Erro ao gerar Anexo P.");
    }
  };

  const handleConvertToCustomer = async () => {
    if (!confirm("Deseja converter este lead em um CLIENTE oficial? Os dados serão movidos para o cadastro de clientes e o lead será removido do funil.")) return;
    
    setIsGenerating(true);
    try {
      const res = await convertToCustomer(lead.id);

      if (res.success) {
        toast.success("Lead convertido em CLIENTE com sucesso!");
        onClose();
      } else {
        toast.error("Erro ao converter lead: " + res.error);
      }
    } catch (error) {
      toast.error("Erro crítico na conversão.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConvertToOrder = async () => {
    if (!confirm("Deseja converter este lead em um CLIENTE e gerar um PEDIDO DE VENDA real?")) return;
    
    setIsGenerating(true); // Usando como flag de loading geral aqui
    try {
      const res = await convertToOrder(lead.id, {
        ...lead,
        value: totalValue,
        items: dealItems
      });

      if (res.success) {
        toast.success("Lead convertido em PEDIDO com sucesso!");
        onClose();
        // O revalidatePath nas actions cuidará de atualizar a lista
      } else {
        toast.error("Erro ao converter lead: " + res.error);
      }
    } catch (error) {
      toast.error("Erro crítico na conversão.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner - Status & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-brand-surface/40 p-5 rounded-lg border border-brand-border shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-accent/10 rounded border border-brand-accent/20 text-brand-accent">
            <User size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">{lead.name}</h3>
            <div className="flex items-center gap-3 mt-1">
               <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Pipeline:</span>
               <span className="text-[10px] font-bold text-brand-accent uppercase bg-brand-accent/10 px-2 py-0.5 rounded border border-brand-accent/20">
                 {lead.status}
               </span>
               <span className="text-brand-text-muted text-xs">|</span>
               <span className="text-[10px] font-bold text-white/70 uppercase">{Array.isArray(lead.interests) ? lead.interests.join(", ") : (lead.interests || "Sem interesse")}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 md:flex-none h-10 px-4 gap-2 text-[10px] font-bold text-white/50 hover:text-brand-accent hover:bg-brand-accent/10"
            onClick={handleConvertToCustomer}
          >
            <User size={14} /> CONVERTER EM CLIENTE
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex-1 md:flex-none h-10 px-4 gap-2 text-[10px] font-bold"
            onClick={() => {
              setActiveTab("summary");
              setIsEditingInfo(true);
            }}
          >
            <Settings size={14} /> ATUALIZAR LEAD
          </Button>
          <Button 
            className="flex-1 md:flex-none h-10 px-6 gap-2 text-[10px] font-bold shadow-[0_0_15px_rgba(245,196,0,0.1)]"
            onClick={handleConvertToOrder}
          >
            <ArrowRight size={16} /> GERAR PEDIDO
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-brand-border bg-brand-surface/20 rounded-t-lg">
        <button 
          onClick={() => setActiveTab("products")}
          className={cn(
            "flex-1 md:flex-none px-8 py-4 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all",
            activeTab === "products" ? "border-brand-accent text-brand-accent bg-brand-accent/5" : "border-transparent text-brand-text-muted hover:text-white"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <ShoppingBag size={14} /> Itens do Pedido
          </span>
        </button>
        <button 
          onClick={() => setActiveTab("summary")}
          className={cn(
            "flex-1 md:flex-none px-8 py-4 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all",
            activeTab === "summary" ? "border-brand-accent text-brand-accent bg-brand-accent/5" : "border-transparent text-brand-text-muted hover:text-white"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <Clock size={14} /> Perfil & Cadastro
          </span>
        </button>
        <button 
          onClick={() => setActiveTab("history")}
          className={cn(
            "flex-1 md:flex-none px-8 py-4 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all",
            activeTab === "history" ? "border-brand-accent text-brand-accent bg-brand-accent/5" : "border-transparent text-brand-text-muted hover:text-white"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <History size={14} /> Log de Atividade
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "products" && (
          <div className="animate-fade-in space-y-8 p-6">
            <div className="flex justify-between items-center bg-brand-surface/30 p-5 rounded-xl border border-brand-border/40">
               <div>
                 <h4 className="text-[15px] font-black text-white uppercase tracking-[0.2em] mb-1">Configuração da Proposta</h4>
                 <p className="text-[12px] text-white/50 uppercase font-bold tracking-tight">Selecione os armamentos e acessórios para este lead.</p>
               </div>
               <Button 
                variant="secondary" 
                className="gap-3 h-11 px-6 text-[12px] font-black shadow-lg" 
                onClick={() => setIsProductModalOpen(true)}
               >
                 <Plus size={18} /> ADICIONAR ITEM
               </Button>
            </div>

            <Card className="p-0 border-brand-border/60 bg-brand-surface/20 overflow-hidden shadow-2xl">
               <table className="w-full text-left">
                 <thead className="bg-brand-surface/80 border-b border-brand-border">
                   <tr>
                     <th className="px-8 py-5 text-[12px] font-black text-white/80 uppercase tracking-[0.2em]">Produto / SKU</th>
                     <th className="px-8 py-5 text-[12px] font-black text-white/80 uppercase tracking-[0.2em]">Qtd</th>
                     <th className="px-8 py-5 text-[12px] font-black text-white/80 uppercase tracking-[0.2em]">Valor Un.</th>
                     <th className="px-8 py-5 text-[12px] font-black text-white/80 uppercase tracking-[0.2em] text-right">Subtotal</th>
                     <th className="px-8 py-5 w-10"></th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-brand-border/40">
                   {dealItems.map((item) => (
                     <tr key={item.id} className="hover:bg-brand-accent/5 transition-colors group">
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-5">
                             <div className="w-12 h-12 bg-brand-input rounded-lg border border-brand-border flex items-center justify-center text-brand-accent group-hover:scale-110 transition-transform">
                               <Package size={24} />
                             </div>
                             <div>
                               <span className="text-[16px] font-black text-white uppercase block mb-1">{item.product.name}</span>
                               <span className="text-[12px] text-white/60 uppercase font-bold tracking-tight">Calibre: {item.product.caliber}</span>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                              className="w-20 bg-brand-input border border-brand-border rounded-lg px-4 py-2.5 text-sm text-white font-mono font-bold focus:border-brand-accent outline-none"
                            />
                          </div>
                       </td>
                       <td className="px-8 py-6 font-mono text-[14px] font-bold text-white/80">
                         {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price)}
                       </td>
                       <td className="px-8 py-6 font-mono text-[16px] font-black text-brand-accent text-right">
                         {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price * item.quantity)}
                       </td>
                       <td className="px-8 py-6">
                          <button 
                            className="p-2.5 text-brand-text-muted hover:text-brand-danger hover:bg-brand-danger/10 rounded-lg transition-all border border-transparent hover:border-brand-danger/20"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 size={18} />
                          </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
                 <tfoot className="bg-brand-black/40 border-t-2 border-brand-border">
                   <tr>
                     <td colSpan={3} className="px-8 py-6 text-[13px] font-black text-white/80 uppercase text-right tracking-[0.2em]">Valor Total da Negociação:</td>
                     <td className="px-8 py-6 font-mono text-2xl font-black text-brand-accent text-right">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                     </td>
                     <td></td>
                   </tr>
                 </tfoot>
               </table>
            </Card>

             <div className="flex flex-col md:flex-row gap-6">
               <Card className="flex-1 p-6 bg-brand-warning/5 border border-brand-warning/30 rounded-xl flex gap-5">
                  <FileText className="text-brand-warning shrink-0" size={28} />
                  <div>
                    <p className="text-[12px] font-black text-brand-warning uppercase mb-1.5 tracking-wider">Status de Reserva</p>
                    <p className="text-[11px] text-white/80 uppercase leading-relaxed font-bold tracking-tight">Este lead ainda não possui reserva formal no estoque físico. Para garantir a exclusividade, converta em pedido.</p>
                  </div>
               </Card>
               <div className="flex flex-col gap-2">
                 <Button 
                  variant="secondary" 
                  className="h-auto py-3 px-6 gap-3 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl" 
                  onClick={handleGenerateProposal}
                  disabled={isGenerating}
                 >
                    {isGenerating ? "PROCESSANDO..." : <><FileText size={16} /> GERAR PROPOSTA (B2C)</>}
                 </Button>
                 <Button 
                  className="h-auto py-3 px-6 gap-3 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl border border-brand-accent/50 bg-brand-accent/20 text-brand-accent hover:bg-brand-accent/40" 
                  onClick={handleGenerateAnexoP}
                  disabled={isGenerating}
                 >
                    {isGenerating ? "PROCESSANDO..." : <><FileText size={16} /> GERAR ANEXO P (B2B)</>}
                 </Button>
               </div>
            </div>
          </div>
        )}

        {activeTab === "summary" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="space-y-6">
              <Card className="bg-brand-surface/30 border-brand-border p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6 border-b border-brand-border/50 pb-4">
                   <h4 className="text-[14px] font-bold text-brand-accent uppercase tracking-widest flex items-center gap-2">
                     <Settings size={16} /> Dados Cadastrais do Lead
                   </h4>
                   <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 px-4 text-[11px] font-bold gap-2 hover:bg-brand-accent/10 hover:text-brand-accent uppercase"
                    onClick={() => setIsEditingInfo(!isEditingInfo)}
                   >
                     {isEditingInfo ? "Cancelar" : "Editar Dados"}
                   </Button>
                </div>
                
                {isEditingInfo ? (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <LeadForm 
                      initialData={lead}
                      products={products}
                      onSubmit={handleUpdateInfo} 
                      onCancel={() => setIsEditingInfo(false)} 
                      submitLabel="Salvar Atualização"
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6 mb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-surface rounded border border-brand-border text-brand-text-muted">
                          <Phone size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-brand-text-muted tracking-widest mb-1">WhatsApp</p>
                          <p className="text-sm font-mono text-white font-bold">{lead.phone || "(Não informado)"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-surface rounded border border-brand-border text-brand-text-muted">
                          <Mail size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-brand-text-muted tracking-widest mb-1">E-mail</p>
                          <p className="text-sm font-mono text-white font-bold truncate max-w-[150px]">{lead.email || "(Não informado)"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-brand-border/30 w-full my-4" />

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-brand-text-muted tracking-widest mb-1.5">CPF / CNPJ</p>
                        <p className="text-sm font-bold text-white uppercase font-mono">{lead.taxId || "Não informado"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-brand-text-muted tracking-widest mb-1.5">Localização</p>
                        <p className="text-sm font-bold text-white uppercase">{lead.city && lead.state ? `${lead.city} - ${lead.state}` : "Não informada"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-brand-text-muted tracking-widest mb-1.5">Tipo de Cliente</p>
                        <p className="text-sm font-bold text-white uppercase">PJ (B2B)</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-brand-text-muted tracking-widest mb-1.5">Status de CR</p>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded border uppercase",
                          lead.documentStatus === "ACTIVE" ? "bg-brand-success/10 text-brand-success border-brand-success/20" : 
                          lead.documentStatus === "PENDING" ? "bg-brand-warning/10 text-brand-warning border-brand-warning/20" :
                          "bg-brand-danger/10 text-brand-danger border-brand-danger/20"
                        )}>
                          {lead.documentStatus === "ACTIVE" ? "Regular" : lead.documentStatus === "PENDING" ? "Em Processo" : "Sem Registro"}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-brand-text-muted tracking-widest mb-1.5">Vendedor</p>
                        <p className="text-sm font-bold text-brand-accent uppercase">{lead.assignedTo || "Admin Eleven"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-brand-text-muted tracking-widest mb-1.5">Pipeline / Fase</p>
                        <select 
                          className="bg-brand-input border border-brand-border rounded text-[11px] text-white font-bold px-2 py-1 focus:border-brand-accent outline-none uppercase"
                          defaultValue={lead.status}
                          onChange={(e) => handleUpdateInfo({ ...lead, status: e.target.value })}
                        >
                          <option value="NOVO">NOVOS LEADS</option>
                          <option value="INTERESSADO">INTERESSADOS</option>
                          <option value="ATENDIMENTO">ATENDIMENTO</option>
                          <option value="PROPOSTA">PROPOSTA</option>
                          <option value="DOCUMENTO">DOCUMENTAÇÃO</option>
                          <option value="PAGAMENTO">PAGAMENTO</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-brand-surface/30 border-brand-border p-6">
                 <h4 className="text-[14px] font-bold text-white uppercase tracking-widest mb-6 border-b border-brand-border/50 pb-4">Qualificação Comercial</h4>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <p className="text-[10px] uppercase font-bold text-brand-text-muted tracking-widest">Prioridade</p>
                       <span className={cn(
                        "text-[11px] font-bold px-4 py-1.5 rounded border uppercase inline-block",
                        lead.priority === "high" ? "bg-brand-danger/10 text-brand-danger border-brand-danger/30" : "bg-brand-warning/10 text-brand-warning border-brand-warning/30"
                       )}>
                         {lead.priority === "high" ? "URGENTE / HOT" : "MÉDIO / WARM"}
                       </span>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[10px] uppercase font-bold text-brand-text-muted tracking-widest">Canal de Origem</p>
                       <span className="text-[11px] font-bold text-white uppercase bg-brand-surface px-4 py-1.5 rounded border border-brand-border tracking-wider">
                         {lead.source || "Direto"}
                       </span>
                    </div>
                 </div>
              </Card>

              <div className="flex flex-col gap-4">
                <h4 className="text-[14px] font-bold text-white uppercase tracking-widest">Observações Estratégicas</h4>
                <textarea 
                  className="w-full bg-brand-surface/40 border border-brand-border rounded-lg p-5 text-base text-white focus:outline-none focus:border-brand-accent min-h-[180px] resize-none"
                  placeholder="Insira aqui notas sobre o perfil do comprador, objeções ou detalhes da negociação..."
                  defaultValue={lead.notes}
                ></textarea>
                <Button 
                  className="w-full py-5 gap-3 text-[12px] font-bold uppercase tracking-[0.2em] shadow-lg"
                  onClick={() => toast.success("Observações salvas no histórico do lead.")}
                >
                  <Save size={18} /> SALVAR OBSERVAÇÃO
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="animate-fade-in space-y-10 p-8">
            <h4 className="text-[15px] font-bold text-white uppercase tracking-[0.2em] border-b border-brand-border/50 pb-4">
              Linha do Tempo da Negociação
            </h4>
            
            <div className="space-y-8 relative">
               {/* Linha vertical de fundo */}
               <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-brand-border/20" />

               {(lead.logs && lead.logs.length > 0 ? lead.logs : []).map((log: any, i: number) => (
                 <div key={i} className="flex items-start gap-6 relative group">
                    {/* Indicador (Bola) */}
                    <div className="z-10 shrink-0 mt-0.5">
                      <div className="w-[32px] h-[32px] bg-brand-surface border-2 border-brand-accent rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(245,196,0,0.2)] group-hover:scale-110 transition-transform">
                        <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse" />
                      </div>
                    </div>

                    {/* Conteúdo (Texto) */}
                    <div className="flex-1 bg-brand-surface/20 p-5 rounded-lg border border-brand-border/40 group-hover:border-brand-accent/30 transition-all">
                       <p className="text-[16px] text-white font-bold uppercase tracking-tight mb-2">
                         {log.action}
                       </p>
                       <div className="flex items-center gap-3 text-white/60">
                         <Calendar size={14} className="text-brand-accent" />
                         <p className="text-[12px] uppercase font-black tracking-wider">
                           {new Date(log.createdAt).toLocaleString('pt-BR')} <span className="mx-2 opacity-30">|</span> 
                           Responsável: <span className="text-brand-accent">{log.user}</span>
                         </p>
                       </div>
                    </div>
                 </div>
               ))}

               {(!lead.logs || lead.logs.length === 0) && (
                 <div className="flex items-start gap-6 relative group">
                    <div className="z-10 shrink-0 mt-0.5">
                      <div className="w-[32px] h-[32px] bg-brand-surface border-2 border-brand-border rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-brand-border/50 rounded-full" />
                      </div>
                    </div>
                    <div className="flex-1 bg-brand-surface/10 p-5 rounded-lg border border-brand-border/20">
                       <p className="text-[14px] text-white/50 font-bold uppercase tracking-tight">
                         Aguardando primeiras atividades...
                       </p>
                    </div>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Seleção de Produtos */}
      <Dialog 
        isOpen={isProductModalOpen} 
        onClose={() => setIsProductModalOpen(false)}
        title="Catálogo de Armamentos Eleven"
        className="max-w-2xl"
      >
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-accent" size={18} />
            <Input 
              className="pl-12 py-3 h-14 text-base" 
              placeholder="Buscar por nome, calibre ou SKU..." 
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredProducts.map(product => (
              <div 
                key={product.id}
                className="group flex items-center justify-between p-4 bg-brand-bg/40 border border-brand-border rounded-xl hover:border-brand-accent hover:bg-brand-accent/5 transition-all cursor-pointer"
                onClick={() => handleSelectProduct(product)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-surface rounded-lg border border-brand-border flex items-center justify-center text-brand-accent group-hover:scale-110 transition-transform">
                    <Package size={24} />
                  </div>
                  <div>
                    <h5 className="text-[15px] font-black text-white uppercase tracking-tight">{product.name}</h5>
                    <p className="text-[11px] text-white/50 font-bold uppercase tracking-widest">{product.caliber} • SKU: {product.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[16px] font-mono font-black text-brand-accent">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                  </p>
                  <Button variant="ghost" size="sm" className="h-7 text-[9px] font-bold mt-1 group-hover:bg-brand-accent group-hover:text-black">
                    SELECIONAR
                  </Button>
                </div>
              </div>
            ))}

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-brand-text-muted font-bold uppercase tracking-widest text-sm">Nenhum produto encontrado</p>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
