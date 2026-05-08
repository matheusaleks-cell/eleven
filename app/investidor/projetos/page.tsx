"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MoneyDisplay } from "@/components/shared/MoneyDisplay";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { mockProjects } from "@/lib/mock-data";
import Link from "next/link";

export default function InvestorProjectsPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const s = localStorage.getItem("eleven_session");
    if (!s) { router.push("/login"); return; }
    const parsed = JSON.parse(s);
    if (parsed.role !== "INVESTOR") { router.push("/admin"); return; }
    setSession(parsed);
  }, []);

  const myProjects = mockProjects.filter((p) => p.investor_id === "user-francisco");

  if (!session) return null;

  return (
    <DashboardLayout role="INVESTOR" userName={session.name} userEmail={session.email} pageTitle="Meus Projetos">
      <div className="mb-6">
        <h1 style={{ color: "#FFFFFF", fontSize: "24px", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>Meus Projetos</h1>
        <p style={{ color: "#606060", fontSize: "14px", fontFamily: "'Rajdhani', sans-serif" }}>{myProjects.length} projetos vinculados à sua conta</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {myProjects.map((project) => (
          <Link key={project.id} href={`/investor/projects/${project.id}`} style={{ textDecoration: "none" }}>
            <div
              className="rounded-[4px] p-5 transition-all h-full"
              style={{ background: "#242424", border: "1px solid #333", borderLeft: "3px solid #333", cursor: "pointer" }}
              onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#F5C400"; (e.currentTarget as HTMLElement).style.borderLeft = "3px solid #F5C400"; }}
              onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#333"; (e.currentTarget as HTMLElement).style.borderLeft = "3px solid #333"; }}
            >
              <div className="flex items-start justify-between mb-2">
                <p style={{ fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", fontSize: "16px", color: "#FFFFFF" }}>{project.name}</p>
                <StatusBadge status={project.status} />
              </div>
              <p style={{ color: "#606060", fontSize: "12px", fontFamily: "'Rajdhani', sans-serif", marginBottom: 16 }}>{project.product_name}</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Capital Inicial", value: <MoneyDisplay value={project.initial_capital} size="sm" /> },
                  { label: "Capital Atual", value: <MoneyDisplay value={project.currentCapital} size="sm" /> },
                  { label: "Saldo Recebido", value: <MoneyDisplay value={project.totalInvestorShare} size="sm" /> },
                  { label: "Ciclo", value: <span style={{ color: "#F5C400", fontFamily: "'Roboto Mono', monospace", fontWeight: 700 }}>{project.currentCycle}/{project.max_cycles}</span> },
                ].map((stat) => (
                  <div key={stat.label} className="p-2 rounded-[2px]" style={{ background: "#1E1E1E" }}>
                    <p style={{ color: "#606060", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", marginBottom: 2 }}>{stat.label}</p>
                    {stat.value}
                  </div>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
}
