"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { LeadForm, LeadFormData } from "@/components/crm/LeadForm";
import { Users, Plus, Filter, Search, GripVertical, Phone, Mail, MoreHorizontal, Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STAGES = [
  { id: "NOVO", label: "Novos Leads", color: "border-t-blue-500" },
  { id: "INTERESSADO", label: "Interessados", color: "border-t-indigo-500" },
  { id: "ATENDIMENTO", label: "Atendimento", color: "border-t-purple-500" },
  { id: "PROPOSTA", label: "Proposta", color: "border-t-brand-accent" },
  { id: "DOCUMENTO", label: "Documentação", color: "border-t-orange-500" },
  { id: "PAGAMENTO", label: "Pagamento", color: "border-t-brand-success" },
];

const INITIAL_LEADS = [
  { id: "l1", name: "Ricardo Oliveira", interest: "VR-12P Carrera", value: 17000, time: "2h atrás", priority: "high", status: "NOVO" },
  { id: "l2", name: "Clínica de Tiro Alfa", interest: "Canik Rival", value: 45000, time: "5h atrás", priority: "medium", status: "NOVO" },
  { id: "l3", name: "Marcos Pontes", interest: "Derya MK-12", value: 11500, time: "1d atrás", priority: "low", status: "NOVO" },
  { id: "l4", name: "João Pedro Silva", interest: "VR-12F", value: 8500, time: "2d atrás", priority: "medium", status: "INTERESSADO" },
  { id: "l5", name: "Security Corp", interest: "Lote B2B", value: 65500, time: "30 min atrás", priority: "high", status: "INTERESSADO" },
  { id: "l6", name: "Fernando Costa", interest: "Canik + VR12", value: 28500, time: "12h atrás", priority: "high", status: "PROPOSTA" },
];

import { LeadWorkspace } from "@/components/crm/LeadWorkspace";

export default function CRMFunnelPage() {
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => 
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.interest.toLowerCase().includes(search.toLowerCase())
    );
  }, [leads, search]);

  const leadsByStage = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    STAGES.forEach(s => grouped[s.id] = []);
    filteredLeads.forEach(l => {
      if (grouped[l.status]) grouped[l.status].push(l);
    });
    return grouped;
  }, [filteredLeads]);

  const handleAddLead = (data: LeadFormData) => {
    const newLead = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      time: "Agora",
    };
    setLeads([newLead, ...leads]);
    setIsAddModalOpen(false);
    toast.success("Lead adicionado com sucesso!");
  };

  const handleUpdateLead = (data: LeadFormData) => {
    setLeads(leads.map(l => l.id === editingLead.id ? { ...l, ...data } : l));
    // We don't close the modal automatically now if we are in the workspace
    // setEditingLead(null); 
    toast.success("Dados do lead atualizados!");
  };

  const handleMetas = () => {
    toast.success("Abrindo painel de metas comerciais.");
  };

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
              <p className="text-brand-text-secondary text-sm font-medium uppercase tracking-wider text-[10px]">Gestão de Pipeline Comercial · {filteredLeads.length} Leads Filtrados</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="secondary" 
              size="md" 
              className="gap-2 px-6 h-11 border-2"
              onClick={handleMetas}
            >
              <TrendingUp size={18} />
              METAS
            </Button>
            <Button 
              size="md" 
              className="gap-2 px-6 h-11 shadow-[0_0_20px_rgba(245,196,0,0.2)]"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={20} />
              ADICIONAR LEAD
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between shrink-0 bg-brand-surface/50 p-2 rounded-lg border border-brand-border">
          <div className="flex gap-4 items-center">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={14} />
               <Input 
                 className="pl-9 py-1.5 h-9 w-[250px] text-xs" 
                 placeholder="Buscar lead ou empresa..." 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
               />
             </div>
             <div className="h-4 w-px bg-brand-border" />
             <Button variant="ghost" size="sm" className="text-[10px] gap-2 h-8" onClick={() => toast.info("Abrindo filtros por vendedor...")}>
               <Filter size={14} /> FILTRAR POR VENDEDOR
             </Button>
          </div>
          <div className="flex gap-2">
             <span className="text-[10px] font-bold text-brand-text-muted uppercase self-center mr-2">Visualização:</span>
             <Button variant="primary" size="sm" className="h-8 px-3 text-[10px]" onClick={() => toast.success("Modo Kanban Ativo")}>KANBAN</Button>
             <Button variant="ghost" size="sm" className="h-8 px-3 text-[10px]" onClick={() => toast.info("Alternando para modo Lista...")}>LISTA</Button>
          </div>
        </div>

        {/* Funnel Container */}
        <div className="flex gap-4 overflow-x-auto pb-4 h-full scrollbar-thin scrollbar-thumb-brand-border/50">
          {STAGES.map((stage) => {
            const stageLeads = leadsByStage[stage.id] || [];
            const stageTotal = stageLeads.reduce((acc, l) => acc + l.value, 0);

            return (
              <div key={stage.id} className="flex-shrink-0 w-[300px] flex flex-col gap-3 h-full">
                {/* Stage Header */}
                <div className={cn(
                  "flex flex-col gap-1 px-3 py-2 border-t-2 bg-brand-surface/20 rounded-b-md border-x border-b border-brand-border/30",
                  stage.color
                )}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white">{stage.label}</h3>
                    <span className="bg-brand-input px-1.5 py-0.5 rounded text-[9px] font-mono text-brand-text-muted border border-brand-border">
                      {stageLeads.length}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-brand-accent/80 font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stageTotal)}
                  </p>
                </div>

                {/* Stage Body - Column */}
                <div className="flex-1 bg-brand-surface/10 rounded-xl p-2 border border-brand-border/20 flex flex-col gap-3 overflow-y-auto min-h-0 custom-scrollbar">
                  {stageLeads.map((lead) => (
                    <div 
                      key={lead.id} 
                      className="bg-brand-surface border border-brand-border p-3 rounded-lg shadow-sm hover:border-brand-accent/50 hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all cursor-pointer group border-l-2 border-l-brand-accent/30"
                      onClick={() => setEditingLead(lead)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={cn(
                          "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border tracking-tighter",
                          lead.priority === "high" ? "bg-brand-danger/10 text-brand-danger border-brand-danger/20" :
                          lead.priority === "medium" ? "bg-brand-warning/10 text-brand-warning border-brand-warning/20" :
                          "bg-brand-text-muted/10 text-brand-text-muted border-brand-border"
                        )}>
                          {lead.priority === "high" ? "URGENTE" : lead.priority === "medium" ? "MÉDIO" : "FRIO"}
                        </span>
                        <GripVertical size={14} className="text-brand-text-muted group-hover:text-brand-accent transition-colors" />
                      </div>

                      <h4 className="text-sm font-bold mb-1 leading-tight text-white group-hover:text-brand-accent transition-colors">{lead.name}</h4>
                      <div className="flex items-center gap-1.5 mb-3 text-brand-text-secondary">
                         <span className="text-[10px] font-bold uppercase truncate">{lead.interest}</span>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-brand-border/50">
                         <div className="flex gap-1">
                            <button className="p-1.5 bg-brand-input rounded-md hover:bg-brand-accent/20 transition-colors text-brand-text-muted hover:text-brand-accent border border-brand-border">
                              <Phone size={12} />
                            </button>
                            <button className="p-1.5 bg-brand-input rounded-md hover:bg-brand-accent/20 transition-colors text-brand-text-muted hover:text-brand-accent border border-brand-border">
                              <Mail size={12} />
                            </button>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-mono font-bold text-white leading-none mb-1">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(lead.value)}
                            </p>
                            <div className="flex items-center gap-1 justify-end text-brand-text-muted">
                               <Calendar size={10} />
                               <span className="text-[9px] uppercase font-bold">{lead.time}</span>
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
