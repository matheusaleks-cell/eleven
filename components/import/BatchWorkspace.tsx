"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
  Ship, 
  FileText, 
  Globe, 
  DollarSign, 
  Package, 
  Truck, 
  Anchor, 
  CheckCircle2, 
  Download,
  AlertCircle,
  History,
  Plus,
  ExternalLink,
  Trash2,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateLotStatus, addLotDocument, deleteLotDocument, deleteImportLot, registerLotSerials, updateDocumentRealizedFields } from "@/app/admin/importacao/lotes/actions";
import { deleteWeapon } from "@/app/admin/mapa-de-armas/actions";
import Link from "next/link";

const REQUIRED_DOCUMENTS = [
  "INVOICE",
  "PACKING LIST",
  "LICENÇA DE IMPORTAÇÃO / LPCO",
  "SWIFT – COMPROVANTE DE PAGTO/CÂMBIO",
  "AWB EMBARQUE",
  "TERMO DE VISTORIA EXÉRCITO BRASILEIRO",
  "PAGTO TRIBUTOS FEDERAIS",
  "PAGTO GARE ICMS",
  "PGTO ARMAZENAGEM",
  "NFe ENTRADA"
];

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
    icon: <CheckCircle2 size={14} />,
    items: [
      "NFe ENTRADA"
    ]
  }
];

interface DocumentCardProps {
  requiredCat: string;
  globalIdx: number;
  doc: any;
  lotId: string;
  onRefresh?: () => void;
  updating: boolean;
  setUpdating: (v: boolean) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  requiredCat,
  globalIdx,
  doc,
  lotId,
  onRefresh,
  updating,
  setUpdating
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
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="text-brand-accent uppercase hover:underline"
            >
              {isEditing ? "Cancelar" : "Editar"}
            </button>
          </div>

