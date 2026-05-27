"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  TrendingUp,
  Wallet,
  ArrowUpRight,
  History,
  Package,
  ShieldCheck,
  Download,
  CreditCard,
  ChevronRight,
  Layers,
  Zap,
  ArrowRight,
} from "lucide-react";
import { CapitalGrowthChart } from "@/components/charts/CapitalGrowthChart";
import { MoneyDisplay } from "@/components/shared/MoneyDisplay";
import { cn } from "@/lib/utils";
import { projectFutureBatches, RIFLE_22_PRESET } from "@/lib/calculations";

import { getInvestorDashboardData } from "./actions";

// Projeção calculada uma vez com as premissas padrão do Rifle .22
const BATCH_PROJECTION = projectFutureBatches(RIFLE_22_PRESET);

function fmtBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function InvestorDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const s = localStorage.getItem("eleven_session");
    if (s) {
      const parsed = JSON.parse(s);
      setSession(parsed);
      getInvestorDashboardData(parsed.email).then(res => {
        if (res.success) setDashboardData(res.data);
        setLoading(false);
      });
    } else {
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

  const project = dashboardData?.projects?.[0];
  const batches: any[] = project?.projection && project.projection.length > 0 ? project.projection : BATCH_PROJECTION;
  const lastBatch = batches[batches.length - 1];
  const totalInvestorEarnings = lastBatch?.cumulativeInvestorEarnings ?? 0;
  const initialAporte = batches[0]?.totalImportCostBRL ?? 1;
  const globalROI = (totalInvestorEarnings / initialAporte) * 100;


  return (
    <DashboardLayout role="INVESTOR" userName={session.name} userEmail={session.email}>
      <div className="flex flex-col gap-10 animate-fade-in pb-10 px-4 md:px-0">

        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 font-rajdhani uppercase">OLÁ, {session.name.split(' ')[0]}</h1>
            <p className="text-brand-text-secondary text-sm font-medium uppercase tracking-[0.2em] flex items-center gap-2">
               <ShieldCheck size={14} className="text-brand-accent" /> INVESTIDOR CERTIFICADO · NÍVEL ELITE
            </p>
          </div>
          <div className="flex gap-3">
             <Button 
               variant="secondary" 
               className="gap-2"
               onClick={() => router.push("/investidor/extrato")}
             >
               <History size={18} /> EXTRATO COMPLETO
             </Button>
             <Button 
               className="gap-2 shadow-[0_0_15px_rgba(245,196,0,0.2)]"
               onClick={() => router.push("/investidor/extrato")}
             >
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
                <span className="text-3xl font-bold font-mono text-white tracking-tighter">
                  R$ {dashboardData?.totalPatrimony?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0,00"}
                </span>
                <div className="flex items-center gap-1.5 mt-2 text-brand-success">
                   <ArrowUpRight size={16} strokeWidth={3} />
                   <span className="text-xs font-bold uppercase tracking-wider">
                     +{dashboardData?.totalYield?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0,00"}
                   </span>
                </div>
             </div>
          </Card>

          <Card className="bg-brand-bg/60 backdrop-blur-sm">
             <div className="flex justify-between items-start mb-4">
                <span className="text-[11px] font-bold text-brand-text-muted uppercase tracking-[0.2em]">Rendimento Acumulado</span>
                <TrendingUp className="text-brand-success" size={20} />
             </div>
             <div className="flex flex-col">
                <span className="text-3xl font-bold font-mono text-white tracking-tighter">
                  R$ {dashboardData?.totalYield?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0,00"}
                </span>
                <p className="text-[10px] text-brand-text-muted mt-2 uppercase font-bold tracking-widest">
                  Baseado em {dashboardData?.activeProjectsCount || 0} projetos ativos
                </p>
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
           <Card className="lg:col-span-2 p-0 overflow-hidden bg-brand-surface/20">
              <div className="p-6 border-b border-brand-border flex items-center justify-between">
                 <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Evolução do Capital</h3>
                 <div className="flex gap-2">
                    <button className="px-2 py-1 text-[10px] font-bold text-brand-accent bg-brand-accent/10 border border-brand-accent/20 rounded">6 MESES</button>
                    <button className="px-2 py-1 text-[10px] font-bold text-brand-text-muted hover:text-white transition-colors">1 ANO</button>
                 </div>
              </div>
              <div className="p-6 h-[320px]">
                 <CapitalGrowthChart data={dashboardData?.chartData || []} height={320} />
              </div>
           </Card>

           <div className="flex flex-col gap-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-text-muted px-2">Projetos em Execução</h3>
              {(dashboardData?.projects || []).map((project: any) => (
                <Card 
                  key={project.id} 
                  className="p-5 border-brand-border hover:border-brand-accent/40 transition-all group cursor-pointer"
                  onClick={() => router.push(`/investidor/projetos/${project.id}`)}
                >
                   <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-brand-input rounded flex items-center justify-center text-brand-accent border border-brand-border group-hover:scale-110 transition-transform">
                        <Package size={20} />
                      </div>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border border-brand-success/20 bg-brand-success/5 text-brand-success">
                        CICLO {project.cycle}
                      </span>
                   </div>
                   <h4 className="text-sm font-bold text-white mb-1 group-hover:text-brand-accent transition-colors uppercase tracking-tight">{project.name}</h4>
                   
                   {project.activeCycleTotalWeapons > 0 && (
                     <div className="mt-4 pt-3 border-t border-brand-border/40 space-y-1.5">
                       <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-brand-text-secondary">
                         <span>Progresso de Vendas</span>
                         <span className="text-brand-accent">{project.activeCycleSoldWeapons} / {project.activeCycleTotalWeapons} un.</span>
                       </div>
                       <div className="h-1 rounded-full bg-brand-border overflow-hidden">
                         <div 
                           className="h-full rounded-full bg-brand-accent" 
                           style={{ width: `${(project.activeCycleSoldWeapons / project.activeCycleTotalWeapons) * 100}%` }}
                         />
                       </div>
                       <div className="flex justify-between text-[8px] font-bold text-brand-text-muted mt-1 uppercase">
                         <span>Em estoque: {project.activeCycleTotalWeapons - project.activeCycleSoldWeapons} un.</span>
                         <span>Giro: R$ {project.activeCycleInventoryValue.toLocaleString('pt-BR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                       </div>
                     </div>
                   )}

                   <div className="flex items-center gap-3 mt-4 pt-4 border-t border-brand-border/50">
                      <div>
                         <p className="text-[9px] text-brand-text-muted uppercase font-bold tracking-widest mb-1">Investido</p>
                         <p className="text-sm font-bold font-mono">R$ {project.invested.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
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

        {/* Vendas Recentes & Resumo do Ciclo */}
        {dashboardData?.recentSales && dashboardData.recentSales.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            <Card className="lg:col-span-2 p-6 bg-brand-surface/20 border-brand-border">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white mb-4 flex items-center gap-2">
                <History size={16} className="text-brand-accent" />
                VENDAS RECENTES DE SUAS UNIDADES
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-brand-border text-[9px] font-black text-brand-text-muted uppercase tracking-widest">
                      <th className="pb-3 font-black">Projeto</th>
                      <th className="pb-3 font-black">Produto</th>
                      <th className="pb-3 font-black">Nº Série</th>
                      <th className="pb-3 font-black">Data Venda</th>
                      <th className="pb-3 font-black text-right">Valor Venda</th>
                      <th className="pb-3 font-black text-right text-brand-accent">Seu Lucro (Est.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/30 text-xs font-medium text-white/90">
                    {dashboardData.recentSales.map((sale: any) => (
                      <tr key={sale.id} className="hover:bg-brand-accent/5 transition-colors">
                        <td className="py-3 uppercase font-bold text-[10px] text-brand-text-secondary">{sale.projectName}</td>
                        <td className="py-3 uppercase">{sale.productName}</td>
                        <td className="py-3 font-mono font-bold text-brand-text-muted">{sale.serialNumber}</td>
                        <td className="py-3 text-brand-text-muted">{sale.saleDate}</td>
                        <td className="py-3 text-right font-mono font-bold text-white">
                          {sale.saleValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="py-3 text-right font-mono font-black text-brand-accent">
                          +{sale.investorProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-6 bg-brand-surface/20 border-brand-border flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white mb-4">
                  RESUMO DO CICLO EM GIRO
                </h3>
                <div className="space-y-4">
                  {dashboardData.projects?.map((p: any) => {
                    if (p.activeCycleTotalWeapons === 0) return null;
                    return (
                      <div key={p.id} className="p-3 bg-brand-bg/40 border border-brand-border rounded-lg space-y-2.5">
                        <p className="text-[10px] font-black text-brand-accent uppercase tracking-widest">{p.name}</p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-brand-text-muted uppercase text-[9px] font-bold">Lucro Líquido Concretizado</span>
                          <span className="font-mono font-black text-brand-success">
                            {p.activeCycleRealizedProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-brand-text-muted uppercase text-[9px] font-bold">Capital Ativo em Estoque</span>
                          <span className="font-mono font-bold text-white">
                            {p.activeCycleInventoryValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="text-[9px] text-brand-text-muted font-bold mt-4 uppercase leading-relaxed">
                * Os lucros das vendas em andamento são apurados à medida que cada arma é faturada e serão disponibilizados para reinvestimento/saque na conclusão do ciclo de importação.
              </p>
            </Card>
          </div>
        )}

        {/* ── DETALHAMENTO DE RECEITA REALIZADA ── */}
        {dashboardData?.projects && dashboardData.projects.some((p: any) => p.activeCycleRealizedProfit > 0 || p.activeCycleSoldWeapons > 0) && (
          <div className="rounded-lg overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(245,196,0,0.03) 0%, rgba(245,196,0,0.01) 100%)", border: "1px solid rgba(245,196,0,0.15)", borderTop: "2px solid #F5C400" }}>
            <div className="p-6 border-b border-brand-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                    <TrendingUp size={16} className="text-brand-accent" />
                    DETALHAMENTO DE RECEITA REALIZADA (PROPORCIONAL)
                  </h3>
                  <p className="text-[10px] text-brand-text-muted mt-1 uppercase tracking-wider">
                    Transparência total · Receita bruta → dedução → sua fatia líquida
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {dashboardData.projects.filter((p: any) => p.activeCycleSoldWeapons > 0).map((p: any) => {
                // Estimativas baseadas em 8% imposto + 15% operacional sobre a receita gerada
                // activeCycleRealizedProfit já é a fatia do investidor (lucro líquido × splitPct)
                // Vamos exibir a decomposição da receita que gerou esse lucro
                const realizedProfit = p.activeCycleRealizedProfit || 0;
                const inventoryCost = p.activeCycleInventoryValue || 0;
                // Estimativa: Receita bruta ≈ custo + lucro líquido / (1 - 0.23)  
                // Como o investidor representa splitPct do lucro, e o lucro = receita×0.77 - custo
                // E realizedProfit = lucro × splitPct → lucro = realizedProfit / splitPct ≈ realizedProfit × 2 (para 50%)
                const estimatedLucroLiq = realizedProfit * 2; // 50% split default
                const estimatedReceita = inventoryCost > 0 
                  ? (estimatedLucroLiq + (inventoryCost / Math.max(1, p.activeCycleTotalWeapons)) * p.activeCycleSoldWeapons) / 0.77
                  : estimatedLucroLiq / 0.77;
                const taxEstimate = estimatedReceita * 0.08;
                const opEstimate = estimatedReceita * 0.15;
                const costEstimate = (inventoryCost / Math.max(1, p.activeCycleTotalWeapons)) * p.activeCycleSoldWeapons;

                const items = [
                  { label: "Receita Bruta (Vendas)", value: estimatedReceita, color: "#FFFFFF", pct: "100%" },
                  { label: "(-) Custo Amortizado", value: -costEstimate, color: "#2196F3", pct: `${((costEstimate / estimatedReceita) * 100).toFixed(1)}%` },
                  { label: "(-) Impostos 8%", value: -taxEstimate, color: "#f44336", pct: "8%" },
                  { label: "(-) Operacional 15%", value: -opEstimate, color: "#FF9800", pct: "15%" },
                  { label: "= Sua Fatia Líquida", value: realizedProfit, color: "#F5C400", pct: `${estimatedReceita > 0 ? ((realizedProfit / estimatedReceita) * 100).toFixed(1) : "0"}%` },
                ];

                return (
                  <div key={p.id} className="space-y-3">
                    <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.2em] flex items-center gap-2">
                      <Package size={12} /> {p.name} · {p.activeCycleSoldWeapons} un. vendidas
                    </p>
                    {/* Barra de decomposição */}
                    <div className="h-2 rounded-full overflow-hidden flex bg-brand-border/30">
                      <div style={{ width: `${((costEstimate / estimatedReceita) * 100).toFixed(1)}%`, background: "#2196F3" }} />
                      <div style={{ width: "8%", background: "#f44336" }} />
                      <div style={{ width: "15%", background: "#FF9800" }} />
                      <div style={{ flex: 1, background: "#F5C400" }} />
                    </div>
                    {/* Lista de itens */}
                    <div className="space-y-1">
                      {items.map((item, i) => (
                        <div key={i} className={cn(
                          "flex items-center justify-between py-1.5 px-3 rounded text-xs",
                          i === items.length - 1 ? "bg-brand-accent/8 border border-brand-accent/20" : "hover:bg-brand-bg/40 transition-colors"
                        )}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                            <span style={{ color: i === items.length - 1 ? "#F5C400" : "#A0A0A0", fontFamily: "'Rajdhani', sans-serif", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                              {item.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span style={{ fontFamily: "'Roboto Mono', monospace", fontSize: "9px", color: "#404040" }}>{item.pct}</span>
                            <span style={{ fontFamily: "'Roboto Mono', monospace", fontSize: "12px", fontWeight: 700, color: item.color }}>
                              {item.value >= 0 ? "+" : ""}R$ {Math.abs(item.value).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              <p className="text-[8px] text-brand-text-muted/50 uppercase tracking-widest pt-2 border-t border-brand-border/30">
                * Estimativas baseadas nos percentuais acordados: 8% impostos + 15% operacional. Valores exatos disponíveis na conclusão do ciclo.
              </p>
            </div>
          </div>
        )}

        {/* ── PROJEÇÃO DE CRESCIMENTO — ESCALADA DE LOTES ── */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                <Zap size={16} className="text-brand-accent" />
                Projeção de Crescimento — Escalada de Lotes
              </h2>
              <p className="text-[10px] text-brand-text-muted mt-1 uppercase tracking-wider">
                {project?.product_name || "Vezir VR12 Pump"} · Reinvestimento automático: Capital + Lucro do Investidor
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-brand-accent/20 bg-brand-accent/5 w-fit">
              <Layers size={12} className="text-brand-accent" />
              <span className="text-[10px] font-bold text-brand-accent uppercase tracking-wider">
                ≈ {lastBatch?.investorROI.toFixed(1)}% ROI / lote
              </span>
            </div>
          </div>

          {/* Cards de lote */}
          <div className="grid grid-cols-2 md:grid-cols-5 xl:grid-cols-7 gap-3">
            {batches.map((b, idx) => {
              const maxQty = Math.max(...batches.map((x) => x.quantity));
              const heightPct = maxQty > 0 ? (b.quantity / maxQty) * 100 : 0;
              const isFirst = b.batchNumber === 1;

              return (
                <Card
                  key={b.batchNumber}
                  className={cn(
                    "p-4 flex flex-col gap-3 transition-all group cursor-default",
                    isFirst
                      ? "border-brand-accent/50 bg-brand-accent/5"
                      : "border-brand-border hover:border-brand-accent/20"
                  )}
                >
                  {/* Badge */}
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                      isFirst
                        ? "bg-brand-accent text-brand-bg"
                        : "bg-brand-input text-brand-text-muted border border-brand-border"
                    )}>
                      LOTE {b.batchNumber}
                    </span>
                    {isFirst && (
                      <span className="text-[8px] font-bold text-brand-accent uppercase tracking-wider animate-pulse">ATUAL</span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="h-1 rounded-full bg-brand-border overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${heightPct}%`,
                        background: "linear-gradient(90deg, #F5C400, #FFD740)",
                      }}
                    />
                  </div>

                  {/* Métricas */}
                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="text-[9px] text-brand-text-muted uppercase font-bold tracking-widest mb-0.5">Unidades</p>
                      <p className="text-xl font-bold font-mono text-white">{b.quantity}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-brand-text-muted uppercase font-bold tracking-widest mb-0.5">Faturamento</p>
                      <p className="text-sm font-bold font-mono text-brand-success">{fmtBRL(b.grossRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-brand-text-muted uppercase font-bold tracking-widest mb-0.5">Seu Lucro</p>
                      <p className="text-sm font-bold font-mono text-brand-accent">{fmtBRL(b.investorShare)}</p>
                    </div>
                  </div>

                  {idx < batches.length - 1 && (
                    <div className="hidden md:flex justify-end">
                      <ArrowRight size={12} className="text-brand-text-muted group-hover:text-brand-accent transition-colors" />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Resumo da projeção */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border border-brand-border bg-brand-surface/30">
              <div className="w-8 h-8 rounded-full bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center shrink-0">
                <Package size={14} className="text-brand-accent" />
              </div>
              <div>
                <p className="text-[9px] text-brand-text-muted uppercase font-bold tracking-widest">Lote {batches.length} (final)</p>
                <p className="text-base font-bold text-white">{lastBatch?.quantity ?? "–"} {project ? 'unidades' : 'rifles'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg border border-brand-success/20 bg-brand-success/5">
              <div className="w-8 h-8 rounded-full bg-brand-success/10 border border-brand-success/30 flex items-center justify-center shrink-0">
                <TrendingUp size={14} className="text-brand-success" />
              </div>
              <div>
                <p className="text-[9px] text-brand-text-muted uppercase font-bold tracking-widest">Ganho Acumulado</p>
                <p className="text-base font-bold text-brand-success">{fmtBRL(totalInvestorEarnings)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg border border-brand-accent/20 bg-brand-accent/5">
              <div className="w-8 h-8 rounded-full bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center shrink-0">
                <Zap size={14} className="text-brand-accent" />
              </div>
              <div>
                <p className="text-[9px] text-brand-text-muted uppercase font-bold tracking-widest">ROI Total Projetado</p>
                <p className="text-base font-bold text-brand-accent">{globalROI.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
