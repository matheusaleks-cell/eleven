"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAdminSession } from "@/lib/hooks/use-session";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BarChart3, Download, FileText, PieChart, Shield, History, Users, ShoppingBag, Package, Ship, Target, UserCheck, TrendingUp, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getInventoryReportData,
  getFinancialReportData,
  getWeaponsMapReportData,
  getLotTraceabilityData,
  getInventoryConferenceData,
  getSellerPerformanceData,
  getDefaultersData,
  getReinvestmentProjectionData,
  getMovementHistoryData,
  getAccessLogsData,
} from "./actions";

const REPORT_CATEGORIES = [
  { 
    id: "operacional",
    title: "OPERACIONAL & ESTOQUE", 
    icon: <Package size={24} />,
    color: "text-blue-500",
    reports: [
      { name: "Posição de Estoque (SKU)", icon: <Package size={16} />, format: ["PDF", "CSV"] },
      { name: "Mapa de Armas Completo", icon: <Target size={16} />, format: ["PDF", "CSV"] },
      { name: "Rastreabilidade por Lote", icon: <Ship size={16} />, format: ["PDF"] },
      { name: "Inventário de Conferência", icon: <FileText size={16} />, format: ["CSV"] },
    ]
  },
  { 
    id: "financeiro",
    title: "FINANCEIRO & VENDAS", 
    icon: <TrendingUp size={24} />,
    color: "text-brand-accent",
    reports: [
      { name: "DRE por Período", icon: <BarChart3 size={16} />, format: ["PDF"] },
      { name: "Distribuição de Lucros", icon: <CreditCard size={16} />, format: ["PDF", "CSV"] },
      { name: "Performance por Vendedor", icon: <Users size={16} />, format: ["CSV"] },
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
      { name: "Projeção de Reinvestimento", icon: <TrendingUp size={16} />, format: ["CSV"] },
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
      { name: "Histórico de Movimentações", icon: <History size={16} />, format: ["PDF", "CSV"] },
      { name: "Alterações de Preço/Impostos", icon: <UserCheck size={16} />, format: ["PDF"] },
    ]
  }
];

function downloadCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    toast.error("Nenhum dado encontrado para exportar.");
    return;
  }
  
  const headers = Object.keys(data[0]).join(";");
  const rows = data.map(obj => 
    Object.values(obj).map(val => `"${String(val).replace(/"/g, '""')}"`).join(";")
  );
  
  const csvContent = [headers, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function ReportsPage() {
  const session = useAdminSession();
  const handleExport = async (reportName: string, format: string) => {
    if (format === "PDF") {
      toast.success(`Preparando impressão de "${reportName}"...`);
      setTimeout(() => window.print(), 800);
      return;
    }

    toast.loading(`Gerando CSV de "${reportName}"...`, { id: "export" });

    try {
      let data: any[] = [];

      if (reportName.includes("Posição de Estoque")) {
        const res = await getInventoryReportData();
        if (res.success) data = res.data;
      } else if (reportName.includes("Mapa de Armas")) {
        const res = await getWeaponsMapReportData();
        if (res.success) data = res.data;
      } else if (reportName.includes("DRE por Período") || reportName.includes("Distribuição de Lucros")) {
        const res = await getFinancialReportData();
        if (res.success) data = res.data;
      } else if (reportName.includes("Rastreabilidade por Lote")) {
        const res = await getLotTraceabilityData();
        if (res.success) data = res.data;
      } else if (reportName.includes("Inventário de Conferência")) {
        const res = await getInventoryConferenceData();
        if (res.success) data = res.data;
      } else if (reportName.includes("Performance por Vendedor")) {
        const res = await getSellerPerformanceData();
        if (res.success) data = res.data;
      } else if (reportName.includes("Inadimplência")) {
        const res = await getDefaultersData();
        if (res.success) data = res.data;
      } else if (reportName.includes("Extrato de Cotas")) {
        const res = await getFinancialReportData();
        if (res.success) data = res.data;
      } else if (reportName.includes("Projeção de Reinvestimento")) {
        const res = await getReinvestmentProjectionData();
        if (res.success) data = res.data;
      } else if (reportName.includes("Histórico de Movimentações")) {
        const res = await getMovementHistoryData();
        if (res.success) data = res.data;
      } else if (reportName.includes("Logs de Acesso")) {
        const res = await getAccessLogsData();
        if (res.success) data = res.data;
      } else {
        toast.error("Este relatório será implementado em breve.", { id: "export" });
        return;
      }

      if (data.length > 0) {
        downloadCSV(data, reportName.replace(/[^a-z0-9]/gi, '_').toLowerCase());
        toast.success("Download concluído com sucesso!", { id: "export" });
      } else {
        toast.error("Não há dados para gerar este relatório.", { id: "export" });
      }
    } catch {
      toast.error("Erro ao gerar relatório.", { id: "export" });
    }
  };
  return (
    <DashboardLayout role="ADMIN" userName={session.userName} userEmail={session.userEmail}>
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
                          onClick={() => handleExport(report.name, fmt)}
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
