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
  const [newCliente, setNewCliente] = useState<any>({ 
    name: "", 
    type: "B2B", 
    document: "", 
    email: "", 
    phone: "", 
    state: "", 
    city: "", 
    address: "", 
    crNumber: "", 
    category: "LOJA DE ARMAS", 
    rg: "", 
    birthDate: "", 
    source: "", 
    notes: "",
    fantasyName: "",
    stateRegistration: "",
    responsibleName: "",
    storeEmail: "",
    cep: "",
    addressNumber: "",
    addressComplement: "",
    neighborhood: "",
    crValidityDate: ""
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

  const handleCNPJLookup = async (cnpj: string) => {
    const cleanCNPJ = cnpj.replace(/\D/g, "");
    if (cleanCNPJ.length !== 14) {
      toast.error("CNPJ inválido para busca.");
      return;
    }

    toast.loading("Buscando dados do CNPJ...", { id: "cnpj-lookup" });
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
      if (!response.ok) throw new Error("CNPJ não encontrado.");
      const data = await response.json();
      
      setNewCliente((prev: any) => ({
        ...prev,
        name: data.razao_social,
        fantasyName: data.nome_fantasia || data.razao_social,
        cep: data.cep,
        address: data.logradouro,
        addressNumber: data.numero,
        addressComplement: data.complemento,
        neighborhood: data.bairro,
        city: data.municipio,
        state: data.uf,
        email: data.email || prev.email,
        phone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.slice(0,2)}) ${data.ddd_telefone_1.slice(2)}` : prev.phone
      }));
      toast.success("Dados preenchidos com sucesso!", { id: "cnpj-lookup" });
    } catch (error) {
      toast.error("Erro ao buscar CNPJ. Verifique o número ou preencha manualmente.", { id: "cnpj-lookup" });
    }
  };

  const handleAddCliente = async () => {
    if (!newCliente.name || !newCliente.document || !newCliente.phone || !newCliente.state) {
      toast.error("Por favor, preencha todos os campos obrigatórios (Nome, Documento, Telefone e UF).");
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
      setNewCliente({ name: "", type: "B2B", document: "", email: "", phone: "", state: "", city: "", address: "", crNumber: "", category: "LOJA DE ARMAS", rg: "", birthDate: "", source: "", notes: "", fantasyName: "", stateRegistration: "", responsibleName: "", storeEmail: "", cep: "", addressNumber: "", addressComplement: "", neighborhood: "", crValidityDate: "" });
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
      responsibleName: cliente.responsibleName || "",
      storeEmail: cliente.storeEmail || "",
      cep: cliente.cep || "",
      addressNumber: cliente.addressNumber || "",
      addressComplement: cliente.addressComplement || "",
      neighborhood: cliente.neighborhood || "",
      crValidityDate: cliente.crValidityDate ? new Date(cliente.crValidityDate).toISOString().split('T')[0] : ""
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
               <div className="px-4 py-2 rounded border text-[10px] font-black uppercase tracking-widest bg-brand-accent text-black border-brand-accent shadow-[0_0_15px_rgba(245,196,0,0.3)]">
                 PESSOA JURÍDICA (B2B)
               </div>
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
          setNewCliente({ name: "", type: "B2B", document: "", email: "", phone: "", state: "", city: "", address: "", crNumber: "", category: "LOJA DE ARMAS", rg: "", birthDate: "", source: "", notes: "", fantasyName: "", stateRegistration: "", responsibleName: "", storeEmail: "", cep: "", addressNumber: "", addressComplement: "", neighborhood: "", crValidityDate: "" });
        }}
        title={isEditing ? "EDITAR CLIENTE" : "CADASTRAR NOVO CLIENTE"}
        className="max-w-6xl"
      >
         <div className="space-y-8 max-h-[85vh] overflow-y-auto pr-4 custom-scrollbar">
            {/* Toggle B2B/B2C */}
            <div className="flex justify-center p-1 bg-brand-input rounded-xl border border-brand-border w-fit mx-auto mb-6">
               <button
                 className={cn(
                   "px-8 py-2.5 rounded-lg text-sm font-black transition-all",
                   newCliente.type === "B2B" ? "bg-brand-accent text-black shadow-lg" : "text-brand-text-muted hover:text-white"
                 )}
                 onClick={() => setNewCliente({...newCliente, type: "B2B", category: "LOJA DE ARMAS"})}
               >
                 B2B (LOJA / CLUBE)
               </button>
               <button
                 className={cn(
                   "px-8 py-2.5 rounded-lg text-sm font-black transition-all",
                   newCliente.type === "B2C" ? "bg-brand-accent text-black shadow-lg" : "text-brand-text-muted hover:text-white"
                 )}
                 onClick={() => setNewCliente({...newCliente, type: "B2C", category: "CAC"})}
               >
                 B2C (PESSOA FÍSICA)
               </button>
            </div>

            {/* Seção 1: Dados Pessoais */}
            <div className="space-y-6">
               <h3 className="text-sm font-black text-brand-accent uppercase tracking-widest flex items-center gap-2">
                  <Users size={16} /> {newCliente.type === "B2B" ? "DADOS INSTITUCIONAIS / RAZÃO SOCIAL" : "DADOS PESSOAIS / IDENTIFICAÇÃO"}
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 md:col-span-3">
                      <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">
                        {newCliente.type === "B2B" ? "Razão Social *" : "Nome Completo *"}
                      </label>
                      <Input 
                        className="h-12 text-base"
                        placeholder={newCliente.type === "B2B" ? "Ex: Clube de Tiro Eleven LTDA" : "Ex: João Silva"} 
                        value={newCliente.name}
                        onChange={(e) => setNewCliente({...newCliente, name: e.target.value})}
                      />
                  </div>
                  
                  {newCliente.type === "B2B" ? (
                    <>
                      <div className="space-y-2 md:col-span-2">
                          <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Nome Fantasia *</label>
                          <Input 
                            className="h-12 text-base"
                            placeholder="Como o clube é conhecido" 
                            value={newCliente.fantasyName}
                            onChange={(e) => setNewCliente({...newCliente, fantasyName: e.target.value})}
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Inscrição Estadual (IE)</label>
                          <Input 
                            className="h-12 text-base"
                            placeholder="ISENTO ou número" 
                            value={newCliente.stateRegistration}
                            onChange={(e) => setNewCliente({...newCliente, stateRegistration: e.target.value})}
                          />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">RG</label>
                          <Input 
                            className="h-12 text-base"
                            placeholder="0.000.000-0" 
                            value={newCliente.rg}
                            onChange={(e) => setNewCliente({...newCliente, rg: e.target.value})}
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Data de Nascimento</label>
                          <Input 
                            className="h-12 text-base"
                            type="date"
                            value={newCliente.birthDate}
                            onChange={(e) => setNewCliente({...newCliente, birthDate: e.target.value})}
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">CPF *</label>
                          <Input 
                            className="h-12 text-base"
                            placeholder="000.000.000-00" 
                            value={newCliente.document}
                            onChange={(e) => setNewCliente({...newCliente, document: maskCPF(e.target.value)})}
                          />
                      </div>
                    </>
                  )}

                  {newCliente.type === "B2B" && (
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">CNPJ *</label>
                       <div className="flex gap-2">
                          <Input 
                            className="h-12 text-base"
                            placeholder="00.000.000/0000-00" 
                            value={newCliente.document}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewCliente({
                                ...newCliente, 
                                document: maskCNPJ(val)
                              });
                            }}
                          />
                          <Button 
                            variant="secondary" 
                            className="h-12 px-4 shrink-0"
                            onClick={() => handleCNPJLookup(newCliente.document)}
                            title="Buscar dados via CNPJ"
                          >
                            <Search size={18} />
                          </Button>
                       </div>
                    </div>
                  )}

                  <div className="space-y-2">
                     <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Responsável Legal</label>
                     <Input 
                       className="h-12 text-base"
                       placeholder="Nome do Presidente/Dono" 
                       value={newCliente.responsibleName}
                       onChange={(e) => setNewCliente({...newCliente, responsibleName: e.target.value})}
                     />
                  </div>
               </div>
            </div>

            {/* Seção 2: Contato e Endereço */}
            <div className="space-y-6 pt-6 border-t border-brand-border/30">
               <h3 className="text-sm font-black text-brand-accent uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={16} /> CONTATO E LOCALIZAÇÃO
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">E-mail</label>
                     <Input 
                       className="h-12 text-base"
                       placeholder="cliente@email.com" 
                       value={newCliente.email}
                       onChange={(e) => setNewCliente({...newCliente, email: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Telefone</label>
                     <Input 
                       className="h-12 text-base"
                       placeholder="(00) 00000-0000" 
                       value={newCliente.phone}
                       onChange={(e) => setNewCliente({...newCliente, phone: maskPhone(e.target.value)})}
                     />
                  </div>
                  {newCliente.type === "B2B" && (
                    <div className="space-y-2 md:col-span-2">
                       <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">E-mail da Loja (Secundário)</label>
                       <Input 
                         className="h-12 text-base"
                         placeholder="loja@dominio.com.br" 
                         value={newCliente.storeEmail}
                         onChange={(e) => setNewCliente({...newCliente, storeEmail: e.target.value})}
                       />
                    </div>
                  )}
                  <div className="space-y-2 md:col-span-2">
                     <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">CEP</label>
                     <div className="flex gap-2">
                       <Input 
                         className="h-12 text-base max-w-[240px]"
                         placeholder="00000-000" 
                         value={newCliente.cep}
                         onChange={async (e) => {
                           const val = e.target.value.replace(/\D/g, '');
                           const formattedCep = val.replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
                           setNewCliente({...newCliente, cep: formattedCep});
                           if (val.length === 8) {
                             try {
                               const res = await fetch(`https://viacep.com.br/ws/${val}/json/`);
                               const data = await res.json();
                               if (!data.erro) {
                                 setNewCliente({
                                   ...newCliente,
                                   address: data.logradouro,
                                   neighborhood: data.bairro,
                                   city: data.localidade,
                                   state: data.uf
                                 });
                               }
                             } catch (err) {}
                           }
                         }}
                       />
                     </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                     <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Logradouro / Rua</label>
                     <Input 
                       className="h-12 text-base"
                       placeholder="Ex: Avenida Paulista" 
                       value={newCliente.address}
                       onChange={(e) => setNewCliente({...newCliente, address: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Número</label>
                     <Input 
                       className="h-12 text-base"
                       placeholder="Ex: 1000" 
                       value={newCliente.addressNumber}
                       onChange={(e) => setNewCliente({...newCliente, addressNumber: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Complemento</label>
                     <Input 
                       className="h-12 text-base"
                       placeholder="Ex: Sala 42" 
                       value={newCliente.addressComplement}
                       onChange={(e) => setNewCliente({...newCliente, addressComplement: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                     <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Bairro</label>
                     <Input 
                       className="h-12 text-base"
                       placeholder="Ex: Bela Vista" 
                       value={newCliente.neighborhood}
                       onChange={(e) => setNewCliente({...newCliente, neighborhood: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Cidade</label>
                     <Input 
                       className="h-12 text-base"
                       placeholder="Ex: São Paulo" 
                       value={newCliente.city}
                       onChange={(e) => setNewCliente({...newCliente, city: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Estado (UF)</label>
                     <Input 
                       className="h-12 text-base"
                       placeholder="SP" 
                       value={newCliente.state}
                       onChange={(e) => setNewCliente({...newCliente, state: e.target.value})}
                     />
                  </div>
               </div>
            </div>

            {/* Seção 3: Conformidade Técnica (Armaria) */}
            <div className="space-y-6 pt-6 border-t border-brand-border/30">
               <h3 className="text-sm font-black text-brand-warning uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={16} /> CONFORMIDADE LEGAL (SIGMA/SINARM)
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Número do CR (Certificado de Registro)</label>
                     <Input 
                       className="h-12 text-base"
                       placeholder="Ex: 123456" 
                       value={newCliente.crNumber}
                       onChange={(e) => setNewCliente({...newCliente, crNumber: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Validade do CR</label>
                     <Input 
                       className="h-12 text-base"
                       type="date"
                       value={newCliente.crValidityDate}
                       onChange={(e) => setNewCliente({...newCliente, crValidityDate: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                     <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Categoria do Cliente</label>
                     <select 
                       className="w-full bg-brand-input border border-brand-border rounded-military px-4 py-3 text-base text-white outline-none focus:border-brand-accent transition-all"
                       value={newCliente.category}
                       onChange={(e) => setNewCliente({...newCliente, category: e.target.value})}
                     >
                        {newCliente.type === "B2B" ? (
                           <>
                              <option value="LOJA DE ARMAS">LOJA DE ARMAS</option>
                              <option value="CLUBE DE TIRO">CLUBE DE TIRO</option>
                              <option value="INSTRUTOR">INSTRUTOR (PJ)</option>
                              <option value="OUTROS">OUTROS (PJ)</option>
                           </>
                        ) : (
                           <>
                              <option value="CAC">CAC (COLECIONADOR, ATIRADOR, CAÇADOR)</option>
                              <option value="POLICIAL">POLICIAL (FEDERAL/ESTADUAL)</option>
                              <option value="GM">GM (GUARDA MUNICIPAL)</option>
                              <option value="MILITAR">MILITAR (FORÇAS ARMADAS)</option>
                              <option value="CIVIL">CIVIL COM POSSE</option>
                              <option value="MAGISTRADO">MAGISTRADO / PROMOTOR</option>
                           </>
                        )}
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
                 setNewCliente({ name: "", type: "B2B", document: "", email: "", phone: "", state: "", city: "", address: "", crNumber: "", category: "LOJA DE ARMAS", rg: "", birthDate: "", source: "", notes: "", fantasyName: "", stateRegistration: "", responsibleName: "", storeEmail: "", cep: "", addressNumber: "", addressComplement: "", neighborhood: "", crValidityDate: "" });
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
        customer={clientes.find(c => c.id === viewingCustomer?.id) || viewingCustomer}
        isOpen={!!viewingCustomer}
        onClose={() => setViewingCustomer(null)}
        onRefresh={loadData}
      />
    </DashboardLayout>
  );
}

