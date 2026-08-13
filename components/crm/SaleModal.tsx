"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { jsPDF } from "jspdf";
import { ShoppingBag, Plus, Trash2, DollarSign, Building2, User, FileText, Search, X } from "lucide-react";
import { getProductsForSale, createDirectSale, getLotOptionsForCart, getAvailableSerialsForProduct } from "@/app/admin/crm/vendas/actions";
import { cn } from "@/lib/utils";
import { fmtDate, loadImageAsDataURL } from "@/lib/pdf-helpers";
import { toast } from "sonner";

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Cliente pré-definido e travado (ex: venda aberta a partir do perfil do cliente). Quando omitido, o cliente é escolhido dentro do modal (fluxo estilo PDV). */
  customer?: any;
  /** Lista de clientes para o seletor interno, usada quando não há `customer` pré-definido. */
  customers?: any[];
  sellerId?: string;
  onSuccess?: () => void;
}

interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  stock: number;
  selectedSerials?: string[];
  lotPreference: LotPreference;
  selectedProjectId: string;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function LotBadge({ source, investor, own }: { source?: string; investor?: number; own?: number }) {
  if (!source || source === "SEM_RASTREIO") return null;
  if (source === "INVESTIDOR")
    return (
      <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <User size={8} /> LOTE INVESTIDOR ({investor})
      </span>
    );
  if (source === "PROPRIO")
    return (
      <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20">
        <Building2 size={8} /> LOTE PRÓPRIO ({own})
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5 bg-brand-text-muted/10 text-brand-text-muted border border-brand-border">
      <Building2 size={8} /> MISTO · Inv: {investor} / Próprio: {own}
    </span>
  );
}

type LotPreference = "AUTO" | "PROPRIO" | "INVESTIDOR";

