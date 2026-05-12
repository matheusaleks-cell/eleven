"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MoneyDisplay } from "@/components/shared/MoneyDisplay";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getInvestorProjectDetails } from "../../actions";
import { formatMoney } from "@/lib/calculations";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

export default function InvestorProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);

  useEffect(() => {
    const s = localStorage.getItem("eleven_session");
    if (!s) { router.push("/login"); return; }
    const parsed = JSON.parse(s);
    setSession(parsed);

    getInvestorProjectDetails(params.id, parsed.email).then(res => {
      if (res.success && res.project) {
        setProject(res.project);
      } else {
        router.push("/investidor/projetos");
      }
      setLoading(false);
    });
  }, []);

  if (loading || !session || !project) return null;

  return (
    <DashboardLayout role="INVESTOR" userName={session.name} userEmail={session.email} pageTitle={project.name}>
      <div className="mb-6">
        <Link href="/investidor/projetos" className="inline-flex items-center gap-2 text-sm" style={{ color: "#A0A0A0", textDecoration: "none", fontFamily: "'Rajdhani', sans-serif" }}
          onMouseOver={(e) => (e.currentTarget as HTMLElement).style.color = "#F5C400"}
          onMouseOut={(e) => (e.currentTarget as HTMLElement).style.color = "#A0A0A0"}>
          <ArrowLeft size={14} /> Voltar
        </Link>
      </div>

      {/* Header */}
      <div className="rounded-[4px] p-5 mb-6" style={{ background: "#242424", border: "1px solid #333", borderLeft: "3px solid #F5C400" }}>
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <h1 style={{ color: "#FFFFFF", fontSize: "22px", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>{project.name}</h1>
          <StatusBadge status={project.status} />
        </div>
        <p style={{ color: "#A0A0A0", fontSize: "14px", fontFamily: "'Rajdhani', sans-serif", marginBottom: 16 }}>{project.product_name}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Capital Inicial", value: formatMoney(project.initial_capital) },
            { label: "Capital Atual", value: formatMoney(project.currentCapital) },
            { label: "Total Recebido", value: formatMoney(project.totalInvestorShare) },
            { label: "Ciclos", value: `${project.currentCycle}/${project.max_cycles}` },
          ].map((stat) => (
            <div key={stat.label} className="p-3 rounded-[2px]" style={{ background: "#1E1E1E", border: "1px solid #2A2A2A" }}>
              <p style={{ color: "#606060", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Rajdhani', sans-serif", marginBottom: 4 }}>{stat.label}</p>
              <p style={{ color: "#F5C400", fontSize: "18px", fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="section-divider mb-4">★ Histórico de Ciclos ★</div>

      <div className="space-y-3">
        {project.cycles.map((cycle: any) => (
          <div key={cycle.id} className="rounded-[4px] overflow-hidden" style={{ border: "1px solid #333" }}>
            <button
              onClick={() => setExpandedCycle(expandedCycle === cycle.id ? null : cycle.id)}
              className="w-full flex items-center justify-between px-5 py-4 transition-all"
              style={{ background: expandedCycle === cycle.id ? "#272727" : "#242424", border: "none", cursor: "pointer", borderLeft: "3px solid #F5C400" }}
            >
              <div className="text-left">
                <p style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "15px", fontFamily: "'Rajdhani', sans-serif" }}>★ {cycle.cycleName.toUpperCase()}</p>
                <p style={{ color: "#606060", fontSize: "12px", fontFamily: "'Rajdhani', sans-serif" }}>{cycle.quantity} unidades · {cycle.startDate}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p style={{ color: "#606060", fontSize: "11px", fontFamily: "'Rajdhani', sans-serif" }}>Sua parte</p>
                  <span style={{ color: "#F5C400", fontFamily: "'Roboto Mono', monospace", fontWeight: 700, fontSize: "14px" }}>{formatMoney(cycle.investor_profit_share)}</span>
                </div>
                {expandedCycle === cycle.id ? <ChevronUp size={16} style={{ color: "#606060" }} /> : <ChevronDown size={16} style={{ color: "#606060" }} />}
              </div>
            </button>

            {expandedCycle === cycle.id && (
              <div className="p-5 animate-fade-in" style={{ background: "#1E1E1E", borderTop: "1px solid #2A2A2A" }}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Capital Investido", value: formatMoney(cycle.total_investment) },
                    { label: "Faturamento do Lote", value: formatMoney(cycle.gross_revenue) },
                    { label: "Sua Parte do Lucro", value: formatMoney(cycle.investor_profit_share), accent: true },
                    { label: "Capital Próximo Ciclo", value: formatMoney(cycle.next_cycle_capital) },
                  ].map((stat) => (
                    <div key={stat.label} className="p-3 rounded-[2px]" style={{ background: "#242424", border: "1px solid #2A2A2A" }}>
                      <p style={{ color: "#606060", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Rajdhani', sans-serif", marginBottom: 4 }}>{stat.label}</p>
                      <p style={{ color: stat.accent ? "#F5C400" : "#FFFFFF", fontFamily: "'Roboto Mono', monospace", fontWeight: 700, fontSize: "15px" }}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
