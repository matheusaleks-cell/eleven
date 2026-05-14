"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CreditCard, Download, Filter, Search, Calendar, ArrowUpRight, ArrowDownRight, Printer, Wallet, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/calculations";
import { getInvestorStatement } from "../actions";

export default function ExtratoPage() {
  const [session, setSession] = useState<any>(null);
  const [statement, setStatement] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = localStorage.getItem("eleven_session");
    if (s) {
      const parsed = JSON.parse(s);
      setSession(parsed);
      getInvestorStatement(parsed.email).then((res) => {
        if (res.success) setStatement(res.statement);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading || !session) {
    return (
      <DashboardLayout role="INVESTOR" userName="Investidor" userEmail="" pageTitle="Carregando...">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const totalEntradas = statement.filter(s => s.tipo === "ENTRADA").reduce((acc, curr) => acc + curr.valor, 0);
  const totalSaidas = statement.filter(s => s.tipo === "SAIDA").reduce((acc, curr) => acc + curr.valor, 0);
  const totalReinvest = statement.filter(s => s.tipo === "REINVEST").reduce((acc, curr) => acc + curr.valor, 0);
  const saldoAtual = statement.length > 0 ? statement[0].saldo : 0;

  return (
    <DashboardLayout role="INVESTOR" userName={session.name} userEmail={session.email}>
      <div className="flex flex-col gap-8 animate-fade-in pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-accent/10 rounded border border-brand-accent/20 text-brand-accent shadow-[0_0_15px_rgba(245,196,0,0.1)]">
              <CreditCard size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1 font-rajdhani uppercase text-white">EXTRATO DE MOVIMENTAÇÕES</h1>
              <p className="text-brand-text-secondary text-sm font-medium uppercase tracking-wider text-[10px]">Histórico financeiro detalhado de aportes, lucros e reinvestimentos.</p>
            </div>
          </div>
          <div className="flex gap-3">
             <Button variant="secondary" className="gap-2 text-[10px] font-black uppercase">
                <Printer size={16} /> IMPRIMIR
             </Button>
             <Button className="gap-2 text-[10px] font-black uppercase shadow-[0_0_15px_rgba(245,196,0,0.1)]">
                <Download size={16} /> EXPORTAR PDF
             </Button>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <Card className="bg-brand-surface/40 border-l-2 border-l-brand-accent">
              <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Patrimônio Líquido</span>
              <p className="text-2xl font-bold font-mono mt-1 text-white">{formatMoney(saldoAtual)}</p>
           </Card>
           <Card className="bg-brand-surface/40 border-l-2 border-l-brand-success">
              <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Total Rendimentos</span>
              <p className="text-2xl font-bold font-mono mt-1 text-brand-success">{formatMoney(totalEntradas)}</p>
           </Card>
           <Card className="bg-brand-surface/40 border-l-2 border-l-brand-warning">
              <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Total Reinvestido</span>
              <p className="text-2xl font-bold font-mono mt-1 text-brand-warning">{formatMoney(totalReinvest)}</p>
           </Card>
           <Card className="bg-brand-surface/40 border-l-2 border-l-brand-text-muted">
              <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Saques Realizados</span>
              <p className="text-2xl font-bold font-mono mt-1 text-brand-text-muted">{formatMoney(totalSaidas)}</p>
           </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-brand-surface/30 border border-brand-border rounded-xl">
           <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={16} />
                 <input className="w-full bg-brand-input border border-brand-border rounded-lg pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-brand-accent transition-all" placeholder="Filtrar por descrição..." />
              </div>
              <Button variant="secondary" size="sm" className="text-[10px] font-bold gap-2 h-9">
                 <Calendar size={14} /> ÚLTIMOS 30 DIAS
              </Button>
           </div>
           <Button variant="ghost" className="text-[10px] font-black uppercase text-brand-text-muted hover:text-white">
             <Filter size={14} className="mr-2" /> Filtros Avançados
           </Button>
        </div>

        {/* Statement Table */}
        <Card className="p-0 border-brand-border bg-brand-surface/20 overflow-hidden">
           <table className="table-base">
              <thead>
                 <tr className="bg-brand-bg/60">
                    <th className="w-32 uppercase text-[10px] tracking-widest">Data</th>
                    <th className="uppercase text-[10px] tracking-widest">Descrição da Operação</th>
                    <th className="uppercase text-[10px] tracking-widest text-center">Tipo</th>
                    <th className="text-right uppercase text-[10px] tracking-widest">Valor</th>
                    <th className="text-right uppercase text-[10px] tracking-widest">Saldo Acumulado</th>
                 </tr>
              </thead>
              <tbody>
                 {statement.map((mov) => (
                    <tr key={mov.id} className="hover:bg-brand-accent/5 transition-colors group">
                       <td className="text-xs font-mono font-bold text-brand-text-muted group-hover:text-white transition-colors">{mov.dataStr}</td>
                       <td>
                          <div className="flex flex-col">
                             <span className="text-sm font-bold text-white group-hover:text-brand-accent transition-colors uppercase tracking-tight">{mov.descricao}</span>
                             <span className="text-[9px] text-brand-text-muted uppercase font-black mt-0.5 tracking-widest">REF: {mov.id}</span>
                          </div>
                       </td>
                       <td className="text-center">
                          <div className={cn(
                             "inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-tighter",
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
                          {mov.tipo === "SAIDA" ? "-" : "+"} {formatMoney(mov.valor)}
                       </td>
                       <td className="text-right font-mono font-bold text-sm text-white">
                          {formatMoney(mov.saldo)}
                       </td>
                    </tr>
                 ))}
                 {statement.length === 0 && (
                    <tr>
                       <td colSpan={5} className="text-center py-20">
                          <div className="flex flex-col items-center gap-4">
                             <Wallet size={48} className="text-brand-text-muted opacity-20" />
                             <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-[0.3em]">Nenhuma movimentação registrada no período.</span>
                          </div>
                       </td>
                    </tr>
                 )}
              </tbody>
           </table>
           <div className="p-4 border-t border-brand-border bg-brand-bg/40 flex justify-center">
              <Button variant="ghost" size="sm" className="text-[10px] uppercase font-black tracking-widest text-brand-text-muted hover:text-white">
                 Ver histórico completo de transações
              </Button>
           </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
