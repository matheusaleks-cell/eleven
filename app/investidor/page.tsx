"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TrendingUp, Wallet, ArrowUpRight, History, Package, ShieldCheck, Download, CreditCard, ChevronRight } from "lucide-react";
import { CapitalGrowthChart } from "@/components/charts/CapitalGrowthChart";
import { MoneyDisplay } from "@/components/shared/MoneyDisplay";
import { cn } from "@/lib/utils";

const MOCK_PROJECTS = [
  { id: "P1", name: "VR-12P · Francisco · Lote 01", invested: 63000, current: 84200, yield: 33.6, cycle: 2 },
  { id: "P2", name: "Canik TP9 · Francisco · Lote 02", invested: 45000, current: 48500, yield: 7.7, cycle: 1 },
];


export default function InvestorDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const s = localStorage.getItem("eleven_session");
      if (!s) {
        window.location.href = "/login";
        return;
      }
      const parsed = JSON.parse(s);
      setSession(parsed);
    } catch (e) {
      window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-brand-accent font-bold uppercase tracking-widest text-[10px] animate-pulse">Sincronizando Sessão...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <DashboardLayout role="INVESTOR" userName={session.name} userEmail={session.email}>
      <div className="flex flex-col gap-10 animate-fade-in pb-10 px-4 md:px-0">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 font-rajdhani uppercase">OLÁ, FRANCISCO</h1>
            <p className="text-brand-text-secondary text-sm font-medium uppercase tracking-[0.2em] flex items-center gap-2">
               <ShieldCheck size={14} className="text-brand-accent" /> INVESTIDOR CERTIFICADO · NÍVEL ELITE
            </p>
          </div>
          <div className="flex gap-3">
             <Button variant="secondary" className="gap-2">
               <History size={18} /> EXTRATO COMPLETO
             </Button>
             <Button className="gap-2 shadow-[0_0_15px_rgba(245,196,0,0.2)]">
               <Download size={18} /> RELATÓRIO ANUAL
             </Button>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card accent className="bg-brand-bg/60 backdrop-blur-sm border-brand-accent/20">
             <div className="flex justify-between items-start mb-4">
                <span className="text-[11px] font-bold text-brand-text-muted uppercase tracking-[0.2em]">Patrimônio Total</span>
                <Wallet className="text-brand-accent" size={20} />
             </div>
             <div className="flex flex-col">
                <span className="text-3xl font-bold font-mono text-white tracking-tighter">R$ 132.700,00</span>
                <div className="flex items-center gap-1.5 mt-2 text-brand-success">
                   <ArrowUpRight size={16} strokeWidth={3} />
                   <span className="text-xs font-bold uppercase tracking-wider">+R$ 24.700 (22.8%)</span>
                </div>
             </div>
          </Card>

          <Card className="bg-brand-bg/60 backdrop-blur-sm">
             <div className="flex justify-between items-start mb-4">
                <span className="text-[11px] font-bold text-brand-text-muted uppercase tracking-[0.2em]">Rendimento Acumulado</span>
                <TrendingUp className="text-brand-success" size={20} />
             </div>
             <div className="flex flex-col">
                <span className="text-3xl font-bold font-mono text-white tracking-tighter">R$ 24.700,00</span>
                <p className="text-[10px] text-brand-text-muted mt-2 uppercase font-bold tracking-widest">Baseado em 2 projetos ativos</p>
             </div>
          </Card>

          <Card className="bg-brand-bg/60 backdrop-blur-sm">
             <div className="flex justify-between items-start mb-4">
                <span className="text-[11px] font-bold text-brand-text-muted uppercase tracking-[0.2em]">Disponível p/ Saque</span>
                <CreditCard className="text-brand-text-muted" size={20} />
             </div>
             <div className="flex flex-col">
                <span className="text-3xl font-bold font-mono text-white tracking-tighter">R$ 0,00</span>
                <p className="text-[10px] text-brand-accent mt-2 uppercase font-bold tracking-widest animate-pulse">Capital em Ciclo de Giro</p>
             </div>
          </Card>
        </div>

        {/* Chart & Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Chart */}
           <Card className="lg:col-span-2 p-0 overflow-hidden bg-brand-surface/20">
              <div className="p-6 border-b border-brand-border flex items-center justify-between">
                 <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Evolução do Capital</h3>
                 <div className="flex gap-2">
                    <button className="px-2 py-1 text-[10px] font-bold text-brand-accent bg-brand-accent/10 border border-brand-accent/20 rounded">6 MESES</button>
                    <button className="px-2 py-1 text-[10px] font-bold text-brand-text-muted hover:text-white transition-colors">1 ANO</button>
                 </div>
              </div>
              <div className="p-6 h-[320px]">
                 <CapitalGrowthChart data={[
                   { month: 'Set', capital: 63000, growth: 0 },
                   { month: 'Out', capital: 68500, growth: 5500 },
                   { month: 'Nov', capital: 74200, growth: 11200 },
                   { month: 'Dez', capital: 81000, growth: 18000 },
                   { month: 'Jan', capital: 89500, growth: 26500 },
                   { month: 'Fev', capital: 132700, growth: 34700 },
                 ]} />
              </div>
           </Card>

           {/* Active Projects List */}
           <div className="flex flex-col gap-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-text-muted px-2">Projetos em Execução</h3>
              {MOCK_PROJECTS.map((project) => (
                <Card key={project.id} className="p-5 border-brand-border hover:border-brand-accent/40 transition-all group cursor-pointer">
                   <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-brand-input rounded flex items-center justify-center text-brand-accent border border-brand-border group-hover:scale-110 transition-transform">
                        <Package size={20} />
                      </div>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border border-brand-success/20 bg-brand-success/5 text-brand-success">
                        CICLO {project.cycle}/8
                      </span>
                   </div>
                   <h4 className="text-sm font-bold text-white mb-1 group-hover:text-brand-accent transition-colors uppercase tracking-tight">{project.name}</h4>
                   <div className="flex items-center gap-3 mt-4 pt-4 border-t border-brand-border/50">
                      <div>
                         <p className="text-[9px] text-brand-text-muted uppercase font-bold tracking-widest mb-1">Investido</p>
                         <p className="text-sm font-bold font-mono">R$ {project.invested.toLocaleString()}</p>
                      </div>
                      <div className="h-8 w-px bg-brand-border" />
                      <div>
                         <p className="text-[9px] text-brand-text-muted uppercase font-bold tracking-widest mb-1">Rendimento</p>
                         <p className="text-sm font-bold font-mono text-brand-success">+{project.yield}%</p>
                      </div>
                      <div className="ml-auto">
                        <ChevronRight size={18} className="text-brand-text-muted group-hover:text-brand-accent transition-all" />
                      </div>
                   </div>
                </Card>
              ))}
              
              <Button variant="secondary" className="w-full mt-2 text-[10px] py-3 border-dashed opacity-60 hover:opacity-100 uppercase tracking-[0.2em]">
                NOVA OPORTUNIDADE DE INVESTIMENTO
              </Button>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
