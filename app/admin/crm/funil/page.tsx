"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { LeadForm, LeadFormData } from "@/components/crm/LeadForm";
import { LeadWorkspace } from "@/components/crm/LeadWorkspace";
import { Search, Plus, Filter, GripVertical, ShoppingBag, Kanban, List as ListIcon, MoreHorizontal, Clock, ArrowRight, User as UserIcon, Building2, Phone, Mail, FileText, Trash2, Edit3, AlertCircle, Users, TrendingUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  getLeads, 
  createLead, 
  updateLead, 
  deleteLead 
} from "./actions";

const STAGES = [
  { id: "NOVO", label: "Novos Leads", color: "border-t-blue-500" },
  { id: "INTERESSADO", label: "Interessados", color: "border-t-indigo-500" },
  { id: "ATENDIMENTO", label: "Atendimento", color: "border-t-purple-500" },
  { id: "PROPOSTA", label: "Proposta", color: "border-t-brand-accent" },
  { id: "DOCUMENTO", label: "Documentação", color: "border-t-orange-500" },
  { id: "PAGAMENTO", label: "Pagamento", color: "border-t-brand-success" },
];

const INITIAL_LEADS = [
  { 
    id: "l1", 
    name: "Ricardo Oliveira", 
    email: "ricardo@oliveira.com",
    phone: "(11) 98888-7777",
    interest: "Vezir Arms Carrera VR-12P", 
    value: 8500, 
    time: "2h atrás", 
    priority: "high", 
    status: "NOVO",
    source: "INSTAGRAM",
    customerType: "CAC",
    documentStatus: "ACTIVE",
    category: "ARMAS",
    notes: "Interesse em kit completo com munição.",
    taxId: "123.456.789-00",
    state: "SP",
    city: "São Paulo",
    assignedTo: "RODRIGO"
  },
  { 
    id: "l2", 
    name: "Clínica de Tiro Alfa", 
    email: "contato@clinicaalfa.com",
    phone: "(41) 3030-4040",
    interest: "Canik TP9 SFx Rival", 
    value: 9200, 
    time: "5h atrás", 
    priority: "medium", 
    status: "NOVO",
    source: "SITE",
    customerType: "PJ",
    documentStatus: "ACTIVE",
    category: "B2B",
    notes: "Lote para instrução.",
    taxId: "12.345.678/0001-00",
    state: "PR",
    city: "Curitiba",
    assignedTo: "ADMIN"
  },
  { 
    id: "l3", 
    name: "Marcos Pontes", 
    email: "marcos@pontes.com",
    phone: "(21) 99765-4321",
    interest: "Derya MK-12 AS-250", 
    value: 11500, 
    time: "1d atrás", 
    priority: "low", 
    status: "NOVO",
    source: "INDICACAO",
    customerType: "PF",
    documentStatus: "NONE",
    category: "ARMAS",
    notes: "Iniciante, precisa de auxílio com CR.",
    taxId: "987.654.321-11",
    state: "RJ",
    city: "Niterói",
    assignedTo: "BEATRIZ"
  },
  { 
    id: "l4", 
    name: "João Pedro Silva", 
    email: "joao@pedro.com",
    phone: "(31) 98877-6655",
    interest: "Glock G17 Gen5", 
    value: 7800, 
    time: "2d atrás", 
    priority: "medium", 
    status: "INTERESSADO",
    source: "YOUTUBE",
    customerType: "CAC",
    documentStatus: "ACTIVE",
    category: "ARMAS",
    taxId: "444.555.666-77",
    state: "SP",
    city: "Campinas",
    assignedTo: "RODRIGO"
  },
  { 
    id: "l5", 
    name: "Security Corp", 
    email: "vendas@securitycorp.com",
    phone: "(61) 3333-4444",
    interest: "Sig Sauer P320 M17", 
    value: 10500, 
    time: "30 min atrás", 
    priority: "high", 
    status: "INTERESSADO",
    source: "EVENTO",
    customerType: "GOV",
    documentStatus: "ACTIVE",
    category: "B2B",
    taxId: "00.111.222/0001-33",
    state: "DF",
    city: "Brasília",
    assignedTo: "ADMIN"
  },
  { 
    id: "l6", 
    name: "Fernando Costa", 
    email: "fernando@costa.com",
    phone: "(51) 9988-7766",
    interest: "Taurus TS9 Graphene", 
    value: 5400, 
    time: "12h atrás", 
    priority: "high", 
    status: "PROPOSTA",
    source: "INSTAGRAM",
    customerType: "CAC",
    documentStatus: "ACTIVE",
    category: "ARMAS",
    taxId: "333.222.111-00",
    state: "RS",
    city: "Porto Alegre",
    assignedTo: "CARLOS"
  },
];



