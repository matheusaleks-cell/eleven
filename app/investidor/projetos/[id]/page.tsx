"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MoneyDisplay } from "@/components/shared/MoneyDisplay";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getInvestorProjectDetails, getCycleSales } from "../../actions";
import { formatMoney } from "@/lib/calculations";
import { ArrowLeft, ChevronDown, ChevronUp, ShoppingCart, TrendingUp, Package, BarChart3, DollarSign, Ship, Globe, CheckCircle, Download, FileText, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { addLotDocument, deleteLotDocument, updateDocumentRealizedFields } from "../../../admin/importacao/lotes/actions";

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
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                          const base64 = reader.result as string;
                          const res = await addLotDocument(lotId, file.name, requiredCat, base64);
                          if (res.success) {
                            toast.success(`Documento "${requiredCat}" anexado com sucesso!`);
                            onRefresh?.();
                          } else {
                            toast.error("Erro ao fazer upload.");
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

export default function InvestorProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);
  const [cycleSales, setCycleSales] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [totalSoldValue, setTotalSoldValue] = useState(0);
  const [activeTab, setActiveTab] = useState<"cycles" | "import" | "docs">("cycles");
  const [updatingLotDoc, setUpdatingLotDoc] = useState(false);

  async function fetchProject(emailOverride?: string) {
    const email = emailOverride ?? session?.email;
    if (!email) return;
    const res = await getInvestorProjectDetails(id, email);
    if (res.success && res.project) {
      setProject(res.project);
    }
  }

  useEffect(() => {
    const s = localStorage.getItem("eleven_session");
    if (!s) { router.push("/login"); return; }
    const parsed = JSON.parse(s);
    setSession(parsed);

    getInvestorProjectDetails(id, parsed.email).then(res => {
      if (res.success && res.project) {
        setProject(res.project);
        // Expand current cycle if available
        if (res.project.cycles.length > 0) {
          const latestCycle = res.project.cycles[0];
          handleExpandCycle(latestCycle.id, parsed.email);
        }
      } else {
        router.push("/investidor/projetos");
      }
      setLoading(false);
    });
  }, []);

  const handleExpandCycle = async (cycleId: string, emailOverride?: string) => {
    if (expandedCycle === cycleId) {
      setExpandedCycle(null);
      return;
    }

    setExpandedCycle(cycleId);
    setSalesLoading(true);
    try {
      const email = emailOverride ?? session?.email ?? "";
      const res = await getCycleSales(cycleId, email);
      if (res.success) {
        setCycleSales(res.sales);
        setTotalSoldValue(res.totalSoldValue || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSalesLoading(false);
    }
  };

  if (loading || !session || !project) {
    return (
      <DashboardLayout role="INVESTOR" userName={session?.name ?? "Investidor"} userEmail={session?.email ?? ""} pageTitle="Carregando...">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="INVESTOR" userName={session.name} userEmail={session.email}>
      <div className="flex flex-col gap-6 animate-fade-in pb-12">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/investidor/projetos" className="p-2 bg-brand-surface border border-brand-border rounded-lg text-brand-text-muted hover:text-brand-accent transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-rajdhani uppercase text-white">{project.name}</h1>
            <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">{project.product_name}</p>
          </div>
          <div className="ml-auto">
            <StatusBadge status={project.status} />
          </div>
        </div>

        {/* Global Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <Card className="bg-brand-surface/40 border-brand-border">
              <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.2em]">Capital Inicial</span>
              <p className="text-xl font-bold mt-1 text-white">{formatMoney(project.initial_capital)}</p>
           </Card>
           <Card className="bg-brand-surface/40 border-brand-border">
              <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.2em]">Patrimônio Atual</span>
              <p className="text-xl font-bold mt-1 text-brand-accent">{formatMoney(project.currentCapital)}</p>
           </Card>
           <Card className="bg-brand-surface/40 border-brand-border">
              <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.2em]">Total Distribuído</span>
              <p className="text-xl font-bold mt-1 text-brand-success">{formatMoney(project.totalInvestorShare)}</p>
           </Card>
           <Card className="bg-brand-surface/40 border-brand-border">
              <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.2em]">Andamento</span>
              <p className="text-xl font-bold mt-1 text-white">{project.currentCycle}/{project.max_cycles} Ciclos</p>
           </Card>
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
        <div className="space-y-4 mt-4 animate-fade-in">
          <h3 className="text-xs font-black text-brand-text-muted uppercase tracking-[0.3em] px-2 flex items-center gap-2">
            <BarChart3 size={14} /> Histórico de Ciclos de Importação
          </h3>
          
          {project.cycles.map((cycle: any, index: number) => {
            const progress = cycle.gross_revenue > 0 ? (totalSoldValue / cycle.gross_revenue) * 100 : 0;

            return (
              <div key={cycle.id} className={cn(
                "rounded-xl overflow-hidden border transition-all",
                expandedCycle === cycle.id ? "border-brand-accent/50 bg-brand-surface/30" : "border-brand-border bg-brand-surface/20 hover:border-brand-border-hover"
              )}>
                <button
                  onClick={() => handleExpandCycle(cycle.id)}
                  className="w-full flex items-center justify-between px-6 py-5"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center font-black text-xs",
                      cycle.status === "COMPLETED" ? "bg-brand-success/10 text-brand-success border border-brand-success/20" : "bg-brand-accent/10 text-brand-accent border border-brand-accent/20"
                    )}>
                      {cycle.status === "COMPLETED" ? "✓" : `C${project.cycles.length - index}`}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white uppercase tracking-tight">{cycle.cycleName}</p>
                      <p className="text-[10px] font-bold text-brand-text-muted uppercase mt-0.5">{cycle.startDate} • {cycle.quantity} Unidades</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block">
                      <p className="text-[9px] font-black text-brand-text-muted uppercase">Sua Parte</p>
                      <p className="text-sm font-mono font-bold text-brand-accent">{formatMoney(cycle.investor_profit_share)}</p>
                    </div>
                    <StatusBadge status={cycle.status} />
                    {expandedCycle === cycle.id ? <ChevronUp size={20} className="text-brand-text-muted" /> : <ChevronDown size={20} className="text-brand-text-muted" />}
                  </div>
                </button>

                {expandedCycle === cycle.id && (
                  <div className="px-6 pb-6 pt-2 space-y-6 animate-fade-in border-t border-brand-border/30 mt-2">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "Investimento do Lote", value: formatMoney(cycle.total_investment) },
                        { label: "Expectativa de Faturamento", value: formatMoney(cycle.gross_revenue) },
                        { label: "Seu Lucro Líquido", value: formatMoney(cycle.investor_profit_share), highlight: true },
                        { label: "Saldo para Reinvestimento", value: formatMoney(cycle.next_cycle_capital) },
                      ].map((stat) => (
                        <div key={stat.label} className="p-3 bg-brand-bg/40 rounded-lg border border-brand-border/50">
                          <p className="text-[9px] font-black text-brand-text-muted uppercase mb-1 tracking-tight">{stat.label}</p>
                          <p className={cn("text-sm font-mono font-bold", stat.highlight ? "text-brand-accent" : "text-white")}>{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Sales Thermometer (Only for active or recently completed) */}
                    {cycle.status !== "PENDING" && (
                      <div className="space-y-4 p-4 bg-brand-input/30 rounded-xl border border-brand-border/40">
                         <div className="flex justify-between items-end">
                            <div className="flex items-center gap-2">
                               <TrendingUp size={14} className="text-brand-success" />
                               <span className="text-[10px] font-black text-white uppercase tracking-widest">Termômetro de Vendas do Ciclo</span>
                            </div>
                            <span className="text-[10px] font-black text-brand-success uppercase">{progress.toFixed(1)}% CONCLUÍDO</span>
                         </div>
                         <div className="h-2 w-full bg-brand-bg rounded-full overflow-hidden border border-brand-border/50">
                            <div 
                              className="h-full bg-gradient-to-r from-brand-accent to-brand-success transition-all duration-1000" 
                              style={{ width: `${Math.min(progress, 100)}%` }} 
                            />
                         </div>
                         <div className="flex justify-between text-[9px] font-bold text-brand-text-muted uppercase">
                            <span>Faturado: {formatMoney(totalSoldValue)}</span>
                            <span>Alvo: {formatMoney(cycle.gross_revenue)}</span>
                         </div>
                      </div>
                    )}

                    {/* Associated Sales Table */}
                    <div className="space-y-3">
                       <h4 className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest flex items-center gap-2">
                          <ShoppingCart size={14} /> Detalhamento de Vendas do Lote
                       </h4>
                       <div className="bg-brand-bg/40 rounded-lg border border-brand-border/50 overflow-hidden">
                          <table className="w-full text-left text-[11px]">
                             <thead>
                                <tr className="bg-brand-surface/50 text-brand-text-muted font-black border-b border-brand-border/50">
                                   <th className="px-4 py-2 uppercase">Data</th>
                                   <th className="px-4 py-2 uppercase">Produto / Serial</th>
                                   <th className="px-4 py-2 uppercase">Cliente</th>
                                   <th className="px-4 py-2 text-right uppercase">Custo Unitário (Aporte)</th>
                                   <th className="px-4 py-2 text-right uppercase font-bold text-white">Valor Venda</th>
                                   <th className="px-4 py-2 text-right uppercase text-brand-accent">Seu Retorno (Saldo)</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-brand-border/30">
                                {salesLoading ? (
                                   <tr>
                                      <td colSpan={6} className="px-4 py-8 text-center text-brand-text-muted animate-pulse font-bold">Sincronizando dados de vendas...</td>
                                   </tr>
                                ) : cycleSales.length > 0 ? (
                                   cycleSales.map((sale) => (
                                      <tr key={sale.id} className="hover:bg-brand-accent/5 transition-colors">
                                         <td className="px-4 py-2 font-mono text-brand-text-secondary">{sale.saleDate}</td>
                                         <td className="px-4 py-2 font-bold text-white">
                                            {sale.productName}
                                            <span className="block text-[9px] text-brand-text-muted">SN: {sale.serialNumber}</span>
                                         </td>
                                         <td className="px-4 py-2 text-brand-text-secondary">{sale.customerName}</td>
                                         <td className="px-4 py-2 text-right font-mono text-brand-text-muted">{formatMoney(sale.unitCost)}</td>
                                         <td className="px-4 py-2 text-right font-mono text-white">{formatMoney(sale.saleValue)}</td>
                                         <td className="px-4 py-2 text-right font-mono font-bold text-brand-success">{formatMoney(sale.investorReturn)}</td>
                                      </tr>
                                   ))
                                ) : (
                                   <tr>
                                      <td colSpan={6} className="px-4 py-8 text-center text-brand-text-muted font-bold">Aguardando início das vendas deste lote.</td>
                                   </tr>
                                )}
                             </tbody>
                          </table>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
                            onRefresh={() => fetchProject()}
                            updating={updatingLotDoc}
                            setUpdating={setUpdatingLotDoc}
                            isAdmin={false}
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
                {(project.documents || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-brand-text-muted text-xs uppercase font-bold tracking-widest">
                      Nenhum documento anexado a este projeto.
                    </td>
                  </tr>
                ) : (
                  (project.documents || []).map((doc: any) => (
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
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-brand-accent hover:bg-brand-accent/10 gap-2 font-bold uppercase text-[10px]"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = doc.base64Data;
                            link.download = doc.name;
                            link.click();
                            toast.success("Download iniciado!");
                          }}
                        >
                           Visualizar
                        </Button>
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
      </div>
    </DashboardLayout>
  );
}
