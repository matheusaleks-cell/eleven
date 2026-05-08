"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LeadForm, LeadFormData } from "./LeadForm";
import { 
  User, 
  Phone, 
  Mail, 
  ShoppingBag, 
  Clock, 
  FileText, 
  ArrowRight, 
  Edit3, 
  Trash2,
  Plus,
  ChevronRight,
  Package,
  History,
  Settings,
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LeadWorkspaceProps {
  lead: any;
  onUpdate: (data: LeadFormData) => void;
  onClose: () => void;
}

const MOCK_PRODUCTS = [
  { id: "1", name: "Vezir Arms Carrera VR-12P", price: 8500, caliber: "12 Gauge" },
  { id: "2", name: "Canik TP9 SFx Rival", price: 9200, caliber: "9mm" },
  { id: "3", name: "Derya MK-12 AS-250", price: 11500, caliber: "12 Gauge" },
];

export function LeadWorkspace({ lead, onUpdate, onClose }: LeadWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "products" | "history">("products");
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  
  const [dealItems, setDealItems] = useState<any[]>([
    { id: "item-1", product: MOCK_PRODUCTS[0], quantity: 1 }
  ]);

  const totalValue = dealItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  const handleUpdateInfo = (data: LeadFormData) => {
    onUpdate(data);
    setIsEditingInfo(false);
    toast.success("Dados do lead sincronizados com sucesso!");
  };

  const handleGenerateProposal = () => {
    toast.info("Gerando proposta PDF personalizada...");
  };

  const handleConvertToOrder = () => {
    toast.success("Lead convertido em PEDIDO com sucesso!");
    onClose();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner - Status & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-brand-surface/40 p-5 rounded-lg border border-brand-border shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-accent/10 rounded border border-brand-accent/20 text-brand-accent">
            <User size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">{lead.name}</h3>
            <div className="flex items-center gap-3 mt-1">
               <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Pipeline:</span>
               <span className="text-[10px] font-bold text-brand-accent uppercase bg-brand-accent/10 px-2 py-0.5 rounded border border-brand-accent/20">
                 {lead.status}
               </span>
               <span className="text-brand-text-muted text-xs">|</span>
               <span className="text-[10px] font-bold text-white/70 uppercase">{lead.interest}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex-1 md:flex-none h-10 px-4 gap-2 text-[10px] font-bold"
            onClick={() => {
              setActiveTab("summary");
              setIsEditingInfo(true);
            }}
          >
            <Settings size={14} /> ATUALIZAR LEAD
          </Button>
          <Button 
            className="flex-1 md:flex-none h-10 px-6 gap-2 text-[10px] font-bold shadow-[0_0_15px_rgba(245,196,0,0.1)]"
            onClick={handleConvertToOrder}
          >
            <ArrowRight size={16} /> GERAR PEDIDO
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-brand-border bg-brand-surface/20 rounded-t-lg">
        <button 
          onClick={() => setActiveTab("products")}
          className={cn(
            "flex-1 md:flex-none px-8 py-4 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all",
            activeTab === "products" ? "border-brand-accent text-brand-accent bg-brand-accent/5" : "border-transparent text-brand-text-muted hover:text-white"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <ShoppingBag size={14} /> Itens do Pedido
          </span>
        </button>
        <button 
          onClick={() => setActiveTab("summary")}
          className={cn(
            "flex-1 md:flex-none px-8 py-4 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all",
            activeTab === "summary" ? "border-brand-accent text-brand-accent bg-brand-accent/5" : "border-transparent text-brand-text-muted hover:text-white"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <Clock size={14} /> Perfil & Cadastro
          </span>
        </button>
        <button 
          onClick={() => setActiveTab("history")}
          className={cn(
            "flex-1 md:flex-none px-8 py-4 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all",
            activeTab === "history" ? "border-brand-accent text-brand-accent bg-brand-accent/5" : "border-transparent text-brand-text-muted hover:text-white"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <History size={14} /> Log de Atividade
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "products" && (
          <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
               <div>
                 <h4 className="text-[12px] font-bold text-white uppercase tracking-widest">Configuração da Proposta</h4>
                 <p className="text-[10px] text-brand-text-muted uppercase font-medium">Selecione os armamentos e acessórios para este lead.</p>
               </div>
               <Button variant="secondary" size="sm" className="gap-2 h-9 text-[10px] font-bold" onClick={() => toast.info("Abrindo catálogo de produtos...")}>
                 <Plus size={14} /> ADICIONAR ITEM
               </Button>
            </div>

            <Card className="p-0 border-brand-border bg-brand-surface/20 overflow-hidden shadow-xl">
               <table className="w-full text-left">
                 <thead className="bg-brand-surface/60 border-b border-brand-border">
                   <tr>
                     <th className="px-6 py-4 text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Produto / SKU</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Qtd</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Valor Un.</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-brand-text-muted uppercase tracking-widest text-right">Subtotal</th>
                     <th className="px-6 py-4 w-10"></th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-brand-border/50">
                   {dealItems.map((item) => (
                     <tr key={item.id} className="hover:bg-brand-accent/5 transition-colors group">
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-brand-input rounded border border-brand-border flex items-center justify-center text-brand-accent group-hover:scale-110 transition-transform">
                               <Package size={20} />
                             </div>
                             <div>
                               <span className="text-sm font-bold text-white uppercase block">{item.product.name}</span>
                               <span className="text-[9px] text-brand-text-muted uppercase font-bold tracking-tighter">Calibre: {item.product.caliber}</span>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              defaultValue={item.quantity}
                              className="w-16 bg-brand-input border border-brand-border rounded-md px-3 py-1.5 text-xs text-white font-mono focus:border-brand-accent outline-none"
                            />
                          </div>
                       </td>
                       <td className="px-6 py-5 font-mono text-xs text-brand-text-secondary">
                         {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price)}
                       </td>
                       <td className="px-6 py-5 font-mono text-sm font-bold text-white text-right">
                         {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price * item.quantity)}
                       </td>
                       <td className="px-6 py-5">
                          <button 
                            className="p-2 text-brand-text-muted hover:text-brand-danger hover:bg-brand-danger/10 rounded-full transition-all"
                            onClick={() => toast.error("Removendo item da proposta...")}
                          >
                            <Trash2 size={16} />
                          </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
                 <tfoot className="bg-brand-surface/40 border-t border-brand-border">
                   <tr>
                     <td colSpan={3} className="px-6 py-5 text-[11px] font-bold text-brand-text-muted uppercase text-right tracking-widest">Valor Total da Negociação:</td>
                     <td className="px-6 py-5 font-mono text-xl font-bold text-brand-accent text-right">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                     </td>
                     <td></td>
                   </tr>
                 </tfoot>
               </table>
            </Card>

            <div className="flex flex-col md:flex-row gap-4">
               <Card className="flex-1 p-5 bg-brand-warning/5 border border-brand-warning/20 rounded-lg flex gap-4">
                  <FileText className="text-brand-warning shrink-0" size={24} />
                  <div>
                    <p className="text-[11px] font-bold text-brand-warning uppercase mb-1">Status de Reserva</p>
                    <p className="text-[10px] text-brand-text-muted uppercase leading-relaxed font-medium">Este lead ainda não possui reserva formal no estoque físico. Para garantir a exclusividade, converta em pedido.</p>
                  </div>
               </Card>
               <Button variant="secondary" className="h-auto py-4 px-8 gap-3 text-[11px] font-bold uppercase tracking-widest" onClick={handleGenerateProposal}>
                  <FileText size={18} /> GERAR PROPOSTA PDF
               </Button>
            </div>
          </div>
        )}

        {activeTab === "summary" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="space-y-6">
              <Card className="bg-brand-surface/30 border-brand-border p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6 border-b border-brand-border/50 pb-3">
                   <h4 className="text-[12px] font-bold text-brand-accent uppercase tracking-widest flex items-center gap-2">
                     <Settings size={14} /> Dados Cadastrais do Lead
                   </h4>
                   <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-3 text-[10px] font-bold gap-1.5 hover:bg-brand-accent/10 hover:text-brand-accent uppercase"
                    onClick={() => setIsEditingInfo(!isEditingInfo)}
                   >
                     {isEditingInfo ? "Cancelar Edição" : "Editar Dados"}
                   </Button>
                </div>
                
                {isEditingInfo ? (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <LeadForm 
                      initialData={lead} 
                      onSubmit={handleUpdateInfo} 
                      onCancel={() => setIsEditingInfo(false)} 
                      submitLabel="Salvar Atualização"
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 group">
                      <div className="p-3 bg-brand-surface rounded-lg border border-brand-border text-brand-text-muted group-hover:border-brand-accent transition-colors">
                        <Phone size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-brand-text-muted leading-none mb-2 tracking-widest">Telefone / WhatsApp</p>
                        <p className="text-sm font-mono text-white font-bold">{lead.phone || "(Não informado)"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 group">
                      <div className="p-3 bg-brand-surface rounded-lg border border-brand-border text-brand-text-muted group-hover:border-brand-accent transition-colors">
                        <Mail size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-brand-text-muted leading-none mb-2 tracking-widest">E-mail para Contato</p>
                        <p className="text-sm font-mono text-white font-bold">{lead.email || "(Não informado)"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              <Card className="bg-brand-surface/30 border-brand-border p-6">
                 <h4 className="text-[12px] font-bold text-white uppercase tracking-widest mb-6 border-b border-brand-border/50 pb-3">Qualificação Comercial</h4>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                       <p className="text-[10px] uppercase font-bold text-brand-text-muted tracking-widest">Nível de Prioridade</p>
                       <span className={cn(
                        "text-[10px] font-bold px-3 py-1 rounded border uppercase inline-block",
                        lead.priority === "high" ? "bg-brand-danger/10 text-brand-danger border-brand-danger/30" : "bg-brand-warning/10 text-brand-warning border-brand-warning/30"
                       )}>
                         {lead.priority === "high" ? "URGENTE / HOT" : "MÉDIO / WARM"}
                       </span>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] uppercase font-bold text-brand-text-muted tracking-widest">Canal de Origem</p>
                       <span className="text-[10px] font-bold text-white uppercase bg-brand-surface px-3 py-1 rounded border border-brand-border">Instagram Ads</span>
                    </div>
                 </div>
              </Card>
            </div>

            <div className="flex flex-col gap-4 h-full">
              <h4 className="text-[12px] font-bold text-white uppercase tracking-widest">Observações Estratégicas</h4>
              <textarea 
                className="flex-1 w-full bg-brand-surface/40 border border-brand-border rounded-lg p-5 text-sm text-white focus:outline-none focus:border-brand-accent min-h-[250px] resize-none"
                placeholder="Insira aqui notas sobre o perfil do comprador, objeções ou detalhes da negociação..."
              ></textarea>
              <Button 
                className="w-full py-4 gap-2 text-[11px] font-bold uppercase tracking-widest"
                onClick={() => toast.success("Observações salvas no histórico do lead.")}
              >
                <Save size={16} /> Salvar Observação
              </Button>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="animate-fade-in space-y-8 p-4">
            <h4 className="text-[12px] font-bold text-white uppercase tracking-widest">Linha do Tempo da Negociação</h4>
            <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-brand-border">
               {[
                 { action: "Lead cadastrado via formulário de prospecção", time: "08/05/2026 10:30", user: "Admin Eleven" },
                 { action: "Carrera VR-12P vinculado à negociação", time: "08/05/2026 10:35", user: "Admin Eleven" },
                 { action: "Proposta inicial enviada via WhatsApp", time: "08/05/2026 11:20", user: "Admin Eleven" },
                 { action: "Status alterado para INTERESSADO", time: "08/05/2026 12:00", user: "Sistema Inteligente" },
               ].map((log, i) => (
                 <div key={i} className="pl-10 relative group">
                    <div className="absolute left-0 top-1 w-6 h-6 bg-brand-surface border-2 border-brand-accent rounded-full flex items-center justify-center group-hover:scale-125 transition-transform">
                       <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse" />
                    </div>
                    <div>
                       <p className="text-sm text-white font-bold uppercase tracking-tight">{log.action}</p>
                       <p className="text-[10px] text-brand-text-muted uppercase font-bold mt-1 tracking-widest">{log.time} · Responsável: {log.user}</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
