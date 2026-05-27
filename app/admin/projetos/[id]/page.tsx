"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { MoneyDisplay } from "@/components/shared/MoneyDisplay";
import { getCycleName, formatMoney } from "@/lib/calculations";
import { ArrowLeft, ChevronDown, ChevronUp, Plus, CheckCircle, Clock, FileText, Download, Trash2, DollarSign, Ship, Globe } from "lucide-react";
import { CycleModal } from "@/components/cycles/CycleModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getProjectById, createCycle } from "../actions";
import { uploadDocument, getProjectDocuments, deleteDocument } from "../document-actions";
import { getTaxConfigs } from "../../configuracoes/actions";
import { addLotDocument, deleteLotDocument, updateDocumentRealizedFields } from "../../importacao/lotes/actions";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";

const DOCUMENT_GROUPS = [
  {
    id: "pagamento",
    title: "1. PAGAMENTO & INÍCIO (FOB)",
    description: "Invoice, Packing List e Swift de Câmbio",
    icon: <DollarSign size={14} />,
    items: [
      "INVOICE",
      "PACKING LIST",
      "SWIFT – COMPROVANTE DE PAGTO/CÂMBIO"
    ]
  },
  {
    id: "embarque",
    title: "2. EMBARQUE & TRÂNSITO",
    description: "Conhecimento de embarque internacional",
    icon: <Ship size={14} />,
    items: [
      "AWB EMBARQUE"
    ]
  },
  {
    id: "aduana",
    title: "3. ADUANA & DESEMBARAÇO",
    description: "Licenças, vistorias e recolhimento de impostos federais/estaduais",
    icon: <Globe size={14} />,
    items: [
      "LICENÇA DE IMPORTAÇÃO / LPCO",
      "TERMO DE VISTORIA EXÉRCITO BRASILEIRO",
      "PAGTO TRIBUTOS FEDERAIS",
      "PAGTO GARE ICMS",
      "PGTO ARMAZENAGEM"
    ]
  },
  {
    id: "recebido",
    title: "4. RECEBIDO & ESTOQUE",
    description: "NFe de entrada no depósito nacional",
    icon: <CheckCircle size={14} />,
    items: [
      "NFe ENTRADA"
    ]
  }
];

interface LotDocumentCardProps {
  requiredCat: string;
  globalIdx: number;
  doc: any;
  lotId: string;
  onRefresh?: () => void;
  updating: boolean;
  setUpdating: (v: boolean) => void;
  isAdmin: boolean;
}

