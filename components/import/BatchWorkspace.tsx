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
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BatchWorkspaceProps {
  batch: any;
  onClose: () => void;
}

export const BatchWorkspace: React.FC<BatchWorkspaceProps> = ({ batch, onClose }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "items" | "docs" | "history">("overview");

  if (!batch) return null;

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
        <Card className="p-3 bg-brand-surface border-brand-border">
          <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1">Status Atual</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
            <span className="text-xs font-bold text-white uppercase">{batch.status}</span>
          </div>
        </Card>
        <Card className="p-3 bg-brand-surface border-brand-border">
          <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1">Total FOB</p>
          <span className="text-sm font-mono font-bold text-brand-accent">{batch.currency} {batch.value.toLocaleString()}</span>
        </Card>
        <Card className="p-3 bg-brand-surface border-brand-border">
          <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1">Previsão ETA</p>
          <span className="text-sm font-bold text-white">{batch.eta}</span>
        </Card>
        <Card className="p-3 bg-brand-surface border-brand-border">
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
                       Lote aguardando confirmação de pagamento do frete internacional para liberação do HAWB.
                    </p>
                 </div>
              </Card>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-brand-accent uppercase tracking-widest border-b border-brand-border pb-2">Custos Nacionalizados (Est.)</h4>
              <div className="bg-brand-surface/50 rounded-lg p-5 border border-brand-border space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-brand-text-muted uppercase">Subtotal FOB</span>
                    <span className="text-sm font-mono text-white">R$ 640.500,00</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-brand-text-muted uppercase">Imposto de Importação (II)</span>
                    <span className="text-sm font-mono text-brand-danger">R$ 128.100,00</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-brand-text-muted uppercase">IPI / PIS / COFINS</span>
                    <span className="text-sm font-mono text-brand-danger">R$ 84.300,00</span>
                 </div>
                 <div className="pt-3 border-t border-brand-border flex justify-between items-center">
                    <span className="text-xs font-bold text-brand-accent uppercase">Total Estimado (DDP)</span>
                    <span className="text-xl font-bold font-mono text-white">R$ 852.900</span>
                 </div>
              </div>
              <Button variant="secondary" className="w-full text-[10px] font-bold tracking-widest gap-2">
                 <Download size={14} /> EXPORTAR PLANILHA DE CUSTOS
              </Button>
            </div>
          </div>
        )}

        {activeTab === "items" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <h4 className="text-xs font-bold text-brand-accent uppercase tracking-widest">Listagem de SKUs no Lote</h4>
               <span className="text-[10px] font-mono text-brand-text-muted uppercase">Total: {batch.items} Unidades</span>
            </div>
            <table className="table-base">
               <thead>
                  <tr>
                     <th>Produto</th>
                     <th>Qtd</th>
                     <th>Valor Unit.</th>
                     <th>NCM</th>
                     <th className="text-right">Ação</th>
                  </tr>
               </thead>
               <tbody>
                  <tr>
                     <td className="text-xs font-bold uppercase">VR-12P CARRERA - 12GA</td>
                     <td className="font-mono text-xs">200</td>
                     <td className="font-mono text-xs">USD 450.00</td>
                     <td className="text-[10px] font-mono">9303.20.00</td>
                     <td className="text-right">
                        <Button variant="ghost" size="sm" className="text-[10px]">VER SKU</Button>
                     </td>
                  </tr>
                  <tr>
                     <td className="text-xs font-bold uppercase">CANIK TP9 SFx RIVAL - 9MM</td>
                     <td className="font-mono text-xs">200</td>
                     <td className="font-mono text-xs">USD 580.00</td>
                     <td className="text-[10px] font-mono">9302.00.00</td>
                     <td className="text-right">
                        <Button variant="ghost" size="sm" className="text-[10px]">VER SKU</Button>
                     </td>
                  </tr>
               </tbody>
            </table>
          </div>
        )}

        {activeTab === "docs" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {[
               { name: "Commercial Invoice", type: "PDF", status: "VERIFICADO" },
               { name: "Packing List", type: "PDF", status: "VERIFICADO" },
               { name: "Bill of Lading (B/L)", type: "PDF", status: "AGUARDANDO" },
               { name: "Certificado de Origem", type: "PDF", status: "VERIFICADO" },
               { name: "LI - Licença de Importação", type: "PDF", status: "PROCESSANDO" },
             ].map((doc, i) => (
               <Card key={i} className="p-4 border-brand-border bg-brand-surface/30 flex flex-col gap-3 hover:border-brand-accent/30 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-brand-bg rounded border border-brand-border text-brand-text-muted group-hover:text-brand-accent">
                        <FileText size={18} />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-white uppercase leading-tight">{doc.name}</span>
                        <span className="text-[9px] text-brand-text-muted uppercase font-mono">{doc.type}</span>
                     </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-brand-border/50">
                     <span className={cn(
                       "text-[8px] font-bold px-1.5 py-0.5 rounded border",
                       doc.status === "VERIFICADO" ? "bg-brand-success/10 text-brand-success border-brand-success/20" :
                       doc.status === "PROCESSANDO" ? "bg-brand-warning/10 text-brand-warning border-brand-warning/20" :
                       "bg-brand-text-muted/10 text-brand-text-muted border-brand-border"
                     )}>
                       {doc.status}
                     </span>
                     <Download size={14} className="text-brand-text-muted group-hover:text-brand-accent" />
                  </div>
               </Card>
             ))}
             <button className="border-2 border-dashed border-brand-border rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:border-brand-accent/50 hover:bg-brand-accent/5 transition-all text-brand-text-muted hover:text-brand-accent">
                <Plus size={20} />
                <span className="text-[10px] font-bold uppercase">UPLOAD DOCUMENTO</span>
             </button>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center mt-6 pt-6 border-t border-brand-border">
         <div className="flex gap-2">
            <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-widest hover:text-brand-danger" onClick={onClose}>
               FECHAR WORKSPACE
            </Button>
         </div>
         <div className="flex gap-3">
            <Button variant="secondary" className="text-[10px] font-bold uppercase tracking-widest gap-2">
               <Anchor size={14} /> ALTERAR LOGÍSTICA
            </Button>
            <Button className="text-[10px] font-bold uppercase tracking-widest gap-2 shadow-[0_0_15px_rgba(245,196,0,0.15)]" onClick={() => toast.success("Processo movido para ADUANA")}>
               <Truck size={14} /> AVANÇAR ETAPA
            </Button>
         </div>
      </div>
    </div>
  );
};
