"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  DollarSign, 
  Building2, 
  User, 
  FileText, 
  Search, 
  X, 
  Sparkles, 
  Check 
} from "lucide-react";
import { 
  getProductsForSale, 
  createDirectSale, 
  getLotOptionsForCart, 
  getAvailableSerialsForProduct, 
  getSellers 
} from "@/app/admin/crm/vendas/actions";
import { cn } from "@/lib/utils";
import { fmtDate, getMissingAnexoPSpecs, generateAnexoPPdf, generatePedidoPdf, AnexoPBuyer, AnexoPItemSpec } from "@/lib/pdf-helpers";
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
  hasSerials?: boolean;
  selectedSerials?: string[];
  lotPreference: LotPreference;
  selectedProjectId: string;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

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
  const [isGeneratingPedido, setIsGeneratingPedido] = useState(false);
  const [search, setSearch] = useState("");

  // Vendedor responsável pela venda
  const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string>(sellerId || "");

  // Cliente
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
      setSelectedSellerId(sellerId || "");
      loadProducts();
      getSellers().then(setSellers);
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

          // Se o item tem séries disponíveis mas nenhuma selecionada ainda, auto-seleciona as primeiras
          setCart(currentCart => currentCart.map(c => {
            if (c.id === item.id && (!c.selectedSerials || c.selectedSerials.length === 0) && serials.length > 0) {
              const toSelect = serials.slice(0, c.quantity).map(s => s.serial);
              return { ...c, selectedSerials: toSelect };
            }
            return c;
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
          toast.error(`Estoque insuficiente. Disponível: ${product.stockAvailable} un.`);
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
        hasSerials: product.hasSerials ?? true,
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
        toast.error(`Estoque insuficiente. Disponível: ${i.stock} un.`);
        return i;
      }
      const serials = i.selectedSerials || [];
      const available = availableSerialsMap[id] || [];
      
      let nextSerials = serials.slice(0, next);
      if (next > nextSerials.length && available.length >= next) {
        const remaining = available.map(a => a.serial).filter(s => !nextSerials.includes(s));
        nextSerials = [...nextSerials, ...remaining.slice(0, next - nextSerials.length)];
      }

      return { ...i, quantity: next, selectedSerials: nextSerials };
    }));
  };

  const autoSelectSerials = (itemId: string, quantity: number) => {
    const available = availableSerialsMap[itemId] || [];
    if (available.length === 0) {
      toast.info("Nenhuma série disponível para auto-preenchimento.");
      return;
    }
    const autoSerials = available.slice(0, quantity).map(s => s.serial);
    setCart(prev => prev.map(c => c.id === itemId ? { ...c, selectedSerials: autoSerials } : c));
    toast.success(`${autoSerials.length} série(s) selecionada(s) automaticamente!`);
  };

  const totalValue = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const totalLiquido = Math.max(0, totalValue - discount);

  const handleSave = async () => {
    if (!customer) { 
      toast.error("Selecione um cliente antes de finalizar a venda."); 
      setShowCustomerPicker(true);
      return; 
    }
    if (cart.length === 0) { 
      toast.error("Adicione pelo menos um produto ao carrinho."); 
      return; 
    }

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
        sellerId: selectedSellerId || sellerId,
      });
      if (res.success) {
        toast.success(`Pedido ${res.orderNumber} registrado com sucesso!`);
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.error || "Falha ao registrar venda.");
      }
    } catch {
      toast.error("Erro ao processar venda.");
    } finally {
      setLoading(false);
    }
  };

  const buildAnexoPBuyer = (): AnexoPBuyer => {
    const addressParts = [
      customer?.address,
      customer?.addressNumber ? `nº ${customer.addressNumber}` : null,
      customer?.addressComplement,
      customer?.neighborhood ? `– ${customer.neighborhood}` : null,
      customer?.city ? `– ${customer.city}` : null,
      customer?.state ? `/ ${customer.state}` : null,
      customer?.cep ? `– CEP: ${customer.cep}` : null,
    ].filter(Boolean);

    return {
      name: customer?.name,
      document: customer?.document || customer?.cpfCnpj,
      crNumber: customer?.crNumber || customer?.cr,
      crValidity: fmtDate(customer?.crValidityDate),
      phone: customer?.phone,
      email: customer?.email,
      address: addressParts.length > 0 ? addressParts.join(" ") : null,
      contactName: customer?.responsibleName || null,
    };
  };

  const buildAnexoPItems = (): AnexoPItemSpec[] =>
    cart.map(item => {
      const fullProduct = products.find(p => p.id === item.id) || {};
      const unitPrice = item.price ?? 0;
      return {
        quantity: item.quantity,
        name: item.name,
        unitPrice,
        totalPrice: unitPrice * item.quantity,
        species: fullProduct.species,
        brand: fullProduct.brand,
        model: fullProduct.model,
        caliber: fullProduct.caliber,
        actionType: fullProduct.actionType,
        finish: fullProduct.finish,
        originCountry: fullProduct.originCountry,
        barrelLength: fullProduct.barrelLength,
        capacity: fullProduct.capacity,
        technicalDescription: fullProduct.technicalDescription,
      };
    });

  const checkMissingSpecs = () => {
    const itemsComSpecsFaltando = cart
      .map(item => ({ item, faltando: getMissingAnexoPSpecs(products.find(p => p.id === item.id)) }))
      .filter(({ faltando }) => faltando.length > 0);
    if (itemsComSpecsFaltando.length > 0) {
      const resumo = itemsComSpecsFaltando
        .map(({ item, faltando }) => `${item.name}: ${faltando.join(", ")}`)
        .join(" · ");
      toast.warning(`Cadastro incompleto — sairá como "N/A" no documento: ${resumo}`, { duration: 8000 });
    }
  };

  const handleGenerateAnexoP = async () => {
    if (!customer) {
      toast.error("Selecione um cliente antes de gerar o Anexo P.");
      setShowCustomerPicker(true);
      return;
    }
    if (cart.length === 0) {
      toast.error("Adicione itens ao carrinho para gerar o Anexo P.");
      return;
    }

    checkMissingSpecs();
    setIsGeneratingAnexoP(true);
    toast.info("Gerando Anexo P Oficial (PCE)...");

    try {
      generateAnexoPPdf(buildAnexoPBuyer(), buildAnexoPItems(), customer?.name || "Cliente");
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

  const handleGeneratePedido = async () => {
    if (!customer) {
      toast.error("Selecione um cliente antes de gerar o Pedido.");
      setShowCustomerPicker(true);
      return;
    }
    if (cart.length === 0) {
      toast.error("Adicione itens ao carrinho para gerar o Pedido.");
      return;
    }

    checkMissingSpecs();
    setIsGeneratingPedido(true);
    toast.info("Gerando Pedido...");

    try {
      const buyer = buildAnexoPBuyer();
      const items = buildAnexoPItems();
      await generatePedidoPdf(
        buyer,
        items,
        customer?.name || "Cliente",
        "/logos/logo-alta-preto.png",
        {
          orderNumber: `ORC-${Date.now().toString().slice(-4)}`,
          orderDate: new Date().toLocaleDateString("pt-BR"),
          sellerName: sellers.find(s => s.id === selectedSellerId)?.name || "Raul Fiuza",
          paymentMethod: paymentMethod || "ENTRADA 50% DO VALOR - RESTANTE EM 6X NO CARTÃO DE CRÉDITO",
          totalValue: totalValue,
        }
      );

      setTimeout(() => {
        setIsGeneratingPedido(false);
        toast.success("Pedido gerado!");
      }, 1000);
    } catch (error) {
      console.error(error);
      setIsGeneratingPedido(false);
      toast.error("Erro ao gerar Pedido.");
    }
  };

  const filtered = products.filter(p =>
    p.commercialName.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())) ||
    (p.caliber && p.caliber.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredCustomersForPicker = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.cpfCnpj?.includes(customerSearch)
  );

  return (
    <Dialog 
      isOpen={isOpen} 
      onClose={onClose} 
      title={customer ? `REGISTRAR VENDA — ${customer.name}` : "REGISTRAR VENDA / PDV"} 
      className="max-w-5xl h-[94vh] max-h-[94vh]"
      contentClassName="p-0 flex flex-col flex-1 min-h-0 overflow-hidden"
    >
      {/* 1. SELETOR DE CLIENTE (STICKY TOPO) */}
      <div className="p-3 sm:px-6 border-b border-brand-border bg-brand-surface/40 shrink-0">
        {customer ? (
          <div className="flex items-center justify-between gap-3 p-2.5 bg-brand-bg/60 border border-brand-border rounded-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center shrink-0">
                {customer.type === "B2B" ? <Building2 size={15} className="text-brand-accent" /> : <User size={15} className="text-brand-accent" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[12px] font-black text-white uppercase tracking-wide truncate">{customer.name}</p>
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-brand-accent/15 text-brand-accent border border-brand-accent/30">
                    {customer.type === "B2B" ? "PESSOA JURÍDICA (B2B)" : "PESSOA FÍSICA (B2C)"}
                  </span>
                </div>
                <p className="text-[9px] text-brand-text-muted font-mono font-bold mt-0.5">
                  Doc: {customer.cpfCnpj || "Não informado"} {customer.state ? `· UF: ${customer.state}` : ""} {customer.crNumber ? `· CR: ${customer.crNumber}` : ""}
                </p>
              </div>
            </div>
            {!isCustomerLocked && (
              <button
                onClick={() => setShowCustomerPicker(true)}
                className="shrink-0 px-2.5 py-1 bg-brand-surface hover:bg-brand-surface/80 border border-brand-border rounded text-[9px] font-black uppercase tracking-wider text-brand-accent hover:border-brand-accent transition-all"
              >
                Trocar Cliente
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowCustomerPicker(true)}
            className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-brand-accent/40 rounded-lg text-brand-accent text-[11px] font-black uppercase tracking-widest hover:bg-brand-accent/5 hover:border-brand-accent transition-all"
          >
            <User size={16} /> Clique para selecionar o cliente da venda
          </button>
        )}
      </div>

      {/* 2. CORPO PRINCIPAL DO MODAL (CATÁLOGO + CARRINHO) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-full">

          {/* COLUNA ESQUERDA: CATÁLOGO DE PRODUTOS */}
          <div className="flex flex-col gap-3 min-h-[300px]">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5">
                <ShoppingBag size={14} className="text-brand-accent" />
                <span className="text-[11px] font-black text-white uppercase tracking-widest">
                  Catálogo de Armas & Produtos
                </span>
              </div>
              <span className="text-[9px] font-bold text-brand-text-muted uppercase">
                {customer?.type === "B2B" ? "Tabela B2B" : "Tabela B2C"}
              </span>
            </div>

            <div className="relative shrink-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-text-muted" size={14} />
              <Input
                placeholder="Buscar por nome, SKU, marca ou calibre..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 pl-8 text-xs bg-brand-bg/80"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px] lg:max-h-[460px] custom-scrollbar">
              {loadingProducts ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-7 h-7 border-2 border-brand-accent border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Carregando catálogo e estoque...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-14 bg-brand-surface/20 border border-brand-border/40 rounded-lg p-4">
                  <p className="text-[11px] font-bold text-brand-text-muted uppercase">
                    {products.length === 0 ? "Nenhum produto com estoque disponível." : "Nenhum produto encontrado para o filtro."}
                  </p>
                </div>
              ) : filtered.map(p => {
                const price = customer?.type === "B2B" ? (p.priceB2B ?? p.priceB2C) : p.priceB2C;
                const inCart = cart.find(i => i.id === p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className={cn(
                      "p-3 bg-brand-surface/40 border rounded-lg flex items-center justify-between group transition-all cursor-pointer select-none",
                      inCart 
                        ? "border-brand-accent/60 bg-brand-accent/5 shadow-[0_0_12px_rgba(245,196,0,0.08)]" 
                        : "border-brand-border hover:border-brand-accent/50 hover:bg-brand-surface/70"
                    )}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-[12px] font-black text-white uppercase tracking-tight group-hover:text-brand-accent transition-colors truncate">
                        {p.commercialName}
                      </p>
                      <p className="text-[9px] text-brand-text-muted font-bold mt-0.5 truncate">
                        SKU: <span className="font-mono text-white/70">{p.sku}</span> · {p.brand} {p.model} {p.caliber ? `· ${p.caliber}` : ""}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          "text-[9px] font-black font-mono px-1.5 py-0.2 rounded",
                          p.stockAvailable <= 3 
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" 
                            : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        )}>
                          Estoque: {p.stockAvailable} un.
                        </span>
                        {inCart && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-brand-accent text-brand-bg font-mono">
                            No carrinho: {inCart.quantity}
                          </span>
                        )}
                        <LotBadge source={p.lotSource} investor={p.investorLotStock} own={p.ownLotStock} />
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-sm font-mono font-black text-brand-accent">{fmt(price)}</p>
                      <button className="mt-1 ml-auto w-6 h-6 rounded bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent group-hover:bg-brand-accent group-hover:text-brand-bg transition-all">
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUNA DIREITA: CARRINHO + DETALHES DA VENDA */}
          <div className="flex flex-col gap-3 min-h-[300px]">
            <Card className="flex-1 flex flex-col p-0 border-brand-border bg-brand-bg/40 overflow-hidden shadow-md">
              {/* Header Carrinho */}
              <div className="p-3 border-b border-brand-border bg-brand-surface/30 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={14} className="text-brand-accent" />
                  <h3 className="text-[11px] font-black text-white uppercase tracking-widest">
                    Itens Selecionados {cart.length > 0 ? `(${cart.reduce((a, i) => a + i.quantity, 0)})` : ""}
                  </h3>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-[9px] text-red-400/80 hover:text-red-400 font-bold uppercase transition-colors"
                  >
                    Limpar Tudo
                  </button>
                )}
              </div>

              {/* Lista de Itens do Carrinho */}
              <div className="p-3 space-y-3 overflow-y-auto max-h-[220px] lg:max-h-[260px] custom-scrollbar border-b border-brand-border/50">
                {cart.length === 0 ? (
                  <div className="py-10 flex flex-col items-center justify-center opacity-40 text-center">
                    <ShoppingBag size={32} />
                    <p className="text-[11px] font-black mt-2 uppercase tracking-wider">Carrinho Vazio</p>
                    <p className="text-[9px] text-brand-text-muted mt-0.5">Selecione produtos no catálogo à esquerda</p>
                  </div>
                ) : (
                  cart.map(item => {
                    const availableSerials = availableSerialsMap[item.id] || [];
                    const selectedSerials = item.selectedSerials || [];

                    return (
                      <div key={item.id} className="p-2.5 bg-brand-surface/30 rounded-lg border border-brand-border space-y-2.5">
                        {/* Linha 1: Nome, Qtd, Preço, Remover */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-white uppercase truncate">{item.name}</p>
                            <p className="text-[9px] text-brand-text-muted font-bold font-mono">
                              {fmt(item.price)} × {item.quantity} = <span className="text-brand-accent font-black">{fmt(item.price * item.quantity)}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center bg-brand-bg rounded border border-brand-border overflow-hidden">
                              <button onClick={() => updateQty(item.id, -1)} className="px-2.5 py-1 hover:bg-brand-surface text-brand-text-muted text-xs font-bold">−</button>
                              <span className="px-2 text-xs font-mono font-black text-white">{item.quantity}</span>
                              <button onClick={() => updateQty(item.id, 1)} className="px-2.5 py-1 hover:bg-brand-surface text-brand-text-muted text-xs font-bold">+</button>
                            </div>
                            <button 
                              onClick={() => removeFromCart(item.id)} 
                              className="p-1 text-brand-text-muted hover:text-red-400 transition-colors"
                              title="Remover do carrinho"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Linha 2: Preferência de Lote */}
                        <div className="pt-1.5 border-t border-brand-border/30 flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-[8px] font-black text-brand-text-muted uppercase">
                            <span>Origem do Lote</span>
                          </div>
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
                                {opt === "AUTO" ? "Automático" : opt === "PROPRIO" ? "Lote Próprio" : "Investidor"}
                              </button>
                            ))}
                          </div>

                          {item.lotPreference === "INVESTIDOR" && (
                            <div>
                              {loadingProjectsMap[item.id] ? (
                                <div className="flex items-center gap-2 px-1 text-[8px] text-brand-text-muted">
                                  <div className="w-2.5 h-2.5 border border-amber-500 border-t-transparent rounded-full animate-spin" />
                                  Buscando investidores...
                                </div>
                              ) : !productProjectsMap[item.id] || productProjectsMap[item.id].length === 0 ? (
                                <p className="text-[8px] text-amber-400/70 font-bold px-1">
                                  Nenhum projeto de investidor com este produto.
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
                                  <option value="">Selecionar projeto do investidor...</option>
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

                        {/* Linha 3: Seletor de Números de Série */}
                        <div className="pt-1.5 border-t border-brand-border/30">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[8px] font-black text-brand-text-muted uppercase tracking-wider">
                              Números de Série ({selectedSerials.length}/{item.quantity})
                            </span>
                            {availableSerials.length > 0 && (
                              <button
                                onClick={() => autoSelectSerials(item.id, item.quantity)}
                                className="text-[8px] font-black text-brand-accent hover:underline uppercase flex items-center gap-1"
                              >
                                <Sparkles size={9} /> Auto-selecionar
                              </button>
                            )}
                          </div>
                          
                          {availableSerials.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-h-[72px] overflow-y-auto pr-1 py-0.5 custom-scrollbar">
                              {availableSerials.map(s => {
                                const isSelected = selectedSerials.includes(s.serial);
                                return (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => {
                                      setCart(prev => prev.map(c => {
                                        if (c.id !== item.id) return c;
                                        const cur = c.selectedSerials || [];
                                        let next = [];
                                        if (cur.includes(s.serial)) {
                                          next = cur.filter(x => x !== s.serial);
                                        } else {
                                          if (cur.length >= c.quantity) {
                                            next = [...cur.slice(0, c.quantity - 1), s.serial];
                                          } else {
                                            next = [...cur, s.serial];
                                          }
                                        }
                                        return { ...c, selectedSerials: next };
                                      }));
                                    }}
                                    className={cn(
                                      "px-2 py-0.5 rounded text-[8px] font-mono font-black border transition-all flex items-center gap-1",
                                      isSelected 
                                        ? "bg-brand-accent text-brand-bg border-brand-accent shadow-[0_0_8px_rgba(245,196,0,0.2)]" 
                                        : "bg-brand-bg text-brand-text-muted border-brand-border hover:border-brand-text-muted hover:text-white"
                                    )}
                                  >
                                    {isSelected && <Check size={8} className="stroke-[3]" />}
                                    {s.serial}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-[8px] text-brand-text-muted font-bold uppercase tracking-wider bg-brand-bg/50 p-1 rounded border border-brand-border/30">
                              Item sem controle individual de número de série (baixa direta do estoque).
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Formulário de Finalização & Dados de Pagamento */}
              <div className="p-3 bg-brand-surface/20 space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-black text-brand-text-muted uppercase">Vendedor Responsável</label>
                    <select
                      className="w-full bg-brand-input border border-brand-border rounded px-2.5 py-1 text-xs text-white outline-none focus:border-brand-accent"
                      value={selectedSellerId}
                      onChange={e => setSelectedSellerId(e.target.value)}
                    >
                      {sellers.length === 0 && <option value="">Carregando vendedores...</option>}
                      {sellers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-black text-brand-text-muted uppercase">Desconto (R$)</label>
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={discount || ""}
                      onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="h-7 font-mono text-white text-right text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-black text-brand-text-muted uppercase">Forma de Pagamento</label>
                    <select
                      className="w-full bg-brand-input border border-brand-border rounded px-2.5 py-1 text-xs text-white outline-none focus:border-brand-accent"
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
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-black text-brand-text-muted uppercase">Status do Pedido</label>
                    <select
                      className="w-full bg-brand-input border border-brand-border rounded px-2.5 py-1 text-xs text-white outline-none focus:border-brand-accent"
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                    >
                      <option value="PAGO">PAGO / EFETIVADO</option>
                      <option value="PENDENTE">PENDENTE</option>
                      <option value="RASCUNHO">RASCUNHO</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[9px] font-black text-brand-text-muted uppercase">Observações do Pedido</label>
                  <textarea
                    className="w-full bg-brand-input border border-brand-border rounded px-2.5 py-1 text-xs text-white outline-none focus:border-brand-accent custom-scrollbar"
                    placeholder="Condições de entrega, descontos ou notas fiscais..."
                    style={{ minHeight: 34, maxHeight: 50, resize: "none" }}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </Card>
          </div>

        </div>
      </div>

      {/* 3. RODAPÉ FIXO DE AÇÕES — SEMPRE VISÍVEL E INTACTO */}
      <div className="shrink-0 border-t border-brand-border bg-brand-surface px-4 sm:px-6 py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] z-10">
        <div className="flex items-center gap-4 min-w-0">
          <div>
            <p className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest">
              {cart.length === 0 ? "Nenhum item" : `${cart.reduce((a, i) => a + i.quantity, 0)} item(ns) no pedido`}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-mono font-black text-brand-accent">
                {fmt(totalLiquido)}
              </span>
              {discount > 0 && (
                <span className="text-[10px] font-mono text-brand-text-muted line-through">
                  {fmt(totalValue)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="text-[10px] font-black tracking-widest h-10 px-4"
          >
            CANCELAR
          </Button>

          <Button
            onClick={handleGenerateAnexoP}
            disabled={isGeneratingAnexoP || cart.length === 0 || !customer}
            variant="secondary"
            className="gap-1.5 text-[10px] font-black tracking-widest border-brand-accent/30 text-brand-accent hover:bg-brand-accent hover:text-white h-10 px-3.5"
            title={!customer ? "Selecione um cliente" : cart.length === 0 ? "Adicione produtos" : "Gerar documento Anexo P"}
          >
            {isGeneratingAnexoP ? "GERANDO..." : <><FileText size={14} /> ANEXO P</>}
          </Button>

          <Button
            onClick={handleGeneratePedido}
            disabled={isGeneratingPedido || cart.length === 0 || !customer}
            variant="secondary"
            className="gap-1.5 text-[10px] font-black tracking-widest border-brand-accent/30 text-brand-accent hover:bg-brand-accent hover:text-white h-10 px-3.5"
            title={!customer ? "Selecione um cliente" : cart.length === 0 ? "Adicione produtos" : "Gerar PDF do Pedido"}
          >
            {isGeneratingPedido ? "GERANDO..." : <><FileText size={14} /> PEDIDO</>}
          </Button>

          <Button
            onClick={handleSave}
            disabled={loading || cart.length === 0 || !customer}
            className="gap-2 text-[11px] font-black tracking-widest h-10 px-6 bg-brand-accent text-brand-bg hover:bg-brand-accent/90 shadow-[0_0_15px_rgba(245,196,0,0.25)]"
            title={!customer ? "Selecione um cliente antes de finalizar" : cart.length === 0 ? "Adicione pelo menos um produto" : "Gravar e efetivar a venda no sistema"}
          >
            {loading ? "PROCESSANDO..." : <><DollarSign size={16} /> EFETIVAR VENDA</>}
          </Button>
        </div>
      </div>

      {/* MODAL / POPUP DE ESCOLHA DE CLIENTE */}
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
              maxHeight: "75vh",
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
                <p className="text-[10px] text-brand-text-muted mt-0.5">Escolha o cliente comprador para esta venda</p>
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

