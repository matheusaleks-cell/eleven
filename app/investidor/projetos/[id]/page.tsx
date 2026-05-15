"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MoneyDisplay } from "@/components/shared/MoneyDisplay";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getInvestorProjectDetails, getCycleSales } from "../../actions";
import { formatMoney } from "@/lib/calculations";
import { ArrowLeft, ChevronDown, ChevronUp, ShoppingCart, TrendingUp, Package, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function InvestorProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);
  const [cycleSales, setCycleSales] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [totalSoldValue, setTotalSoldValue] = useState(0);

  useEffect(() => {
    const s = localStorage.getItem("eleven_session");
    if (!s) { router.push("/login"); return; }
    const parsed = JSON.parse(s);
    setSession(parsed);

    getInvestorProjectDetails(id, parsed.email).then(res => {
      if (res.success && res.project) {
        setProject(res.project);
        // Expand current cycle if available
        if (res.project.cycles.length > 0) {
          const latestCycle = res.project.cycles[0];
          handleExpandCycle(latestCycle.id);
        }
      } else {
        router.push("/investidor/projetos");
      }
      setLoading(false);
    });
  }, []);

  const handleExpandCycle = async (cycleId: string) => {
    if (expandedCycle === cycleId) {
      setExpandedCycle(null);
      return;
    }
    
    setExpandedCycle(cycleId);
    setSalesLoading(true);
    try {
      const res = await getCycleSales(cycleId);
      if (res.success) {
        setCycleSales(res.sales);
        setTotalSoldValue(res.totalSoldValue || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSalesLoading(false);
    }
  };

  if (loading || !session || !project) {
    return (
      <DashboardLayout role="INVESTOR" userName="Investidor" userEmail="" pageTitle="Carregando...">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="INVESTOR" userName={session.name} userEmail={session.email}>
      <div className="flex flex-col gap-6 animate-fade-in pb-12">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/investidor/projetos" className="p-2 bg-brand-surface border border-brand-border rounded-lg text-brand-text-muted hover:text-brand-accent transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-rajdhani uppercase text-white">{project.name}</h1>
            <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">{project.product_name}</p>
          </div>
          <div className="ml-auto">
            <StatusBadge status={project.status} />
          </div>
        </div>

        {/* Global Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <Card className="bg-brand-surface/40 border-brand-border">
              <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.2em]">Capital Inicial</span>
              <p className="text-xl font-bold mt-1 text-white">{formatMoney(project.initial_capital)}</p>
           </Card>
           <Card className="bg-brand-surface/40 border-brand-border">
              <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.2em]">Patrimônio Atual</span>
              <p className="text-xl font-bold mt-1 text-brand-accent">{formatMoney(project.currentCapital)}</p>
           </Card>
           <Card className="bg-brand-surface/40 border-brand-border">
              <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.2em]">Total Distribuído</span>
              <p className="text-xl font-bold mt-1 text-brand-success">{formatMoney(project.totalInvestorShare)}</p>
           </Card>
           <Card className="bg-brand-surface/40 border-brand-border">
              <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.2em]">Andamento</span>
              <p className="text-xl font-bold mt-1 text-white">{project.currentCycle}/{project.max_cycles} Ciclos</p>
           </Card>
        </div>

        {/* Cycles Timeline */}
        <div className="space-y-4 mt-4">
          <h3 className="text-xs font-black text-brand-text-muted uppercase tracking-[0.3em] px-2 flex items-center gap-2">
            <BarChart3 size={14} /> Histórico de Ciclos de Importação
          </h3>
          
          {project.cycles.map((cycle: any, index: number) => {
            const isLatest = index === 0;
            const progress = cycle.gross_revenue > 0 ? (totalSoldValue / cycle.gross_revenue) * 100 : 0;

            return (
              <div key={cycle.id} className={cn(
                "rounded-xl overflow-hidden border transition-all",
                expandedCycle === cycle.id ? "border-brand-accent/50 bg-brand-surface/30" : "border-brand-border bg-brand-surface/20 hover:border-brand-border-hover"
              )}>
                <button
                  onClick={() => handleExpandCycle(cycle.id)}
                  className="w-full flex items-center justify-between px-6 py-5"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center font-black text-xs",
                      cycle.status === "COMPLETED" ? "bg-brand-success/10 text-brand-success border border-brand-success/20" : "bg-brand-accent/10 text-brand-accent border border-brand-accent/20"
                    )}>
                      {cycle.status === "COMPLETED" ? "✓" : `C${cycle.cycles?.length || project.cycles.length - index}`}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white uppercase tracking-tight">{cycle.cycleName}</p>
                      <p className="text-[10px] font-bold text-brand-text-muted uppercase mt-0.5">{cycle.startDate} • {cycle.quantity} Unidades</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block">
                      <p className="text-[9px] font-black text-brand-text-muted uppercase">Sua Parte</p>
                      <p className="text-sm font-mono font-bold text-brand-accent">{formatMoney(cycle.investor_profit_share)}</p>
                    </div>
                    <StatusBadge status={cycle.status} />
                    {expandedCycle === cycle.id ? <ChevronUp size={20} className="text-brand-text-muted" /> : <ChevronDown size={20} className="text-brand-text-muted" />}
                  </div>
                </button>

                {expandedCycle === cycle.id && (
                  <div className="px-6 pb-6 pt-2 space-y-6 animate-fade-in border-t border-brand-border/30 mt-2">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "Investimento do Lote", value: formatMoney(cycle.total_investment) },
                        { label: "Expectativa de Faturamento", value: formatMoney(cycle.gross_revenue) },
                        { label: "Seu Lucro Líquido", value: formatMoney(cycle.investor_profit_share), highlight: true },
                        { label: "Saldo para Reinvestimento", value: formatMoney(cycle.next_cycle_capital) },
                      ].map((stat) => (
                        <div key={stat.label} className="p-3 bg-brand-bg/40 rounded-lg border border-brand-border/50">
                          <p className="text-[9px] font-black text-brand-text-muted uppercase mb-1 tracking-tight">{stat.label}</p>
                          <p className={cn("text-sm font-mono font-bold", stat.highlight ? "text-brand-accent" : "text-white")}>{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Sales Thermometer (Only for active or recently completed) */}
                    {cycle.status !== "PENDING" && (
                      <div className="space-y-4 p-4 bg-brand-input/30 rounded-xl border border-brand-border/40">
                         <div className="flex justify-between items-end">
                            <div className="flex items-center gap-2">
                               <TrendingUp size={14} className="text-brand-success" />
                               <span className="text-[10px] font-black text-white uppercase tracking-widest">Termômetro de Vendas do Ciclo</span>
                            </div>
                            <span className="text-[10px] font-black text-brand-success uppercase">{progress.toFixed(1)}% CONCLUÍDO</span>
                         </div>
                         <div className="h-2 w-full bg-brand-bg rounded-full overflow-hidden border border-brand-border/50">
                            <div 
                              className="h-full bg-gradient-to-r from-brand-accent to-brand-success transition-all duration-1000" 
                              style={{ width: `${Math.min(progress, 100)}%` }} 
                            />
                         </div>
                         <div className="flex justify-between text-[9px] font-bold text-brand-text-muted uppercase">
                            <span>Faturado: {formatMoney(totalSoldValue)}</span>
                            <span>Alvo: {formatMoney(cycle.gross_revenue)}</span>
                         </div>
                      </div>
                    )}

                    {/* Associated Sales Table */}
                    <div className="space-y-3">
                       <h4 className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest flex items-center gap-2">
                          <ShoppingCart size={14} /> Detalhamento de Vendas do Lote
                       </h4>
                       <div className="bg-brand-bg/40 rounded-lg border border-brand-border/50 overflow-hidden">
                          <table className="w-full text-left text-[11px]">
                             <thead>
                                <tr className="bg-brand-surface/50 text-brand-text-muted font-black border-b border-brand-border/50">
                                   <th className="px-4 py-2 uppercase">Data</th>
                                   <th className="px-4 py-2 uppercase">Produto / Serial</th>
                                   <th className="px-4 py-2 uppercase">Cliente</th>
                                   <th className="px-4 py-2 text-right uppercase">Valor Bruto</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-brand-border/30">
                                {salesLoading ? (
                                   <tr>
                                      <td colSpan={4} className="px-4 py-8 text-center text-brand-text-muted animate-pulse font-bold">Sincronizando dados de vendas...</td>
                                   </tr>
                                ) : cycleSales.length > 0 ? (
                                   cycleSales.map((sale) => (
                                      <tr key={sale.id} className="hover:bg-brand-accent/5 transition-colors">
                                         <td className="px-4 py-2 font-mono text-brand-text-secondary">{sale.saleDate}</td>
                                         <td className="px-4 py-2 font-bold text-white">
                                            {sale.productName}
                                            <span className="block text-[9px] text-brand-text-muted">SN: {sale.serialNumber}</span>
                                         </td>
                                         <td className="px-4 py-2 text-brand-text-secondary">{sale.customerName}</td>
                                         <td className="px-4 py-2 text-right font-mono font-bold text-brand-success">{formatMoney(sale.saleValue)}</td>
                                      </tr>
                                   ))
                                ) : (
                                   <tr>
                                      <td colSpan={4} className="px-4 py-8 text-center text-brand-text-muted font-bold">Aguardando início das vendas deste lote.</td>
                                   </tr>
                                )}
                             </tbody>
                          </table>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