          {isEditing ? (
            <div className="grid grid-cols-2 gap-1.5">
              <div className="space-y-0.5">
                <span className="text-[6px] font-bold text-brand-text-muted uppercase">Valor Pago (R$)</span>
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
                <span className="text-[6px] font-bold text-brand-text-muted uppercase">Data de Pagto</span>
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
                    Salvar
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
        {doc ? (
          <>
            <span className="text-[9px] text-brand-text-muted font-mono uppercase">{doc.size || "PDF"}</span>
            <div className="flex items-center gap-2">
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
                <Trash2 size={14} />
              </button>
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
                <Download size={14} />
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="text-[9px] text-brand-text-muted/50 uppercase">PENDENTE</span>
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
          </>
        )}
      </div>
    </Card>
  );
};

interface BatchWorkspaceProps {
  batch: any;
  onClose: () => void;
  onRefresh?: () => void;
}

export const BatchWorkspace: React.FC<BatchWorkspaceProps> = ({ batch, onClose, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "items" | "docs" | "history" | "weapons">("overview");
  const [updating, setUpdating] = useState(false);

  if (!batch) return null;

  const handleDeleteLot = async () => {
    if (confirm(`Deseja realmente excluir o lote de importação "${batch.batchCode || batch.id}"? Esta ação não pode ser desfeita.`)) {
      setUpdating(true);
      try {
        const res = await deleteImportLot(batch.dbId || batch.id);
        if (res.success) {
          toast.success("Lote de importação excluído com sucesso!");
          onRefresh?.();
          onClose();
        } else {
          toast.error(res.error || "Erro ao excluir lote.");
        }
      } catch (err) {
        toast.error("Erro de comunicação ao excluir lote.");
      } finally {
        setUpdating(false);
      }
    }
  };

  // Cálculos Reais baseados no lote
  const fobBrl = (batch.fobTotal || 0) * (batch.exchangeRate || 1);
  const taxesEst = fobBrl * 0.48; // Estimativa consolidada
  const totalDdp = fobBrl + taxesEst + (batch.freightTotal * batch.exchangeRate) + (batch.insuranceTotal * batch.exchangeRate);

  const handleNextStep = async () => {
    const statusFlow: Record<string, string> = {
      "PEDIDO_FEITO": "TRANSITO",
      "TRANSITO": "NACIONALIZANDO",
      "NACIONALIZANDO": "DISPONIVEL",
      "DISPONIVEL": "LIQUIDADO"
    };

    const nextStatus = statusFlow[batch.status];
    if (!nextStatus) {
      toast.info("Lote já concluído ou em status final.");
      return;
    }

    setUpdating(true);
    const res = await updateLotStatus(batch.dbId || batch.id, nextStatus);
    if (res.success) {
      toast.success(`Lote movido para ${nextStatus.replace('_', ' ')}`);
      onRefresh?.();
      onClose();
    } else {
      toast.error("Falha ao atualizar status.");
    }
    setUpdating(false);
  };

  const exportCSV = () => {
    const rows = [
      ["Campo", "Valor"],
      ["Lote", batch.id],
      ["Fornecedor", batch.supplier],
      ["Origem", batch.origin],
      ["Total FOB (USD)", batch.fobTotal],
      ["Cambio", batch.exchangeRate],
      ["Total FOB (BRL)", fobBrl.toFixed(2)],
      ["Impostos Estimados", taxesEst.toFixed(2)],
      ["Frete Internacional", batch.freightTotal],
      ["Seguro", batch.insuranceTotal],
      ["Total DDP (Estimado)", totalDdp.toFixed(2)]
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lote_${batch.id}_custos.csv`);
    document.body.appendChild(link);
    link.click();
    toast.success("Planilha de custos exportada com sucesso!");
  };

  const tabs = [
    { id: "overview", label: "Resumo", icon: <Globe size={14} /> },
    { id: "items", label: "Itens do Lote", icon: <Package size={14} /> },
    { id: "weapons", label: "Armas/Séries", icon: <Shield size={14} /> },
    { id: "docs", label: "Documentos (DI/LI)", icon: <FileText size={14} /> },
    { id: "history", label: "Histórico", icon: <History size={14} /> },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in duration-300">
      {/* Quick Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-3 bg-brand-surface border-brand-border shadow-md">
          <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1">Status Atual</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
            <span className="text-xs font-bold text-white uppercase">{batch.status?.replace('_', ' ')}</span>
          </div>
        </Card>
        <Card className="p-3 bg-brand-surface border-brand-border shadow-md">
          <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1">Total FOB</p>
          <span className="text-sm font-mono font-bold text-brand-accent">{batch.currency} {batch.value?.toLocaleString()}</span>
        </Card>
        <Card className="p-3 bg-brand-surface border-brand-border shadow-md">
          <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1">Previsão ETA</p>
          <span className="text-sm font-bold text-white">{batch.eta || "A definir"}</span>
        </Card>
        <Card className="p-3 bg-brand-surface border-brand-border shadow-md">
          <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1">Progresso</p>
          <span className="text-sm font-mono font-bold text-brand-success">{batch.progress}%</span>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-1 bg-brand-bg p-1 rounded-lg border border-brand-border w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-[10px] font-bold uppercase transition-all",
              activeTab === tab.id 
                ? "bg-brand-accent text-brand-bg shadow-lg" 
                : "text-brand-text-muted hover:text-white hover:bg-brand-surface"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              {batch.investmentProject && (
                <div className="p-4 bg-brand-accent/5 border border-brand-accent/20 rounded-[4px] space-y-1">
                  <p className="text-[9px] font-black text-brand-accent uppercase tracking-widest">Projeto do Investidor Vinculado</p>
                  <p className="text-sm font-bold text-white uppercase">
                    {batch.investmentProject.investor?.name || "N/A"} — {batch.investmentProject.name}
                  </p>
                </div>
              )}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-brand-accent uppercase tracking-widest border-b border-brand-border pb-2">Informações Gerais</h4>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <p className="text-[9px] font-bold text-brand-text-muted uppercase">Fornecedor</p>
                      <p className="text-sm font-bold text-white uppercase">{batch.supplier}</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-bold text-brand-text-muted uppercase">Origem</p>
                      <p className="text-sm font-bold text-white uppercase">{batch.origin}</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-bold text-brand-text-muted uppercase">Porto de Embarque</p>
                      <p className="text-sm font-bold text-white">Istanbul (Ambarli), TR</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-bold text-brand-text-muted uppercase">Incoterm</p>
                      <p className="text-sm font-bold text-brand-accent uppercase">FOB</p>
                   </div>
                </div>
              </div>

              <Card className="p-4 bg-brand-warning/5 border-brand-warning/20 flex gap-3">
                 <AlertCircle className="text-brand-warning shrink-0" size={18} />
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-brand-warning uppercase">Atenção Aduaneira</p>
                    <p className="text-[9px] text-brand-text-secondary uppercase leading-tight font-medium">
                       Verificar se a Licença de Importação (LI) foi deferida antes da chegada ao porto nacional.
                    </p>
                 </div>
              </Card>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-brand-accent uppercase tracking-widest border-b border-brand-border pb-2">Custos Nacionalizados (Est.)</h4>
              <div className="bg-brand-surface/50 rounded-lg p-5 border border-brand-border space-y-3 shadow-inner">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-brand-text-muted uppercase">Subtotal FOB (BRL)</span>
                    <span className="text-sm font-mono text-white">R$ {fobBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-brand-text-muted uppercase">Impostos Est. (48%)</span>
                    <span className="text-sm font-mono text-brand-danger">R$ {taxesEst.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-brand-text-muted uppercase">Câmbio Aplicado</span>
                    <span className="text-sm font-mono text-brand-accent">R$ {batch.exchangeRate?.toFixed(4)}</span>
                 </div>
                 <div className="pt-3 border-t border-brand-border flex justify-between items-center">
                    <span className="text-xs font-bold text-brand-accent uppercase">Total Estimado (DDP)</span>
                    <span className="text-xl font-bold font-mono text-white">R$ {totalDdp.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                 </div>
              </div>
              <Button variant="secondary" className="w-full text-[10px] font-bold tracking-widest gap-2 py-6" onClick={exportCSV}>
                 <Download size={14} /> EXPORTAR PLANILHA DE CUSTOS
              </Button>
            </div>
          </div>
        )}

        {activeTab === "items" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <h4 className="text-xs font-bold text-brand-accent uppercase tracking-widest">Listagem de SKUs no Lote</h4>
               <span className="text-[10px] font-mono text-brand-text-muted uppercase">Total: {batch.items_count || 0} Itens</span>
            </div>
            <table className="table-base">
               <thead>
                  <tr>
                     <th>Produto</th>
                     <th>Qtd Estimada</th>
                     <th>Valor Unit. (FOB)</th>
                     <th>NCM</th>
                     <th className="text-right">Ação</th>
                  </tr>
               </thead>
               <tbody>
                  {batch.products?.map((product: any, i: number) => (
                    <tr key={i}>
                       <td className="text-xs font-bold uppercase">
                         <div className="flex flex-col">
                           <span className="text-white">{product.commercialName}</span>
                           <span className="text-[9px] text-brand-text-muted">{product.sku}</span>
                         </div>
                       </td>
                       <td className="font-mono text-xs">{(batch.items_count / (batch.products?.length || 1)).toFixed(0)}</td>
                       <td className="font-mono text-xs">{batch.currency} {(batch.fobTotal / (batch.items_count || 1)).toLocaleString()}</td>
                       <td className="text-[10px] font-mono">{product.ncm || "9303.20.00"}</td>
                       <td className="text-right">
                          <Link href={`/admin/erp/produtos?search=${product.sku}`}>
                            <Button variant="ghost" size="sm" className="text-[10px] gap-2">
                              VER NO ERP <ExternalLink size={10} />
                            </Button>
                          </Link>
                       </td>
                    </tr>
                  ))}
                  {(!batch.products || batch.products.length === 0) && (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-brand-text-muted text-[10px] uppercase">
                        Nenhum SKU detalhado vinculado a este lote.
                      </td>
                    </tr>
                  )}
               </tbody>
            </table>
          </div>
        )}

        {activeTab === "weapons" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Lado Esquerdo: Formulário de Registro */}
               <Card className="lg:col-span-1 p-5 border-brand-border bg-brand-surface/30 flex flex-col gap-4">
                  <div>
                     <h4 className="text-xs font-bold text-brand-accent uppercase tracking-widest mb-1">REGISTRAR NÚMEROS DE SÉRIE</h4>
                     <p className="text-[9px] text-brand-text-muted uppercase">Cadastre as séries individualmente ou cole a listagem da invoice abaixo.</p>
                  </div>
                  
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest block">Produto SKU *</label>
                     <select 
                       id="weapon-product-select"
                       className="w-full bg-brand-input border border-brand-border rounded text-[11px] p-2 outline-none focus:border-brand-accent text-white"
                     >
                       {batch.products?.map((p: any) => (
                         <option key={p.id} value={p.id}>{p.sku} — {p.commercialName}</option>
                       ))}
                       {(!batch.products || batch.products.length === 0) && (
                         <option value="">Nenhum produto cadastrado...</option>
                       )}
                     </select>
                  </div>

                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest block">Números de Série (1 por linha ou separados por vírgula) *</label>
                     <textarea
                       id="weapon-serials-textarea"
                       rows={6}
                       placeholder="Ex:&#10;599-H25PD-1&#10;599-H25PD-2&#10;599-H25PD-3"
                       className="w-full bg-[#0F0F0F] border border-brand-border rounded text-xs p-3 outline-none focus:border-brand-accent text-white font-mono"
                     />
                  </div>

                  <Button 
                    className="w-full text-[10px] font-bold uppercase tracking-widest py-3 gap-2"
                    onClick={async () => {
                      const productSelect = document.getElementById("weapon-product-select") as HTMLSelectElement;
                      const serialsTextarea = document.getElementById("weapon-serials-textarea") as HTMLTextAreaElement;
                      
                      const productId = productSelect?.value;
                      const serialsVal = serialsTextarea?.value || "";
                      
                      if (!productId) {
                        toast.error("Selecione um produto.");
                        return;
                      }
                      
                      const serialsList = serialsVal
                        .split(/[\n,]/)
                        .map(s => s.trim())
                        .filter(s => s.length > 0);
                        
                      if (serialsList.length === 0) {
                        toast.error("Insira ao menos um número de série.");
                        return;
                      }
                      
                      setUpdating(true);
                      const res = await registerLotSerials(batch.dbId || batch.id, productId, serialsList);
                      if (res.success) {
                        toast.success(`${res.count} arma(s) cadastrada(s) com sucesso!`);
                        if (serialsTextarea) serialsTextarea.value = "";
                        onRefresh?.();
                      } else {
                        toast.error(res.error || "Erro ao registrar.");
                      }
                      setUpdating(false);
                    }}
                    disabled={updating}
                  >
                     <Plus size={14} /> CADASTRAR ARMAS
                  </Button>
               </Card>

               {/* Lado Direito: Listagem */}
               <div className="lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center border-b border-brand-border pb-2">
                     <h4 className="text-xs font-bold text-white uppercase tracking-widest">Armas Cadastradas neste Lote</h4>
                     <span className="text-[10px] font-mono text-brand-text-muted uppercase">Total: {batch.weapons?.length || 0} Armas</span>
                  </div>

                  <div className="bg-brand-bg/20 rounded-lg border border-brand-border overflow-hidden max-h-[350px] overflow-y-auto custom-scrollbar">
                     <table className="w-full text-left text-[11px]">
                        <thead>
                           <tr className="bg-brand-surface/50 text-brand-text-muted font-black border-b border-brand-border/50">
                              <th className="px-4 py-2 uppercase">Série</th>
                              <th className="px-4 py-2 uppercase">Produto</th>
                              <th className="px-4 py-2 uppercase">Status</th>
                              <th className="px-4 py-2 uppercase">Cliente</th>
                              <th className="px-4 py-2 text-right uppercase">Ação</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/30">
                           {batch.weapons?.map((w: any) => (
                             <tr key={w.id} className="hover:bg-brand-surface/20 transition-all">
                                <td className="px-4 py-2 font-mono font-bold text-white">{w.serialNumber}</td>
                                <td className="px-4 py-2 text-brand-text-secondary uppercase">{w.product?.commercialName}</td>
                                <td className="px-4 py-2">
                                   <span className={cn(
                                     "text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider",
                                     w.currentStatus === "VENDIDA" ? "bg-brand-success/10 text-brand-success border-brand-success/20" :
                                     w.currentStatus === "RESERVADA" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                     "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                   )}>
                                     {w.currentStatus}
                                   </span>
                                </td>
                                <td className="px-4 py-2 text-brand-text-muted uppercase truncate max-w-[120px]" title={w.customer?.name}>
                                   {w.customer?.name || "ESTOQUE"}
                                </td>
                                <td className="px-4 py-2 text-right">
                                   <button
                                     onClick={async () => {
                                       if (confirm(`Deseja realmente remover a arma com número de série "${w.serialNumber}"?`)) {
                                         const res = await deleteWeapon(w.id);
                                         if (res.success) {
                                           toast.success("Arma removida com sucesso!");
                                           onRefresh?.();
                                         } else {
                                           toast.error(res.error || "Erro ao remover arma.");
                                         }
                                       }
                                     }}
                                     className="p-1 hover:text-brand-danger text-brand-text-muted transition-colors"
                                     title="Remover"
                                   >
                                      <Trash2 size={13} />
                                   </button>
                                </td>
                             </tr>
                           ))}
                           {(!batch.weapons || batch.weapons.length === 0) && (
                             <tr>
                                <td colSpan={5} className="text-center py-16 text-brand-text-muted text-[10px] uppercase font-bold">
                                   Nenhuma arma cadastrada para este lote.
                                </td>
                             </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === "docs" && (
          <div className="space-y-8">
            {/* Demonstrativo Financeiro Simulado vs Realizado */}
            {(() => {
              const docSwift = batch.documents?.find((d: any) => d.category === "SWIFT – COMPROVANTE DE PAGTO/CÂMBIO");
              const docInvoice = batch.documents?.find((d: any) => d.category === "INVOICE");
              const realizedFob = docSwift?.realizedValue ?? docInvoice?.realizedValue ?? 0;

              const docAwb = batch.documents?.find((d: any) => d.category === "AWB EMBARQUE");
              const realizedFreight = docAwb?.realizedValue ?? 0;

              const docTributos = batch.documents?.find((d: any) => d.category === "PAGTO TRIBUTOS FEDERAIS");
              const docIcms = batch.documents?.find((d: any) => d.category === "PAGTO GARE ICMS");
              const realizedTaxes = (docTributos?.realizedValue ?? 0) + (docIcms?.realizedValue ?? 0);

              const docLpco = batch.documents?.find((d: any) => d.category === "LICENÇA DE IMPORTAÇÃO / LPCO");
              const docVistoria = batch.documents?.find((d: any) => d.category === "TERMO DE VISTORIA EXÉRCITO BRASILEIRO");
              const docArmazenagem = batch.documents?.find((d: any) => d.category === "PGTO ARMAZENAGEM");
              const realizedFees = (docLpco?.realizedValue ?? 0) + (docVistoria?.realizedValue ?? 0) + (docArmazenagem?.realizedValue ?? 0);

              const totalRealized = batch.documents?.reduce((acc: number, d: any) => acc + (d.realizedValue ?? 0), 0) ?? 0;
              const totalPrevisto = fobBrl + ((batch.freightTotal + batch.insuranceTotal) * batch.exchangeRate) + (batch.customsTaxes || taxesEst) + (batch.customsFees || 7884);
              const desvio = totalRealized - totalPrevisto;
              const desvioPct = totalPrevisto > 0 ? (desvio / totalPrevisto) * 100 : 0;

              return (
                <Card className="p-5 border border-brand-border bg-brand-surface/40 shadow-inner space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-brand-accent uppercase tracking-widest mb-1">Demonstrativo Financeiro (Previsto vs Realizado)</h4>
                    <p className="text-[9px] text-brand-text-muted uppercase">Comparativo em tempo real dos custos de importação com base nos documentos lançados.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { label: "1. Câmbio / FOB", previsto: fobBrl, realizado: realizedFob },
                      { label: "2. Frete & Seguro", previsto: (batch.freightTotal + batch.insuranceTotal) * batch.exchangeRate, realizado: realizedFreight },
                      { label: "3. Tributos Aduaneiros", previsto: batch.customsTaxes || taxesEst, realizado: realizedTaxes },
                      { label: "4. Taxas & Logística", previsto: batch.customsFees || 7884, realizado: realizedFees },
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
                          <span className="font-mono text-white">R$ {totalPrevisto.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-brand-text-secondary uppercase font-black">Real:</span>
                          <span className="font-mono text-brand-success">R$ {totalRealized.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                        </div>
                        {totalRealized > 0 && (
                          <div className="flex justify-between text-[9px] font-black border-t border-brand-border/40 pt-1 mt-1">
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
              );
            })()}

            <div>
               <h4 className="text-xs font-bold text-brand-accent uppercase tracking-widest mb-2">DOCUMENTOS OBRIGATÓRIOS DO PROCESSO</h4>
               <p className="text-[10px] text-brand-text-muted uppercase mb-4">Os documentos abaixo estão agrupados por etapas do fluxo de importação e integrados à área do investidor.</p>
            </div>
            
            <div className="space-y-8">
              {DOCUMENT_GROUPS.map((group) => {
                const groupAttachedCount = group.items.filter(requiredCat => 
                  batch.documents?.some((d: any) => d.category === requiredCat)
                ).length;
                const groupTotalCount = group.items.length;
                const isGroupCompleted = groupAttachedCount === groupTotalCount;

                return (
                  <Card key={group.id} className="p-5 border border-brand-border bg-brand-surface/20 shadow-lg space-y-4">
                    {/* Cabeçalho do Grupo de Documentos */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border/40 pb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded border transition-colors",
                          isGroupCompleted 
                            ? "bg-brand-success/10 border-brand-success/20 text-brand-success" 
                            : "bg-brand-bg border-brand-border text-brand-accent"
                        )}>
                          {group.icon}
                        </div>
                        <div>
                          <h5 className="text-[11px] font-black text-white uppercase tracking-wider">{group.title}</h5>
                          <p className="text-[9px] text-brand-text-muted uppercase leading-tight font-medium mt-0.5">{group.description}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-wider w-fit shrink-0",
                        isGroupCompleted 
                          ? "bg-brand-success/10 text-brand-success border-brand-success/20" 
                          : "bg-brand-surface text-brand-accent border-brand-border"
                      )}>
                        {groupAttachedCount} de {groupTotalCount} Anexados
                      </div>
                    </div>

                    {/* Cards do Grupo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {group.items.map((requiredCat) => {
                        const globalIdx = REQUIRED_DOCUMENTS.indexOf(requiredCat) + 1;
                        const doc = batch.documents?.find((d: any) => d.category === requiredCat);
                        
                        return (
                          <DocumentCard 
                            key={requiredCat}
                            requiredCat={requiredCat}
                            globalIdx={globalIdx}
                            doc={doc}
                            lotId={batch.dbId || batch.id}
                            onRefresh={onRefresh}
                            updating={updating}
                            setUpdating={setUpdating}
                          />
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="pt-6 border-t border-brand-border">
              <h4 className="text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-4">OUTROS DOCUMENTOS (ADICIONAIS)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {batch.documents?.filter((d: any) => ![
                  "INVOICE",
                  "PACKING LIST",
                  "LICENÇA DE IMPORTAÇÃO / LPCO",
                  "SWIFT – COMPROVANTE DE PAGTO/CÂMBIO",
                  "AWB EMBARQUE",
                  "TERMO DE VISTORIA EXÉRCITO BRASILEIRO",
                  "PAGTO TRIBUTOS FEDERAIS",
                  "PAGTO GARE ICMS",
                  "PGTO ARMAZENAGEM",
                  "NFe ENTRADA"
                ].includes(d.category)).map((doc: any, i: number) => (
                  <Card key={i} className="p-4 border-brand-border bg-brand-surface/30 flex flex-col justify-between min-h-[110px] hover:border-brand-accent/30 transition-all group shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-bg rounded border border-brand-border text-brand-text-muted group-hover:text-brand-accent transition-colors">
                        <FileText size={18} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">{doc.category || "Outros"}</span>
                        <span className="text-xs font-bold text-white uppercase leading-tight truncate mt-0.5" title={doc.name}>{doc.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand-border/50">
                      <span className="text-[9px] text-brand-text-muted font-mono uppercase">{doc.size}</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={async () => {
                            if (confirm("Deseja realmente excluir este documento?")) {
                              const res = await deleteLotDocument(doc.id);
                              if (res.success) {
                                toast.success("Documento removido!");
                                onRefresh?.();
                              } else {
                                toast.error("Erro ao excluir.");
                              }
                            }
                          }}
                          className="p-1 hover:text-brand-danger text-brand-text-muted transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
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
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}

                <div className="border-2 border-dashed border-brand-border rounded-lg p-4 flex flex-col items-center justify-center gap-4 hover:border-brand-accent/50 hover:bg-brand-accent/5 transition-all text-brand-text-muted hover:text-brand-accent group min-h-[110px]">
                  <div className="flex flex-col items-center gap-1">
                    <Plus size={18} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">ANEXAR EXTRA</span>
                  </div>
                  
                  <div className="w-full space-y-2">
                    <select 
                      id="doc-category-extra"
                      className="w-full bg-brand-input border border-brand-border rounded text-[9px] font-bold uppercase p-1.5 outline-none focus:border-brand-accent text-white"
                    >
                      <option value="Outros">Outros</option>
                      <option value="CII">Certificado CII</option>
                      <option value="Laudo">Laudo Técnico</option>
                      <option value="Seguro Extra">Apólice de Seguro</option>
                    </select>
                    <label className="block w-full bg-brand-accent/10 text-brand-accent text-center py-1.5 rounded text-[9px] font-black uppercase cursor-pointer hover:bg-brand-accent/20 transition-colors">
                      Selecionar Arquivo
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="application/pdf,image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          const category = (document.getElementById("doc-category-extra") as HTMLSelectElement).value;
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              const base64 = reader.result as string;
                              const res = await addLotDocument(batch.dbId || batch.id, file.name, category, base64);
                              if (res.success) {
                                toast.success("Documento adicional anexado!");
                                onRefresh?.();
                              } else {
                                toast.error("Erro ao subir documento adicional.");
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-brand-accent uppercase tracking-widest mb-4">Linha do Tempo de Operações</h4>
            <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-brand-border">
               {[
                 { date: "10/05/2026 14:30", action: "Status alterado para NACIONALIZANDO", user: "Raul (Admin)", icon: <Truck size={12} /> },
                 { date: "08/05/2026 09:15", action: "Embarque confirmado - Istanbul", user: "Sistema", icon: <Ship size={12} /> },
                 { date: "01/05/2026 16:40", action: "Pagamento FOB realizado", user: "Financeiro", icon: <DollarSign size={12} /> },
                 { date: "28/04/2026 11:20", action: "Lote criado no sistema", user: "Raul (Admin)", icon: <Plus size={12} /> },
               ].map((item, i) => (
                 <div key={i} className="flex gap-4 relative z-10">
                    <div className="w-6 h-6 rounded-full bg-brand-bg border border-brand-border flex items-center justify-center text-brand-accent shadow-sm">
                       {item.icon}
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[11px] font-bold text-white uppercase">{item.action}</span>
                       <div className="flex gap-2 text-[9px] text-brand-text-muted font-medium uppercase mt-0.5">
                          <span>{item.date}</span>
                          <span>•</span>
                          <span className="text-brand-accent/70">{item.user}</span>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center mt-6 pt-6 border-t border-brand-border">
         <div className="flex gap-2">
            <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-widest hover:text-brand-danger transition-colors" onClick={onClose}>
               FECHAR WORKSPACE
            </Button>
            <Button 
              variant="ghost" 
              className="text-[10px] font-bold uppercase tracking-widest text-brand-danger/70 hover:text-brand-danger hover:bg-brand-danger/5 transition-colors gap-2" 
              onClick={handleDeleteLot}
              disabled={updating}
            >
               <Trash2 size={14} /> EXCLUIR LOTE
            </Button>
         </div>
         <div className="flex gap-3">
            <Button 
              variant="secondary" 
              className="text-[10px] font-bold uppercase tracking-widest gap-2"
              onClick={() => toast.info("Escolha o novo status manualmente no editor de lote.")}
            >
               <Anchor size={14} /> ALTERAR LOGÍSTICA
            </Button>
            <Button 
              className="text-[10px] font-bold uppercase tracking-widest gap-2 shadow-[0_0_15px_rgba(245,196,0,0.15)] hover:shadow-brand-accent/20 transition-all" 
              onClick={handleNextStep}
              disabled={updating}
            >
               <Truck size={14} /> {updating ? "ATUALIZANDO..." : "AVANÇAR ETAPA"}
            </Button>
         </div>
      </div>
    </div>
  );
};
