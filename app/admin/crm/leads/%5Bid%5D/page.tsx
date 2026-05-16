"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAdminSession } from "@/lib/hooks/use-session";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  History, 
  FileText, 
  UserCheck, 
  Trash2, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Target, 
  DollarSign,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  Plus
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function LeadDetailPage() {
  const session = useAdminSession();
  const lead = {
    name: "Ricardo Oliveira",
    status: "PROPOSTA",
    email: "ricardo.oliveira@email.com",
    phone: "(11) 98877-6655",
    origin: "E-commerce (Reserva)",
    city: "São Paulo",
    state: "SP",
    interest: ["Vezir Arms VR-12P", "Canik TP9 SFx"],
    value: 17700.00,
    created: "12/03/2026",
    seller: "Carlos Santos",
    notes: "Cliente muito interessado em 2 unidades para competição. Possui CR ativo e autorização de compra em andamento.",
  };

  return (
    <DashboardLayout role="ADMIN" userName={session.userName} userEmail={session.userEmail}>
      <div className="flex flex-col gap-8 animate-fade-in pb-12">
        
        {/* Header / Breadcrumb */}
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Link href="/admin/crm/funnel">
                 <Button variant="ghost" size="sm" className="p-2 h-auto text-brand-text-muted hover:text-white">
                    <ArrowLeft size={20} />
                 </Button>
              </Link>
              <div>
                 <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold tracking-tight font-rajdhani uppercase text-white">{lead.name}</h1>
                    <span className="bg-brand-accent/10 text-brand-accent text-[9px] font-bold px-2 py-0.5 rounded border border-brand-accent/20 tracking-widest">PROPOSTA ENVIADA</span>
                 </div>
                 <p className="text-brand-text-secondary text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                    Lead ID: #LD-2026-881 · Responsável: <span className="text-white">{lead.seller}</span>
                 </p>
              </div>
           </div>
           <div className="flex gap-2">
              <Button variant="secondary" className="gap-2">
                 CONVERTER EM CLIENTE
              </Button>
              <Button className="gap-2">
                 <UserCheck size={18} />
                 APROVAR VENDA
              </Button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Left: Main Info & History */}
           <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Profile Card */}
              <Card className="p-8 border-brand-border bg-brand-surface/20 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4">
                    <button className="text-brand-text-muted hover:text-white transition-colors">
                       <MoreVertical size={20} />
                    </button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="space-y-1">
                       <span className="text-[10px] text-brand-text-muted font-bold uppercase tracking-widest flex items-center gap-2">
                          <Mail size={12} /> E-mail
                       </span>
                       <p className="text-sm font-bold text-white">{lead.email}</p>
                    </div>
                    <div className="space-y-1">
                       <span className="text-[10px] text-brand-text-muted font-bold uppercase tracking-widest flex items-center gap-2">
                          <Phone size={12} /> Telefone
                       </span>
                       <p className="text-sm font-bold text-white">{lead.phone}</p>
                    </div>
                    <div className="space-y-1">
                       <span className="text-[10px] text-brand-text-muted font-bold uppercase tracking-widest flex items-center gap-2">
                          <MapPin size={12} /> Localização
                       </span>
                       <p className="text-sm font-bold text-white">{lead.city} - {lead.state}</p>
                    </div>
                    <div className="space-y-1">
                       <span className="text-[10px] text-brand-text-muted font-bold uppercase tracking-widest flex items-center gap-2">
                          <Calendar size={12} /> Cadastro
                       </span>
                       <p className="text-sm font-bold text-white">{lead.created}</p>
                    </div>
                    <div className="space-y-1">
                       <span className="text-[10px] text-brand-text-muted font-bold uppercase tracking-widest flex items-center gap-2">
                          <Target size={12} /> Origem
                       </span>
                       <p className="text-sm font-bold text-white">{lead.origin}</p>
                    </div>
                    <div className="space-y-1">
                       <span className="text-[10px] text-brand-text-muted font-bold uppercase tracking-widest flex items-center gap-2">
                          <DollarSign size={12} /> Valor Potencial
                       </span>
                       <p className="text-sm font-bold text-brand-accent font-mono">R$ {lead.value.toLocaleString()}</p>
                    </div>
                 </div>

                 <div className="mt-8 pt-8 border-t border-brand-border/50">
                    <span className="text-[10px] text-brand-text-muted font-bold uppercase tracking-widest mb-2 block">Interesse Comercial</span>
                    <div className="flex flex-wrap gap-2">
                       {lead.interest.map((item, i) => (
                         <span key={i} className="bg-brand-bg text-[10px] font-bold text-white px-3 py-1.5 rounded-md border border-brand-border uppercase tracking-wider">
                            {item}
                         </span>
                       ))}
                    </div>
                 </div>
              </Card>

              {/* Timeline / History */}
              <Card className="p-0 border-brand-border bg-brand-surface/20 overflow-hidden">
                 <div className="p-5 border-b border-brand-border bg-brand-bg/40 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                       <History size={16} className="text-brand-accent" /> HISTÓRICO DE ATIVIDADES
                    </h3>
                    <Button variant="ghost" size="sm" className="text-[10px] gap-2 h-8 text-brand-accent">
                       <Plus size={14} /> ADICIONAR NOTA
                    </Button>
                 </div>
                 <div className="p-6 space-y-8">
                    {[
                      { date: "Hoje, 10:30", user: "Carlos Santos", msg: "Enviado catálogo completo de acessórios via WhatsApp.", icon: <MessageSquare size={14} />, type: "msg" },
                      { date: "Ontem, 16:45", user: "Sistema", msg: "Status alterado de ATENDIMENTO para PROPOSTA.", icon: <History size={14} />, type: "status" },
                      { date: "13/03/2026, 09:12", user: "Carlos Santos", msg: "Ligação realizada. Cliente confirmou recebimento da cotação e enviará documentos amanhã.", icon: <Phone size={14} />, type: "call" },
                      { date: "12/03/2026, 14:22", user: "Sistema", msg: "Lead capturado via formulário Shop (VR-12P).", icon: <Target size={14} />, type: "capture" },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4 relative">
                         {i < 3 && <div className="absolute left-[7px] top-6 w-0.5 h-10 bg-brand-border" />}
                         <div className={cn(
                           "w-4 h-4 rounded-full mt-1 z-10 flex items-center justify-center text-[10px]",
                           item.type === "msg" ? "bg-brand-success text-brand-bg" : 
                           item.type === "status" ? "bg-brand-accent text-brand-bg" : 
                           "bg-brand-border text-brand-text-muted"
                         )}>
                            {item.icon}
                         </div>
                         <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                               <span className="text-[10px] font-bold text-white uppercase tracking-wider">{item.user}</span>
                               <span className="text-[9px] font-mono text-brand-text-muted uppercase">{item.date}</span>
                            </div>
                            <p className="text-sm text-brand-text-secondary">{item.msg}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </Card>
           </div>

           {/* Right: Actions & Documents */}
           <div className="flex flex-col gap-6">
              <Card className="p-6 border-brand-border bg-brand-bg/50">
                 <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent mb-6 flex items-center gap-2">
                    <CheckCircle2 size={16} /> PRÓXIMAS AÇÕES
                 </h3>
                 <div className="space-y-3">
                    <button className="w-full flex items-center justify-between p-3 rounded-lg border border-brand-border bg-brand-input hover:border-brand-accent transition-all group">
                       <div className="flex flex-col items-start">
                          <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">WhatsApp</span>
                          <span className="text-xs font-bold text-white uppercase group-hover:text-brand-accent">Enviar Mensagem</span>
                       </div>
                       <ChevronRight size={16} className="text-brand-text-muted" />
                    </button>
                    <button className="w-full flex items-center justify-between p-3 rounded-lg border border-brand-border bg-brand-input hover:border-brand-accent transition-all group">
                       <div className="flex flex-col items-start">
                          <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">E-mail</span>
                          <span className="text-xs font-bold text-white uppercase group-hover:text-brand-accent">Enviar Proposta PDF</span>
                       </div>
                       <ChevronRight size={16} className="text-brand-text-muted" />
                    </button>
                 </div>
              </Card>

              <Card className="p-6 border-brand-border bg-brand-bg/50">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent flex items-center gap-2">
                       <FileText size={16} /> DOCUMENTAÇÃO
                    </h3>
                    <Button variant="ghost" size="sm" className="p-1 h-auto text-[10px] text-brand-accent underline">UP-LOAD</Button>
                 </div>
                 <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded bg-brand-input/50 border border-brand-border">
                       <span className="text-[10px] font-bold text-brand-text-secondary uppercase">RG_RICARDO.PDF</span>
                       <CheckCircle2 size={14} className="text-brand-success" />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-brand-input/50 border border-brand-border opacity-50">
                       <span className="text-[10px] font-bold text-brand-text-muted uppercase">COMPR_RESID.PDF</span>
                       <Clock size={14} className="text-brand-warning" />
                    </div>
                 </div>
              </Card>

              <Card className="p-6 border-brand-danger/20 bg-brand-danger/[0.02] border-dashed">
                 <div className="flex flex-col items-center text-center gap-4">
                    <div>
                       <h4 className="text-xs font-bold text-brand-danger uppercase tracking-wider">Área de Risco</h4>
                       <p className="text-[10px] text-brand-text-muted mt-1 uppercase leading-tight">CUIDADO: ESTA AÇÃO NÃO PODE SER DESFEITA.</p>
                    </div>
                    <Button variant="danger" size="sm" className="w-full text-[10px] gap-2">
                       <Trash2 size={14} /> DESQUALIFICAR LEAD
                    </Button>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
