"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { CreditCard, TrendingUp, ArrowDownRight, ArrowUpRight, DollarSign, Wallet, FileText, CheckCircle2, History, Percent, LayoutDashboard, Save, AlertCircle, Ship, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect, useCallback } from "react";
import { getFinancialStats, getRecentTransactions } from "./actions";
import { MoneyDisplay } from "@/components/shared/MoneyDisplay";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const INITIAL_TRANSACTIONS = [
  { id: "TX-99812", type: "DISTRIB", investor: "Francisco I.", value: 12500, date: "Hoje, 14:20", status: "EFETUADO" },
  { id: "TX-99811", type: "VENDA", investor: "Lote 01", value: 8500, date: "Hoje, 11:05", status: "RECEBIDO" },
  { id: "TX-99810", type: "REINVEST", investor: "Francisco I.", value: 12500, date: "Ontem, 18:30", status: "EFETUADO" },
  { id: "TX-99809", type: "IMPOSTO", investor: "DRE Mensal", value: 4200, date: "Ontem, 10:15", status: "AGUARDANDO" },
];

export default function FinancialPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ custody: 0, distributed: 0, reinvestment: 0, taxes: 0, transitCapital: 0 });
  const [loading, setLoading] = useState(true);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [filter, setFilter] = useState({ type: "ALL", period: "JUN/2026" });
  const [splitRules, setSplitRules] = useState({
    investor: 50,
    company: 35,
    reserve: 10,
    reinvest: 5
  });

  const chartData = [
    { name: 'Jan', valor: 45000 },
    { name: 'Fev', valor: 52000 },
    { name: 'Mar', valor: 48000 },
    { name: 'Abr', valor: 61000 },
    { name: 'Mai', valor: 55000 },
    { name: 'Jun', valor: stats.custody || 0 },
  ];

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [sData, tData] = await Promise.all([
        getFinancialStats(),
        getRecentTransactions()
      ]);
      setStats(sData);
      setTransactions(tData);
    } catch (error) {
      toast.error("Erro ao carregar dados financeiros.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

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
             <Button className="gap-2 shadow-[0_0_15px_rgba(245,196,0,0.15)] text-[10px] font-bold" onClick={() => setIsClosingModalOpen(true)}>
               <DollarSign size={18} />
               FECHAMENTO MENSAL
             </Button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-brand-surface/20 border border-brand-border rounded-lg">
           <div className="flex items-center gap-2">
              <Filter size={14} className="text-brand-accent" />
              <span className="text-[10px] font-bold text-brand-text-muted uppercase">Filtros:</span>
           </div>
           <select 
             className="bg-brand-bg border border-brand-border rounded px-3 py-1.5 text-[10px] font-bold text-white outline-none focus:border-brand-accent transition-colors"
             value={filter.period}
             onChange={(e) => setFilter({...filter, period: e.target.value})}
           >
              <option>JUN/2026 (ATUAL)</option>
              <option>MAI/2026</option>
              <option>ABR/2026</option>
           </select>
           <select 
             className="bg-brand-bg border border-brand-border rounded px-3 py-1.5 text-[10px] font-bold text-white outline-none focus:border-brand-accent transition-colors"
             value={filter.type}
             onChange={(e) => setFilter({...filter, type: e.target.value})}
           >
              <option value="ALL">TODAS OPERAÇÕES</option>
              <option value="VENDA">VENDAS</option>
              <option value="DISTRIB">DISTRIBUIÇÕES</option>
              <option value="CUSTO">CUSTOS OPERACIONAIS</option>
           </select>
           
           <div className="ml-auto flex items-center gap-4">
              <div className="flex flex-col items-end">
                 <span className="text-[8px] font-bold text-brand-text-muted uppercase">Lucro Líquido no Período</span>
                 <MoneyDisplay value={stats.custody * 0.15} size="sm" colored />
              </div>
              <Button variant="ghost" className="h-8 text-[9px] font-bold gap-2" onClick={handleGenerateDRE}>
                 <FileText size={14} /> EXPORTAR PERÍODO
              </Button>
           </div>
        </div>

        {/* Financial Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-l-2 border-l-brand-accent bg-brand-surface/30">
             <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Saldo em Custódia</span>
                <Wallet size={16} className="text-brand-accent opacity-50" />
             </div>
             <MoneyDisplay value={stats.custody} size="lg" />
             <div className="flex items-center gap-1 mt-2 text-brand-success">
                <ArrowUpRight size={14} />
                <span className="text-[10px] font-bold uppercase">SALDO REAL</span>
             </div>
          </Card>
          <Card className="border-l-2 border-l-brand-primary bg-brand-surface/30">
             <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Capital em Trânsito</span>
                <Ship size={16} className="text-brand-primary opacity-50" />
             </div>
             <MoneyDisplay value={stats.transitCapital} size="lg" />
             <p className="text-[9px] text-brand-text-muted mt-2 uppercase font-bold tracking-wider">Estoque Internacional</p>
          </Card>
          <Card className="border-l-2 border-l-brand-success bg-brand-surface/30">
             <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Lucro Distribuído</span>
                <TrendingUp size={16} className="text-brand-success opacity-50" />
             </div>
             <MoneyDisplay value={stats.distributed} size="lg" />
             <p className="text-[9px] text-brand-text-muted mt-2 uppercase font-bold tracking-wider">Cálculo de Split (50%)</p>
          </Card>
          <Card className="border-l-2 border-l-brand-warning bg-brand-surface/30">
             <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Operacional Eleven</span>
                <History size={16} className="text-brand-warning opacity-50" />
             </div>
             <MoneyDisplay value={stats.reinvestment} size="lg" />
             <p className="text-[9px] text-brand-text-muted mt-2 uppercase font-bold tracking-wider">Custo Operacional (35%)</p>
          </Card>
          <Card className="border-l-2 border-l-brand-danger bg-brand-surface/30">
             <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Provisão Impostos</span>
                <Percent size={16} className="text-brand-danger opacity-50" />
             </div>
             <MoneyDisplay value={stats.taxes} size="lg" />
             <p className="text-[9px] text-brand-text-muted mt-2 uppercase font-bold tracking-wider">Estimativa (5%)</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 flex flex-col p-0 overflow-hidden border-brand-border bg-brand-surface/20">
             <div className="p-5 border-b border-brand-border flex items-center justify-between bg-brand-surface/40">
                <div className="flex flex-col">
                   <h3 className="font-bold font-rajdhani tracking-widest text-white uppercase text-sm">Evolução do Faturamento Mensal</h3>
                   <span className="text-[9px] text-brand-text-muted uppercase font-bold tracking-tighter">Dados consolidados de vendas pagas</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="flex items-center gap-1.5 px-2 py-1 bg-brand-accent/10 border border-brand-accent/20 rounded">
                      <div className="w-1.5 h-1.5 bg-brand-accent rounded-full shadow-[0_0_5px_rgba(245,196,0,0.5)]" />
                      <span className="text-[8px] font-black text-brand-accent uppercase">Realizado</span>
                   </div>
                </div>
             </div>
             <div className="flex-1 p-6 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F5C400" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#F5C400" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#606060" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#606060', fontWeight: 'bold' }}
                    />
                    <YAxis 
                      stroke="#606060" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `R$ ${value/1000}k`}
                      tick={{ fill: '#606060', fontWeight: 'bold' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#F5C400' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="valor" 
                      stroke="#F5C400" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
             <div className="p-4 bg-brand-surface/40 border-t border-brand-border flex justify-between items-center">
                <div className="flex gap-4">
                   <div className="flex flex-col">
                      <span className="text-[8px] text-brand-text-muted font-bold uppercase">Média Mensal</span>
                      <span className="text-xs font-bold text-white font-mono">R$ 52.600</span>
                   </div>
                   <div className="flex flex-col border-l border-brand-border pl-4">
                      <span className="text-[8px] text-brand-text-muted font-bold uppercase">Melhor Mês</span>
                      <span className="text-xs font-bold text-brand-success font-mono">Abril</span>
                   </div>
                </div>
                <Button variant="ghost" className="text-[10px] gap-2 tracking-widest font-bold uppercase hover:bg-brand-accent/10 hover:text-brand-accent" onClick={() => setIsSplitModalOpen(true)}>
                   <LayoutDashboard size={14} /> REGRAS DE DIVISÃO
                </Button>
             </div>
          </Card>

          {/* Recent Transactions */}
          <Card className="flex flex-col p-0 border-brand-border bg-brand-surface/20">
             <div className="p-5 border-b border-brand-border flex items-center justify-between bg-brand-surface/40">
                <h3 className="font-bold font-rajdhani tracking-widest text-white uppercase text-sm">Últimas Atividades</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-1 h-auto text-[10px] font-bold text-brand-accent underline uppercase"
                  onClick={() => setIsHistoryModalOpen(true)}
                >
                  Ver Histórico
                </Button>
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
                        <MoneyDisplay 
                          value={tx.value} 
                          size="sm" 
                          colored
                        />
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

      {/* Modal Histórico Completo */}
      <Dialog
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="HISTÓRICO FINANCEIRO DETALHADO"
        className="max-w-4xl"
      >
        <div className="space-y-4">
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="border-b border-brand-border bg-brand-bg/50">
                   <th className="p-4 text-[10px] font-black text-brand-text-muted uppercase tracking-widest">ID / Data</th>
                   <th className="p-4 text-[10px] font-black text-brand-text-muted uppercase tracking-widest">Operação</th>
                   <th className="p-4 text-[10px] font-black text-brand-text-muted uppercase tracking-widest">Descrição / Investidor</th>
                   <th className="p-4 text-[10px] font-black text-brand-text-muted uppercase tracking-widest text-right">Valor</th>
                   <th className="p-4 text-[10px] font-black text-brand-text-muted uppercase tracking-widest text-center">Status</th>
                 </tr>
               </thead>
               <tbody>
                 {transactions.map((tx) => (
                   <tr key={tx.id} className="border-b border-brand-border/30 hover:bg-white/5 transition-colors">
                     <td className="p-4">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-white font-mono">{tx.id}</span>
                           <span className="text-[9px] text-brand-text-muted font-bold">{tx.date}</span>
                        </div>
                     </td>
                     <td className="p-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black border",
                          tx.type === "DISTRIB" ? "bg-brand-danger/10 text-brand-danger border-brand-danger/20" : "bg-brand-success/10 text-brand-success border-brand-success/20"
                        )}>
                           {tx.type}
                        </span>
                     </td>
                     <td className="p-4 text-xs font-bold text-white uppercase">{tx.investor}</td>
                     <td className="p-4 text-right">
                        <MoneyDisplay value={tx.value} size="sm" colored />
                     </td>
                     <td className="p-4 text-center">
                        <span className="text-[9px] font-bold text-brand-text-muted uppercase">{tx.status}</span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           <div className="flex justify-end pt-4">
              <Button onClick={() => setIsHistoryModalOpen(false)} className="text-[10px] font-bold">FECHAR HISTÓRICO</Button>
           </div>
        </div>
      </Dialog>

      {/* Modal Fechamento Mensal */}
      <Dialog
        isOpen={isClosingModalOpen}
        onClose={() => setIsClosingModalOpen(false)}
        title="FECHAMENTO MENSAL OPERACIONAL"
        className="max-w-md"
      >
        <div className="space-y-6">
           <div className="p-4 bg-brand-warning/10 rounded border border-brand-warning/20 flex gap-4">
              <AlertCircle className="text-brand-warning shrink-0" size={24} />
              <div className="space-y-1">
                 <p className="text-xs font-bold text-brand-warning uppercase">Atenção ao Fechamento</p>
                 <p className="text-[10px] text-brand-text-secondary leading-tight uppercase font-medium">
                   O fechamento consolida todas as vendas, calcula o Split automático e provisiona os impostos. Esta ação não pode ser desfeita após a emissão do DRE.
                 </p>
              </div>
           </div>

           <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-brand-border">
                 <span className="text-[10px] font-bold text-brand-text-muted uppercase">Período de Referência</span>
                 <span className="text-xs font-bold text-white">JUNHO / 2026</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-brand-border">
                 <span className="text-[10px] font-bold text-brand-text-muted uppercase">Volume de Vendas (Total)</span>
                 <MoneyDisplay value={stats.custody} size="sm" />
              </div>
              <div className="flex justify-between items-center py-3 border-b border-brand-border">
                 <span className="text-[10px] font-bold text-brand-text-muted uppercase">Provisão de Impostos (Simulada)</span>
                 <MoneyDisplay value={stats.taxes} size="sm" colored />
              </div>
           </div>

           <div className="flex gap-3 pt-4">
              <Button variant="ghost" onClick={() => setIsClosingModalOpen(false)} className="flex-1 text-[10px] font-bold">CANCELAR</Button>
              <Button onClick={handleMonthlyClosing} className="flex-1 text-[10px] font-bold gap-2">
                 <CheckCircle2 size={16} /> CONFIRMAR FECHAMENTO
              </Button>
           </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}

