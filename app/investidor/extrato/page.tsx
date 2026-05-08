"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CreditCard, Download, Filter, Search, Calendar, ArrowUpRight, ArrowDownRight, Printer, Wallet, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const MOVIMENTACOES = [
  { id: "1", data: "08/05/2026", descricao: "Distribuição de Lucro - Lote 01 (Ciclo 2)", tipo: "ENTRADA", valor: 12500, saldo: 132700 },
  { id: "2", data: "15/04/2026", descricao: "Reinvestimento Automático - Lote 02", tipo: "REINVEST", valor: 8200, saldo: 120200 },
  { id: "3", data: "10/04/2026", descricao: "Aporte de Capital - Projeto Canik", tipo: "ENTRADA", valor: 45000, saldo: 112000 },
  { id: "4", data: "01/03/2026", descricao: "Taxa de Manutenção Administrativa", tipo: "SAIDA", valor: 150, saldo: 67000 },
  { id: "5", data: "12/02/2026", descricao: "Rendimento Parcial - Lote 01", tipo: "ENTRADA", valor: 4200, saldo: 67150 },
];

export default function ExtratoPage() {
  return (
    <DashboardLayout role="INVESTOR" userName="Francisco Investidor" userEmail="francisco@email.com">
      <div className="flex flex-col gap-8 animate-fade-in pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-accent/10 rounded border border-brand-accent/20 text-brand-accent">
              <CreditCard size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1 font-rajdhani uppercase text-white">EXTRATO DE MOVIMENTAÇÕES</h1>
              <p className="text-brand-text-secondary text-sm font-medium uppercase tracking-wider text-[10px]">Histórico financeiro detalhado de aportes, lucros e reinvestimentos.</p>
            </div>
          </div>
          <div className="flex gap-3">
             <Button variant="secondary" className="gap-2">
                <Printer size={18} /> IMPRIMIR
             </Button>
             <Button className="gap-2 shadow-[0_0_15px_rgba(245,196,0,0.1)]">
                <Download size={18} /> EXPORTAR PDF
             </Button>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <Card className="bg-brand-bg/40 border-l-2 border-l-brand-accent">
              <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Saldo Atual</span>
              <p className="text-2xl font-bold font-mono mt-1">R$ 132.700</p>
           </Card>
           <Card className="bg-brand-bg/40 border-l-2 border-l-brand-success">
              <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Total Entradas</span>
              <p className="text-2xl font-bold font-mono mt-1 text-brand-success">R$ 133.400</p>
           </Card>
           <Card className="bg-brand-bg/40 border-l-2 border-l-brand-danger">
              <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Total Saídas</span>
              <p className="text-2xl font-bold font-mono mt-1 text-brand-danger">R$ 700</p>
           </Card>
           <Card className="bg-brand-bg/40 border-l-2 border-l-brand-warning">
              <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Reinvestimentos</span>
              <p className="text-2xl font-bold font-mono mt-1 text-brand-warning">R$ 38.200</p>
           </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-brand-surface/50 border border-brand-border rounded-lg">
           <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={16} />
                 <input className="w-full bg-brand-input border border-brand-border rounded-md pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-brand-accent" placeholder="Filtrar por descrição..." />
              </div>
              <Button variant="ghost" size="sm" className="text-[10px] gap-2 border border-brand-border h-9">
                 <Calendar size={14} /> ÚLTIMOS 30 DIAS
              </Button>
           </div>
        </div>

        {/* Statement Table */}
        <Card className="p-0 border-brand-border bg-brand-surface/20 overflow-hidden">
           <table className="table-base">
              <thead>
                 <tr className="bg-brand-bg/60">
                    <th className="w-32">Data</th>
                    <th>Descrição da Operação</th>
                    <th>Tipo</th>
                    <th className="text-right">Valor (R$)</th>
                    <th className="text-right">Saldo (R$)</th>
                 </tr>
              </thead>
              <tbody>
                 {MOVIMENTACOES.map((mov) => (
                    <tr key={mov.id} className="hover:bg-brand-accent/5 transition-colors group">
                       <td className="text-xs font-mono font-bold text-brand-text-muted group-hover:text-white transition-colors">{mov.data}</td>
                       <td>
                          <div className="flex flex-col">
                             <span className="text-sm font-bold text-white group-hover:text-brand-accent transition-colors">{mov.descricao}</span>
                             <span className="text-[10px] text-brand-text-muted uppercase font-bold mt-0.5 tracking-tighter">ID Operação: #TX-00{mov.id}</span>
                          </div>
                       </td>
                       <td>
                          <div className={cn(
                             "inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest",
                             mov.tipo === "ENTRADA" ? "bg-brand-success/10 text-brand-success border-brand-success/20" : 
                             mov.tipo === "REINVEST" ? "bg-brand-warning/10 text-brand-warning border-brand-warning/20" :
                             "bg-brand-danger/10 text-brand-danger border-brand-danger/20"
                          )}>
                             {mov.tipo === "ENTRADA" ? <ArrowUpRight size={10} /> : mov.tipo === "SAIDA" ? <ArrowDownRight size={10} /> : <RefreshCw size={10} />}
                             {mov.tipo}
                          </div>
                       </td>
                       <td className={cn(
                          "text-right font-mono font-bold text-sm",
                          mov.tipo === "ENTRADA" ? "text-brand-success" : mov.tipo === "REINVEST" ? "text-brand-warning" : "text-brand-danger"
                       )}>
                          {mov.tipo === "SAIDA" ? "-" : "+"} R$ {mov.valor.toLocaleString()}
                       </td>
                       <td className="text-right font-mono font-bold text-sm text-white">
                          R$ {mov.saldo.toLocaleString()}
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
           <div className="p-4 border-t border-brand-border bg-brand-bg/40 flex justify-center">
              <Button variant="ghost" size="sm" className="text-[10px] uppercase font-bold tracking-widest text-brand-text-muted hover:text-white">
                 Carregar mais movimentações
              </Button>
           </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

import { RefreshCw } from "lucide-react";