const LotDocumentCard: React.FC<LotDocumentCardProps> = ({
  requiredCat,
  globalIdx,
  doc,
  lotId,
  onRefresh,
  updating,
  setUpdating,
  isAdmin
}) => {
  const [realizedValue, setRealizedValue] = useState(doc?.realizedValue ? String(doc.realizedValue) : "");
  const [realizedDate, setRealizedDate] = useState(doc?.realizedDate ? new Date(doc.realizedDate).toISOString().split('T')[0] : "");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setRealizedValue(doc?.realizedValue ? String(doc.realizedValue) : "");
    setRealizedDate(doc?.realizedDate ? new Date(doc.realizedDate).toISOString().split('T')[0] : "");
  }, [doc]);

  const handleSaveRealized = async () => {
    if (!doc) return;
    setUpdating(true);
    const val = realizedValue === "" ? null : Number(realizedValue);
    const res = await updateDocumentRealizedFields(doc.id, val, realizedDate || null);
    if (res.success) {
      toast.success("Dados de lançamento financeiro salvos!");
      setIsEditing(false);
      onRefresh?.();
    } else {
      toast.error(res.error || "Erro ao salvar.");
    }
    setUpdating(false);
  };

  return (
    <Card className={cn(
      "p-4 border flex flex-col justify-between min-h-[145px] transition-all",
      doc 
        ? "border-brand-success/30 bg-brand-success/[0.02] hover:border-brand-success/50" 
        : "border-dashed border-brand-border/60 bg-brand-surface/10 hover:border-brand-accent/40"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "p-2.5 rounded border transition-colors",
            doc 
              ? "bg-brand-success/10 border-brand-success/20 text-brand-success" 
              : "bg-brand-bg border-brand-border text-brand-text-muted"
          )}>
            <FileText size={18} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">
              {globalIdx}. {requiredCat}
            </span>
            {doc ? (
              <span className="text-xs font-bold text-white uppercase leading-tight truncate mt-0.5" title={doc.name}>
                {doc.name}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-brand-text-muted/60 uppercase mt-0.5">
                Aguardando upload...
              </span>
            )}
          </div>
        </div>
        
        {doc && (
          <span className="text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider bg-brand-success/10 text-brand-success border-brand-success/20 shrink-0">
            ANEXADO
          </span>
        )}
      </div>

      {doc && (
        <div className="my-2 p-1.5 bg-brand-bg/40 rounded border border-brand-border/40 space-y-1.5">
          <div className="flex justify-between items-center text-[7px] font-bold text-brand-text-muted uppercase">
            <span>LANÇAMENTO FINANCEIRO</span>
            {isAdmin && (
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-brand-accent uppercase hover:underline text-[9px]"
              >
                {isEditing ? "Cancelar" : "Editar"}
              </button>
            )}
          </div>

          {isEditing && isAdmin ? (
            <div className="grid grid-cols-2 gap-1.5">
              <div className="space-y-0.5">
                <span className="text-[6px] font-bold text-brand-text-muted uppercase">Valor (R$)</span>
                <input 
                  type="number" 
                  step="any"
                  value={realizedValue} 
                  onChange={(e) => setRealizedValue(e.target.value)} 
                  placeholder="0.00"
                  className="w-full bg-[#0F0F0F] border border-brand-border rounded text-[9px] p-0.5 text-white font-mono outline-none focus:border-brand-accent"
                />
              </div>
              <div className="space-y-0.5">
                <span className="text-[6px] font-bold text-brand-text-muted uppercase">Data</span>
                <div className="flex gap-1">
                  <input 
                    type="date" 
                    value={realizedDate} 
                    onChange={(e) => setRealizedDate(e.target.value)} 
                    className="w-full bg-[#0F0F0F] border border-brand-border rounded text-[9px] p-0.5 text-white outline-none focus:border-brand-accent font-mono"
                  />
                  <button 
                    onClick={handleSaveRealized}
                    disabled={updating}
                    className="px-1.5 bg-brand-accent text-brand-bg rounded font-black text-[7px] uppercase hover:bg-brand-accent-hover transition-colors"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center text-[8px]">
              <div className="flex items-center gap-1">
                <span className="text-brand-text-secondary uppercase">Real:</span>
                <span className="font-mono text-white font-bold">
                  {doc.realizedValue !== null && doc.realizedValue !== undefined
                    ? `R$ ${Number(doc.realizedValue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "R$ 0,00"
                  }
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-brand-text-secondary uppercase">Data:</span>
                <span className="font-mono text-white">
                  {doc.realizedDate 
                    ? new Date(doc.realizedDate).toLocaleDateString('pt-BR')
                    : new Date(doc.createdAt).toLocaleDateString('pt-BR')
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-brand-border/30">
        <span className="text-[9px] text-brand-text-muted font-mono uppercase">{doc ? (doc.size || "PDF") : "PENDENTE"}</span>
        <div className="flex items-center gap-2">
          {doc ? (
            <>
              {isAdmin && (
                <button
                  onClick={() => {
                    if (confirm(`Deseja realmente excluir o documento "${doc.name}"?`)) {
                      deleteLotDocument(doc.id).then(res => {
                        if (res.success) {
                          toast.success("Documento removido!");
                          onRefresh?.();
                        } else {
                          toast.error("Erro ao excluir documento.");
                        }
                      });
                    }
                  }}
                  className="p-1 hover:text-brand-danger text-brand-text-muted transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={13} />
                </button>
              )}
              <button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = doc.base64Data;
                  link.download = doc.name;
                  link.click();
                  toast.success("Download iniciado!");
                }}
                className="p-1 hover:text-brand-accent text-brand-text-muted transition-colors"
                title="Baixar"
              >
                <Download size={13} />
              </button>
            </>
          ) : (
            <>
              {isAdmin ? (
                <label className="flex items-center gap-1.5 px-3 py-1 rounded bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-[9px] font-black uppercase cursor-pointer hover:bg-brand-accent/20 transition-all">
                  <Plus size={11} /> ANEXAR
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="application/pdf,image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const maxSizeBytes = 4.5 * 1024 * 1024;
                        if (file.size > maxSizeBytes) {
                          const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
                          toast.error(`Arquivo muito grande (${sizeMb} MB). Limite máximo de 4.5 MB. Comprima o arquivo ou use uma imagem menor.`);
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                          try {
                            const base64 = reader.result as string;
                            const res = await addLotDocument(lotId, file.name, requiredCat, base64);
                            if (res.success) {
                              toast.success(`Documento "${requiredCat}" anexado com sucesso!`);
                              onRefresh?.();
                            } else {
                              toast.error("Erro ao fazer upload. Verifique as dimensões ou tente novamente.");
                            }
                          } catch (err) {
                            console.error("Erro de upload no client:", err);
                            toast.error("Erro de rede ou payload muito grande. Tente comprimir o arquivo.");
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              ) : (
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded border border-brand-border/40 text-brand-text-muted/40 uppercase tracking-wider bg-[#151515]">
                  AGUARDANDO
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"cycles" | "import" | "docs">("cycles");
  const [updatingLotDoc, setUpdatingLotDoc] = useState(false);

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
          projectId: project.id,
          userId: project.investorId
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
        importLotId: data.importLotId,
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
          onClick={() => setActiveTab("import")}
          className={cn(
            "px-6 py-3 font-bold text-xs uppercase tracking-widest font-rajdhani transition-all outline-none",
            activeTab === "import" ? "text-brand-accent border-b-2 border-brand-accent bg-brand-accent/5" : "text-brand-text-muted hover:text-white"
          )}
        >
          Processo de Importação
        </button>
        <button
          onClick={() => setActiveTab("docs")}
          className={cn(
            "px-6 py-3 font-bold text-xs uppercase tracking-widest font-rajdhani transition-all outline-none",
            activeTab === "docs" ? "text-brand-accent border-b-2 border-brand-accent bg-brand-accent/5" : "text-brand-text-muted hover:text-white"
          )}
        >
          Contratos & Anexos
        </button>
      </div>

      {activeTab === "cycles" && (
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
                          ["Tributação (8%)", cycle.salesTax],
                          ["Custo Operacional (15%)", cycle.salesOperationalCost],
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
      )}

      {activeTab === "import" && (() => {
        const activeLot = project.importLots?.[0];
        if (!activeLot) {
          return (
            <div className="bg-brand-surface/20 border border-brand-border p-8 rounded-xl text-center">
              <Ship size={48} className="mx-auto text-brand-text-muted mb-4 opacity-20" />
              <p className="text-[11px] font-black text-brand-text-muted uppercase tracking-widest">
                Nenhum processo de importação registrado para este projeto.
              </p>
            </div>
          );
        }

        const fobBrl = (activeLot.fobValue || 0) * (activeLot.exchangeRate || 1);
        const taxesEst = activeLot.customsTaxes || (fobBrl * 0.48);
        const freightBrl = (activeLot.freight || 0) * (activeLot.exchangeRate || 1);
        const insuranceBrl = (activeLot.insurance || 0) * (activeLot.exchangeRate || 1);
        const feesEst = activeLot.customsFees || 7884;
        const totalDdp = fobBrl + taxesEst + freightBrl + insuranceBrl + feesEst;

        const docSwift = activeLot.documents?.find((d: any) => d.category === "SWIFT – COMPROVANTE DE PAGTO/CÂMBIO");
        const docInvoice = activeLot.documents?.find((d: any) => d.category === "INVOICE");
        const realizedFob = docSwift?.realizedValue ?? docInvoice?.realizedValue ?? 0;

        const docAwb = activeLot.documents?.find((d: any) => d.category === "AWB EMBARQUE");
        const realizedFreight = docAwb?.realizedValue ?? 0;

        const docTributos = activeLot.documents?.find((d: any) => d.category === "PAGTO TRIBUTOS FEDERAIS");
        const docIcms = activeLot.documents?.find((d: any) => d.category === "PAGTO GARE ICMS");
        const realizedTaxes = (docTributos?.realizedValue ?? 0) + (docIcms?.realizedValue ?? 0);

        const docLpco = activeLot.documents?.find((d: any) => d.category === "LICENÇA DE IMPORTAÇÃO / LPCO");
        const docVistoria = activeLot.documents?.find((d: any) => d.category === "TERMO DE VISTORIA EXÉRCITO BRASILEIRO");
        const docArmazenagem = activeLot.documents?.find((d: any) => d.category === "PGTO ARMAZENAGEM");
        const realizedFees = (docLpco?.realizedValue ?? 0) + (docVistoria?.realizedValue ?? 0) + (docArmazenagem?.realizedValue ?? 0);

        const totalRealized = activeLot.documents?.reduce((acc: number, d: any) => acc + (d.realizedValue ?? 0), 0) ?? 0;
        const desvio = totalRealized - totalDdp;
        const desvioPct = totalDdp > 0 ? (desvio / totalDdp) * 100 : 0;

        return (
          <div className="space-y-6 animate-fade-in">
            {/* Cabecalho Rápido do Lote */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-3 bg-brand-surface border-brand-border shadow-md">
                <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1">Código do Lote</p>
                <span className="text-xs font-mono font-bold text-white uppercase">{activeLot.batchCode}</span>
              </Card>
              <Card className="p-3 bg-brand-surface border-brand-border shadow-md">
                <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1">Status da Importação</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase">{activeLot.status?.replace('_', ' ')}</span>
                </div>
              </Card>
              <Card className="p-3 bg-brand-surface border-brand-border shadow-md">
                <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1">Total FOB</p>
                <span className="text-sm font-mono font-bold text-brand-accent">{activeLot.currency} {activeLot.fobValue?.toLocaleString()}</span>
              </Card>
              <Card className="p-3 bg-brand-surface border-brand-border shadow-md">
                <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1">Câmbio Declarado</p>
                <span className="text-sm font-mono font-bold text-white">R$ {activeLot.exchangeRate?.toFixed(2)}</span>
              </Card>
            </div>

            {/* Demonstrativo Financeiro Simulado vs Realizado */}
            <Card className="p-5 border border-brand-border bg-brand-surface/40 shadow-inner space-y-4">
              <div>
                <h4 className="text-xs font-bold text-brand-accent uppercase tracking-widest mb-1">Demonstrativo Financeiro (Previsto vs Realizado)</h4>
                <p className="text-[9px] text-brand-text-muted uppercase">Comparativo em tempo real dos custos de importação com base nos documentos lançados.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "1. Câmbio / FOB", previsto: fobBrl, realizado: realizedFob },
                  { label: "2. Frete & Seguro", previsto: freightBrl + insuranceBrl, realizado: realizedFreight },
                  { label: "3. Tributos Aduaneiros", previsto: taxesEst, realizado: realizedTaxes },
                  { label: "4. Taxas & Logística", previsto: feesEst, realizado: realizedFees },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-brand-bg/50 rounded border border-brand-border/60 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">{item.label}</span>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-brand-text-secondary uppercase">Previsto:</span>
                        <span className="font-mono text-white">R$ {item.previsto.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-brand-text-secondary uppercase font-bold">Real:</span>
                        <span className={cn(
                          "font-mono font-bold",
                          item.realizado > 0 ? "text-brand-accent" : "text-brand-text-muted/50"
                        )}>
                          {item.realizado > 0 
                            ? `R$ ${item.realizado.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                            : "A definir"
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Totalização do Orçamento */}
                <div className="p-3 bg-brand-surface/70 border-2 border-brand-border rounded flex flex-col justify-between md:col-span-1 shadow-md">
                  <span className="text-[9px] font-black text-white uppercase tracking-wider">Total Geral (DDP)</span>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-brand-text-secondary uppercase">Previsto:</span>
                      <span className="font-mono text-white">R$ {totalDdp.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-brand-text-secondary uppercase font-black">Real:</span>
                      <span className="font-mono text-brand-success">R$ {totalRealized.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                    </div>
                    {totalRealized > 0 && (
                      <div className="flex justify-between text-[9px] font-black border-t border-brand-border/40 pt-1 mt-1 font-mono">
                        <span className="text-brand-text-secondary uppercase">Desvio:</span>
                        <span className={cn(
                          "font-mono",
                          desvio > 0 ? "text-brand-danger" : "text-brand-success"
                        )}>
                          {desvio > 0 ? "+" : ""}{desvio.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} ({desvio > 0 ? "+" : ""}{desvioPct.toFixed(1)}%)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Grupos de Documentos */}
            <div className="space-y-8">
              {DOCUMENT_GROUPS.map((group) => {
                const groupDocs = activeLot.documents || [];
                
                return (
                  <div key={group.id} className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-brand-border pb-2">
                      <div className="p-1.5 bg-brand-accent/10 border border-brand-accent/20 rounded text-brand-accent">
                        {group.icon}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">{group.title}</h4>
                        <p className="text-[9px] text-brand-text-muted uppercase mt-0.5">{group.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {group.items.map((cat, idx) => {
                        const doc = groupDocs.find((d: any) => d.category === cat);
                        const globalIdx = 1 + DOCUMENT_GROUPS.slice(0, DOCUMENT_GROUPS.indexOf(group)).reduce((sum, g) => sum + g.items.length, 0) + idx;
                        
                        return (
                          <LotDocumentCard
                            key={cat}
                            requiredCat={cat}
                            globalIdx={globalIdx}
                            doc={doc}
                            lotId={activeLot.id}
                            onRefresh={fetchProject}
                            updating={updatingLotDoc}
                            setUpdating={setUpdatingLotDoc}
                            isAdmin={isAdmin}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {activeTab === "docs" && (
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
          importLots={project.importLots}
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
