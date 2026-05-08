"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { CreditCard, TrendingUp, ArrowDownRight, ArrowUpRight, DollarSign, Wallet, FileText, CheckCircle2, History, Percent, LayoutDashboard, Save, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const INITIAL_TRANSACTIONS = [
  { id: "TX-99812", type: "DISTRIB", investor: "Francisco I.", value: 12500, date: "Hoje, 14:20", status: "EFETUADO" },
  { id: "TX-99811", type: "VENDA", investor: "Lote 01", value: 8500, date: "Hoje, 11:05", status: "RECEBIDO" },
  { id: "TX-99810", type: "REINVEST", investor: "Francisco I.", value: 12500, date: "Ontem, 18:30", status: "EFETUADO" },
  { id: "TX-99809", type: "IMPOSTO", investor: "DRE Mensal", value: 4200, date: "Ontem, 10:15", status: "AGUARDANDO" },
];

export default function FinancialPage() {
  const [transactions] = useState(INITIAL_TRANSACTIONS);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splitRules, setSplitRules] = useState({
    investor: 50,
    company: 35,
    reserve: 10,
    reinvest: 5
  });

  const handleMonthlyClosing = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 3000)),
      {
        loading: "Consolidando lançamentos e gerando guias de impostos...",
        success: "Fechamento Mensal realizado com sucesso!",
        error: "Erro ao processar fechamento.",
      }
    );
  };

  const handleGenerateDRE = () => {
    toast.info("Gerando Relatório DRE consolidado...", {
      description: "O PDF será aberto em uma nova aba assim que processado.",
    });
  };

  const handleSaveSplit = () => {
    const total = splitRules.investor + splitRules.company + splitRules.reserve + splitRules.reinvest;
    if (total !== 100) {
      toast.error(`A soma dos percentuais deve ser 100%. Atual: ${total}%`);
      return;
    }
    setIsSplitModalOpen(false);
    toast.success("Regras de distribuição atualizadas com sucesso!");
  };

  return (
    <DashboardLayout role="ADMIN" userName="Admin Eleven" userEmail="admin@elevenfirearms.com.br">
      <div className="flex flex-col gap-8 animate-fade-in pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-accent/10 rounded border border-brand-accent/20 text-brand-accent shadow-[0_0_15px_rgba(245,196,0,0.1)]">
              <CreditCard size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1 font-rajdhani uppercase text-white tracking-tighter">FINANCEIRO & DISTRIBUIÇÃO</h1>
              <p className="text-brand-text-secondary text-[10px] font-bold uppercase tracking-widest opacity-70 leading-none">Motor de Divisão de Lucros, Reinvestimentos e Fluxo de Caixa Central.</p>
            </div>
          </div>
          <div className="flex gap-3">
             <Button variant="secondary" className="gap-2 text-[10px] font-bold" onClick={() => setIsSplitModalOpen(true)}>
               REGRAS DE DISTRIBUIÇÃO
             </Button>
             <Button className="gap-2 shadow-[0_0_15px_rgba(245,196,0,0.15)] text-[10px] font-bold" onClick={handleMonthlyClosing}>
               <DollarSign size={18} />
               FECHAMENTO MENSAL
             </Button>
          </div>
        </div>

        {/* Financial Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-2 border-l-brand-accent bg-brand-surface/30">
             <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Saldo em Custódia</span>
                <Wallet size={16} className="text-brand-accent opacity-50" />
             </div>
             <p className="text-2xl font-bold font-mono text-white">R$ 1.240.500</p>
             <div className="flex items-center gap-1 mt-2 text-brand-success">
                <ArrowUpRight size={14} />
                <span className="text-[10px] font-bold uppercase">+12% ESTE MÊS</span>
             </div>
          </Card>
          <Card className="border-l-2 border-l-brand-success bg-brand-surface/30">
             <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Lucro Distribuído</span>
                <TrendingUp size={16} className="text-brand-success opacity-50" />
             </div>
             <p className="text-2xl font-bold font-mono text-white">R$ 485.200</p>
             <p className="text-[9px] text-brand-text-muted mt-2 uppercase font-bold tracking-wider">Últimos 12 meses</p>
          </Card>
          <Card className="border-l-2 border-l-brand-warning bg-brand-surface/30">
             <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Em Reinvestimento</span>
                <History size={16} className="text-brand-warning opacity-50" />
             </div>
             <p className="text-2xl font-bold font-mono text-white">R$ 620.000</p>
             <p className="text-[9px] text-brand-text-muted mt-2 uppercase font-bold tracking-wider">Crescimento de Capital</p>
          </Card>
          <Card className="border-l-2 border-l-brand-danger bg-brand-surface/30">
             <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Provisão Impostos</span>
                <Percent size={16} className="text-brand-danger opacity-50" />
             </div>
             <p className="text-2xl font-bold font-mono text-white">R$ 42.150</p>
             <p className="text-[9px] text-brand-text-muted mt-2 uppercase font-bold tracking-wider">Simples Nacional / ICMS-ST</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart / Distribution Rule */}
          <Card className="lg:col-span-2 flex flex-col p-0 overflow-hidden border-brand-border bg-brand-surface/20">
             <div className="p-5 border-b border-brand-border flex items-center justify-between bg-brand-surface/40">
                <h3 className="font-bold font-rajdhani tracking-widest text-white uppercase text-sm">Distribuição Automática por Venda (Split)</h3>
                <span className="bg-brand-success/10 text-brand-success text-[9px] font-bold px-2 py-1 rounded border border-brand-success/20 animate-pulse">SISTEMA OPERACIONAL</span>
             </div>
             <div className="p-8 flex flex-col md:flex-row items-center gap-10">
                {/* Visual Representation of Split */}
                <div className="relative w-48 h-48 flex items-center justify-center">
                   <div className="absolute inset-0 border-[12px] border-brand-accent rounded-full opacity-20" />
                   <div className="absolute inset-0 border-[12px] border-brand-accent rounded-full" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 50%)' }} />
                   <div className="flex flex-col items-center">
                      <span className="text-3xl font-bold font-mono text-white">{splitRules.investor}/{100 - splitRules.investor}</span>
                      <span className="text-[8px] font-bold text-brand-text-muted uppercase tracking-widest">Investidor / Eleven</span>
                   </div>
                </div>

                <div className="flex-1 space-y-4 w-full">
                   <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                         <span className="text-brand-accent flex items-center gap-2"><div className="w-2 h-2 bg-brand-accent rounded-full" /> Investidor</span>
                         <span className="text-white">{splitRules.investor}.00%</span>
                      </div>
                      <div className="w-full h-1.5 bg-brand-bg rounded-full overflow-hidden border border-brand-border">
                         <div className="h-full bg-brand-accent transition-all duration-1000" style={{ width: `${splitRules.investor}%` }} />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                         <span className="text-brand-success flex items-center gap-2"><div className="w-2 h-2 bg-brand-success rounded-full" /> Eleven (Operacional)</span>
                         <span className="text-white">{splitRules.company}.00%</span>
                      </div>
                      <div className="w-full h-1.5 bg-brand-bg rounded-full overflow-hidden border border-brand-border">
                         <div className="h-full bg-brand-success transition-all duration-1000" style={{ width: `${splitRules.company}%` }} />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                         <span className="text-brand-warning flex items-center gap-2"><div className="w-2 h-2 bg-brand-warning rounded-full" /> Reserva de Emergência</span>
                         <span className="text-white">{splitRules.reserve}.00%</span>
                      </div>
                      <div className="w-full h-1.5 bg-brand-bg rounded-full overflow-hidden border border-brand-border">
                         <div className="h-full bg-brand-warning transition-all duration-1000" style={{ width: `${splitRules.reserve}%` }} />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                         <span className="text-brand-danger flex items-center gap-2"><div className="w-2 h-2 bg-brand-danger rounded-full" /> Reinvestimento Lotes</span>
                         <span className="text-white">{splitRules.reinvest}.00%</span>
                      </div>
                      <div className="w-full h-1.5 bg-brand-bg rounded-full overflow-hidden border border-brand-border">
                         <div className="h-full bg-brand-danger transition-all duration-1000" style={{ width: `${splitRules.reinvest}%` }} />
                      </div>
                   </div>
                </div>
             </div>
             <div className="p-4 bg-brand-surface/40 border-t border-brand-border mt-auto">
                <Button variant="ghost" className="w-full text-[10px] gap-2 tracking-widest font-bold uppercase hover:bg-brand-accent/10 hover:text-brand-accent" onClick={() => setIsSplitModalOpen(true)}>
                   <LayoutDashboard size={14} /> CONFIGURAR REGRAS DO MOTOR
                </Button>
             </div>
          </Card>

          {/* Recent Transactions */}
          <Card className="flex flex-col p-0 border-brand-border bg-brand-surface/20">
             <div className="p-5 border-b border-brand-border flex items-center justify-between bg-brand-surface/40">
                <h3 className="font-bold font-rajdhani tracking-widest text-white uppercase text-sm">Últimas Atividades</h3>
                <Button variant="ghost" size="sm" className="p-1 h-auto text-[10px] font-bold text-brand-accent underline uppercase">Ver Histórico</Button>
             </div>
             <div className="p-2 space-y-1">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-brand-surface/40 transition-colors border border-transparent hover:border-brand-border group cursor-pointer">
                     <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center border",
                          tx.type === "DISTRIB" ? "bg-brand-danger/10 text-brand-danger border-brand-danger/20" : 
                          tx.type === "VENDA" ? "bg-brand-success/10 text-brand-success border-brand-success/20" : 
                          "bg-brand-accent/10 text-brand-accent border-brand-accent/20"
                        )}>
                          {tx.type === "DISTRIB" ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-xs font-bold uppercase text-white group-hover:text-brand-accent transition-colors">{tx.investor}</span>
                           <span className="text-[9px] text-brand-text-muted uppercase font-bold tracking-tighter">{tx.date}</span>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className={cn(
                          "text-xs font-bold font-mono",
                          tx.type === "DISTRIB" ? "text-brand-danger" : "text-brand-success"
                        )}>
                          {tx.type === "DISTRIB" ? "-" : "+"} R$ {tx.value.toLocaleString()}
                        </p>
                        <span className="text-[8px] font-bold text-brand-text-muted uppercase tracking-widest">{tx.status}</span>
                     </div>
                  </div>
                ))}
             </div>
             <div className="mt-auto p-4 border-t border-brand-border bg-brand-surface/40">
                <Button className="w-full text-[10px] gap-2 tracking-widest font-bold uppercase" onClick={handleGenerateDRE}>
                   <FileText size={14} /> EXPORTAR DRE MENSAL
                </Button>
             </div>
          </Card>
        </div>
      </div>

      {/* Modal Configuração de Split */}
      <Dialog
        isOpen={isSplitModalOpen}
        onClose={() => setIsSplitModalOpen(false)}
        title="MOTOR DE DISTRIBUIÇÃO AUTOMÁTICA"
        className="max-w-md"
      >
        <div className="space-y-6">
          <div className="p-4 bg-brand-accent/5 rounded border border-brand-accent/20 flex gap-3">
             <AlertCircle className="text-brand-accent shrink-0" size={20} />
             <p className="text-[10px] text-brand-text-secondary leading-tight uppercase font-bold">
               Ajuste os percentuais de divisão de lucro bruto. A soma deve ser exatamente 100% para manter a integridade fiscal.
             </p>
          </div>

          <div className="space-y-4">
             <div className="space-y-2">
                <div className="flex justify-between items-center">
                   <label className="text-[10px] font-bold uppercase text-brand-text-muted">Investidor Principal (%)</label>
                   <span className="text-xs font-mono font-bold text-brand-accent">{splitRules.investor}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" step="1"
                  className="w-full h-1.5 bg-brand-bg rounded-lg appearance-none cursor-pointer accent-brand-accent"
                  value={splitRules.investor}
                  onChange={(e) => setSplitRules({...splitRules, investor: parseInt(e.target.value)})}
                />
             </div>
             <div className="space-y-2">
                <div className="flex justify-between items-center">
                   <label className="text-[10px] font-bold uppercase text-brand-text-muted">Operacional Eleven (%)</label>
                   <span className="text-xs font-mono font-bold text-brand-success">{splitRules.company}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" step="1"
                  className="w-full h-1.5 bg-brand-bg rounded-lg appearance-none cursor-pointer accent-brand-success"
                  value={splitRules.company}
                  onChange={(e) => setSplitRules({...splitRules, company: parseInt(e.target.value)})}
                />
             </div>
             <div className="space-y-2">
                <div className="flex justify-between items-center">
                   <label className="text-[10px] font-bold uppercase text-brand-text-muted">Reserva Legal (%)</label>
                   <span className="text-xs font-mono font-bold text-brand-warning">{splitRules.reserve}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" step="1"
                  className="w-full h-1.5 bg-brand-bg rounded-lg appearance-none cursor-pointer accent-brand-warning"
                  value={splitRules.reserve}
                  onChange={(e) => setSplitRules({...splitRules, reserve: parseInt(e.target.value)})}
                />
             </div>
             <div className="space-y-2">
                <div className="flex justify-between items-center">
                   <label className="text-[10px] font-bold uppercase text-brand-text-muted">Reinvestimento (%)</label>
                   <span className="text-xs font-mono font-bold text-brand-danger">{splitRules.reinvest}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" step="1"
                  className="w-full h-1.5 bg-brand-bg rounded-lg appearance-none cursor-pointer accent-brand-danger"
                  value={splitRules.reinvest}
                  onChange={(e) => setSplitRules({...splitRules, reinvest: parseInt(e.target.value)})}
                />
             </div>
          </div>

          <div className="pt-4 border-t border-brand-border flex flex-col gap-2">
             <div className="flex justify-between text-xs font-bold uppercase">
                <span className="text-brand-text-muted">TOTAL CONSOLIDADO</span>
                <span className={cn(
                   "font-mono",
                   splitRules.investor + splitRules.company + splitRules.reserve + splitRules.reinvest === 100 ? "text-brand-success" : "text-brand-danger"
                )}>
                   {splitRules.investor + splitRules.company + splitRules.reserve + splitRules.reinvest}%
                </span>
             </div>
             <div className="flex justify-end gap-3 mt-2">
                <Button variant="ghost" onClick={() => setIsSplitModalOpen(false)} className="text-[10px] font-bold uppercase">DESCARTAR</Button>
                <Button className="gap-2 text-[10px] font-bold uppercase" onClick={handleSaveSplit}>
                   <Save size={14} /> SALVAR MOTOR
                </Button>
             </div>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}

