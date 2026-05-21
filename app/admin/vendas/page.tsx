"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SaleModal } from "@/components/crm/SaleModal";
import {
  ShoppingBag,
  Search,
  Plus,
  DollarSign,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Building2,
  Pencil,
} from "lucide-react";
import { getSalesOrders, getCustomersForSale, updateSalesOrder } from "@/app/admin/crm/vendas/actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function VendasPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [session, setSession] = useState({ userName: "Administrador", userEmail: "", userId: "" });

  // Picker de cliente
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Edição de pedido
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editPayment, setEditPayment] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

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

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
    c.cpfCnpj?.includes(pickerSearch)
  );

  const handlePickCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setShowPicker(false);
    setPickerSearch("");
  };

  const openEdit = (order: any) => {
    setEditingOrder(order);
    setEditStatus(order.status);
    setEditPayment(order.paymentMethod || "PIX");
    setEditNotes(order.notes || "");
  };

  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    setSavingEdit(true);
    const res = await updateSalesOrder(editingOrder.id, {
      status: editStatus,
      paymentMethod: editPayment,
      notes: editNotes,
    });
    setSavingEdit(false);
    if (res.success) {
      toast.success("Pedido atualizado.");
      setEditingOrder(null);
      loadData();
    } else {
      toast.error(res.error || "Erro ao atualizar pedido.");
    }
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
          <Button className="gap-2" onClick={() => setShowPicker(true)}>
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
        <Card className="border-brand-border bg-brand-surface/10 overflow-hidden shadow-2xl">
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-brand-accent" />
                        <span className="text-xs font-bold text-white uppercase">{order.customer?.name || "—"}</span>
                      </div>
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
                      <button
                        onClick={() => openEdit(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-wider border border-brand-border text-brand-text-muted hover:text-brand-accent hover:border-brand-accent transition-all"
                      >
                        <Pencil size={11} /> Editar
                      </button>
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

      {/* Customer Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setShowPicker(false); setPickerSearch(""); }} />
          <div
            className="relative w-full animate-fade-in"
            style={{
              maxWidth: 520,
              maxHeight: "80vh",
              background: "#1A1A1A",
              border: "1px solid #333",
              borderTop: "3px solid #F5C400",
              borderRadius: 4,
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border shrink-0">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest font-rajdhani">SELECIONAR CLIENTE</h3>
                <p className="text-[10px] text-brand-text-muted mt-0.5">Escolha o cliente para registrar a venda</p>
              </div>
              <button onClick={() => { setShowPicker(false); setPickerSearch(""); }} className="text-brand-text-muted hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-brand-border shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={15} />
                <Input className="pl-9 h-10 text-sm" placeholder="Buscar por nome ou documento..." value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} autoFocus />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[10px] font-bold text-brand-text-muted uppercase">
                    {customers.length === 0 ? "Nenhum cliente cadastrado." : "Nenhum cliente encontrado."}
                  </p>
                </div>
              ) : filteredCustomers.map(c => (
                <button
                  key={c.id}
                  onClick={() => handlePickCustomer(c)}
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
                {filteredCustomers.length} cliente{filteredCustomers.length !== 1 ? "s" : ""} · <a href="/admin/crm/clientes" className="text-brand-accent hover:underline">Cadastrar novo cliente</a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sale Modal */}
      <SaleModal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
        sellerId={session.userId}
        onSuccess={() => { setSelectedCustomer(null); loadData(); }}
      />

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditingOrder(null)} />
          <div
            className="relative w-full animate-fade-in"
            style={{
              maxWidth: 480,
              background: "#1A1A1A",
              border: "1px solid #333",
              borderTop: "3px solid #F5C400",
              borderRadius: 4,
              boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
            }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest font-rajdhani">EDITAR PEDIDO</h3>
                <p className="text-[10px] text-brand-text-muted mt-0.5">{editingOrder.orderNumber} · {editingOrder.customer?.name}</p>
              </div>
              <button onClick={() => setEditingOrder(null)} className="text-brand-text-muted hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
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
                </select>
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

              <div className="flex gap-3 pt-2 border-t border-brand-border">
                <button
                  onClick={() => setEditingOrder(null)}
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
                  {savingEdit ? "Salvando..." : "★ Salvar Alterações"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
