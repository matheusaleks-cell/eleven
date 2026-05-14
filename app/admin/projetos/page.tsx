"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { MoneyDisplay } from "@/components/shared/MoneyDisplay";
import { FilterBar } from "@/components/shared/FilterBar";
import { Plus, Search, Filter, ArrowRight, Eye, Trash2 } from "lucide-react";
import { getProjects, deleteProject } from "./actions";
import { getInvestors } from "../investidores/actions";
import { toast } from "sonner";

export default function AdminProjectsPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [investorId, setInvestorId] = useState("ALL");

  const [projects, setProjects] = useState<any[]>([]);
  const [investors, setInvestors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = localStorage.getItem("eleven_session");
    if (s) setSession(JSON.parse(s));
    
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [pData, iData] = await Promise.all([
        getProjects(),
        getInvestors()
      ]);
      setProjects(pData);
      setInvestors(iData);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setStartDate("");
    setEndDate("");
    setInvestorId("ALL");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este projeto?")) return;
    try {
      const res = await deleteProject(id);
      if (res.success) {
        toast.success("Projeto excluído com sucesso.");
        fetchData();
      } else {
        toast.error(res.error || "Erro ao excluir projeto.");
      }
    } catch {
      toast.error("Erro na comunicação com o servidor.");
    }
  };

  const filtered = projects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.investorName.toLowerCase().includes(search.toLowerCase()) ||
      p.product_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
    const matchInvestor = investorId === "ALL" || p.investor_id === investorId;
    
    const matchDate = (!startDate || p.created_at >= startDate) && (!endDate || p.created_at <= endDate);

    return matchSearch && matchStatus && matchInvestor && matchDate;
  });

  if (!session) return null;

  return (
    <DashboardLayout role="ADMIN" userName={session.name} userEmail={session.email} pageTitle="Projetos">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 style={{ color: "#FFFFFF", fontSize: "24px", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.04em" }}>
            Projetos
          </h1>
          <p style={{ color: "#606060", fontSize: "14px", fontFamily: "'Rajdhani', sans-serif" }}>
            {projects.length} projetos cadastrados
          </p>
        </div>
        <Link
          href="/admin/projetos/novo"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[2px] font-bold uppercase transition-all"
          style={{ background: "#F5C400", color: "#1A1A1A", fontSize: "13px", letterSpacing: "0.12em", fontFamily: "'Rajdhani', sans-serif", textDecoration: "none" }}
          onMouseOver={(e) => (e.currentTarget as HTMLElement).style.background = "#D4A900"}
          onMouseOut={(e) => (e.currentTarget as HTMLElement).style.background = "#F5C400"}
        >
          <Plus size={16} />
          Novo Projeto
        </Link>
      </div>

      {/* Filters */}
      <FilterBar
        startDate={startDate}
        endDate={endDate}
        investorId={investorId}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onInvestorChange={setInvestorId}
        onClear={handleClearFilters}
        investors={investors}
      />

      <div
        className="flex flex-col sm:flex-row gap-4 mb-8 p-6 rounded-[4px]"
        style={{ background: "#242424", border: "1px solid #333" }}
      >
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#606060" }} />
          <input
            type="text"
            placeholder="Buscar por nome, produto ou investidor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-11"
            style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14 }}
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter size={16} style={{ color: "#606060" }} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-base"
            style={{ width: "auto", minWidth: 160, fontFamily: "'Rajdhani', sans-serif", fontSize: 14 }}
          >
            <option value="ALL">Todos os status</option>
            <option value="ACTIVE">Ativos</option>
            <option value="COMPLETED">Concluídos</option>
            <option value="CANCELLED">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[4px]" style={{ background: "#242424", border: "1px solid #333" }}>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Projeto</th>
                <th className="hidden md:table-cell">Produto</th>
                <th>Investidor</th>
                <th className="hidden lg:table-cell">Ciclo</th>
                <th className="hidden xl:table-cell">Capital Atual</th>
                <th className="hidden xl:table-cell">Faturamento</th>
                <th>Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12" style={{ color: "#606060", fontFamily: "'Rajdhani', sans-serif" }}>
                    Nenhum projeto encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <p style={{ fontWeight: 600, fontFamily: "'Rajdhani', sans-serif", fontSize: "15px" }}>
                        {project.name}
                      </p>
                    </td>
                    <td className="hidden md:table-cell" style={{ color: "#A0A0A0", fontFamily: "'Rajdhani', sans-serif", fontSize: 14 }}>
                      {project.product_name}
                    </td>
                    <td style={{ color: "#A0A0A0", fontFamily: "'Rajdhani', sans-serif" }}>
                      {project.investorName}
                    </td>
                    <td className="hidden lg:table-cell" style={{ fontFamily: "'Roboto Mono', monospace", color: "#A0A0A0", fontSize: 13 }}>
                      {project.currentCycle}/{project.max_cycles}
                    </td>
                    <td className="hidden xl:table-cell">
                      <MoneyDisplay value={project.currentCapital} size="sm" />
                    </td>
                    <td className="hidden xl:table-cell">
                      <MoneyDisplay value={project.totalRevenue} size="sm" />
                    </td>
                    <td>
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/projetos/${project.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[2px] text-xs font-bold uppercase transition-all"
                          style={{ border: "1px solid #F5C400", color: "#F5C400", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.1em", textDecoration: "none" }}
                          onMouseOver={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(245,196,0,0.1)"}
                          onMouseOut={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                        >
                          <Eye size={12} /> Ver
                        </Link>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[2px] text-xs font-bold uppercase transition-all"
                          style={{ border: "1px solid #E53935", color: "#E53935", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.1em", cursor: "pointer", background: "transparent" }}
                          onMouseOver={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(229,57,53,0.1)"}
                          onMouseOut={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
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
