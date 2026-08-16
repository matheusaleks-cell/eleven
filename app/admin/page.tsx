"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { MoneyDisplay } from "@/components/shared/MoneyDisplay";
import { CapitalGrowthChart } from "@/components/charts/CapitalGrowthChart";
import { RevenueBarChart } from "@/components/charts/RevenueBarChart";
import { FilterBar } from "@/components/shared/FilterBar";
import { TrendingUp, FolderKanban, Users, ArrowRight, Plus, Activity, Eye } from "lucide-react";
import { getDashboardStats, getRecentProjects } from "./actions";
import { getInvestors } from "./investidores/actions";
import { toast } from "sonner";

export default function AdminDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [investorId, setInvestorId] = useState("ALL");
  
  // Dados reais do banco
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [investors, setInvestors] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const s = localStorage.getItem("eleven_session");
    if (s) {
      setSession(JSON.parse(s));
    }

    // Carregar dados iniciais do banco
    const loadData = async () => {
      setLoading(true);
      try {
        const [sData, pData, iData] = await Promise.all([
          getDashboardStats(),
          getRecentProjects(),
          getInvestors()
        ]);
        setStats(sData);
        setFilteredProjects(pData);
        setInvestors(iData);
      } catch (error) {
        toast.error("Erro ao sincronizar dados com o banco.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const applyFilters = async () => {
    setLoading(true);
    try {
      const [sData, pData] = await Promise.all([
        getDashboardStats({ investorId, startDate, endDate }),
        getRecentProjects(investorId === "ALL" ? undefined : investorId)
      ]);
      setStats(sData);
      setFilteredProjects(pData);
      toast.success("Filtros aplicados com sucesso!");
    } catch (error) {
      console.error("Erro ao filtrar:", error);
      toast.error("Erro ao aplicar filtros.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = async () => {
    setStartDate("");
    setEndDate("");
    setInvestorId("ALL");
    setLoading(true);
    try {
      const [sData, pData] = await Promise.all([
        getDashboardStats(),
        getRecentProjects()
      ]);
      setStats(sData);
      setFilteredProjects(pData);
      toast.success("Filtros limpos!");
    } catch (error) {
      console.error("Erro ao limpar filtros:", error);
      toast.error("Erro ao limpar filtros.");
    } finally {
      setLoading(false);
    }
  };

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

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <p className="text-brand-text-muted font-bold uppercase tracking-widest text-[10px]">Acesso Restrito. Redirecionando...</p>
      </div>
    );
  }

  // Dados para os gráficos com campos reais do banco
  // Agregação de dados para os gráficos
  const chartCapitalData = filteredProjects.reduce((acc: any[], p: any) => {
    p.cycles?.forEach((c: any) => {
      const existing = acc.find(x => x.name === c.cycleName);
      if (existing) {
        existing.capital += Number(c.totalInvestment) || 0;
      } else {
        acc.push({ name: c.cycleName, capital: Number(c.totalInvestment) || 0 });
      }
    });
    return acc;
  }, []).sort((a, b) => a.name.localeCompare(b.name));

  const chartRevenueData = filteredProjects.reduce((acc: any[], p: any) => {
    p.cycles?.forEach((c: any) => {
      const existing = acc.find(x => x.name === c.cycleName);
      if (existing) {
        existing.value += Number(c.grossRevenue) || 0;
      } else {
        acc.push({ name: c.cycleName, value: Number(c.grossRevenue) || 0 });
      }
    });
    return acc;
  }, []).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <DashboardLayout role="ADMIN" userName={session.name} userEmail={session.email} pageTitle="Dashboard">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6" style={{ marginBottom: "var(--space-5)", flexShrink: 0 }}>
        <div>
          <h1 style={{ color: "#FFFFFF", fontSize: "32px", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "-0.02em" }}>
            Bem-vindo, {session.name}
          </h1>
          <p style={{ color: "#606060", fontSize: "16px", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.05em", marginTop: "4px" }}>
            Visão geral do sistema de investimentos
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/investidores"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[2px] font-bold uppercase transition-all"
            style={{ border: "1px solid #333", background: "#242424", color: "#FFFFFF", fontSize: "13px", letterSpacing: "0.1em", fontFamily: "'Rajdhani', sans-serif" }}
          >
            <Users size={16} />
            Gestão de Investidores
          </Link>
          <Link
            href="/admin/projetos/novo"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[2px] font-bold uppercase transition-all"
            style={{ background: "#F5C400", color: "#1A1A1A", fontSize: "13px", letterSpacing: "0.1em", fontFamily: "'Rajdhani', sans-serif" }}
          >
            <Plus size={16} />
            Novo Projeto
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ marginBottom: "var(--space-5)", flexShrink: 0 }}>
        <FilterBar
          startDate={startDate}
          endDate={endDate}
          investorId={investorId}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onInvestorChange={setInvestorId}
          onClear={handleClearFilters}
          onFilter={applyFilters}
          investors={investors}
        />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
        <StatCard
          title="Projetos Ativos"
          value={
            <span style={{ color: "#F5C400", fontSize: "38px", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>
              {stats?.activeProjects || 0}
            </span>
          }
          icon={<FolderKanban size={18} />}
          sub={`${stats?.completedProjects || 0} concluídos`}
          accent
        />
        <StatCard
          title="Faturamento Total"
          value={<MoneyDisplay value={stats?.totalRevenue || 0} size="lg" />}
          icon={<Activity size={18} />}
          sub="Baseado nos filtros"
        />
        <StatCard
          title="Saldo Investidores"
          value={<MoneyDisplay value={stats?.totalInvestorShare || 0} size="lg" />}
          icon={<Users size={18} />}
          sub="Total distribuído"
        />
        <StatCard
          title="Saldo Empresa"
          value={<MoneyDisplay value={stats?.totalCompanyShare || 0} size="lg" />}
          icon={<TrendingUp size={18} />}
          sub="Lucro retido"
        />
      </div>

      <div style={{ display: "block", height: "var(--space-6)", width: "100%", flexShrink: 0 }} />

      {/* ── PAINEL: FLUXO DE CAIXA REALIZADO ── */}
      {stats && (
        <div className="rounded-[4px] p-8 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #242424 100%)", border: "1px solid #333", borderTop: "3px solid #F5C400" }}>
          {/* Glow de fundo */}
          <div style={{ position: "absolute", top: 0, right: 0, width: "300px", height: "300px", background: "radial-gradient(circle, rgba(245,196,0,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <p style={{ margin: 0, fontSize: "11px", color: "#F5C400", letterSpacing: "0.15em", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: "uppercase" }}>
                Fluxo de Caixa Realizado (Vendas Físicas em Tempo Real)
              </p>
              <p style={{ color: "#606060", fontSize: "12px", fontFamily: "'Rajdhani', sans-serif", marginTop: 4 }}>
                Contabilidade real baseada em cada arma vendida · {stats.weaponsSold || 0} unidades liquidadas
              </p>
            </div>
            {stats.totalRevenue > 0 && (
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "10px", color: "#606060", fontFamily: "'Rajdhani', sans-serif", textTransform: "uppercase", letterSpacing: "0.1em" }}>Lucro Líquido</p>
                <p style={{ fontSize: "24px", fontWeight: 700, color: "#4CAF50", fontFamily: "'Rajdhani', sans-serif", margin: 0 }}>
                  R$ {((stats.totalRevenue || 0) - (stats.totalUnitCosts || 0) - (stats.totalTaxes || 0) - (stats.totalOperationalCosts || 0)).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                </p>
              </div>
            )}
          </div>

          {/* Barra de decomposição da receita bruta */}
          {stats.totalRevenue > 0 ? (
            <>
              {/* Barra visual */}
              <div className="mb-6">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "10px", color: "#606060", fontFamily: "'Rajdhani', sans-serif", textTransform: "uppercase", letterSpacing: "0.1em" }}>Decomposição do Faturamento Bruto</span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF", fontFamily: "'Rajdhani', sans-serif" }}>
                    R$ {(stats.totalRevenue || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div style={{ height: "10px", borderRadius: "5px", overflow: "hidden", display: "flex", background: "#1b1b1b" }}>
                  {/* Custo de importação */}
                  <div style={{ width: `${((stats.totalUnitCosts || 0) / stats.totalRevenue * 100).toFixed(1)}%`, background: "#2196F3", transition: "width 0.8s ease" }} title={`Custo: ${((stats.totalUnitCosts || 0) / stats.totalRevenue * 100).toFixed(1)}%`} />
                  {/* Impostos */}
                  <div style={{ width: "8%", background: "#f44336", transition: "width 0.8s ease" }} title="Impostos: 8%" />
                  {/* Operacional */}
                  <div style={{ width: "15%", background: "#FF9800", transition: "width 0.8s ease" }} title="Operacional: 15%" />
                  {/* Lucro investidores */}
                  <div style={{ width: `${Math.max(0, ((stats.totalInvestorShare || 0) / stats.totalRevenue * 100)).toFixed(1)}%`, background: "#9C27B0", transition: "width 0.8s ease" }} title="Lucro Investidores" />
                  {/* Lucro empresa */}
                  <div style={{ flex: 1, background: "#4CAF50", transition: "width 0.8s ease" }} title="Lucro Empresa" />
                </div>
                <div style={{ display: "flex", gap: "16px", marginTop: "8px", flexWrap: "wrap" }}>
                  {[
                    { color: "#2196F3", label: "Custo Import." },
                    { color: "#f44336", label: "Impostos 8%" },
                    { color: "#FF9800", label: "Operac. 15%" },
                    { color: "#9C27B0", label: "Lucro Invest." },
                    { color: "#4CAF50", label: "Lucro Empresa" },
                  ].map(({ color, label }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: "9px", color: "#606060", fontFamily: "'Rajdhani', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid de cartões financeiros */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                {[
                  {
                    label: "Faturamento Bruto",
                    value: stats.totalRevenue || 0,
                    color: "#FFFFFF",
                    bg: "rgba(255,255,255,0.03)",
                    border: "#333",
                    icon: "💰",
                    pct: null
                  },
                  {
                    label: "Custo Import. (Giro)",
                    value: stats.totalUnitCosts || 0,
                    color: "#2196F3",
                    bg: "rgba(33,150,243,0.05)",
                    border: "rgba(33,150,243,0.2)",
                    icon: "📦",
                    pct: stats.totalRevenue > 0 ? ((stats.totalUnitCosts || 0) / stats.totalRevenue * 100).toFixed(1) : "0"
                  },
                  {
                    label: "Impostos 8%",
                    value: stats.totalTaxes || 0,
                    color: "#f44336",
                    bg: "rgba(244,67,54,0.05)",
                    border: "rgba(244,67,54,0.2)",
                    icon: "🏛️",
                    pct: "8.0"
                  },
                  {
                    label: "Operacional 15%",
                    value: stats.totalOperationalCosts || 0,
                    color: "#FF9800",
                    bg: "rgba(255,152,0,0.05)",
                    border: "rgba(255,152,0,0.2)",
                    icon: "⚙️",
                    pct: "15.0"
                  },
                  {
                    label: "Lucro Investidores",
                    value: stats.totalInvestorShare || 0,
                    color: "#9C27B0",
                    bg: "rgba(156,39,176,0.05)",
                    border: "rgba(156,39,176,0.2)",
                    icon: "👥",
                    pct: stats.totalRevenue > 0 ? ((stats.totalInvestorShare || 0) / stats.totalRevenue * 100).toFixed(1) : "0"
                  },
                  {
                    label: "Lucro Empresa",
                    value: stats.totalCompanyShare || 0,
                    color: "#4CAF50",
                    bg: "rgba(76,175,80,0.05)",
                    border: "rgba(76,175,80,0.2)",
                    icon: "🏢",
                    pct: stats.totalRevenue > 0 ? ((stats.totalCompanyShare || 0) / stats.totalRevenue * 100).toFixed(1) : "0"
                  }
                ].map((item) => (
                  <div key={item.label} style={{ padding: "14px 12px", borderRadius: "4px", background: item.bg, border: `1px solid ${item.border}`, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "16px" }}>{item.icon}</span>
                      {item.pct !== null && (
                        <span style={{ fontSize: "9px", fontWeight: 700, color: item.color, background: `${item.color}20`, border: `1px solid ${item.color}40`, padding: "1px 5px", borderRadius: "3px", fontFamily: "'Roboto Mono', monospace" }}>
                          {item.pct}%
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: "9px", color: "#606060", fontFamily: "'Rajdhani', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: 1.3 }}>{item.label}</p>
                    <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: item.color, fontFamily: "'Roboto Mono', monospace" }}>
                      R$ {item.value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ padding: "32px", textAlign: "center", color: "#404040" }}>
              <p style={{ fontFamily: "'Rajdhani', sans-serif", textTransform: "uppercase", letterSpacing: "0.15em", fontSize: "13px" }}>
                Nenhuma venda registrada. O fluxo de caixa aparecerá aqui à medida que as armas forem vendidas.
              </p>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "block", height: "var(--space-6)", width: "100%", flexShrink: 0 }} />

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <div className="rounded-[4px] p-10" style={{ background: "#242424", border: "1px solid #333" }}>
          <div className="mb-6">
            <p className="section-divider" style={{ margin: 0, fontSize: "11px", color: "#F5C400", letterSpacing: "0.15em", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: "uppercase" }}>
              Evolução do Capital
            </p>
            <p style={{ color: "#606060", fontSize: "12px", fontFamily: "'Rajdhani', sans-serif", marginTop: 4 }}>
              {filteredProjects.length > 0 ? filteredProjects[0].name : "Nenhum projeto selecionado"}
            </p>
          </div>
          <CapitalGrowthChart data={chartCapitalData} height={280} />
        </div>

        <div className="rounded-[4px] p-10" style={{ background: "#242424", border: "1px solid #333" }}>
          <div className="mb-6">
            <p style={{ margin: 0, fontSize: "11px", color: "#F5C400", letterSpacing: "0.15em", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: "uppercase" }}>
              Faturamento por Ciclo
            </p>
            <p style={{ color: "#606060", fontSize: "12px", fontFamily: "'Rajdhani', sans-serif", marginTop: 4 }}>
              Ciclos do projeto em destaque
            </p>
          </div>
          <RevenueBarChart data={chartRevenueData} height={280} />
        </div>
      </div>

      <div style={{ display: "block", height: "48px", width: "100%", flexShrink: 0 }} />

      {/* Recent Projects Table */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="section-divider" style={{ margin: 0, fontSize: "16px", color: "#F5C400", letterSpacing: "0.2em", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: "uppercase" }}>
          Projetos Recentes
        </h2>
        <Link href="/admin/projetos" className="text-sm text-gray-500 hover:text-yellow-500 flex items-center gap-2 uppercase tracking-widest font-bold">
          Ver todos <ArrowRight size={14} />
        </Link>
      </div>

      <div style={{ display: "block", height: "24px", width: "100%", flexShrink: 0 }} />

      <div className="rounded-[4px] overflow-hidden" style={{ background: "#242424", border: "1px solid #333" }}>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Projeto</th>
                <th>Investidor</th>
                <th>Ciclo</th>
                <th>Capital Atual</th>
                <th>Status</th>
                <th className="text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12" style={{ color: "#606060", fontFamily: "'Rajdhani', sans-serif" }}>
                    Nenhum projeto encontrado para estes filtros.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <div>
                        <p style={{ fontWeight: 600, fontFamily: "'Rajdhani', sans-serif", fontSize: "15px" }}>
                          {project.name}
                        </p>
                        <p style={{ color: "#606060", fontSize: "12px", fontFamily: "'Rajdhani', sans-serif" }}>
                          {project.product_name}
                        </p>
                      </div>
                    </td>
                    <td style={{ color: "#A0A0A0", fontFamily: "'Rajdhani', sans-serif" }}>{project.investorName}</td>
                    <td style={{ fontFamily: "'Roboto Mono', monospace", color: "#A0A0A0" }}>
                      {project.currentCycle}/{project.max_cycles}
                    </td>
                    <td>
                      <MoneyDisplay value={project.currentCapital} size="sm" />
                    </td>
                    <td>
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/admin/projetos/${project.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] transition-all"
                        style={{ border: "1px solid #F5C400", color: "#F5C400", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}
                      >
                        Ver <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Informações Físicas de Lotes e Distribuição de Estoque */}
      {stats?.activeLotsProgress && stats.activeLotsProgress.length > 0 && (
        <>
          <div style={{ display: "block", height: "48px", width: "100%", flexShrink: 0 }} />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
            {/* Liquidação de Lotes */}
            <div className="xl:col-span-2 rounded-[4px] p-8" style={{ background: "#242424", border: "1px solid #333" }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: "12px", color: "#F5C400", letterSpacing: "0.15em", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: "uppercase" }}>
                Liquidação Física de Lotes em Giro
              </h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {stats.activeLotsProgress.map((lot: any) => (
                  <div key={lot.id} className="p-4 bg-[#1b1b1b] border border-[#2d2d2d] rounded flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white uppercase tracking-wider">{lot.batchCode} · {lot.projectName}</span>
                      <span className="font-bold text-[#A0A0A0] text-[10px]">{lot.investorName}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-[#A0A0A0] uppercase">
                      <span>Progresso de Vendas</span>
                      <span style={{ color: "#F5C400" }}>{lot.sold} / {lot.total} unidades ({lot.percentage}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-brand-border overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ width: `${lot.percentage}%`, background: "linear-gradient(90deg, #F5C400, #FFD740)" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status de Armas */}
            <div className="rounded-[4px] p-8" style={{ background: "#242424", border: "1px solid #333" }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: "12px", color: "#F5C400", letterSpacing: "0.15em", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: "uppercase" }}>
                Distribuição de Estoque Geral
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2.5 border-b border-[#2d2d2d] text-xs">
                  <span className="font-bold text-[#A0A0A0] uppercase tracking-wider">Armas Vendidas</span>
                  <span className="font-mono font-bold text-[#4CAF50] bg-[#4CAF50]/10 border border-[#4CAF50]/20 px-2 py-0.5 rounded">{stats?.weaponsSold || 0} un.</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-[#2d2d2d] text-xs">
                  <span className="font-bold text-[#A0A0A0] uppercase tracking-wider">Disponíveis em Estoque</span>
                  <span className="font-mono font-bold text-[#F5C400] bg-[#F5C400]/10 border border-[#F5C400]/20 px-2 py-0.5 rounded">{stats?.weaponsInStock || 0} un.</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-[#2d2d2d] text-xs">
                  <span className="font-bold text-[#A0A0A0] uppercase tracking-wider">Reservadas (Vendas Pendentes)</span>
                  <span className="font-mono font-bold text-[#FF9800] bg-[#FF9800]/10 border border-[#FF9800]/20 px-2 py-0.5 rounded">{stats?.weaponsReserved || 0} un.</span>
                </div>
                <div className="flex justify-between items-center py-2.5 text-xs">
                  <span className="font-bold text-[#A0A0A0] uppercase tracking-wider">Aguardando Desembaraço</span>
                  <span className="font-mono font-bold text-[#2196F3] bg-[#2196F3]/10 border border-[#2196F3]/20 px-2 py-0.5 rounded">{stats?.weaponsImported || 0} un.</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
