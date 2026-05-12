"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
  Ship, Plus, Search, Filter, Anchor, Package, Truck, 
  CheckCircle2, Globe, ArrowRight, DollarSign, Calendar, 
  FileText, Download 
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { getImportLots, deleteImportLot } from "./actions";
import { BatchWorkspace } from "@/components/import/BatchWorkspace";
import { ImportSimulator } from "@/components/import/ImportSimulator";
import { Dialog } from "@/components/ui/Dialog";

const STATUS_MAP: Record<string, { label: string, class: string }> = {
  PEDIDO_FEITO: { label: "PEDIDO REALIZADO", class: "bg-brand-text-muted/10 text-brand-text-muted border-brand-border" },
  TRANSITO: { label: "EM TRÂNSITO", class: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  NACIONALIZANDO: { label: "NACIONALIZANDO", class: "bg-brand-warning/10 text-brand-warning border-brand-warning/20" },
  DISPONIVEL: { label: "DISPONÍVEL", class: "bg-brand-success/10 text-brand-success border-brand-success/20" },
  LIQUIDADO: { label: "LIQUIDADO", class: "bg-brand-success/10 text-brand-success border-brand-success/20" },
};

export default function ImportBatchesPage() {
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedLot, setSelectedLot] = useState<any>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const refreshLots = useCallback(async () => {
    setLoading(true);
    const data = await getImportLots();
    const mapped = data.map(l => ({
      ...l,
      id: l.lotId,
      dbId: l.id,
      origin: l.originCountry,
      items: l.items_count || 0,
      value: l.fobTotal,
      progress: l.status === "LIQUIDADO" ? 100 : l.status === "NACIONALIZANDO" ? 90 : l.status === "TRANSITO" ? 60 : 15
    }));
    setLots(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshLots();
  }, [refreshLots]);

  const filteredLots = useMemo(() => {
    return lots.filter(lot => {
      const matchesSearch = lot.id.toLowerCase().includes(search.toLowerCase()) ||
                           lot.supplier.toLowerCase().includes(search.toLowerCase()) ||
                           lot.origin.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || lot.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [lots, search, statusFilter]);

  const timelineSteps = [
    { id: "PEDIDO_FEITO", label: "PAGAMENTO", icon: <DollarSign size={18} /> },
    { id: "TRANSITO", label: "EMBARQUE", icon: <Ship size={18} /> },
    { id: "TRANSITO", label: "TRÂNSITO", icon: <Anchor size={18} /> },
    { id: "NACIONALIZANDO", label: "ADUANA", icon: <Truck size={18} /> },
    { id: "DISPONIVEL", label: "RECEBIDO", icon: <CheckCircle2 size={18} /> },
  ];

  return (
    <DashboardLayout role="ADMIN" userName="Admin Eleven" userEmail="admin@elevenfirearms.com.br">
       <div className="flex flex-col gap-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-accent/10 rounded border border-brand-accent/20 text-brand-accent">
                  <Globe size={28} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight mb-1 font-rajdhani uppercase text-white">LOTES DE IMPORTAÇÃO</h1>
                  <p className="text-brand-text-secondary text-sm font-medium uppercase tracking-wider text-[10px]">Gestão de Supply Chain Internacional e Desembaraço Aduaneiro</p>
                </div>
             </div>
             <div className="flex gap-3">
                <Button variant="secondary" className="gap-2" onClick={() => setIsSimulatorOpen(true)}>
                  SIMULAR CUSTOS
                </Button>
                <Link href="/admin/importacao/lotes/new">
                  <Button className="gap-2 shadow-[0_0_15px_rgba(245,196,0,0.1)]">
                    <Plus size={18} />
                    NOVO LOTE
                  </Button>
                </Link>
             </div>
          </div>

          {/* Pipeline Overview */}
          <Card className="p-6 bg-brand-surface/30 border-dashed border-brand-border/50">
             <div className="relative flex justify-between items-center max-w-4xl mx-auto">
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-brand-border -translate-y-1/2 z-0" />
                
                {timelineSteps.map((step, i) => {
                  const isActive = statusFilter === step.id;
                  const count = lots.filter(l => l.status === step.id).length;

                  return (
                    <button 
                      key={i} 
                      className="relative z-10 flex flex-col items-center gap-3 outline-none group"
                      onClick={() => setStatusFilter(statusFilter === step.id ? null : step.id)}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 relative",
                        isActive ? "bg-brand-accent text-brand-bg border-brand-accent shadow-[0_0_15px_rgba(245,196,0,0.2)] scale-110" : 
                        count > 0 ? "bg-brand-bg text-brand-accent border-brand-accent/50" :
                        "bg-brand-bg text-brand-text-muted border-brand-border"
                      )}>
                        {step.icon}
                        {count > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-danger text-white text-[10px] rounded-full flex items-center justify-center font-bold border border-brand-bg shadow-lg">
                            {count}
                          </span>
                        )}
                      </div>
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-[0.2em] transition-colors",
                        isActive ? "text-brand-accent" : "text-brand-text-muted group-hover:text-white"
                      )}>{step.label}</span>
                    </button>
                  );
                })}
             </div>
          </Card>

          {/* Filters */}
          <div className="flex gap-4">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={18} />
                <Input 
                  className="pl-10" 
                  placeholder="Filtrar por código do lote, fornecedor ou país..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
             <Button variant="secondary" className="gap-2" onClick={() => refreshLots()}>
                <Filter size={16} /> ATUALIZAR
             </Button>
          </div>

          {/* Lots Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
            {loading ? (
              <div className="col-span-full py-20 text-center text-brand-text-muted animate-pulse">
                CARREGANDO LOGÍSTICA INTERNACIONAL...
              </div>
            ) : filteredLots.length === 0 ? (
              <div className="col-span-full py-20 text-center text-brand-text-muted border-2 border-dashed border-brand-border rounded-lg">
                NENHUM LOTE ENCONTRADO PARA ESTE FILTRO
              </div>
            ) : filteredLots.map((lot) => (
               <Card 
                key={lot.id} 
                className="p-0 overflow-hidden border-brand-border hover:border-brand-accent/40 transition-all group flex flex-col cursor-pointer shadow-lg"
                onClick={() => setSelectedLot(lot)}
               >
                  <div className="p-5 border-b border-brand-border bg-brand-bg/40">
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-brand-input rounded border border-brand-border text-brand-text-muted group-hover:text-brand-accent transition-colors">
                             <Ship size={18} />
                           </div>
                           <div className="flex flex-col">
                             <h3 className="font-bold font-mono text-white text-lg leading-none">{lot.id}</h3>
                             <span className="text-[10px] text-brand-text-muted font-bold uppercase tracking-wider mt-1">{lot.supplier}</span>
                           </div>
                        </div>
                        <span className={cn(
                          "text-[9px] font-bold uppercase px-2 py-0.5 rounded border tracking-widest",
                          STATUS_MAP[lot.status]?.class
                        )}>
                          {STATUS_MAP[lot.status]?.label}
                        </span>
                     </div>

                     <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="flex flex-col gap-1">
                           <span className="text-[10px] text-brand-text-muted font-bold uppercase tracking-tighter">Origem</span>
                           <span className="text-sm font-medium text-white">{lot.origin}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-[10px] text-brand-text-muted font-bold uppercase tracking-tighter">Volume</span>
                           <span className="text-sm font-medium text-white">{lot.items} un</span>
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-[10px] text-brand-text-muted font-bold uppercase tracking-tighter">Previsão</span>
                           <span className="text-sm font-mono font-bold text-brand-accent">{lot.eta}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-[10px] text-brand-text-muted font-bold uppercase tracking-tighter">Valor FOB</span>
                           <span className="text-sm font-mono font-bold text-white">
                             {lot.currency} {lot.value?.toLocaleString('pt-BR')}
                           </span>
                        </div>
                     </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between bg-brand-surface/20">
                     <div>
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-widest">Progresso Logístico</span>
                           <span className="text-[11px] font-mono font-bold text-brand-accent">{lot.progress}%</span>
                        </div>
                        <div className="w-full h-1 bg-brand-border rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-brand-accent transition-all duration-700 shadow-[0_0_8px_rgba(245,196,0,0.4)]" 
                             style={{ width: `${lot.progress}%` }} 
                           />
                        </div>
                     </div>

                     <Button variant="ghost" className="w-full mt-6 text-[10px] py-2 h-auto text-brand-text-muted hover:text-white uppercase tracking-[0.2em] font-bold border border-brand-border hover:border-brand-accent/50 gap-2 transition-all group-hover:bg-brand-accent/5">
                       DETALHES DO PROCESSO <ArrowRight size={12} />
                     </Button>
                  </div>
               </Card>
            ))}

            <Link href="/admin/importacao/lotes/new" className="flex">
              <button className="flex-1 border-2 border-dashed border-brand-border rounded-lg p-8 flex flex-col items-center justify-center gap-4 hover:border-brand-accent/50 hover:bg-brand-accent/5 transition-all text-brand-text-muted hover:text-brand-accent group w-full">
                 <div className="w-12 h-12 rounded-full border-2 border-dashed border-brand-border flex items-center justify-center group-hover:border-brand-accent group-hover:scale-110 transition-all">
                    <Plus size={24} />
                 </div>
                 <div className="text-center">
                    <p className="font-bold uppercase tracking-widest text-xs">Novo Pedido</p>
                    <p className="text-[10px] uppercase font-medium opacity-60">Iniciar importação</p>
                 </div>
              </button>
            </Link>
          </div>
       </div>

       <Dialog
        isOpen={!!selectedLot}
        onClose={() => setSelectedLot(null)}
        title="Workspace do Lote de Importação"
        className="max-w-4xl"
       >
         <BatchWorkspace 
          batch={selectedLot} 
          onClose={() => setSelectedLot(null)} 
          onRefresh={refreshLots}
         />
       </Dialog>
       <Dialog
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        title="Simulador de Importação Internacional"
        className="max-w-3xl"
       >
         <ImportSimulator />
       </Dialog>

    </DashboardLayout>
  );
}
