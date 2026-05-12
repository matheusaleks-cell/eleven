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

  const applyFilters = () => {
    toast.info("Filtragem de banco em desenvolvimento. Usando visão geral.");
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setInvestorId("ALL");
    // Recarregar do banco
    getRecentProjects().then(setFilteredProjects);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 style={{ color: "#FFFFFF", fontSize: "32px", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "-0.02em" }}>
            Bem-vindo, {session.name}
          </h1>
          <p style={{ color: "#606060", fontSize: "16px", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.05em", marginTop: "4px" }}>
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
        investors={investors}
      />

      <div style={{ height: "48px" }} />

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

      <div style={{ height: "48px" }} />

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <div className="rounded-[4px] p-10" style={{ background: "#242424", border: "1px solid #333" }}>
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

        <div className="rounded-[4px] p-10" style={{ background: "#242424", border: "1px solid #333" }}>
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

      <div style={{ height: "64px" }} />

      {/* Recent Projects Table */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="section-divider" style={{ margin: 0, fontSize: "16px", color: "#F5C400", letterSpacing: "0.2em", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: "uppercase" }}>
          ★ Projetos Recentes ★
        </h2>
        <Link href="/admin/projetos" className="text-sm text-gray-500 hover:text-yellow-500 flex items-center gap-2 uppercase tracking-widest font-bold">
          Ver todos <ArrowRight size={14} />
        </Link>
      </div>

      <div style={{ height: "24px" }} />

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
