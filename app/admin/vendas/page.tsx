"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SaleModal } from "@/components/crm/SaleModal";
import { CustomerProfile } from "@/components/crm/CustomerProfile";
import { getCustomerById } from "@/app/admin/crm/clientes/actions";
import {
  ShoppingBag,
  Search,
  Plus,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Building2,
  Pencil,
  Trash2,
  AlertTriangle,
  Package,
  FileText,
  CreditCard,
  Layers,
} from "lucide-react";
import { getSalesOrders, getCustomersForSale, updateSalesOrder, deleteSalesOrder, getSalesOrderPdfData } from "@/app/admin/crm/vendas/actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { generateAnexoPPdf, generatePedidoPdf } from "@/lib/pdf-helpers";

const cleanMoney = (val: string) => {
  const num = Number(val.replace(/\D/g, "")) / 100;
  return isNaN(num) ? 0 : num;
};

const handleBRLMask = (val: string, setter: (v: string) => void) => {
  const value = val.replace(/\D/g, "");
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) / 100);
  setter(formatted);
};

export default function VendasPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [session, setSession] = useState({ userName: "Administrador", userEmail: "", userId: "" });
  const [profileCustomer, setProfileCustomer] = useState<any>(null);

  // Modal de venda (estilo PDV: abre direto, cliente é escolhido dentro dele)
  const [showSaleModal, setShowSaleModal] = useState(false);

  // Edição de pedido
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editPayment, setEditPayment] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editTotal, setEditTotal] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(false);

  // Emissão de Anexo P / Pedido para um pedido já concluído (id do pedido + tipo em geração no momento)
  const [generatingDoc, setGeneratingDoc] = useState<{ orderId: string; type: "anexo" | "pedido" } | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem("eleven_session");
      if (s) {
        const p = JSON.parse(s);
        setSession({ userName: p.name || "Administrador", userEmail: p.email || "", userId: p.id || "" });
      }
    } catch {}
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersData, customersData] = await Promise.all([getSalesOrders(), getCustomersForSale()]);
      setOrders(ordersData);
      setCustomers(customersData);
    } catch {
      console.error("Erro ao carregar dados de vendas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredOrders = orders.filter(o =>
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (order: any) => {
    setEditingOrder(order);
    setEditStatus(order.status);
    setEditPayment(order.paymentMethod || "PIX");
    setEditNotes(order.notes || "");
    const formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(order.totalValue || 0);
    setEditTotal(formatted);
    setConfirmDelete(false);
  };

  const closeEdit = () => {
    setEditingOrder(null);
    setConfirmDelete(false);
  };

  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    setSavingEdit(true);
    const cleanValue = cleanMoney(editTotal);
    const res = await updateSalesOrder(editingOrder.id, {
      status: editStatus,
      paymentMethod: editPayment,
      notes: editNotes,
      totalValue: cleanValue > 0 ? cleanValue : editingOrder.totalValue,
    });
    setSavingEdit(false);
    if (res.success) {
      toast.success("Pedido atualizado com sucesso.");
      closeEdit();
      loadData();
    } else {
      toast.error(res.error || "Erro ao atualizar pedido.");
    }
  };

  const handleDelete = async () => {
    if (!editingOrder) return;
    setDeletingOrder(true);
    const res = await deleteSalesOrder(editingOrder.id);
    setDeletingOrder(false);
    if (res.success) {
      toast.success("Pedido excluído e estoque restaurado.");
      closeEdit();
      loadData();
    } else {
      toast.error(res.error || "Erro ao excluir pedido.");
    }
  };

  const handleGenerateOrderDoc = async (order: any, type: "anexo" | "pedido") => {
    setGeneratingDoc({ orderId: order.id, type });
    const loadToast = toast.loading(type === "anexo" ? "Gerando Anexo P..." : "Gerando Pedido...");
    try {
      const data = await getSalesOrderPdfData(order.id);
      if (!data) {
        toast.error("Erro ao carregar dados do pedido.");
        return;
      }
      const fileNameBase = data.buyer.name || order.customer?.name || "Cliente";
      if (type === "anexo") {
        generateAnexoPPdf(data.buyer, data.items, fileNameBase);
        toast.success("Anexo P gerado!");
      } else {
        await generatePedidoPdf(data.buyer, data.items, fileNameBase, "/logos/logo-alta-a.png");
        toast.success("Pedido gerado!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar documento.");
    } finally {
      toast.dismiss(loadToast);
      setGeneratingDoc(null);
    }
  };

  const parseProducts = (productsStr: string) => {
    try { return JSON.parse(productsStr || "[]"); } catch { return []; }
  };

  const getLotInfo = (order: any) => {
    const weapons: any[] = order.weapons || [];
    if (weapons.length === 0) return null;
    const investorWeapons = weapons.filter((w: any) => w.importLot?.investmentProjectId);
    const ownWeapons = weapons.filter((w: any) => !w.importLot?.investmentProjectId);
    if (investorWeapons.length > 0 && ownWeapons.length === 0) {
      const project = investorWeapons[0].importLot?.investmentProject;
      return { type: "INVESTIDOR", label: `${project?.investor?.name ?? "Investidor"} — ${project?.name ?? ""}` };
    }
    if (ownWeapons.length > 0 && investorWeapons.length === 0) {
      return { type: "PROPRIO", label: "Lote Próprio" };
    }
    const project = investorWeapons[0]?.importLot?.investmentProject;
    return { type: "MISTO", label: `Misto — Inv: ${investorWeapons.length} / Próprio: ${ownWeapons.length}${project ? ` (${project.investor?.name})` : ""}` };
  };

  const getStatusStyle = (s: string) => {
    if (s === "PAGO") return "bg-brand-success/10 text-brand-success border-brand-success/20";
    if (s === "PENDENTE") return "bg-brand-warning/10 text-brand-warning border-brand-warning/20";
    return "bg-brand-text-muted/10 text-brand-text-muted border-brand-text-muted/20";
  };

  const getStatusIcon = (s: string) => {
    if (s === "PAGO") return <CheckCircle2 size={12} />;
    if (s === "PENDENTE") return <Clock size={12} />;
    return <AlertCircle size={12} />;
  };

  return (
    <DashboardLayout role="ADMIN" userName={session.userName} userEmail={session.userEmail}>
      <div className="flex flex-col gap-8 animate-fade-in pb-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-accent/10 rounded border border-brand-accent/20 text-brand-accent">
              <ShoppingBag size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1 font-rajdhani uppercase text-white">PEDIDOS DE VENDA</h1>
              <p className="text-[10px] text-brand-text-muted font-bold uppercase tracking-wider">Histórico centralizado de transações e pedidos diretos.</p>
            </div>
          </div>
          <Button className="gap-2" onClick={() => setShowSaleModal(true)}>
            <Plus size={18} />
            NOVA VENDA
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border-brand-border bg-brand-surface/20 flex flex-col gap-2">
            <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest">Total de Pedidos</span>
            <p className="text-2xl font-bold text-white">{orders.length}</p>
          </Card>
          <Card className="p-6 border-brand-border bg-brand-surface/20 flex flex-col gap-2">
            <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest">Faturamento Total</span>
            <p className="text-2xl font-bold text-brand-accent">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(orders.reduce((a, o) => a + (o.totalValue || 0), 0))}
            </p>
          </Card>
          <Card className="p-6 border-brand-border bg-brand-surface/20 flex flex-col gap-2">
            <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest">Ticket Médio</span>
            <p className="text-2xl font-bold text-white">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                orders.length > 0 ? orders.reduce((a, o) => a + (o.totalValue || 0), 0) / orders.length : 0
              )}
            </p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={18} />
            <Input className="pl-10 h-11" placeholder="Buscar por número do pedido ou nome do cliente..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button variant="secondary" className="h-11 px-6 font-bold text-[10px] uppercase tracking-widest" onClick={loadData}>
            ATUALIZAR
          </Button>
        </div>

        {/* Table */}
        <Card className="border-brand-border bg-brand-surface/10 shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-surface/50 border-b border-brand-border">
                <th className="px-6 py-4 text-[10px] font-black text-brand-text-muted uppercase tracking-widest">Nº Pedido</th>
                <th className="px-6 py-4 text-[10px] font-black text-brand-text-muted uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black text-brand-text-muted uppercase tracking-widest">Data</th>
                <th className="px-6 py-4 text-[10px] font-black text-brand-text-muted uppercase tracking-widest">Valor Total</th>
                <th className="px-6 py-4 text-[10px] font-black text-brand-text-muted uppercase tracking-widest">Pagamento</th>
                <th className="px-6 py-4 text-[10px] font-black text-brand-text-muted uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-brand-text-muted uppercase tracking-widest text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/30">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Carregando...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-brand-accent/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-black text-white">{order.orderNumber}</span>
                    </td>
                    <td className="px-6 py-4 relative group">
                      <div 
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={async () => {
                          if (!order.customer?.id) return;
                          const loadToast = toast.loading("Carregando perfil do cliente...");
                          try {
                            const full = await getCustomerById(order.customer.id);
                            if (full) {
                              setProfileCustomer(full);
                            } else {
                              toast.error("Erro ao carregar perfil do cliente.");
                            }
                          } catch (err) {
                            console.error(err);
                            toast.error("Erro ao conectar ao servidor.");
                          } finally {
                            toast.dismiss(loadToast);
                          }
                        }}
                      >
                        <User size={14} className="text-brand-accent" />
                        <span className="text-xs font-bold text-white uppercase hover:text-brand-accent transition-colors">
                          {order.customer?.name || "—"}
                        </span>
                      </div>

                      {/* Card de Informações do Cliente (Hover) */}
                      {order.customer && (
                        <div className="absolute left-0 bottom-full mb-2 z-50 hidden group-hover:block w-[350px] p-5 bg-[#161616] border border-brand-border rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.8)] border-t-2 border-t-brand-accent animate-fade-in text-left pointer-events-none">
                          <p className="text-[10px] font-black text-brand-accent uppercase tracking-widest mb-3 border-b border-brand-border/40 pb-1.5 flex items-center gap-1.5">
                            <User size={12} /> Cadastro do Cliente
                          </p>
                          <div className="space-y-2.5 text-xs text-white">
                            <div className="flex justify-between items-start gap-3">
                              <span className="text-brand-text-secondary font-semibold shrink-0 uppercase text-[9px] tracking-wider mt-0.5">Nome:</span>
                              <span className="font-bold uppercase text-right max-w-[220px] text-white leading-tight">{order.customer.name}</span>
                            </div>
                            <div className="flex justify-between items-center gap-3">
                              <span className="text-brand-text-secondary font-semibold shrink-0 uppercase text-[9px] tracking-wider">Documento:</span>
                              <span className="font-mono text-brand-text-primary bg-brand-surface px-1.5 py-0.5 rounded border border-brand-border/40">{order.customer.cpfCnpj}</span>
                            </div>
                            <div className="flex justify-between items-center gap-3">
                              <span className="text-brand-text-secondary font-semibold shrink-0 uppercase text-[9px] tracking-wider">Tipo:</span>
                              <span className="font-bold text-brand-text-secondary uppercase text-[10px]">
                                {order.customer.type === "B2B" ? "B2B / Pessoa Jurídica" : "B2C / Pessoa Física"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center gap-3">
                              <span className="text-brand-text-secondary font-semibold shrink-0 uppercase text-[9px] tracking-wider">Telefone:</span>
                              <span className="font-semibold text-white">{order.customer.phone || "—"}</span>
                            </div>
                            {order.customer.email && (
                              <div className="flex justify-between items-center gap-3">
                                <span className="text-brand-text-secondary font-semibold shrink-0 uppercase text-[9px] tracking-wider">Email:</span>
                                <span className="truncate max-w-[220px] text-white font-medium">{order.customer.email}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-start gap-3">
                              <span className="text-brand-text-secondary font-semibold shrink-0 uppercase text-[9px] tracking-wider">Localidade:</span>
                              <span className="text-right text-white font-medium leading-tight">
                                {order.customer.city ? `${order.customer.city} - ${order.customer.state}` : order.customer.state || "—"}
                              </span>
                            </div>
                            {order.customer.crNumber && (
                              <div className="flex justify-between items-center gap-3 border-t border-brand-border/30 pt-2.5 mt-2">
                                <span className="text-brand-text-secondary font-semibold shrink-0 uppercase text-[9px] tracking-wider">Nº CR:</span>
                                <span className="font-mono text-brand-accent font-bold text-xs bg-brand-accent/5 px-2 py-0.5 rounded border border-brand-accent/20">
                                  {order.customer.crNumber}
                                </span>
                              </div>
                            )}
                            {order.customer.category && (
                              <div className="flex justify-between items-center gap-3">
                                <span className="text-brand-text-secondary font-semibold shrink-0 uppercase text-[9px] tracking-wider">Categoria:</span>
                                <span className="font-bold uppercase text-[9px] bg-brand-accent/10 border border-brand-accent/20 px-2.5 py-0.5 rounded text-brand-accent">
                                  {order.customer.category}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-brand-text-muted uppercase">
                        <Calendar size={14} />
                        {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono font-black text-brand-accent">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.totalValue)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-brand-text-muted uppercase">{order.paymentMethod || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                        getStatusStyle(order.status)
                      )}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleGenerateOrderDoc(order, "anexo")}
                          disabled={!!generatingDoc}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-wider border border-brand-border text-brand-text-muted hover:text-brand-accent hover:border-brand-accent transition-all disabled:opacity-50"
                        >
                          <FileText size={11} />
                          {generatingDoc && generatingDoc.orderId === order.id && generatingDoc.type === "anexo" ? "Gerando..." : "Anexo P"}
                        </button>
                        <button
                          onClick={() => handleGenerateOrderDoc(order, "pedido")}
                          disabled={!!generatingDoc}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-wider border border-brand-border text-brand-text-muted hover:text-brand-accent hover:border-brand-accent transition-all disabled:opacity-50"
                        >
                          <FileText size={11} />
                          {generatingDoc && generatingDoc.orderId === order.id && generatingDoc.type === "pedido" ? "Gerando..." : "Pedido"}
                        </button>
                        <button
                          onClick={() => openEdit(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-wider border border-brand-border text-brand-text-muted hover:text-brand-accent hover:border-brand-accent transition-all"
                        >
                          <Pencil size={11} /> Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">
                      {orders.length > 0 ? "Nenhum resultado para o filtro." : "Nenhum pedido registrado ainda."}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Sale Modal (estilo PDV: abre sem cliente, seleção acontece dentro do modal) */}
      <SaleModal
        isOpen={showSaleModal}
        onClose={() => setShowSaleModal(false)}
        customers={customers}
        sellerId={session.userId}
        onSuccess={() => { setShowSaleModal(false); loadData(); }}
      />

      {/* Edit Order Modal */}
      {editingOrder && (() => {
        const products = parseProducts(editingOrder.products);
        const fmtBRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeEdit} />
            <div
              className="relative w-full animate-fade-in flex flex-col"
              style={{
                maxWidth: 580,
                maxHeight: "90vh",
                background: "#1A1A1A",
                border: "1px solid #333",
                borderTop: "3px solid #F5C400",
                borderRadius: 4,
                boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border shrink-0">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest font-rajdhani">DETALHES DO PEDIDO</h3>
                  <p className="text-[10px] text-brand-text-muted mt-0.5 font-mono">
                    {editingOrder.orderNumber} · {new Date(editingOrder.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <button onClick={closeEdit} className="text-brand-text-muted hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Info do pedido */}
                <div className="px-5 pt-4 pb-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FileText size={11} className="text-brand-accent" />
                    <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest">Informações do Pedido</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 p-3 bg-brand-surface/30 rounded border border-brand-border">
                    <div>
                      <p className="text-[8px] font-bold text-brand-text-muted uppercase tracking-widest mb-0.5">Cliente</p>
                      <p className="text-xs font-bold text-white uppercase truncate">{editingOrder.customer?.name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-brand-text-muted uppercase tracking-widest mb-0.5">Documento</p>
                      <p className="text-xs font-mono text-white">{editingOrder.customer?.cpfCnpj || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-brand-text-muted uppercase tracking-widest mb-0.5">Tipo</p>
                      <p className="text-xs font-bold text-brand-text-secondary uppercase">{editingOrder.customer?.type || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Produtos */}
                {products.length > 0 && (
                  <div className="px-5 pb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Package size={11} className="text-brand-accent" />
                      <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest">Itens do Pedido</span>
                    </div>
                    <div className="border border-brand-border rounded overflow-hidden">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-brand-surface/50">
                            <th className="px-3 py-2 text-[8px] font-black text-brand-text-muted uppercase tracking-widest">Produto</th>
                            <th className="px-3 py-2 text-[8px] font-black text-brand-text-muted uppercase tracking-widest text-center">Qtd</th>
                            <th className="px-3 py-2 text-[8px] font-black text-brand-text-muted uppercase tracking-widest text-right">Unit.</th>
                            <th className="px-3 py-2 text-[8px] font-black text-brand-text-muted uppercase tracking-widest text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/30">
                          {products.map((item: any, i: number) => (
                            <tr key={i} className="hover:bg-brand-surface/20">
                              <td className="px-3 py-2">
                                <p className="text-[11px] font-bold text-white uppercase">{item.name}</p>
                                <p className="text-[9px] font-mono text-brand-text-muted">{item.sku}</p>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className="text-xs font-bold text-white">{item.quantity}</span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <span className="text-xs font-mono text-brand-text-secondary">{fmtBRL(item.price)}</span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <span className="text-xs font-mono font-black text-brand-accent">{fmtBRL(item.price * item.quantity)}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Origem do Lote (derivada das armas do pedido) */}
                {(() => {
                  const lotInfo = getLotInfo(editingOrder);
                  if (!lotInfo) return null;
                  const colorMap: Record<string, string> = {
                    INVESTIDOR: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                    PROPRIO: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                    MISTO: "bg-brand-surface/30 text-brand-text-muted border-brand-border",
                  };
                  return (
                    <div className="px-5 pb-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Layers size={11} className="text-brand-accent" />
                        <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest">Origem do Lote</span>
                      </div>
                      <div className={cn("flex items-center gap-2 px-3 py-2 rounded border text-[10px] font-bold uppercase", colorMap[lotInfo.type])}>
                        {lotInfo.type === "INVESTIDOR" && <User size={11} />}
                        {lotInfo.type === "PROPRIO" && <Building2 size={11} />}
                        {lotInfo.type === "MISTO" && <Layers size={11} />}
                        {lotInfo.label}
                      </div>
                    </div>
                  );
                })()}

                {/* Campos editáveis */}
                <div className="px-5 pb-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CreditCard size={11} className="text-brand-accent" />
                    <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest">Editar Pedido</span>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest">Status</label>
                        <select
                          className="w-full bg-brand-input border border-brand-border rounded px-3 py-2 text-sm text-white outline-none focus:border-brand-accent"
                          value={editStatus}
                          onChange={e => setEditStatus(e.target.value)}
                        >
                          <option value="PAGO">PAGO / FINALIZADO</option>
                          <option value="PENDENTE">PENDENTE</option>
                          <option value="RASCUNHO">RASCUNHO</option>
                          <option value="CANCELADO">CANCELADO</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest">Forma de Pagamento</label>
                        <select
                          className="w-full bg-brand-input border border-brand-border rounded px-3 py-2 text-sm text-white outline-none focus:border-brand-accent"
                          value={editPayment}
                          onChange={e => setEditPayment(e.target.value)}
                        >
                          <option value="PIX">PIX</option>
                          <option value="CARTÃO CRÉDITO">CARTÃO CRÉDITO</option>
                          <option value="BOLETO">BOLETO</option>
                          <option value="DINHEIRO">DINHEIRO</option>
                          <option value="TRANSFERÊNCIA">TRANSFERÊNCIA</option>
                          <option value="CHEQUE">CHEQUE</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest">Valor Total (R$)</label>
                      <input
                        type="text"
                        className="w-full bg-brand-input border border-brand-border rounded px-3 py-2 text-sm text-brand-accent font-mono font-black outline-none focus:border-brand-accent"
                        value={editTotal}
                        onChange={e => handleBRLMask(e.target.value, setEditTotal)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest">Observações</label>
                      <textarea
                        className="w-full bg-brand-input border border-brand-border rounded px-3 py-2 text-sm text-white outline-none focus:border-brand-accent"
                        rows={3}
                        style={{ resize: "none" }}
                        value={editNotes}
                        onChange={e => setEditNotes(e.target.value)}
                        placeholder="Notas adicionais sobre o pedido..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-brand-border shrink-0">
                {confirmDelete ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-brand-danger/10 border border-brand-danger/30 rounded">
                      <AlertTriangle size={16} className="text-brand-danger shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-brand-danger uppercase">Confirmar Exclusão</p>
                        <p className="text-[10px] text-brand-text-muted mt-0.5">
                          O pedido será excluído e as armas vinculadas voltarão ao estoque. Esta ação não pode ser desfeita.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 py-2.5 rounded text-[10px] font-black uppercase tracking-widest border border-brand-border text-brand-text-muted hover:text-white transition-all"
                      >
                        Não, Voltar
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deletingOrder}
                        className="flex-1 py-2.5 rounded text-[10px] font-black uppercase tracking-widest"
                        style={{ background: deletingOrder ? "#333" : "#dc2626", color: deletingOrder ? "#606060" : "#fff" }}
                      >
                        {deletingOrder ? "Excluindo..." : "Sim, Excluir Pedido"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded text-[10px] font-black uppercase tracking-widest border border-brand-danger/40 text-brand-danger hover:bg-brand-danger/10 transition-all"
                    >
                      <Trash2 size={13} /> Excluir
                    </button>
                    <button
                      onClick={closeEdit}
                      className="flex-1 py-2.5 rounded text-[10px] font-black uppercase tracking-widest border border-brand-border text-brand-text-muted hover:text-white transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={savingEdit}
                      className="flex-[2] py-2.5 rounded text-[10px] font-black uppercase tracking-widest"
                      style={{ background: savingEdit ? "#333" : "#F5C400", color: savingEdit ? "#606060" : "#1A1A1A" }}
                    >
                      {savingEdit ? "Salvando..." : "Salvar Alterações"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {profileCustomer && (
        <CustomerProfile
          isOpen={!!profileCustomer}
          onClose={() => setProfileCustomer(null)}
          customer={profileCustomer}
          onRefresh={async () => {
            loadData();
            if (profileCustomer?.id) {
              const full = await getCustomerById(profileCustomer.id);
              if (full) {
                setProfileCustomer(full);
              }
            }
          }}
        />
      )}
    </DashboardLayout>
  );
}
