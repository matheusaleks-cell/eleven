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
import { mockProjects, dashboardStats } from "@/lib/mock-data";
import { TrendingUp, FolderKanban, Users, ArrowRight, Plus, Activity, Eye } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [investorId, setInvestorId] = useState("ALL");
  
  // Dados filtrados (inicializados com os mocks)
  const [filteredProjects, setFilteredProjects] = useState(mockProjects);
  const [stats, setStats] = useState(dashboardStats);

  useEffect(() => {
    try {
      const s = localStorage.getItem("eleven_session");
      if (!s) {
        window.location.href = "/login";
        return;
      }
      const parsed = JSON.parse(s);
      if (parsed.role !== "ADMIN") {
        window.location.href = "/investidor";
        return;
      }
      setSession(parsed);
    } catch (e) {
      window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = () => {
    const filtered = mockProjects.filter(p => {
      const matchInvestor = investorId === "ALL" || p.investor_id === investorId;
      const matchDate = (!startDate || p.created_at >= startDate) && (!endDate || p.created_at <= endDate);
      return matchInvestor && matchDate;
    });

    setFilteredProjects(filtered);

    // Recalcular estatísticas
    setStats({
      activeProjects: filtered.filter(p => p.status === "ACTIVE").length,
      completedProjects: filtered.filter(p => p.status === "COMPLETED").length,
      totalRevenue: filtered.reduce((a, p) => a + p.totalRevenue, 0),
      totalInvestorShare: filtered.reduce((a, p) => a + p.totalInvestorShare, 0),
      totalCompanyShare: filtered.reduce((a, p) => a + p.totalCompanyShare, 0),
    });
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setInvestorId("ALL");
    setFilteredProjects(mockProjects);
    setStats(dashboardStats);
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

  // Dados para os gráficos com campos corretos (camelCase do CycleResult)
  const chartCapitalData = filteredProjects.length > 0 && filteredProjects[0].cycles
    ? filteredProjects[0].cycles.map((c: any) => ({ 
        name: c.cycleName, 
        capital: Number(c.nextCycleCapital) || 0,
      }))
    : [];

  const chartRevenueData = filteredProjects.length > 0 && filteredProjects[0].cycles
    ? filteredProjects[0].cycles.map((c: any) => ({ 
        name: c.cycleName, 
        value: Number(c.grossRevenue) || 0,
      }))
    : [];

  return (
    <DashboardLayout role="ADMIN" userName={session.name} userEmail={session.email} pageTitle="Dashboard">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 style={{ color: "#FFFFFF", fontSize: "28px", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>
            Bem-vindo, {session.name}
          </h1>
          <p style={{ color: "#606060", fontSize: "14px", fontFamily: "'Rajdhani', sans-serif" }}>
            Visão geral do sistema de investimentos
          </p>
        </div>
        <Link
          href="/admin/projetos/novo"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[2px] font-bold uppercase transition-all"
          style={{ background: "#F5C400", color: "#1A1A1A", fontSize: "13px", letterSpacing: "0.1em", fontFamily: "'Rajdhani', sans-serif" }}
        >
          <Plus size={16} />
          Novo Projeto
        </Link>
      </div>

      {/* Filtros */}
      <FilterBar
        startDate={startDate}
        endDate={endDate}
        investorId={investorId}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onInvestorChange={setInvestorId}
        onClear={handleClearFilters}
        onFilter={applyFilters}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        <StatCard
          title="Projetos Ativos"
          value={
            <span style={{ color: "#F5C400", fontSize: "38px", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>
              {stats.activeProjects}
            </span>
          }
          icon={<FolderKanban size={18} />}
          sub={`${stats.completedProjects} concluídos`}
          accent
        />
        <StatCard
          title="Faturamento Total"
          value={<MoneyDisplay value={stats.totalRevenue} size="lg" />}
          icon={<Activity size={18} />}
          sub="Baseado nos filtros"
        />
        <StatCard
          title="Saldo Investidores"
          value={<MoneyDisplay value={stats.totalInvestorShare} size="lg" />}
          icon={<Users size={18} />}
          sub="Total distribuído"
        />
        <StatCard
          title="Saldo Empresa"
          value={<MoneyDisplay value={stats.totalCompanyShare} size="lg" />}
          icon={<TrendingUp size={18} />}
          sub="Lucro retido"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
        <div className="rounded-[4px] p-6" style={{ background: "#242424", border: "1px solid #333" }}>
          <div className="mb-6">
            <p className="section-divider" style={{ margin: 0, fontSize: "11px", color: "#F5C400", letterSpacing: "0.15em", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: "uppercase" }}>
              ★ Evolução do Capital ★
            </p>
            <p style={{ color: "#606060", fontSize: "12px", fontFamily: "'Rajdhani', sans-serif", marginTop: 4 }}>
              {filteredProjects.length > 0 ? filteredProjects[0].name : "Nenhum projeto selecionado"}
            </p>
          </div>
          <CapitalGrowthChart data={chartCapitalData} height={280} />
        </div>

        <div className="rounded-[4px] p-6" style={{ background: "#242424", border: "1px solid #333" }}>
          <div className="mb-6">
            <p style={{ margin: 0, fontSize: "11px", color: "#F5C400", letterSpacing: "0.15em", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: "uppercase" }}>
              ★ Faturamento por Ciclo ★
            </p>
            <p style={{ color: "#606060", fontSize: "12px", fontFamily: "'Rajdhani', sans-serif", marginTop: 4 }}>
              Ciclos do projeto em destaque
            </p>
          </div>
          <RevenueBarChart data={chartRevenueData} height={280} />
        </div>
      </div>

      {/* Recent Projects Table */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-divider" style={{ margin: 0, fontSize: "12px", color: "#F5C400", letterSpacing: "0.15em", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: "uppercase" }}>
          ★ Projetos Recentes ★
        </h2>
        <Link href="/admin/projetos" className="text-xs text-gray-500 hover:text-yellow-500 flex items-center gap-1 uppercase tracking-tighter">
          Ver todos <ArrowRight size={12} />
        </Link>
      </div>

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
    </DashboardLayout>
  );
}
