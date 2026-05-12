"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { Users, Search, Filter, Plus, Mail, Phone, MapPin, ChevronRight, ShoppingBag, DollarSign, Save, Pencil, Trash2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getCustomers, createCustomer, getCustomerStats, updateCustomer, deleteCustomer } from "./actions";
import { CustomerProfile } from "@/components/crm/CustomerProfile";
import { maskCPF, maskCNPJ, maskPhone } from "@/lib/masks";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalCustomers: 0, totalSales: 0, retentionRate: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterState, setFilterState] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<any>(null);
  const [newCliente, setNewCliente] = useState({
    name: "",
    type: "B2C",
    document: "",
    email: "",
    phone: "",
    state: "",
    city: "",
    address: "",
    crNumber: "",
    category: "CAC",
    rg: "",
    birthDate: "",
    source: "",
    notes: "",
    fantasyName: "",
    stateRegistration: "",
    responsibleName: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const states = useMemo(() => {
    const s = new Set(clientes.map(c => c.state).filter(Boolean));
    return Array.from(s).sort();
  }, [clientes]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cData, sData] = await Promise.all([
        getCustomers(),
        getCustomerStats()
      ]);
      setClientes(cData);
      setStats(sData);
    } catch (error) {
      toast.error("Erro ao carregar dados dos clientes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredClientes = useMemo(() => {
    return clientes.filter(c => {
      const matchesSearch = !search || 
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.document?.includes(search) ||
        c.email?.toLowerCase().includes(search.toLowerCase());
      
      const matchesType = filterType === "ALL" || c.type === filterType;
      const matchesState = filterState === "ALL" || c.state === filterState;

      return matchesSearch && matchesType && matchesState;
    });
  }, [clientes, search, filterType, filterState]);

  const handleAddCliente = async () => {
    if (!newCliente.name || !newCliente.document) {
      toast.error("Por favor, preencha os campos obrigatórios.");
      return;
    }

    try {
      if (isEditing && editingId) {
        const res = await updateCustomer(editingId, newCliente);
        if (res.success) {
          toast.success("Cliente atualizado com sucesso!");
        } else {
          toast.error(res.error);
          return;
        }
      } else {
        const res = await createCustomer(newCliente);
        if (res.success) {
          toast.success("Cliente cadastrado com sucesso!");
        } else {
          toast.error(res.error || "Erro ao cadastrar cliente.");
          return;
        }
      }
      
      setIsModalOpen(false);
      setIsEditing(false);
      setEditingId(null);
      setNewCliente({ name: "", type: "B2C", document: "", email: "", phone: "", state: "", city: "", address: "", crNumber: "", category: "CAC", rg: "", birthDate: "", source: "", notes: "", fantasyName: "", stateRegistration: "", responsibleName: "" });
      loadData();
    } catch (error) {
      toast.error("Erro na comunicação com o servidor.");
    }
  };

  const handleEditClick = (cliente: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setNewCliente({
      name: cliente.name,
      type: cliente.type,
      document: cliente.document,
      email: cliente.email,
      phone: cliente.phone,
      state: cliente.state,
      city: cliente.city || "",
      address: cliente.address || "",
      crNumber: cliente.crNumber || "",
      category: cliente.category || "CAC",
      rg: cliente.rg || "",
      birthDate: cliente.birthDate ? new Date(cliente.birthDate).toISOString().split('T')[0] : "",
      source: cliente.source || "",
      notes: cliente.notes || "",
      fantasyName: cliente.fantasyName || "",
      stateRegistration: cliente.stateRegistration || "",
      responsibleName: cliente.responsibleName || ""
    });
    setEditingId(cliente.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Deseja realmente excluir o cliente ${name}?`)) {
      try {
        const res = await deleteCustomer(id);
        if (res.success) {
          toast.success("Cliente excluído com sucesso!");
          loadData();
        } else {
          toast.error(res.error);
        }
      } catch (error) {
        toast.error("Erro ao excluir cliente.");
      }
    }
  };

  return (
    <DashboardLayout role="ADMIN" userName="Admin Eleven" userEmail="admin@elevenfirearms.com.br">
      <div className="flex flex-col gap-8 animate-fade-in pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-accent/10 rounded border border-brand-accent/20 text-brand-accent shadow-[0_0_15px_rgba(245,196,0,0.1)]">
              <Users size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1 font-rajdhani uppercase text-white">GESTÃO DE CLIENTES</h1>
              <p className="text-brand-text-secondary text-sm font-medium uppercase tracking-wider text-[10px]">Base centralizada de compradores B2C e parceiros B2B.</p>
            </div>
          </div>
          <Button className="gap-2 shadow-[0_0_15px_rgba(245,196,0,0.1)]" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            CADASTRAR CLIENTE
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4">
            <div className="flex gap-4">
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={18} />
                 <Input 
                   className="pl-10 h-11" 
                   placeholder="Buscar por nome, CPF/CNPJ ou e-mail..." 
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                 />
               </div>
               <select 
                 className="h-11 bg-brand-surface border border-brand-border rounded-military px-4 text-xs font-bold text-white uppercase outline-none focus:border-brand-accent"
                 value={filterState}
                 onChange={(e) => setFilterState(e.target.value)}
               >
                 <option value="ALL">TODOS OS ESTADOS</option>
                 {states.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
            </div>

            <div className="flex gap-2">
               {["ALL", "B2B", "B2C"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={cn(
                      "px-4 py-2 rounded border text-[10px] font-black uppercase tracking-widest transition-all",
                      filterType === type 
                        ? "bg-brand-accent text-black border-brand-accent shadow-[0_0_15px_rgba(245,196,0,0.3)]" 
                        : "bg-brand-surface/40 text-brand-text-muted border-brand-border hover:border-brand-accent/50"
                    )}
                  >
                    {type === "ALL" ? "TODOS" : type}
                  </button>
               ))}
            </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="bg-brand-surface/30 border-brand-border">
              <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Total de Clientes</span>
              <p className="text-2xl font-bold mt-1 text-white">{stats.totalCustomers}</p>
           </Card>
           <Card className="bg-brand-surface/30 border-brand-border">
              <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Vendas Totais</span>
              <p className="text-2xl font-bold mt-1 text-brand-accent">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalSales)}
              </p>
           </Card>
           <Card className="bg-brand-surface/30 border-brand-border">
              <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Taxa de Retenção</span>
              <p className="text-2xl font-bold mt-1 text-brand-success">{stats.retentionRate.toFixed(1)}%</p>
           </Card>
        </div>

        {/* Table */}
        <Card className="p-0 border-brand-border bg-brand-surface/20 overflow-hidden">
           <table className="table-base">
              <thead>
                 <tr>
                    <th>Cliente / Tipo</th>
                    <th>Documento</th>
                    <th>Estado</th>
                    <th>Total Gasto</th>
                    <th>Último Pedido</th>
                    <th className="text-right">Ação</th>
                 </tr>
              </thead>
              <tbody>
                 {loading ? (
                    <tr>
                       <td colSpan={6} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                             <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
                             <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Sincronizando com o Banco...</span>
                          </div>
                       </td>
                    </tr>
                 ) : filteredClientes.length === 0 ? (
                    <tr>
                       <td colSpan={6} className="py-20 text-center">
                          <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Nenhum cliente encontrado.</span>
                       </td>
                    </tr>
                 ) : (
                    filteredClientes.map((cliente) => (
                       <tr 
                         key={cliente.id} 
                         className="group cursor-pointer hover:bg-brand-accent/5 transition-colors"
                         onClick={() => setViewingCustomer(cliente)}
                       >
                          <td>
                             <div className="flex flex-col">
                                <span className="text-sm font-bold text-white group-hover:text-brand-accent transition-colors">{cliente.name}</span>
                                <div className="flex items-center gap-2 mt-1">
                                   <span className={cn(
                                      "text-[9px] font-bold px-1.5 py-0.5 rounded border tracking-tighter",
                                      cliente.type === "B2B" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-brand-success/10 text-brand-success border-brand-success/20"
                                   )}>
                                      {cliente.type}
                                   </span>
                                   {cliente.badge && cliente.badge !== "STANDARD" && (
                                     <span className={cn(
                                       "text-[9px] font-black px-1.5 py-0.5 rounded border tracking-widest",
                                       cliente.badge === "VIP" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : "bg-slate-300/10 text-slate-300 border-slate-300/20"
                                     )}>
                                       {cliente.badge}
                                     </span>
                                   )}
                                   <span className="text-[10px] text-brand-text-muted">{cliente.email}</span>
                                </div>
                             </div>
                          </td>
                          <td className="text-xs font-mono text-brand-text-secondary">{cliente.document}</td>
                          <td>
                             <div className="flex items-center gap-1.5 text-xs text-brand-text-secondary uppercase font-bold">
                                <MapPin size={12} className="text-brand-accent" /> {cliente.state}
                             </div>
                          </td>
                          <td className="font-mono text-sm font-bold text-white">
                             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cliente.totalSpent)}
                          </td>
                          <td className="text-xs text-brand-text-muted font-bold">{cliente.lastOrder}</td>
                          <td className="pr-6 text-right">
                             <div className="flex justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="p-2 h-auto hover:bg-brand-accent/10 hover:text-brand-accent transition-all text-brand-text-muted"
                                  onClick={(e) => handleEditClick(cliente, e)}
                                >
                                   <Pencil size={16} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="p-2 h-auto hover:bg-brand-danger/10 hover:text-brand-danger transition-all text-brand-text-muted"
                                  onClick={(e) => handleDeleteClick(cliente.id, cliente.name, e)}
                                >
                                   <Trash2 size={16} />
                                </Button>
                                <Button variant="ghost" size="sm" className="p-2 h-auto hover:bg-brand-accent/10 hover:text-brand-accent transition-all">
                                   <ChevronRight size={18} />
                                </Button>
                             </div>
                          </td>
                       </tr>
                    ))
                 )}
              </tbody>
           </table>
           <div className="p-4 border-t border-brand-border bg-brand-bg/40 flex justify-between items-center">
              <span className="text-[10px] font-bold text-brand-text-muted uppercase">Mostrando {filteredClientes.length} registros</span>
              <div className="flex gap-1">
                 <Button variant="secondary" size="sm" className="h-8 px-3 text-[10px] opacity-50">ANTERIOR</Button>
                 <Button variant="secondary" size="sm" className="h-8 px-3 text-[10px]">PRÓXIMO</Button>
              </div>
           </div>
        </Card>
      </div>

      {/* Modal Cadastro/Edição Cliente */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsEditing(false);
          setNewCliente({ name: "", type: "B2C", document: "", email: "", phone: "", state: "", city: "", address: "", crNumber: "", category: "CAC", rg: "", birthDate: "", source: "", notes: "", fantasyName: "", stateRegistration: "", responsibleName: "" });
        }}
        title={isEditing ? "EDITAR CLIENTE" : "CADASTRAR NOVO CLIENTE"}
        className="max-w-4xl"
      >
         <div className="space-y-8 max-h-[80vh] overflow-y-auto pr-4 custom-scrollbar">
            {/* Seção 1: Dados Pessoais */}
            <div className="space-y-4">
               <h3 className="text-xs font-black text-brand-accent uppercase tracking-widest flex items-center gap-2">
                  <Users size={14} /> {newCliente.type === "B2B" ? "DADOS INSTITUCIONAIS / RAZÃO SOCIAL" : "DADOS PESSOAIS / IDENTIFICAÇÃO"}
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2">
                     <label className="text-[10px] font-bold uppercase text-brand-text-muted">{newCliente.type === "B2B" ? "Razão Social *" : "Nome Completo *"}</label>
                     <Input 
                       placeholder={newCliente.type === "B2B" ? "Ex: Clube de Tiro Eleven LTDA" : "Nome Completo"} 
                       value={newCliente.name}
                       onChange={(e) => setNewCliente({...newCliente, name: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase text-brand-text-muted">Tipo</label>
                     <select 
                       className="w-full bg-brand-input border border-brand-border rounded-military px-4 py-2 text-sm text-white outline-none focus:border-brand-accent"
                       value={newCliente.type}
                       onChange={(e) => setNewCliente({...newCliente, type: e.target.value as any})}
                     >
                        <option value="B2C">B2C (Pessoa Física)</option>
                        <option value="B2B">B2B (Empresa/Clube)</option>
                     </select>
                  </div>
                  
                  {newCliente.type === "B2B" && (
                    <>
                      <div className="space-y-2 md:col-span-2">
                         <label className="text-[10px] font-bold uppercase text-brand-text-muted">Nome Fantasia</label>
                         <Input 
                           placeholder="Como o clube é conhecido" 
                           value={newCliente.fantasyName}
                           onChange={(e) => setNewCliente({...newCliente, fantasyName: e.target.value})}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold uppercase text-brand-text-muted">Inscrição Estadual (IE)</label>
                         <Input 
                           placeholder="ISENTO ou número" 
                           value={newCliente.stateRegistration}
                           onChange={(e) => setNewCliente({...newCliente, stateRegistration: e.target.value})}
                         />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase text-brand-text-muted">{newCliente.type === "B2B" ? "CNPJ *" : "CPF *"}</label>
                     <Input 
                       placeholder={newCliente.type === "B2B" ? "00.000.000/0000-00" : "000.000.000-00"} 
                       value={newCliente.document}
                       onChange={(e) => {
                         const val = e.target.value;
                         setNewCliente({
                           ...newCliente, 
                           document: newCliente.type === "B2B" ? maskCNPJ(val) : maskCPF(val)
                         });
                       }}
                     />
                  </div>

                  {newCliente.type === "B2B" ? (
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase text-brand-text-muted">Responsável Legal</label>
                       <Input 
                         placeholder="Nome do Presidente/Dono" 
                         value={newCliente.responsibleName}
                         onChange={(e) => setNewCliente({...newCliente, responsibleName: e.target.value})}
                       />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold uppercase text-brand-text-muted">RG</label>
                         <Input 
                           placeholder="00.000.000-0" 
                           value={newCliente.rg}
                           onChange={(e) => setNewCliente({...newCliente, rg: e.target.value})}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold uppercase text-brand-text-muted">Data de Nascimento</label>
                         <Input 
                           type="date"
                           value={newCliente.birthDate}
                           onChange={(e) => setNewCliente({...newCliente, birthDate: e.target.value})}
                         />
                      </div>
                    </>
                  )}
               </div>
            </div>

            {/* Seção 2: Contato e Endereço */}
            <div className="space-y-4 pt-4 border-t border-brand-border/30">
               <h3 className="text-xs font-black text-brand-accent uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={14} /> CONTATO E LOCALIZAÇÃO
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase text-brand-text-muted">E-mail</label>
                     <Input 
                       placeholder="cliente@email.com" 
                       value={newCliente.email}
                       onChange={(e) => setNewCliente({...newCliente, email: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase text-brand-text-muted">Telefone</label>
                     <Input 
                       placeholder="(00) 00000-0000" 
                       value={newCliente.phone}
                       onChange={(e) => setNewCliente({...newCliente, phone: maskPhone(e.target.value)})}
                     />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                     <label className="text-[10px] font-bold uppercase text-brand-text-muted">Endereço Completo</label>
                     <Input 
                       placeholder="Rua, Número, Bairro..." 
                       value={newCliente.address}
                       onChange={(e) => setNewCliente({...newCliente, address: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase text-brand-text-muted">Cidade</label>
                     <Input 
                       placeholder="Ex: São Paulo" 
                       value={newCliente.city}
                       onChange={(e) => setNewCliente({...newCliente, city: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase text-brand-text-muted">Estado (UF)</label>
                     <Input 
                       placeholder="SP" 
                       value={newCliente.state}
                       onChange={(e) => setNewCliente({...newCliente, state: e.target.value})}
                     />
                  </div>
               </div>
            </div>

            {/* Seção 3: Conformidade Técnica (Armaria) */}
            <div className="space-y-4 pt-4 border-t border-brand-border/30">
               <h3 className="text-xs font-black text-brand-warning uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={14} /> CONFORMIDADE LEGAL (SIGMA/SINARM)
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase text-brand-text-muted">Número do CR (Certificado de Registro)</label>
                     <Input 
                       placeholder="Ex: 123456" 
                       value={newCliente.crNumber}
                       onChange={(e) => setNewCliente({...newCliente, crNumber: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase text-brand-text-muted">Categoria</label>
                     <select 
                       className="w-full bg-brand-input border border-brand-border rounded-military px-4 py-2 text-sm text-white outline-none focus:border-brand-accent"
                       value={newCliente.category}
                       onChange={(e) => setNewCliente({...newCliente, category: e.target.value})}
                     >
                        <option value="CAC">CAC (Caçador/Atirador/Colecionador)</option>
                        <option value="MILITAR">MILITAR / FORÇAS DE SEGURANÇA</option>
                        <option value="CIVIL">CIVIL / DEFESA PESSOAL</option>
                        <option value="JURIDICO">JURÍDICO / CLUBE DE TIRO</option>
                     </select>
                  </div>
               </div>
            </div>

            {/* Seção 4: Inteligência Comercial */}
            <div className="space-y-4 pt-4 border-t border-brand-border/30">
               <h3 className="text-xs font-black text-brand-text-muted uppercase tracking-widest flex items-center gap-2">
                  <ShoppingBag size={14} /> INTELIGÊNCIA COMERCIAL
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase text-brand-text-muted">Origem do Lead</label>
                     <Input 
                       placeholder="Ex: Instagram, Indicação..." 
                       value={newCliente.source}
                       onChange={(e) => setNewCliente({...newCliente, source: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2 col-span-2">
                     <label className="text-[10px] font-bold uppercase text-brand-text-muted">Observações Internas</label>
                     <textarea 
                       className="w-full bg-brand-input border border-brand-border rounded-military px-4 py-2 text-sm text-white outline-none focus:border-brand-accent min-h-[80px]"
                       placeholder="Preferências, histórico de contato, perfil de interesse..."
                       value={newCliente.notes}
                       onChange={(e) => setNewCliente({...newCliente, notes: e.target.value})}
                     />
                  </div>
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-brand-border">
               <Button variant="ghost" onClick={() => {
                 setIsModalOpen(false);
                 setIsEditing(false);
                 setNewCliente({ name: "", type: "B2C", document: "", email: "", phone: "", state: "", city: "", address: "", crNumber: "", category: "CAC", rg: "", birthDate: "", source: "", notes: "", fantasyName: "", stateRegistration: "", responsibleName: "" });
               }} className="text-[10px] font-bold tracking-widest uppercase">
                  CANCELAR
               </Button>
               <Button onClick={handleAddCliente} className="gap-2 text-[10px] font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(245,196,0,0.15)]">
                  <Save size={16} /> {isEditing ? "SALVAR ALTERAÇÕES" : "FINALIZAR CADASTRO"}
               </Button>
            </div>
         </div>
      </Dialog>

      <CustomerProfile 
        customer={viewingCustomer}
        isOpen={!!viewingCustomer}
        onClose={() => setViewingCustomer(null)}
      />
    </DashboardLayout>
  );
}

