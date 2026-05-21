"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ShoppingBag, Plus, Trash2, DollarSign, Building2, User, Layers } from "lucide-react";
import { getProductsForSale, createDirectSale, getLotOptionsForCart } from "@/app/admin/crm/vendas/actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
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

export function SaleModal({ isOpen, onClose, customer, sellerId, onSuccess }: SaleModalProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [status, setStatus] = useState("PAGO");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [search, setSearch] = useState("");
  const [lotPreference, setLotPreference] = useState<LotPreference>("AUTO");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [lotProjects, setLotProjects] = useState<{ id: string; name: string; investorName: string }[]>([]);
  const [loadingLots, setLoadingLots] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCart([]);
      setNotes("");
      setSearch("");
      setPaymentMethod("PIX");
      setStatus("PAGO");
      setLotPreference("AUTO");
      setSelectedProjectId("");
      setLotProjects([]);
      loadProducts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (lotPreference === "INVESTIDOR" && cart.length > 0) {
      setLoadingLots(true);
      getLotOptionsForCart(cart.map(i => i.id)).then(opts => {
        setLotProjects(opts);
        setLoadingLots(false);
        if (opts.length > 0 && !selectedProjectId) setSelectedProjectId(opts[0].id);
      });
    }
  }, [lotPreference, cart]);

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
      return [...prev, { id: product.id, name: product.commercialName, sku: product.sku, price: unitPrice, quantity: 1, stock: product.stockAvailable }];
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
      return { ...i, quantity: next };
    }));
  };

  const totalValue = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);

  const handleSave = async () => {
    if (cart.length === 0) { toast.error("Adicione pelo menos um produto."); return; }
    if (lotPreference === "INVESTIDOR" && !selectedProjectId) {
      toast.error("Selecione o projeto do investidor para direcionar a venda.");
      return;
    }
    setLoading(true);
    try {
      const res = await createDirectSale({
        customerId: customer.id,
        items: cart.map(i => ({ id: i.id, name: i.name, sku: i.sku, price: i.price, quantity: i.quantity })),
        totalValue,
        paymentMethod,
        status,
        notes,
        sellerId,
        lotPreference,
        investmentProjectId: lotPreference === "INVESTIDOR" ? selectedProjectId : undefined,
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

  const filtered = products.filter(p =>
    p.commercialName.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`NOVA VENDA — ${customer?.name ?? ""}`} className="max-w-5xl">
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

            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-12">
                  <ShoppingBag size={36} />
                  <p className="text-[10px] font-black mt-3 uppercase">Carrinho Vazio</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 bg-brand-input rounded border border-brand-border">
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
                ))
              )}
            </div>

            <div className="p-4 bg-brand-surface/30 border-t border-brand-border space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest">Total</span>
                <span className="text-xl font-mono font-black text-brand-accent">{fmt(totalValue)}</span>
              </div>

              {/* Seletor de Origem do Lote */}
              <div className="space-y-1.5 pt-1 border-t border-brand-border/40">
                <label className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest flex items-center gap-1">
                  <Layers size={10} /> Origem do Lote
                </label>
                <div className="flex gap-1 p-0.5 bg-brand-bg rounded border border-brand-border">
                  {(["AUTO", "PROPRIO", "INVESTIDOR"] as LotPreference[]).map(opt => (
                    <button
                      key={opt}
                      onClick={() => { setLotPreference(opt); setSelectedProjectId(""); }}
                      className={cn(
                        "flex-1 py-1.5 rounded text-[8px] font-black uppercase tracking-wider transition-all",
                        lotPreference === opt
                          ? opt === "INVESTIDOR"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : opt === "PROPRIO"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "bg-brand-surface text-white border border-brand-border"
                          : "text-brand-text-muted hover:text-white"
                      )}
                    >
                      {opt === "AUTO" ? "Auto (FIFO)" : opt === "PROPRIO" ? "Lote Próprio" : "Investidor"}
                    </button>
                  ))}
                </div>

                {lotPreference === "INVESTIDOR" && (
                  <div>
                    {loadingLots ? (
                      <div className="flex items-center gap-2 px-2 py-1.5 text-[9px] text-brand-text-muted">
                        <div className="w-3 h-3 border border-amber-500 border-t-transparent rounded-full animate-spin" />
                        Buscando projetos...
                      </div>
                    ) : lotProjects.length === 0 ? (
                      <p className="text-[9px] text-amber-400/70 font-bold px-1">
                        Nenhum projeto com estoque dos produtos no carrinho.
                      </p>
                    ) : (
                      <select
                        className="w-full bg-brand-input border border-amber-500/40 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-amber-500"
                        value={selectedProjectId}
                        onChange={e => setSelectedProjectId(e.target.value)}
                      >
                        <option value="">Selecionar investidor...</option>
                        {lotProjects.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.investorName} — {p.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
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
              onClick={handleSave}
              disabled={loading || cart.length === 0}
              className="flex-[2] gap-2 text-[10px] font-black tracking-widest"
            >
              {loading ? "PROCESSANDO..." : <><DollarSign size={14} /> CONFIRMAR VENDA</>}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