export default function CRMFunnelPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const refreshLeads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLeads();
      if (data.length === 0) {
        for (const initialLead of INITIAL_LEADS) {
          await createLead({
            ...initialLead,
            interests: initialLead.interest
          });
        }
        const seededData = await getLeads();
        setLeads(seededData);
      } else {
        setLeads(data);
      }
    } catch (error) {
      toast.error("Erro ao carregar leads do banco.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshLeads();
  }, [refreshLeads]);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const name = lead.name || "";
      const interest = Array.isArray(lead.interests) ? lead.interests.join(" ") : (lead.interests || "");
      
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) ||
                           interest.toLowerCase().includes(search.toLowerCase());
      
      const matchesPriority = priorityFilter === "ALL" || lead.priority === priorityFilter;
      const matchesSource = sourceFilter === "ALL" || lead.source === sourceFilter;
      
      return matchesSearch && matchesPriority && matchesSource;
    });
  }, [leads, search, priorityFilter, sourceFilter]);

  const leadsByStage = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    STAGES.forEach(stage => grouped[stage.id] = []);
    filteredLeads.forEach(lead => {
      if (grouped[lead.status]) {
        grouped[lead.status].push(lead);
      } else {
        grouped["NOVO"]?.push(lead);
      }
    });
    return grouped;
  }, [filteredLeads]);

  const handleAddLead = async (data: LeadFormData) => {
    try {
      await createLead({
        ...data,
        status: "NOVO",
        priority: "medium",
        value: 0
      });
      setIsAddModalOpen(false);
      toast.success("Lead adicionado com sucesso no banco!");
      refreshLeads();
    } catch (error) {
      toast.error("Erro ao salvar no banco.");
    }
  };

  const handleDeleteLead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar abrir o modal ao clicar em deletar
    if (!confirm("Tem certeza que deseja excluir este lead permanentemente?")) return;
    
    try {
      const res = await deleteLead(id);
      if (res.success) {
        toast.success("Lead excluído com sucesso.");
        refreshLeads();
      } else {
        toast.error("Erro ao excluir lead.");
      }
    } catch (error) {
      toast.error("Erro na operação de exclusão.");
    }
  };

  const handleUpdateLead = async (updatedLead: any) => {
    try {
      await updateLead(updatedLead.id, updatedLead);
      setEditingLead(null);
      toast.success("Dados salvos permanentemente!");
      refreshLeads();
    } catch (error) {
      toast.error("Erro ao atualizar no banco.");
    }
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    if (!leadId) return;

    try {
      await updateLead(leadId, { status: stageId });
      refreshLeads();
      toast.success(`Movido para ${STAGES.find(s => s.id === stageId)?.label}`);
    } catch (error) {
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleMetas = () => {
    toast.success("Abrindo painel de metas comerciais.");
  };

  const totalValue = filteredLeads.reduce((acc, l) => acc + (Number(l.value) || 0), 0);
  const avgTicket = filteredLeads.length > 0 ? totalValue / filteredLeads.length : 0;
  
  // Estimativa de conversão baseada em leads que chegaram em fases avançadas (PROPOSTA ou DOCUMENTO)
  const advancedLeads = filteredLeads.filter(l => l.status === "PROPOSTA" || l.status === "DOCUMENTO").length;
  const conversionEst = filteredLeads.length > 0 ? (advancedLeads / filteredLeads.length) * 100 : 0;

  return (
    <DashboardLayout role="ADMIN" userName="Admin Eleven" userEmail="admin@elevenfirearms.com.br">
      <div className="flex flex-col gap-6 h-[calc(100vh-120px)] animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-accent/10 rounded border border-brand-accent/20 text-brand-accent">
              <Users size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1 font-rajdhani uppercase text-white">FUNIL DE VENDAS (CRM)</h1>
              <div className="flex items-center gap-3">
                <p className="text-brand-text-secondary text-sm font-medium uppercase tracking-wider text-[10px]">Gestão de Pipeline Comercial · {filteredLeads.length} Leads</p>
                <span className="text-brand-border h-3 w-px" />
                <p className="text-brand-accent text-sm font-bold uppercase tracking-wider text-[10px]">
                  Ticket Médio: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(avgTicket)}
                </p>
                <span className="text-brand-border h-3 w-px" />
                <p className="text-brand-success text-sm font-bold uppercase tracking-wider text-[10px]">
                  Conversão Est.: {conversionEst.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="secondary" 
              size="md" 
              className="gap-2 px-6 h-11 border-2 font-rajdhani text-[11px] font-bold tracking-widest"
              onClick={handleMetas}
            >
              <TrendingUp size={18} />
              METAS
            </Button>
            <Button 
              size="md" 
              className="gap-2 px-6 h-11 shadow-[0_0_20px_rgba(245,196,0,0.2)] font-rajdhani text-[11px] font-bold tracking-widest"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={20} />
              ADICIONAR LEAD
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between shrink-0 bg-brand-surface/50 p-3 rounded-lg border border-brand-border">
          <div className="flex gap-4 items-center overflow-x-auto custom-scrollbar no-scrollbar py-1">
             <div className="relative shrink-0">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-accent/60" size={16} />
               <Input 
                 className="pl-10 py-2 h-10 w-[240px] text-[13px] bg-brand-input/40 border-brand-border/50 focus:border-brand-accent/50 transition-all" 
                 placeholder="Buscar por nome ou produto..." 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
               />
             </div>
             
             <div className="h-6 w-px bg-brand-border/50 shrink-0" />
             
             <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-tighter">Prioridade:</span>
                <select 
                  className="bg-brand-input/60 border border-brand-border/50 rounded h-10 px-3 text-[11px] font-black uppercase text-white outline-none focus:border-brand-accent/50 transition-all cursor-pointer min-w-[100px]"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="ALL">TODAS</option>
                  <option value="high" className="text-brand-danger">🔥 HOT (ALTA)</option>
                  <option value="medium" className="text-brand-warning">⚡ WARM (MÉDIA)</option>
                  <option value="low" className="text-brand-text-muted">❄️ COLD (BAIXA)</option>
                </select>
             </div>

             <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-tighter">Origem:</span>
                <select 
                  className="bg-brand-input/60 border border-brand-border/50 rounded h-10 px-3 text-[11px] font-black uppercase text-white outline-none focus:border-brand-accent/50 transition-all cursor-pointer min-w-[120px]"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                >
                  <option value="ALL">TODAS ORIGENS</option>
                  <option value="INSTAGRAM">INSTAGRAM</option>
                  <option value="SITE">SITE</option>
                  <option value="YOUTUBE">YOUTUBE</option>
                  <option value="EVENTO">EVENTO</option>
                  <option value="INDICACAO">INDICAÇÃO</option>
                </select>
             </div>

             <div className="h-6 w-px bg-brand-border/50 shrink-0" />

             <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "text-[11px] font-black gap-2 h-10 px-4 uppercase tracking-tighter hover:bg-brand-accent/10 hover:text-brand-accent",
                  (priorityFilter !== "ALL" || sourceFilter !== "ALL" || search !== "") ? "text-brand-accent bg-brand-accent/5" : "text-brand-text-muted"
                )}
                onClick={() => {
                  setSearch("");
                  setPriorityFilter("ALL");
                  setSourceFilter("ALL");
                  toast.success("Filtros limpos!");
                }}
             >
               <Filter size={14} /> LIMPAR FILTROS
             </Button>
          </div>
          <div className="flex gap-3">
             <span className="text-[12px] font-black text-brand-text-muted uppercase self-center mr-2">Visualização:</span>
             <Button 
              variant={viewMode === "kanban" ? "primary" : "ghost"} 
              size="sm" 
              className="h-10 px-5 text-[12px] font-black" 
              onClick={() => setViewMode("kanban")}
             >
               KANBAN
             </Button>
             <Button 
              variant={viewMode === "list" ? "primary" : "ghost"} 
              size="sm" 
              className="h-10 px-5 text-[12px] font-black" 
              onClick={() => setViewMode("list")}
             >
               LISTA
             </Button>
          </div>
        </div>

        {/* Dynamic Content: Kanban or List */}
        <div className="flex-1 overflow-hidden">
          {viewMode === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-4 h-full scrollbar-thin scrollbar-thumb-brand-border/50">
          {STAGES.map((stage) => {
            const stageLeads = leadsByStage[stage.id] || [];
            const stageTotal = stageLeads.reduce((acc, l) => acc + l.value, 0);

            return (
              <div 
                key={stage.id} 
                className="flex-shrink-0 w-[310px] flex flex-col gap-4 h-full"
                onDragOver={handleDragOver}
                onDrop={(e) => onDrop(e, stage.id)}
              >
                {/* Stage Header */}
                <div className={cn(
                  "flex flex-col gap-2 px-4 py-3 border-t-2 bg-brand-surface/20 rounded-b-md border-x border-b border-brand-border/30",
                  stage.color
                )}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-black uppercase tracking-[0.25em] text-white">{stage.label}</h3>
                    <span className="bg-brand-input px-2.5 py-1 rounded text-[12px] font-black text-brand-accent border border-brand-border">
                      {stageLeads.length}
                    </span>
                  </div>
                  <p className="text-[13px] font-mono text-brand-accent/90 font-black">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stageTotal)}
                  </p>
                </div>

                {/* Stage Body - Column */}
                  <div className="flex-1 bg-brand-surface/10 rounded-xl p-3 border border-brand-border/20 flex flex-col gap-4 overflow-y-auto min-h-0 custom-scrollbar">
                    {stageLeads.map((lead) => (
                      <div 
                        key={lead.id} 
                        className={cn(
                          "bg-brand-surface border border-brand-border/60 p-5 rounded-xl shadow-md hover:border-brand-accent hover:shadow-[0_8px_20px_rgba(245,196,0,0.1)] transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden",
                          lead.priority === "high" ? "border-l-4 border-l-brand-danger shadow-[0_0_25px_rgba(239,68,68,0.1)]" : "border-l-4 border-l-brand-accent/40"
                        )}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onClick={() => setEditingLead(lead)}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className={cn(
                            "text-[10px] font-black uppercase px-2.5 py-1 rounded border tracking-[0.15em] flex items-center gap-1.5",
                            lead.priority === "high" ? "bg-brand-danger text-white border-brand-danger animate-pulse" :
                            lead.priority === "medium" ? "bg-brand-warning/20 text-brand-warning border-brand-warning/40" :
                            "bg-brand-text-muted/20 text-brand-text-muted border-brand-border"
                          )}>
                            {lead.priority === "high" && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                            {lead.priority === "high" ? "URGENTE / HOT" : lead.priority === "medium" ? "WARM LEAD" : "COLD LEAD"}
                          </span>
                          <GripVertical size={18} className="text-brand-text-muted group-hover:text-brand-accent transition-colors" />
                        </div>

                      <h4 className="text-[17px] font-black mb-2 leading-tight text-white group-hover:text-brand-accent transition-colors uppercase tracking-tight">{lead.name}</h4>
                      <div className="flex items-center gap-2.5 mb-5 text-white/90">
                         <ShoppingBag size={15} className="text-brand-accent" />
                         <span className="text-[14px] font-black uppercase truncate tracking-wide">
                           {Array.isArray(lead.interests) ? lead.interests.join(", ") : (lead.interests || "Sem interesse")}
                         </span>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-brand-border/60">
                         <div className="flex gap-2.5">
                            <button className="p-2.5 bg-brand-input rounded-lg hover:bg-brand-accent/20 transition-colors text-brand-text-muted hover:text-brand-accent border border-brand-border">
                              <Phone size={15} />
                            </button>
                            <button className="p-2.5 bg-brand-input rounded-lg hover:bg-brand-accent/20 transition-colors text-brand-text-muted hover:text-brand-accent border border-brand-border">
                              <Mail size={15} />
                            </button>
                            <button 
                               className="p-2.5 bg-brand-input rounded-lg hover:bg-brand-danger/20 transition-colors text-brand-text-muted hover:text-brand-danger border border-brand-border"
                               onClick={(e) => handleDeleteLead(lead.id, e)}
                             >
                               <Trash2 size={15} />
                             </button>
                         </div>
                         <div className="text-right">
                            <p className="text-[18px] font-mono font-black text-brand-accent leading-none mb-2">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(lead.value)}
                            </p>
                            <div className="flex items-center gap-1.5 justify-end text-white/60">
                               <Calendar size={13} />
                               <span className="text-[12px] uppercase font-black tracking-tighter">{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('pt-BR') : "RECÉM-CRIADO"}</span>
                            </div>
                         </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    variant="ghost" 
                    className="w-full py-2 h-auto text-[10px] border border-dashed border-brand-border hover:border-brand-accent/50 hover:bg-brand-accent/5 gap-2 text-brand-text-muted"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    <Plus size={14} /> NOVO LEAD
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        ) : (
            <div className="flex-1 overflow-hidden pb-8">
              <Card className="h-full border-brand-border bg-brand-surface/20 overflow-hidden shadow-2xl flex flex-col rounded-xl">
                <div className="overflow-y-auto custom-scrollbar flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-20 bg-brand-surface border-b border-brand-border">
                      <tr>
                        <th className="px-8 py-6 text-[12px] font-black text-brand-text-muted uppercase tracking-[0.2em]">Lead / Empresa</th>
                        <th className="px-8 py-6 text-[12px] font-black text-brand-text-muted uppercase tracking-[0.2em]">Status Pipeline</th>
                        <th className="px-8 py-6 text-[12px] font-black text-brand-text-muted uppercase tracking-[0.2em]">Interesse Principal</th>
                        <th className="px-8 py-6 text-[12px] font-black text-brand-text-muted uppercase tracking-[0.2em]">Valor Est.</th>
                        <th className="px-8 py-6 text-[12px] font-black text-brand-text-muted uppercase tracking-[0.2em]">Prioridade</th>
                        <th className="px-8 py-6 text-[12px] font-black text-brand-text-muted uppercase tracking-[0.2em] text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/30">
                      {filteredLeads.map((lead) => (
                        <tr 
                          key={lead.id} 
                          className="hover:bg-brand-accent/5 transition-colors cursor-pointer group"
                          onClick={() => setEditingLead(lead)}
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-5">
                              <div className="w-12 h-12 bg-brand-input rounded-xl border border-brand-border flex items-center justify-center text-brand-accent font-black text-lg">
                                {lead.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-[17px] font-black text-white uppercase tracking-tight">{lead.name}</p>
                                <p className="text-[12px] text-brand-text-muted font-bold uppercase tracking-widest">{lead.city} - {lead.state}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "text-[11px] font-black px-4 py-1.5 rounded border uppercase tracking-wider",
                              STAGES.find(s => s.id === lead.status)?.color.replace('border-t-', 'text-')
                            )}>
                              {STAGES.find(s => s.id === lead.status)?.label}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <ShoppingBag size={16} className="text-brand-accent" />
                              <span className="text-[15px] font-black text-white/90 uppercase tracking-tight">{Array.isArray(lead.interests) ? lead.interests.join(", ") : (lead.interests || "Sem interesse")}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-[18px] font-mono font-black text-brand-accent">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value)}
                            </p>
                          </td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "text-[10px] font-black px-3 py-1.5 rounded border uppercase tracking-[0.15em] flex items-center gap-2 w-fit",
                              lead.priority === "high" ? "bg-brand-danger text-white border-brand-danger" :
                              lead.priority === "medium" ? "bg-brand-warning/20 text-brand-warning border-brand-warning/40" :
                              "bg-brand-text-muted/20 text-brand-text-muted border-brand-border"
                            )}>
                              {lead.priority === "high" && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                              {lead.priority === "high" ? "URGENTE" : lead.priority === "medium" ? "WARM" : "COLD"}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <div className="flex justify-end gap-2">
                               <Button variant="ghost" size="sm" className="h-11 px-6 text-[12px] font-black gap-3 hover:bg-brand-accent hover:text-black uppercase tracking-widest">
                                 DETALHES <ArrowRight size={16} />
                               </Button>
                               <Button 
                                 variant="ghost" 
                                 size="sm" 
                                 className="h-11 w-11 p-0 hover:bg-brand-danger hover:text-white"
                                 onClick={(e) => handleDeleteLead(lead.id, e)}
                               >
                                 <Trash2 size={16} />
                               </Button>
                             </div>
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <Dialog 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Cadastrar Novo Lead"
      >
        <LeadForm 
          onSubmit={handleAddLead} 
          onCancel={() => setIsAddModalOpen(false)} 
        />
      </Dialog>

      <Dialog 
        isOpen={!!editingLead} 
        onClose={() => setEditingLead(null)} 
        title="Área Comercial / Workspace do Lead"
        className="max-w-4xl"
      >
        <LeadWorkspace 
          key={editingLead?.id}
          lead={editingLead} 
          onUpdate={handleUpdateLead} 
          onClose={() => setEditingLead(null)} 
        />
      </Dialog>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
    </DashboardLayout>
  );
}
