"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { MoneyDisplay } from "@/components/shared/MoneyDisplay";
import { mockProjects, defaultTaxConfig } from "@/lib/mock-data";
import { getCycleName, formatMoney } from "@/lib/calculations";
import { ArrowLeft, ChevronDown, ChevronUp, Plus, CheckCircle, Clock, FileText, Download } from "lucide-react";
import { CycleModal } from "@/components/cycles/CycleModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"cycles" | "docs">("cycles");

  useEffect(() => {
    const s = localStorage.getItem("eleven_session");
    if (!s) { router.push("/login"); return; }
    setSession(JSON.parse(s));
  }, [router]);

  const project = mockProjects.find((p) => p.id === params.id) || mockProjects[0];

  if (!session) return null;

  const isAdmin = session.role === "ADMIN";

  const MOCK_DOCS = [
    { id: 1, name: "Autorização de Importação (CII)", date: "10/01/2025", type: "PDF", category: "Legal", size: "1.2 MB" },
    { id: 2, name: "Nota Fiscal de Entrada (Alfândega)", date: "25/01/2025", type: "PDF", category: "Fiscal", size: "850 KB" },
    { id: 3, name: "Termo de Vistoria do Exército", date: "05/02/2025", type: "PDF", category: "Conformidade", size: "2.4 MB" },
    { id: 4, name: "Certificado de Origem (Turquia)", date: "12/01/2025", type: "PDF", category: "Importação", size: "1.1 MB" },
    { id: 5, name: "Comprovante de Nacionalização", date: "10/02/2025", type: "PDF", category: "Fiscal", size: "540 KB" },
  ];

  return (
    <DashboardLayout role={isAdmin ? "ADMIN" : "INVESTOR"} userName={session.name} userEmail={session.email} pageTitle="Detalhe do Projeto">
      {/* Back */}
      <div className="mb-6">
        <Link
          href={isAdmin ? "/admin/projetos" : "/investidor/projetos"}
          className="inline-flex items-center gap-2 text-sm transition-all"
          style={{ color: "#A0A0A0", textDecoration: "none", fontFamily: "'Rajdhani', sans-serif" }}
        >
          <ArrowLeft size={14} /> Voltar aos Projetos
        </Link>
      </div>

      <div className="rounded-[4px] p-5 mb-6" style={{ background: "#242424", border: "1px solid #333", borderLeft: "3px solid #F5C400" }}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 style={{ color: "#FFFFFF", fontSize: "22px", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p style={{ color: "#A0A0A0", fontSize: "14px", fontFamily: "'Rajdhani', sans-serif" }}>{project.product_name} · Investidor: {project.investorName}</p>
          </div>
          {isAdmin && project.status === "ACTIVE" && (
            <button
              onClick={() => setShowCycleModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[2px] font-bold uppercase whitespace-nowrap"
              style={{ background: "#F5C400", color: "#1A1A1A", fontSize: "13px", letterSpacing: "0.1em", fontFamily: "'Rajdhani', sans-serif", border: "none", cursor: "pointer" }}
            >
              <Plus size={15} /> Registrar Ciclo
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          {[
            { label: "Capital Inicial", value: formatMoney(project.initial_capital) },
            { label: "Ciclo Atual", value: `${project.currentCycle}/${project.max_cycles}` },
            { label: "Faturamento Total", value: formatMoney(project.totalRevenue) },
            { label: "Saldo Investidor", value: formatMoney(project.totalInvestorShare) },
          ].map((stat) => (
            <div key={stat.label} className="p-3 rounded-[2px]" style={{ background: "#1E1E1E", border: "1px solid #2A2A2A" }}>
              <p style={{ color: "#606060", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, marginBottom: 4 }}>{stat.label}</p>
              <p style={{ color: "#F5C400", fontSize: "18px", fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mt-8 mb-4 border-b border-[#2A2A2A]">
        <button
          onClick={() => setActiveTab("cycles")}
          className={cn(
            "px-6 py-3 font-bold text-xs uppercase tracking-widest font-rajdhani transition-all outline-none",
            activeTab === "cycles" ? "text-brand-accent border-b-2 border-brand-accent bg-brand-accent/5" : "text-brand-text-muted hover:text-white"
          )}
        >
          ★ Timeline de Ciclos
        </button>
        <button
          onClick={() => setActiveTab("docs")}
          className={cn(
            "px-6 py-3 font-bold text-xs uppercase tracking-widest font-rajdhani transition-all outline-none",
            activeTab === "docs" ? "text-brand-accent border-b-2 border-brand-accent bg-brand-accent/5" : "text-brand-text-muted hover:text-white"
          )}
        >
          Documentos Anexos
        </button>
      </div>

      {activeTab === "cycles" ? (
        <div className="space-y-3 animate-fade-in">
          {project.cycles.map((cycle: any) => (
            <div key={cycle.id} className="rounded-[4px] overflow-hidden" style={{ border: "1px solid #333" }}>
              <button
                onClick={() => setExpandedCycle(expandedCycle === cycle.id ? null : cycle.id)}
                className="w-full flex items-center justify-between px-5 py-4 transition-all"
                style={{ background: expandedCycle === cycle.id ? "#272727" : "#242424", border: "none", cursor: "pointer", borderLeft: "3px solid #F5C400" }}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} style={{ color: "#4CAF50", flexShrink: 0 }} />
                  <div className="text-left">
                    <p style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "15px", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.05em" }}>
                      ★ {cycle.cycleName.toUpperCase()}
                    </p>
                    <p style={{ color: "#606060", fontSize: "12px", fontFamily: "'Rajdhani', sans-serif" }}>
                      {cycle.quantity} un · Câmbio: R$ {cycle.exchangeRateUsd?.toFixed(2)} · {cycle.startDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={cycle.status === "COMPLETED" ? "COMPLETED" : "PENDING"} />
                  {expandedCycle === cycle.id ? <ChevronUp size={16} style={{ color: "#606060" }} /> : <ChevronDown size={16} style={{ color: "#606060" }} />}
                </div>
              </button>

              {expandedCycle === cycle.id && (
                <div className="p-5 animate-fade-in" style={{ background: "#1E1E1E", borderTop: "1px solid #2A2A2A" }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p style={{ color: "#F5C400", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, marginBottom: 12 }}>Importação</p>
                      <div className="space-y-2">
                        {[
                          ["Valor Aduaneiro", cycle.customsValueBRL],
                          ["Imposto de Importação (18%)", cycle.ii],
                          ["IPI (55%)", cycle.ipi],
                          ["PIS-PASEP (2,1%)", cycle.pisPasep],
                          ["COFINS (9,65%)", cycle.cofins],
                          ["Taxa Siscomex", cycle.siscomex],
                          ["Custo Operacional", cycle.opCost],
                          ["ICMS Importação (25%)", cycle.icmsImport],
                        ].map(([label, value]) => (
                          <div key={label as string} className="flex justify-between items-center py-1" style={{ borderBottom: "1px solid #2A2A2A" }}>
                            <span style={{ color: "#A0A0A0", fontSize: "13px", fontFamily: "'Rajdhani', sans-serif" }}>{label}</span>
                            <span style={{ color: "#FFFFFF", fontFamily: "'Roboto Mono', monospace", fontSize: "13px" }}>{formatMoney(value as number)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center py-2 mt-1" style={{ borderTop: "2px solid #F5C400" }}>
                          <span style={{ color: "#F5C400", fontSize: "14px", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.05em" }}>CUSTO TOTAL DO LOTE</span>
                          <MoneyDisplay value={cycle.totalInvestment} size="md" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <p style={{ color: "#F5C400", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, marginBottom: 12 }}>Resultado da Venda</p>
                      <div className="space-y-2">
                        {[
                          ["Faturamento Bruto", cycle.grossRevenue],
                          ["Tributação (4.5%)", cycle.salesTax],
                          ["Custo Operacional (8%)", cycle.salesOpCost],
                          ["Saldo Apurado", cycle.netBalance],
                        ].map(([label, value]) => (
                          <div key={label as string} className="flex justify-between items-center py-1" style={{ borderBottom: "1px solid #2A2A2A" }}>
                            <span style={{ color: "#A0A0A0", fontSize: "13px", fontFamily: "'Rajdhani', sans-serif" }}>{label}</span>
                            <span style={{ color: "#FFFFFF", fontFamily: "'Roboto Mono', monospace", fontSize: "13px" }}>{formatMoney(value as number)}</span>
                          </div>
                        ))}
                      </div>

                      <p style={{ color: "#F5C400", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, marginTop: 20, marginBottom: 12 }}>Distribuição Financeira</p>
                      <div className="space-y-2">
                        {[
                          ["Saldo a dividir", cycle.profitToSplit, false],
                          [`Investidor (${(project.profit_split_pct * 100).toFixed(0)}%)`, cycle.investorShare, true],
                          [`Empresa (${((1 - project.profit_split_pct) * 100).toFixed(0)}%)`, cycle.companyShare, false],
                        ].map(([label, value, accent]) => (
                          <div key={label as string} className="flex justify-between items-center py-1" style={{ borderBottom: "1px solid #2A2A2A" }}>
                            <span style={{ color: accent ? "#F5C400" : "#A0A0A0", fontSize: "13px", fontFamily: "'Rajdhani', sans-serif", fontWeight: accent ? 700 : 400 }}>{label}</span>
                            <span style={{ color: accent ? "#F5C400" : "#FFFFFF", fontFamily: "'Roboto Mono', monospace", fontSize: "13px" }}>{formatMoney(value as number)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center py-2 mt-1" style={{ borderTop: "2px solid #4CAF50" }}>
                          <span style={{ color: "#4CAF50", fontSize: "14px", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>PRÓXIMO CICLO</span>
                          <span style={{ color: "#4CAF50", fontFamily: "'Roboto Mono', monospace", fontSize: "14px", fontWeight: 700 }}>{formatMoney(cycle.nextCycleCapital)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {project.status === "ACTIVE" && (
            <div className="rounded-[4px] p-5 flex items-center gap-4" style={{ background: "#1E1E1E", border: "1px dashed #333", borderLeft: "3px dashed #F5C400" }}>
              <Clock size={18} style={{ color: "#F5C400" }} />
              <div>
                <p style={{ color: "#A0A0A0", fontFamily: "'Rajdhani', sans-serif", fontSize: "15px", fontWeight: 600 }}>
                  {getCycleName(project.currentCycle)} — Aguardando registro
                </p>
                <p style={{ color: "#606060", fontSize: "12px", fontFamily: "'Rajdhani', sans-serif" }}>
                  Ciclo {project.currentCycle + 1} de {project.max_cycles}
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowCycleModal(true)}
                  className="ml-auto px-4 py-2 rounded-[2px] font-bold uppercase text-sm"
                  style={{ background: "rgba(245,196,0,0.1)", color: "#F5C400", border: "1px solid rgba(245,196,0,0.3)", cursor: "pointer" }}
                >
                  Registrar
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="animate-fade-in">
          <Card className="p-0 overflow-hidden bg-brand-surface/20 border-brand-border">
            <div className="p-4 border-b border-brand-border bg-brand-surface/30 flex justify-between items-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">Documentação Legal e Comprovação Material da Operação</p>
              {isAdmin && (
                <Button size="sm" variant="secondary" className="h-8 text-[10px] gap-2">
                  <Plus size={14} /> ANEXAR NOVO
                </Button>
              )}
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-surface/50 border-b border-brand-border">
                  <th className="p-4 text-[11px] font-bold uppercase text-brand-text-secondary font-rajdhani tracking-widest">Documento</th>
                  <th className="p-4 text-[11px] font-bold uppercase text-brand-text-secondary font-rajdhani tracking-widest">Categoria</th>
                  <th className="p-4 text-[11px] font-bold uppercase text-brand-text-secondary font-rajdhani tracking-widest">Data Upload</th>
                  <th className="p-4 text-[11px] font-bold uppercase text-brand-text-secondary font-rajdhani tracking-widest text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_DOCS.map((doc) => (
                  <tr key={doc.id} className="border-b border-brand-border/50 hover:bg-brand-accent/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-surface rounded border border-brand-border text-brand-text-muted group-hover:text-brand-accent transition-colors">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold uppercase text-white font-rajdhani tracking-tight">{doc.name}</p>
                          <p className="text-[10px] text-brand-text-muted font-bold uppercase font-mono">{doc.type} · {doc.size}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-brand-bg border border-brand-border text-brand-text-secondary">
                        {doc.category}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-mono text-brand-text-muted">{doc.date}</td>
                    <td className="p-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-brand-accent hover:bg-brand-accent/10 gap-2 font-bold uppercase text-[10px]"
                        onClick={() => toast.success(`Iniciando download seguro: ${doc.name}`)}
                      >
                         Visualizar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-6 text-center border-t border-brand-border/30">
               <p className="text-[10px] text-brand-text-muted uppercase font-bold tracking-[0.2em] leading-relaxed">
                 A Eleven Firearms garante a integridade e autenticidade de todos os documentos anexados.<br/>
                 Estes arquivos são para consulta exclusiva do investidor e não podem ser alterados ou removidos.
               </p>
            </div>
          </Card>
        </div>
      )}

      {showCycleModal && (
        <CycleModal
          projectName={project.name}
          cycleNumber={project.currentCycle}
          splitPct={project.profit_split_pct}
          taxConfig={defaultTaxConfig}
          onClose={() => setShowCycleModal(false)}
          onSave={() => {
            toast.success("Ciclo registrado com sucesso!");
            setShowCycleModal(false);
          }}
        />
      )}
    </DashboardLayout>
  );
}
