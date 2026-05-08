"use client";

import React, { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { Users, Search, Filter, Plus, Mail, Phone, MapPin, ChevronRight, ShoppingBag, DollarSign, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const INITIAL_CLIENTES = [
  { id: "1", name: "Clube de Tiro Sniper", type: "B2B", document: "12.345.678/0001-90", email: "contato@sniperclube.com.br", phone: "(11) 4004-0000", state: "SP", totalSpent: 145000, lastOrder: "02/03/2026" },
  { id: "2", name: "João Silva Santos", type: "B2C", document: "123.456.789-00", email: "joao.silva@email.com", phone: "(21) 99999-8888", state: "RJ", totalSpent: 12500, lastOrder: "15/02/2026" },
  { id: "3", name: "Delta Security Ltda", type: "B2B", document: "98.765.432/0001-10", email: "comercial@deltasec.com", phone: "(31) 3333-2222", state: "MG", totalSpent: 89000, lastOrder: "20/01/2026" },
];

export default function ClientesPage() {
  const [clientes, setClientes] = useState(INITIAL_CLIENTES);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCliente, setNewCliente] = useState({
    name: "",
    type: "B2C",
    document: "",
    email: "",
    phone: "",
    state: ""
  });

  const filteredClientes = useMemo(() => {
    return clientes.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.document.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [clientes, search]);

  const handleAddCliente = () => {
    if (!newCliente.name || !newCliente.document) {
      toast.error("Por favor, preencha os campos obrigatórios.");
      return;
    }

    const cliente = {
      id: Math.random().toString(36).substr(2, 9),
      ...newCliente,
      totalSpent: 0,
      lastOrder: "-"
    };

    setClientes([cliente as any, ...clientes]);
    setIsModalOpen(false);
    setNewCliente({ name: "", type: "B2C", document: "", email: "", phone: "", state: "" });
    toast.success("Cliente cadastrado com sucesso!");
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
           <Button variant="secondary" className="gap-2 h-11">
             <Filter size={16} /> FILTRAR
           </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="bg-brand-surface/30 border-brand-border">
              <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Total de Clientes</span>
              <p className="text-2xl font-bold mt-1 text-white">{clientes.length + 1281}</p>
           </Card>
           <Card className="bg-brand-surface/30 border-brand-border">
              <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Vendas B2B (Mês)</span>
              <p className="text-2xl font-bold mt-1 text-brand-accent">R$ 482.000</p>
           </Card>
           <Card className="bg-brand-surface/30 border-brand-border">
              <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Taxa de Retenção</span>
              <p className="text-2xl font-bold mt-1 text-brand-success">74%</p>
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
                 {filteredClientes.map((cliente) => (
                    <tr key={cliente.id} className="group cursor-pointer hover:bg-brand-accent/5 transition-colors">
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
                       <td className="font-mono text-sm font-bold text-white">R$ {cliente.totalSpent.toLocaleString()}</td>
                       <td className="text-xs text-brand-text-muted font-bold">{cliente.lastOrder}</td>
                       <td className="text-right">
                          <Button variant="ghost" size="sm" className="p-2 h-auto hover:bg-brand-accent/10 hover:text-brand-accent transition-all" onClick={() => toast.info(`Abrir perfil de ${cliente.name}`)}>
                             <ChevronRight size={18} />
                          </Button>
                       </td>
                    </tr>
                 ))}
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

      {/* Modal Cadastro Cliente */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="CADASTRAR NOVO CLIENTE"
        className="max-w-2xl"
      >
         <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-brand-text-muted">Nome / Razão Social *</label>
                  <Input 
                    placeholder="Nome Completo" 
                    value={newCliente.name}
                    onChange={(e) => setNewCliente({...newCliente, name: e.target.value})}
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-brand-text-muted">CPF / CNPJ *</label>
                  <Input 
                    placeholder="000.000.000-00" 
                    value={newCliente.document}
                    onChange={(e) => setNewCliente({...newCliente, document: e.target.value})}
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-brand-text-muted">Tipo de Cliente</label>
                  <select 
                    className="w-full bg-brand-input border border-brand-border rounded-military px-4 py-2 text-sm text-white outline-none focus:border-brand-accent"
                    value={newCliente.type}
                    onChange={(e) => setNewCliente({...newCliente, type: e.target.value as any})}
                  >
                     <option value="B2C">B2C (Pessoa Física)</option>
                     <option value="B2B">B2B (Empresa/Clube)</option>
                  </select>
               </div>
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
                    onChange={(e) => setNewCliente({...newCliente, phone: e.target.value})}
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

            <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
               <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-[10px] font-bold tracking-widest uppercase">
                  CANCELAR
               </Button>
               <Button onClick={handleAddCliente} className="gap-2 text-[10px] font-bold tracking-widest uppercase">
                  <Save size={16} /> FINALIZAR CADASTRO
               </Button>
            </div>
         </div>
      </Dialog>
    </DashboardLayout>
  );
}