export function SaleModal({ isOpen, onClose, customer: fixedCustomer, customers = [], sellerId, onSuccess }: SaleModalProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [status, setStatus] = useState("PAGO");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isGeneratingAnexoP, setIsGeneratingAnexoP] = useState(false);
  const [search, setSearch] = useState("");

  // Cliente: travado quando `fixedCustomer` é informado (venda a partir do perfil do cliente);
  // caso contrário, seleção estilo PDV — escolhido/trocado dentro do próprio modal.
  const isCustomerLocked = !!fixedCustomer;
  const [customer, setCustomer] = useState<any>(fixedCustomer ?? null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  const [productProjectsMap, setProductProjectsMap] = useState<Record<string, { id: string; name: string; investorName: string }[]>>({});
  const [loadingProjectsMap, setLoadingProjectsMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      setCart([]);
      setNotes("");
      setSearch("");
      setPaymentMethod("PIX");
      setStatus("PAGO");
      setDiscount(0);
      setProductProjectsMap({});
      setLoadingProjectsMap({});
      setCustomer(fixedCustomer ?? null);
      setShowCustomerPicker(false);
      setCustomerSearch("");
      loadProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, fixedCustomer?.id]);

  // Recalcula os preços do carrinho quando o cliente é selecionado/trocado no meio da venda (B2B x B2C)
  useEffect(() => {
    if (products.length === 0) return;
    setCart(prev => prev.map(item => {
      const product = products.find(p => p.id === item.id);
      if (!product) return item;
      const price = customer?.type === "B2B" ? (product.priceB2B ?? product.priceB2C) : product.priceB2C;
      return price === item.price ? item : { ...item, price };
    }));
  }, [customer?.type, products]);

  const loadProjectsForProduct = async (productId: string) => {
    if (productProjectsMap[productId]) return;
    setLoadingProjectsMap(prev => ({ ...prev, [productId]: true }));
    try {
      const opts = await getLotOptionsForCart([productId]);
      setProductProjectsMap(prev => ({ ...prev, [productId]: opts }));
      if (opts.length > 0) {
        setCart(prev => prev.map(c => {
          if (c.id === productId && !c.selectedProjectId) {
            return { ...c, selectedProjectId: opts[0].id };
          }
          return c;
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProjectsMap(prev => ({ ...prev, [productId]: false }));
    }
  };

  const [availableSerialsMap, setAvailableSerialsMap] = useState<Record<string, { id: string; serial: string; batchCode: string }[]>>({});

  useEffect(() => {
    if (cart.length > 0) {
      cart.forEach(item => {
        getAvailableSerialsForProduct(item.id, item.lotPreference || "AUTO", item.selectedProjectId || undefined).then(serials => {
          setAvailableSerialsMap(prev => ({
            ...prev,
            [item.id]: serials
          }));
        });
      });
    } else {
      setAvailableSerialsMap({});
    }
  }, [JSON.stringify(cart.map(i => ({ id: i.id, pref: i.lotPreference, proj: i.selectedProjectId })))]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    const data = await getProductsForSale();
    setProducts(data);
    setLoadingProducts(false);
  };

  const addToCart = (product: any) => {
    const unitPrice = customer?.type === "B2B"
      ? (product.priceB2B ?? product.priceB2C)
      : product.priceB2C;

    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockAvailable) {
          toast.error(`Estoque insuficiente. Disponível: ${product.stockAvailable}`);
          return prev;
        }
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { 
        id: product.id, 
        name: product.commercialName, 
        sku: product.sku, 
        price: unitPrice, 
        quantity: 1, 
        stock: product.stockAvailable,
        lotPreference: "AUTO",
        selectedProjectId: "",
        selectedSerials: []
      }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id !== id) return i;
      const next = Math.max(1, Math.min(i.stock, i.quantity + delta));
      if (delta > 0 && i.quantity >= i.stock) {
        toast.error(`Estoque insuficiente. Disponível: ${i.stock}`);
        return i;
      }
      const serials = i.selectedSerials || [];
      const nextSerials = serials.slice(0, next);
      return { ...i, quantity: next, selectedSerials: nextSerials };
    }));
  };

  const totalValue = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);

  const handleSave = async () => {
    if (!customer) { toast.error("Selecione um cliente antes de finalizar a venda."); return; }
    if (cart.length === 0) { toast.error("Adicione pelo menos um produto."); return; }

    // Validação por item do carrinho
    for (const item of cart) {
      if (item.lotPreference === "INVESTIDOR" && !item.selectedProjectId) {
        toast.error(`Selecione o projeto do investidor para o produto: ${item.name}`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await createDirectSale({
        customerId: customer.id,
        items: cart.map(i => ({ 
          id: i.id, 
          name: i.name, 
          sku: i.sku, 
          price: i.price, 
          quantity: i.quantity,
          serialNumbers: i.selectedSerials || [],
          lotPreference: i.lotPreference,
          investmentProjectId: i.selectedProjectId || undefined,
        })),
        totalValue,
        discount,
        paymentMethod,
        status,
        notes,
        sellerId,
      });
      if (res.success) {
        toast.success(`Pedido ${res.orderNumber} registrado!`);
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Erro ao processar venda.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAnexoP = async () => {
    if (!customer) {
      toast.error("Selecione um cliente antes de gerar o Anexo P.");
      return;
    }
    if (cart.length === 0) {
      toast.error("Adicione itens ao carrinho para gerar o Anexo P.");
      return;
    }

    setIsGeneratingAnexoP(true);
    toast.info("Gerando Anexo P Oficial (PCE)...");
    
    try {
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleDateString('pt-BR');
      
      doc.setFillColor(15, 15, 15);
      doc.rect(0, 0, 210, 35, 'F');

      const logoW = 60;
      const logoH = 25;
      const logoData = await loadImageAsDataURL("/logos/logo-alta-a.png");
      doc.addImage(logoData, 'PNG', (210 - logoW) / 2, 5, logoW, logoH, undefined, 'MEDIUM');

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("ANEXO P", 105, 45, { align: 'center' });
      doc.setFontSize(9);
      const title = "PEDIDO DE AQUISIÇÃO DE PCE (tipo arma de fogo e munição) NA INDÚSTRIA PELO COMÉRCIO VAREJISTA DE ARMAS E MUNIÇÕES";
      const splitTitle = doc.splitTextToSize(title, 180);
      doc.text(splitTitle, 105, 52, { align: 'center' });

      doc.setFillColor(240, 240, 240);
      doc.rect(10, 65, 190, 7, 'F');
      doc.text("ADQUIRENTE", 12, 70);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Razão social: ${(customer?.name || "CLIENTE NÃO INFORMADO").toUpperCase()}`, 10, 78);
      doc.text(`CNPJ: ${customer?.document || customer?.cpfCnpj || "N/A"}`, 130, 78);
      doc.text(`Nº CR: ${customer?.crNumber || customer?.cr || "N/A"}`, 10, 85);
      doc.text(`Validade do CR: ${fmtDate(customer?.crValidityDate)}`, 130, 85);
      doc.text(`Telefone/e-mail: ${customer?.phone || "N/A"} / ${customer?.email || "N/A"}`, 10, 92);

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
      cart.forEach((item, index) => {
        const fullProduct = products.find(p => p.id === item.id) || {};
        const especie = fullProduct.species || "N/A";
        const marca = fullProduct.brand || item.name.split(' ')[0] || "N/A";
        const modelo = fullProduct.model || item.name.split(' ').slice(1).join(' ') || "N/A";
        const calibre = fullProduct.caliber || "N/A";
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

        if (y > 260 && index < cart.length - 1) {
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

      y += 30;
      doc.text(`SÃO PAULO/ SP, ${timestamp}`, 105, y, { align: 'center' });
      
      y += 25;
      doc.line(60, y, 150, y);
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.text((customer?.name || "CLIENTE NÃO INFORMADO").toUpperCase(), 105, y, { align: 'center' });
      
      doc.save(`Anexo_P_${(customer?.name || "Cliente").replace(/\s+/g, '_')}.pdf`);
      
      setTimeout(() => {
        setIsGeneratingAnexoP(false);
        toast.success("Anexo P Oficial gerado!");
      }, 1000);
    } catch (error) {
      console.error(error);
      setIsGeneratingAnexoP(false);
      toast.error("Erro ao gerar Anexo P.");
    }
  };

  const filtered = products.filter(p =>
    p.commercialName.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCustomersForPicker = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.cpfCnpj?.includes(customerSearch)
  );

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={customer ? `NOVA VENDA — ${customer.name}` : "NOVA VENDA"} className="max-w-5xl">
      {/* Barra de Cliente — seleção estilo PDV, pode ser feita/trocada a qualquer momento */}
      <div className="mb-4">
        {customer ? (
          <div className="flex items-center justify-between gap-3 p-3 bg-brand-surface/30 border border-brand-border rounded-lg">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center shrink-0">
                {customer.type === "B2B" ? <Building2 size={14} className="text-brand-accent" /> : <User size={14} className="text-brand-accent" />}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black text-white uppercase truncate">{customer.name}</p>
                <p className="text-[9px] text-brand-text-muted font-bold uppercase">
                  {customer.type === "B2B" ? "Pessoa Jurídica" : "Pessoa Física"} · {customer.cpfCnpj}
                </p>
              </div>
            </div>
            {!isCustomerLocked && (
              <button
                onClick={() => setShowCustomerPicker(true)}
                className="shrink-0 text-[9px] font-black uppercase tracking-widest text-brand-accent hover:underline"
              >
                Trocar Cliente
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowCustomerPicker(true)}
            className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-brand-accent/40 rounded-lg text-brand-accent text-[10px] font-black uppercase tracking-widest hover:bg-brand-accent/5 transition-all"
          >
            <User size={14} /> Selecionar Cliente
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ maxHeight: "80vh", overflow: "hidden" }}>

        {/* Produtos */}
        <div className="flex flex-col gap-3 overflow-hidden">
          <p className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest">
            Tipo: <span className="text-brand-accent">{customer?.type ?? "—"}</span>
            {customer?.type === "B2B" ? " · Preço B2B aplicado" : " · Preço B2C aplicado"}
          </p>
          <Input
            placeholder="Buscar produto por nome ou SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10"
          />
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            {loadingProducts ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center py-12 text-[10px] font-bold text-brand-text-muted uppercase">
                {products.length === 0 ? "Nenhum produto com estoque disponível." : "Nenhum produto encontrado."}
              </p>
            ) : filtered.map(p => {
              const price = customer?.type === "B2B" ? (p.priceB2B ?? p.priceB2C) : p.priceB2C;
              const inCart = cart.find(i => i.id === p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="p-3 bg-brand-surface/30 border border-brand-border rounded-lg flex items-center justify-between group hover:border-brand-accent transition-all cursor-pointer"
                >
                  <div>
                    <p className="text-[11px] font-black text-white uppercase tracking-tight group-hover:text-brand-accent transition-colors">
                      {p.commercialName}
                    </p>
                    <p className="text-[9px] text-brand-text-muted font-bold mt-0.5">
                      SKU: {p.sku} · {p.brand} {p.model}
                    </p>
                    <p className="text-[9px] font-bold mt-0.5" style={{ color: p.stockAvailable <= 3 ? "#F59E0B" : "#4CAF50" }}>
                      Estoque: {p.stockAvailable} un.{inCart ? ` · No carrinho: ${inCart.quantity}` : ""}
                    </p>
                    <LotBadge source={p.lotSource} investor={p.investorLotStock} own={p.ownLotStock} />
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-mono font-black text-brand-accent">{fmt(price)}</p>
                    <Plus size={14} className="ml-auto text-brand-text-muted group-hover:text-white mt-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carrinho + Finalização */}
        <div className="flex flex-col gap-4 overflow-hidden">
          <Card className="flex-1 flex flex-col p-0 border-brand-border bg-brand-bg/40 overflow-hidden">
            <div className="p-3 border-b border-brand-border bg-brand-surface/20 flex items-center gap-2">
              <ShoppingBag size={14} className="text-brand-accent" />
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest">
                CARRINHO {cart.length > 0 ? `(${cart.reduce((a, i) => a + i.quantity, 0)} itens)` : ""}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-12">
                  <ShoppingBag size={36} />
                  <p className="text-[10px] font-black mt-3 uppercase">Carrinho Vazio</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="p-2.5 bg-brand-input rounded border border-brand-border flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-white uppercase truncate">{item.name}</p>
                        <p className="text-[9px] text-brand-text-muted font-bold">{fmt(item.price)} × {item.quantity} = {fmt(item.price * item.quantity)}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <div className="flex items-center bg-brand-bg rounded border border-brand-border overflow-hidden">
                          <button onClick={() => updateQty(item.id, -1)} className="px-2 py-0.5 hover:bg-brand-surface text-brand-text-muted text-sm">−</button>
                          <span className="px-2 text-xs font-mono font-bold text-white">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="px-2 py-0.5 hover:bg-brand-surface text-brand-text-muted text-sm">+</button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-brand-text-muted hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Configuração de Lote Individual por Item */}
                    <div className="pt-2 border-t border-brand-border/40 space-y-1.5">
                      <div className="flex gap-1 p-0.5 bg-brand-bg rounded border border-brand-border">
                        {(["AUTO", "PROPRIO", "INVESTIDOR"] as LotPreference[]).map(opt => (
                          <button
                            key={opt}
                            onClick={() => {
                              setCart(prev => prev.map(c => {
                                if (c.id !== item.id) return c;
                                return { ...c, lotPreference: opt, selectedProjectId: "", selectedSerials: [] };
                              }));
                              if (opt === "INVESTIDOR") {
                                loadProjectsForProduct(item.id);
                              }
                            }}
                            className={cn(
                              "flex-1 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all",
                              item.lotPreference === opt
                                ? opt === "INVESTIDOR"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : opt === "PROPRIO"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : "bg-brand-surface text-white border border-brand-border"
                                : "text-brand-text-muted hover:text-white"
                            )}
                          >
                            {opt === "AUTO" ? "Auto" : opt === "PROPRIO" ? "Próprio" : "Investidor"}
                          </button>
                        ))}
                      </div>

                      {item.lotPreference === "INVESTIDOR" && (
                        <div>
                          {loadingProjectsMap[item.id] ? (
                            <div className="flex items-center gap-2 px-1 text-[8px] text-brand-text-muted">
                              <div className="w-2.5 h-2.5 border border-amber-500 border-t-transparent rounded-full animate-spin" />
                              Buscando projetos...
                            </div>
                          ) : !productProjectsMap[item.id] || productProjectsMap[item.id].length === 0 ? (
                            <p className="text-[8px] text-amber-400/70 font-bold px-1">
                              Nenhum projeto com estoque deste produto.
                            </p>
                          ) : (
                            <select
                              className="w-full bg-brand-input border border-amber-500/40 rounded px-2 py-1 text-[9px] text-white outline-none focus:border-amber-500"
                              value={item.selectedProjectId || ""}
                              onChange={e => {
                                const projId = e.target.value;
                                setCart(prev => prev.map(c => {
                                  if (c.id !== item.id) return c;
                                  return { ...c, selectedProjectId: projId, selectedSerials: [] };
                                }));
                              }}
                            >
                              <option value="">Selecionar investidor...</option>
                              {productProjectsMap[item.id].map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.investorName} — {p.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Seletor de Números de Série */}
                    <div className="pt-2 border-t border-brand-border/40">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] font-black text-brand-text-muted uppercase tracking-wider">
                          Séries Selecionadas (Alvo: {item.quantity})
                        </span>
                        {item.selectedSerials && item.selectedSerials.length > 0 && (
                          <span className={cn(
                            "text-[8px] font-black px-1.5 py-0.2 rounded font-mono",
                            item.selectedSerials.length === item.quantity ? "text-brand-success bg-brand-success/10" : "text-brand-warning bg-brand-warning/10"
                          )}>
                            {item.selectedSerials.length}/{item.quantity}
                          </span>
                        )}
                      </div>
                      
                      {availableSerialsMap[item.id] && availableSerialsMap[item.id].length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-h-[70px] overflow-y-auto pr-1 py-1 custom-scrollbar">
                          {availableSerialsMap[item.id].map(s => {
                            const isSelected = item.selectedSerials?.includes(s.serial) || false;
                            return (
                              <button
                                key={s.id}
                                onClick={() => {
                                  setCart(prev => prev.map(c => {
                                    if (c.id !== item.id) return c;
                                    const current = c.selectedSerials || [];
                                    let next = [];
                                    if (current.includes(s.serial)) {
                                      next = current.filter(x => x !== s.serial);
                                    } else {
                                      if (current.length >= c.quantity) {
                                        toast.info(`Remova uma série antes de selecionar mais do que a quantidade (${c.quantity})`);
                                        return c;
                                      }
                                      next = [...current, s.serial];
                                    }
                                    return { ...c, selectedSerials: next };
                                  }));
                                }}
                                className={cn(
                                  "px-2 py-0.5 rounded text-[8px] font-mono font-bold border transition-all",
                                  isSelected 
                                    ? "bg-brand-accent text-brand-bg border-brand-accent shadow-[0_0_8px_rgba(245,196,0,0.15)]" 
                                    : "bg-brand-bg text-brand-text-muted border-brand-border hover:border-brand-text-muted hover:text-white"
                                )}
                              >
                                {s.serial}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[8px] text-brand-warning/60 font-bold uppercase tracking-wider">
                          Nenhum número de série em estoque disponível para este produto.
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-brand-surface/30 border-t border-brand-border space-y-3">
              {discount > 0 && (
                <div className="flex justify-between items-center text-[10px] text-brand-text-muted">
                  <span className="uppercase font-bold tracking-wider">Subtotal bruto</span>
                  <span className="font-mono line-through">{fmt(totalValue)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest">
                  {discount > 0 ? "Total Líquido" : "Total"}
                </span>
                <span className="text-xl font-mono font-black text-brand-accent">
                  {fmt(Math.max(0, totalValue - discount))}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-brand-text-muted uppercase">Pagamento</label>
                  <select
                    className="w-full bg-brand-input border border-brand-border rounded px-2 py-1.5 text-xs text-white outline-none focus:border-brand-accent"
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                  >
                    <option value="PIX">PIX</option>
                    <option value="CARTÃO CRÉDITO">CARTÃO CRÉDITO</option>
                    <option value="BOLETO">BOLETO</option>
                    <option value="DINHEIRO">DINHEIRO</option>
                    <option value="TRANSFERÊNCIA">TRANSFERÊNCIA</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-brand-text-muted uppercase">Status</label>
                  <select
                    className="w-full bg-brand-input border border-brand-border rounded px-2 py-1.5 text-xs text-white outline-none focus:border-brand-accent"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                  >
                    <option value="PAGO">PAGO / FINALIZADO</option>
                    <option value="PENDENTE">PENDENTE</option>
                    <option value="RASCUNHO">RASCUNHO</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-brand-text-muted uppercase">Desconto (R$)</label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={discount || ""}
                  onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="h-9 font-mono text-white text-right"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-brand-text-muted uppercase">Observações</label>
                <textarea
                  className="w-full bg-brand-input border border-brand-border rounded px-2 py-1.5 text-xs text-white outline-none focus:border-brand-accent"
                  placeholder="Detalhes sobre entrega, descontos..."
                  style={{ minHeight: 48, resize: "none" }}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} className="flex-1 text-[10px] font-black tracking-widest">
              CANCELAR
            </Button>
            <Button
              onClick={handleGenerateAnexoP}
              disabled={isGeneratingAnexoP || cart.length === 0 || !customer}
              variant="secondary"
              className="flex-1 gap-2 text-[10px] font-black tracking-widest border-brand-accent/30 text-brand-accent hover:bg-brand-accent hover:text-white"
            >
              {isGeneratingAnexoP ? "GERANDO..." : <><FileText size={14} /> ANEXO P</>}
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || cart.length === 0 || !customer}
              className="flex-[2] gap-2 text-[10px] font-black tracking-widest"
            >
              {loading ? "PROCESSANDO..." : <><DollarSign size={14} /> CONFIRMAR VENDA</>}
            </Button>
          </div>
        </div>
      </div>

      {/* Picker de Cliente (aberto a partir da barra acima, sem sair da tela de venda) */}
      {showCustomerPicker && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => { setShowCustomerPicker(false); setCustomerSearch(""); }}
          />
          <div
            className="relative w-full animate-fade-in"
            style={{
              maxWidth: 480,
              maxHeight: "70vh",
              background: "#1A1A1A",
              border: "1px solid #333",
              borderTop: "3px solid #F5C400",
              borderRadius: 4,
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
            }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border shrink-0">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest font-rajdhani">SELECIONAR CLIENTE</h3>
                <p className="text-[10px] text-brand-text-muted mt-0.5">Escolha o cliente para esta venda</p>
              </div>
              <button
                onClick={() => { setShowCustomerPicker(false); setCustomerSearch(""); }}
                className="text-brand-text-muted hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-brand-border shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={15} />
                <Input
                  className="pl-9 h-10 text-sm"
                  placeholder="Buscar por nome ou documento..."
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
              {filteredCustomersForPicker.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[10px] font-bold text-brand-text-muted uppercase">
                    {customers.length === 0 ? "Nenhum cliente cadastrado." : "Nenhum cliente encontrado."}
                  </p>
                </div>
              ) : filteredCustomersForPicker.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setCustomer(c); setShowCustomerPicker(false); setCustomerSearch(""); }}
                  className="w-full text-left p-3 rounded border border-brand-border hover:border-brand-accent hover:bg-brand-accent/5 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center shrink-0">
                      {c.type === "B2B" ? <Building2 size={14} className="text-brand-accent" /> : <User size={14} className="text-brand-accent" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-black text-white uppercase truncate group-hover:text-brand-accent transition-colors">{c.name}</p>
                      <p className="text-[9px] text-brand-text-muted font-bold uppercase">
                        {c.type === "B2B" ? "Pessoa Jurídica" : "Pessoa Física"} · {c.state || "—"}
                      </p>
                    </div>
                    <span className="text-[9px] font-mono text-brand-text-muted shrink-0">{c.cpfCnpj}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-brand-border shrink-0">
              <p className="text-[10px] text-brand-text-muted text-center">
                {filteredCustomersForPicker.length} cliente{filteredCustomersForPicker.length !== 1 ? "s" : ""} · <a href="/admin/crm/clientes" className="text-brand-accent hover:underline">Cadastrar novo cliente</a>
              </p>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
