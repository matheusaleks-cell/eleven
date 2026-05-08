"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MoneyDisplay } from "@/components/shared/MoneyDisplay";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { mockUsers, mockProjects } from "@/lib/mock-data";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatMoney } from "@/lib/calculations";

export default function InvestorDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const s = localStorage.getItem("eleven_session");
    if (!s) { router.push("/login"); return; }
    setSession(JSON.parse(s));
  }, []);

  const investor = mockUsers.find((u) => u.id === params.id) || mockUsers[1];
  const projects = mockProjects.filter((p) => p.investor_id === investor.id);
  const totalReceived = projects.reduce((a, p) => a + p.totalInvestorShare, 0);
  const totalInvested = projects.reduce((a, p) => a + p.initial_capital, 0);

  if (!session) return null;

  return (
    <DashboardLayout role="ADMIN" userName={session.name} userEmail={session.email} pageTitle="Detalhe do Investidor">
      <div className="mb-6">
        <Link href="/admin/investors" className="inline-flex items-center gap-2 text-sm transition-all" style={{ color: "#A0A0A0", textDecoration: "none", fontFamily: "'Rajdhani', sans-serif" }}
          onMouseOver={(e) => (e.currentTarget as HTMLElement).style.color = "#F5C400"}
          onMouseOut={(e) => (e.currentTarget as HTMLElement).style.color = "#A0A0A0"}>
          <ArrowLeft size={14} /> Voltar
        </Link>
      </div>

      {/* Investor header */}
      <div className="rounded-[4px] p-5 mb-6" style={{ background: "#242424", border: "1px solid #333", borderLeft: "3px solid #F5C400" }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center justify-center rounded-full" style={{ width: 56, height: 56, background: "rgba(245,196,0,0.1)", border: "2px solid rgba(245,196,0,0.3)", color: "#F5C400", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "22px" }}>
            {investor.name.charAt(0)}
          </div>
          <div>
            <h1 style={{ color: "#FFFFFF", fontSize: "22px", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>{investor.name}</h1>
            <p style={{ color: "#606060", fontSize: "13px", fontFamily: "'Roboto Mono', monospace" }}>{investor.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Projetos", value: projects.length.toString() },
            { label: "Capital Inicial Total", value: formatMoney(totalInvested) },
            { label: "Total Recebido", value: formatMoney(totalReceived) },
            { label: "Rentabilidade", value: `${totalInvested > 0 ? ((totalReceived / totalInvested) * 100).toFixed(1) : "0"}%` },
          ].map((stat) => (
            <div key={stat.label} className="p-3 rounded-[2px]" style={{ background: "#1E1E1E", border: "1px solid #2A2A2A" }}>
              <p style={{ color: "#606060", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", marginBottom: 4 }}>{stat.label}</p>
              <p style={{ color: "#F5C400", fontSize: "18px", fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Projects */}
      <div className="section-divider mb-4">★ Projetos do Investidor ★</div>
      <div className="space-y-3">
        {projects.map((project) => (
          <div key={project.id} className="rounded-[4px] p-4" style={{ background: "#242424", border: "1px solid #333" }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p style={{ fontWeight: 600, fontFamily: "'Rajdhani', sans-serif", fontSize: "16px", color: "#FFFFFF" }}>{project.name}</p>
                <p style={{ color: "#606060", fontSize: "12px", fontFamily: "'Rajdhani', sans-serif" }}>{project.product_name} · Ciclo {project.currentCycle}/{project.max_cycles}</p>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={project.status} />
                <div className="text-right">
                  <p style={{ color: "#606060", fontSize: "11px", fontFamily: "'Rajdhani', sans-serif" }}>Saldo Investidor</p>
                  <MoneyDisplay value={project.totalInvestorShare} size="md" />
                </div>
                <Link href={`/admin/projects/${project.id}`} className="px-3 py-1.5 rounded-[2px] text-xs font-bold uppercase" style={{ border: "1px solid #F5C400", color: "#F5C400", fontFamily: "'Rajdhani', sans-serif", textDecoration: "none" }}>Ver</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
