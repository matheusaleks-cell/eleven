"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BarChart3, Download, FileText, PieChart, Shield, History, Users, ShoppingBag, Package, Ship, Target, UserCheck, TrendingUp, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const REPORT_CATEGORIES = [
  { 
    id: "operacional",
    title: "OPERACIONAL & ESTOQUE", 
    icon: <Package size={24} />,
    color: "text-blue-500",
    reports: [
      { name: "Posição de Estoque (SKU)", icon: <Package size={16} />, format: ["PDF", "EXCEL"] },
      { name: "Mapa de Armas Completo", icon: <Target size={16} />, format: ["PDF", "CSV"] },
      { name: "Rastreabilidade por Lote", icon: <Ship size={16} />, format: ["PDF"] },
      { name: "Inventário de Conferência", icon: <FileText size={16} />, format: ["EXCEL"] },
    ]
  },
  { 
    id: "financeiro",
    title: "FINANCEIRO & VENDAS", 
    icon: <TrendingUp size={24} />,
    color: "text-brand-accent",
    reports: [
      { name: "DRE por Período", icon: <BarChart3 size={16} />, format: ["PDF"] },
      { name: "Distribuição de Lucros", icon: <CreditCard size={16} />, format: ["PDF", "EXCEL"] },
      { name: "Performance por Vendedor", icon: <Users size={16} />, format: ["EXCEL"] },
      { name: "Inadimplência & Cobrança", icon: <FileText size={16} />, format: ["PDF"] },
    ]
  },
  { 
    id: "investidor",
    title: "ÁREA DO INVESTIDOR", 
    icon: <Users size={24} />,
    color: "text-brand-success",
    reports: [
      { name: "Extrato de Cotas", icon: <FileText size={16} />, format: ["PDF"] },
      { name: "Projeção de Reinvestimento", icon: <TrendingUp size={16} />, format: ["EXCEL"] },
      { name: "Documentos de Propriedade", icon: <Shield size={16} />, format: ["PDF"] },
    ]
  },
  { 
    id: "auditoria",
    title: "AUDITORIA & SEGURANÇA", 
    icon: <Shield size={24} />,
    color: "text-brand-danger",
    reports: [
      { name: "Logs de Acesso", icon: <History size={16} />, format: ["CSV"] },
      { name: "Histórico de Movimentações", icon: <History size={16} />, format: ["PDF", "EXCEL"] },
      { name: "Alterações de Preço/Impostos", icon: <UserCheck size={16} />, format: ["PDF"] },
    ]
  }
];

export default function ReportsPage() {
  return (
    <DashboardLayout role="ADMIN" userName="Admin Eleven" userEmail="admin@elevenfirearms.com.br">
      <div className="flex flex-col gap-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-accent/10 rounded border border-brand-accent/20 text-brand-accent shadow-[0_0_15px_rgba(245,196,0,0.1)]">
              <BarChart3 size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1 font-rajdhani uppercase text-white">CENTRO DE INTELIGÊNCIA & RELATÓRIOS</h1>
              <p className="text-brand-text-secondary text-sm font-medium uppercase tracking-wider text-[10px]">Geração de documentos técnicos, financeiros e de auditoria legal.</p>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-10">
          {REPORT_CATEGORIES.map((cat) => (
            <Card key={cat.id} className="p-0 border-brand-border bg-brand-surface/20 flex flex-col">
              <div className="p-5 border-b border-brand-border flex items-center justify-between bg-brand-bg/40">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg bg-brand-input border border-brand-border", cat.color)}>
                    {cat.icon}
                  </div>
                  <h3 className="font-bold font-rajdhani tracking-widest text-white">{cat.title}</h3>
                </div>
                <span className="text-[10px] font-bold text-brand-text-muted uppercase px-2 py-1 bg-brand-input rounded border border-brand-border">
                  {cat.reports.length} RELATÓRIOS
                </span>
              </div>

              <div className="p-2 flex flex-col">
                {cat.reports.map((report, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-brand-accent/5 transition-all group border border-transparent hover:border-brand-accent/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-brand-text-muted group-hover:text-brand-accent transition-colors">
                        {report.icon}
                      </div>
                      <span className="text-sm font-medium text-brand-text-secondary group-hover:text-white transition-colors">
                        {report.name}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {report.format.map((fmt) => (
                        <button 
                          key={fmt}
                          onClick={() => toast.success(`Gerando arquivo ${fmt} de "${report.name}"...`)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-input border border-brand-border text-[9px] font-bold text-brand-text-muted hover:text-brand-accent hover:border-brand-accent transition-all uppercase"
                        >
                          <Download size={10} />
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto p-4 border-t border-brand-border bg-brand-bg/20">
                 <Button 
                  variant="ghost" 
                  className="w-full text-[10px] py-1.5 h-auto text-brand-text-muted hover:text-white uppercase tracking-[0.2em] font-bold gap-2"
                  onClick={() => toast.info("Carregando biblioteca completa de modelos...")}
                 >
                   VER TODOS OS MODELOS <Download size={12} />
                 </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Automatic Scheduling */}
        <Card className="p-6 bg-brand-accent/5 border-dashed border-brand-accent/20 flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-accent/10 rounded-full text-brand-accent">
                <History size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Agendamento Automático</h4>
                <p className="text-xs text-brand-text-secondary mt-1">Configure o envio automático de relatórios para seu e-mail (Semanal/Mensal).</p>
              </div>
           </div>
           <Button variant="secondary" className="whitespace-nowrap border-brand-accent/40 text-brand-accent">
             CONFIGURAR AGENDAMENTOS
           </Button>
        </Card>
      </div>
    </DashboardLayout>
  );
}
