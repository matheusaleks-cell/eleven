"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { MoneyDisplay } from "@/components/shared/MoneyDisplay";
import { getCycleName, formatMoney } from "@/lib/calculations";
import { ArrowLeft, ChevronDown, ChevronUp, Plus, CheckCircle, Clock, FileText, Download } from "lucide-react";
import { CycleModal } from "@/components/cycles/CycleModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getProjectById, createCycle } from "../actions";
import { uploadDocument, getProjectDocuments, deleteDocument } from "../document-actions";
import { getTaxConfigs } from "../../configuracoes/actions";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"cycles" | "docs">("cycles");

  const [project, setProject] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState("Legal");
  const [isUploading, setIsUploading] = useState(false);
  const [realTaxConfig, setRealTaxConfig] = useState<any>(null);

  useEffect(() => {
    const s = localStorage.getItem("eleven_session");
    if (s) setSession(JSON.parse(s));
    
    fetchProject();
    fetchTaxes();
  }, []);

  async function fetchTaxes() {
    const res = await getTaxConfigs();
    if (res.success && res.configs.length > 0) {
      const active = res.configs.find((c: any) => c.isDefault) || res.configs[0];
      setRealTaxConfig({
        name: active.name,
        ii_rate: active.ii / 100,
        ipi_rate: active.ipi / 100,
        pis_rate: active.pisPasep / 100,
        cofins_rate: active.cofins / 100,
        icms_rate: active.icmsImport / 100,
        icms_factor: 0.75, // Ajuste fixo temporário
        siscomex_fixed: active.siscomexFixed,
        operational_fixed: 7884.00,
        sales_tax_rate: (active.icmsSale + active.simplesNacional) / 100,
        sales_op_rate: 0.15
      });
    }
  }

  async function fetchProject() {
    setLoading(true);
    try {
      const data = await getProjectById(id);
      if (data) {
        setProject(data);
        fetchDocs(data.id);
      } else {
        toast.error("Projeto não encontrado");
        router.push("/admin/projetos");
      }
    } catch (error) {
      toast.error("Erro ao carregar projeto");
    } finally {
      setLoading(false);
    }
  }

  async function fetchDocs(pid: string) {
    const res = await getProjectDocuments(pid);
    if (res.success) {
      setDocuments(res.documents);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      toast.error("Selecione um arquivo para upload.");
      return;
    }
    
    setIsUploading(true);
    try {
      // Converter para base64
      const reader = new FileReader();
      reader.readAsDataURL(uploadFile);
      reader.onload = async () => {
        const base64 = reader.result as string;
        const sizeMb = (uploadFile.size / (1024 * 1024)).toFixed(2);
        
        const res = await uploadDocument({
          name: uploadFile.name,
          type: uploadFile.type.includes("pdf") ? "PDF" : uploadFile.type.includes("image") ? "IMAGEM" : "ARQUIVO",
          category: uploadCategory,
          size: `${sizeMb} MB`,
          base64Data: base64,
          projectId: project.id
        });

        if (res.success) {
          toast.success("Documento salvo com sucesso no servidor!");
          setIsUploadModalOpen(false);
          setUploadFile(null);
          fetchDocs(project.id);
        } else {
          toast.error("Erro ao fazer upload: " + res.error);
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast.error("Falha ao ler o arquivo.");
        setIsUploading(false);
      };
    } catch (err) {
      toast.error("Erro inesperado no upload.");
      setIsUploading(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (confirm("Deseja realmente excluir este documento?")) {
      const res = await deleteDocument(id, project.id);
      if (res.success) {
        toast.success("Documento excluído.");
        fetchDocs(project.id);
      } else {
        toast.error("Falha ao excluir documento.");
      }
    }
  };

  const handleDownloadDoc = (doc: any) => {
    toast.success(`Iniciando download seguro: ${doc.name}`);
    const link = document.createElement("a");
    link.href = doc.base64Data;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveCycle = async (data: any) => {
    // Strip BRL currency mask (e.g. "R$ 6.000,00" → 6000)
    const cleanBRL = (val: string | number): number => {
      if (typeof val === "number") return val;
      return Number(val.replace(/\D/g, "")) / 100 || 0;
    };

    try {
      const result = await createCycle({
        projectId: project.id,
        cycleNumber: project.currentCycle + 1,
        cycleName: getCycleName(project.currentCycle),
        ...data.result,
        quantity: parseFloat(data.qty),
        salePricePerUnit: cleanBRL(data.price),
        exchangeRateUsd: cleanBRL(data.rate),
        fobValueUsd: cleanBRL(data.fob),
        freightUsd: cleanBRL(data.freight),
        insuranceUsd: cleanBRL(data.insurance),
      });

      if (result.success) {
        toast.success("Ciclo registrado com sucesso!");
        setShowCycleModal(false);
        fetchProject();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro ao registrar ciclo");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111111]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#F5C400] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#F5C400] font-bold uppercase tracking-widest text-[10px] animate-pulse">Carregando Projeto...</p>
        </div>
      </div>
    );
  }

  if (!session || !project) return null;

  const isAdmin = session.role === "ADMIN";
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
            { label: "Capital Inicial", value: formatMoney(project.initialCapital) },
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
                      {cycle.quantity} un · Câmbio: R$ {cycle.exchangeRateUsd?.toFixed(2)} · {new Date(cycle.createdAt).toLocaleDateString("pt-BR")}
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
                          ["Valor Aduaneiro", cycle.customsValueBrl],
                          ["Imposto de Importação (18%)", cycle.iiTax],
                          ["IPI (55%)", cycle.ipiTax],
                          ["PIS-PASEP (2,1%)", cycle.pisPasepTax],
                          ["COFINS (9,65%)", cycle.cofinsTax],
                          ["Taxa Siscomex", cycle.siscomexFee],
                          ["Custo Operacional", cycle.operationalCost],
                          ["ICMS Importação (25%)", cycle.icmsImportTax],
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
                          ["Custo Operacional (8%)", cycle.salesOperationalCost],
                          ["Saldo Apurado", cycle.netRevenue],
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
                          ["Saldo a dividir", cycle.grossProfit, false],
                          [`Investidor (${(project.profitSplitPct * 100).toFixed(0)}%)`, cycle.investorShare, true],
                          [`Empresa (${((1 - project.profitSplitPct) * 100).toFixed(0)}%)`, cycle.companyShare, false],
                        ].map(([label, value, accent]) => (
                          <div key={label as string} className="flex justify-between items-center py-1" style={{ borderBottom: "1px solid #2A2A2A" }}>
                            <span style={{ color: accent ? "#F5C400" : "#A0A0A0", fontSize: "13px", fontFamily: "'Rajdhani', sans-serif", fontWeight: accent ? 700 : 400 }}>{label}</span>
                            <span style={{ color: accent ? "#F5C400" : "#FFFFFF", fontFamily: "'Roboto Mono', monospace", fontSize: "13px" }}>{formatMoney(value as number)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center py-2 mt-1" style={{ borderTop: "2px solid #4CAF50" }}>
                          <span style={{ color: "#4CAF50", fontSize: "14px", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>PRÓXIMO CICLO</span>
                          <span style={{ color: "#4CAF50", fontFamily: "'Roboto Mono', monospace", fontSize: "14px", fontWeight: 700 }}>{formatMoney(cycle.reinvestmentShare)}</span>
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
                <Button size="sm" variant="secondary" className="h-8 text-[10px] gap-2" onClick={() => setIsUploadModalOpen(true)}>
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
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-brand-text-muted text-xs uppercase font-bold tracking-widest">
                      Nenhum documento anexado a este projeto.
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
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
                      <td className="p-4 text-xs font-mono text-brand-text-muted">{new Date(doc.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isAdmin && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-brand-danger hover:bg-brand-danger/10 gap-2 font-bold uppercase text-[10px]"
                              onClick={() => handleDeleteDoc(doc.id)}
                            >
                              Excluir
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-brand-accent hover:bg-brand-accent/10 gap-2 font-bold uppercase text-[10px]"
                            onClick={() => handleDownloadDoc(doc)}
                          >
                             Visualizar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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
          splitPct={project.profitSplitPct}
          taxConfig={realTaxConfig || {
            name: "Padrão (Fallback)",
            ii_rate: 0.18, ipi_rate: 0.55, pis_rate: 0.021, cofins_rate: 0.0965,
            icms_rate: 0.25, icms_factor: 0.75, siscomex_fixed: 154.23, operational_fixed: 7884,
            sales_tax_rate: 0.11, sales_op_rate: 0.15
          }}
          plannedCapital={
            project.cycles.length === 0
              ? project.initialCapital
              : project.cycles[project.cycles.length - 1].reinvestmentShare
          }
          onClose={() => setShowCycleModal(false)}
          onSave={handleSaveCycle}
        />
      )}

      {/* Upload Modal */}
      <Dialog 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        title="Anexar Documento do Projeto"
      >
        <div className="space-y-4">
          <p className="text-xs text-brand-text-muted font-bold uppercase">Todos os documentos enviados ficam vinculados a este projeto e ficam visíveis ao investidor.</p>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-brand-text-muted">Categoria do Documento</label>
            <select 
              className="w-full bg-brand-input border border-brand-border rounded-military px-4 py-2 text-sm text-white outline-none focus:border-brand-accent"
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
            >
              <option value="Legal">Legal (Contratos, Termos)</option>
              <option value="Fiscal">Fiscal (NF-e, GRU)</option>
              <option value="Importação">Importação (CII, DI)</option>
              <option value="Conformidade">Conformidade (Exército, Polícia)</option>
              <option value="Financeiro">Financeiro (Comprovantes Pix)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-brand-text-muted">Arquivo (PDF, Imagem, etc)</label>
            <input 
              type="file" 
              onChange={handleFileChange}
              className="w-full text-sm text-brand-text-muted file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-bold file:bg-brand-accent/10 file:text-brand-accent hover:file:bg-brand-accent/20 cursor-pointer"
            />
            {uploadFile && <p className="text-xs text-brand-success font-bold mt-2">Arquivo selecionado: {uploadFile.name}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-brand-border mt-4">
            <Button variant="ghost" onClick={() => setIsUploadModalOpen(false)} className="text-[10px]">CANCELAR</Button>
            <Button onClick={handleUploadSubmit} disabled={isUploading || !uploadFile} className="gap-2 text-[10px]">
              {isUploading ? "ENVIANDO..." : "SALVAR NO BANCO"}
            </Button>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
