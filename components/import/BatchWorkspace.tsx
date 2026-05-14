"use client";

import React, { useState } from "react";
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
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateLotStatus, addLotDocument, deleteLotDocument } from "@/app/admin/importacao/lotes/actions";
import Link from "next/link";

interface BatchWorkspaceProps {
  batch: any;
  onClose: () => void;
  onRefresh?: () => void;
}

export const BatchWorkspace: React.FC<BatchWorkspaceProps> = ({ batch, onClose, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "items" | "docs" | "history">("overview");
  const [updating, setUpdating] = useState(false);

  if (!batch) return null;

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

        {activeTab === "docs" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {batch.documents?.map((doc: any, i: number) => (
               <Card key={i} className="p-4 border-brand-border bg-brand-surface/30 flex flex-col gap-3 hover:border-brand-accent/30 transition-all cursor-pointer group shadow-sm">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-brand-bg rounded border border-brand-border text-brand-text-muted group-hover:text-brand-accent transition-colors">
                        <FileText size={18} />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-white uppercase leading-tight">{doc.name}</span>
                        <span className="text-[9px] text-brand-text-muted uppercase font-mono">{doc.type} • {doc.size}</span>
                     </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-brand-border/50">
                     <span className={cn(
                       "text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase",
                       "bg-brand-success/10 text-brand-success border-brand-success/20"
                     )}>
                       {doc.category || "Verificado"}
                     </span>
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
                          className="p-1 hover:text-brand-danger transition-colors"
                        >
                          <Trash2 size={14} className="text-brand-text-muted hover:text-brand-danger" />
                        </button>
                        <button 
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = doc.base64Data;
                            link.download = doc.name;
                            link.click();
                          }}
                          className="p-1 hover:text-brand-accent transition-colors"
                        >
                          <Download size={14} className="text-brand-text-muted" />
                        </button>
                     </div>
                  </div>
               </Card>
             ))}

             <label className="border-2 border-dashed border-brand-border rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:border-brand-accent/50 hover:bg-brand-accent/5 transition-all text-brand-text-muted hover:text-brand-accent cursor-pointer">
                <Plus size={20} />
                <span className="text-[10px] font-bold uppercase">UPLOAD DOCUMENTO</span>
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
                        const res = await addLotDocument(batch.dbId || batch.id, file.name, "Importação", base64);
                        if (res.success) {
                          toast.success("Documento anexado ao lote!");
                          onRefresh?.();
                        } else {
                          toast.error("Erro ao subir documento.");
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
             </label>

             {(!batch.documents || batch.documents.length === 0) && (
               <div className="md:col-span-3 py-10 text-center text-brand-text-muted text-[10px] uppercase border border-dashed border-brand-border rounded-lg">
                 Nenhum documento anexado a este processo.
               </div>
             )}
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
