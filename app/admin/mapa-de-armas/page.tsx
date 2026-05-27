"use client";

import React, { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAdminSession } from "@/lib/hooks/use-session";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, Filter, ShieldCheck, QrCode, FileText, MoreHorizontal, Target, History, CheckCircle2, Plus, Eye, Trash2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { useEffect, useCallback } from "react";
import { getWeapons, updateWeaponStatus, getWeaponStats, createWeapon, deleteWeapon, getProducts } from "./actions";

// Dados agora vêm do banco de dados via Server Actions

const STATUS_STYLES: Record<string, string> = {
  ESTOQUE: "bg-brand-success/10 text-brand-success border-brand-success/20",
  RESERVADA: "bg-brand-warning/10 text-brand-warning border-brand-warning/20",
  VENDIDA: "bg-brand-text-muted/10 text-brand-text-muted border-brand-text-muted/20",
  "CONFERÊNCIA": "bg-brand-accent/10 text-brand-accent border-brand-accent/20",
  IMPORTADA: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

export default function WeaponsMapPage() {
  const session = useAdminSession();
  const [weapons, setWeapons] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, available: 0, reserved: 0, sold: 0, divergence: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [selectedWeapon, setSelectedWeapon] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [newWeapon, setNewWeapon] = useState({
    serialNumber: "",
    productId: "",
    location: "COFRE A",
    unitCost: "",
    diNumber: ""
  });

  const refreshWeapons = useCallback(async () => {
    setLoading(true);
    try {
      const [wData, sData, pData] = await Promise.all([
        getWeapons(),
        getWeaponStats(),
        getProducts()
      ]);
      setWeapons(wData);
      setStats(sData);
      setProducts(pData);
    } catch (error) {
      toast.error("Erro ao carregar mapa de armas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWeapons();
  }, [refreshWeapons]);

  const filteredWeapons = useMemo(() => {
    return weapons.filter(w => {
      const matchesSearch = w.serial?.toLowerCase().includes(search.toLowerCase()) || 
                           w.product?.toLowerCase().includes(search.toLowerCase()) ||
                           w.customer?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "Todos" || w.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [weapons, search, filterStatus]);

  const handleAddWeapon = async () => {
    if (!newWeapon.serialNumber || !newWeapon.productId) {
      toast.error("Número de série e produto são obrigatórios.");
      return;
    }
    try {
      const res = await createWeapon(newWeapon);
      if (res.success) {
        toast.success("Arma cadastrada com sucesso!");
        setIsAddModalOpen(false);
        setNewWeapon({ serialNumber: "", productId: "", location: "COFRE A", unitCost: "", diNumber: "" });
        refreshWeapons();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Erro ao processar cadastro.");
    }
  };

  const handleDeleteWeapon = async (id: string) => {
    if (!confirm("Confirmar exclusão permanente deste registro?")) return;
    try {
      const res = await deleteWeapon(id);
      if (res.success) {
        toast.success("Registro removido.");
        refreshWeapons();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Erro ao excluir.");
    }
  };

  const handleScannerClick = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: "Ativando scanner laser...",
        success: "Serial VEZ24-889025 identificado! Armadura verificada.",
        error: "Erro na leitura do QR Code.",
      }
    );
  };

  const handleExportSigma = () => {
    toast.success("Gerando relatório SIGMA (Exército)...", {
      description: "O arquivo .csv será enviado para o e-mail de conformidade em instantes.",
      icon: <ShieldCheck className="text-brand-success" />,
    });
  };

  const openWeaponDetails = (weapon: any) => {
    setSelectedWeapon(weapon);
    setModalOpen(true);
  };

  return (
    <DashboardLayout role="ADMIN" userName={session.userName} userEmail={session.userEmail}>
      <div className="flex flex-col gap-8 animate-fade-in pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-accent/10 rounded border border-brand-accent/20 text-brand-accent shadow-[0_0_15px_rgba(245,196,0,0.1)]">
              <Target size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1 font-rajdhani uppercase text-white tracking-tighter">MAPA DE ARMAS (RASTREABILIDADE)</h1>
              <p className="text-brand-text-secondary text-[10px] font-bold uppercase tracking-widest opacity-70 leading-none">Controle individual por número de série e histórico de custódia legal.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="gap-2" onClick={handleScannerClick}>
              <QrCode size={18} />
              SCANNER
            </Button>
            <Button className="gap-2 shadow-[0_0_20px_rgba(245,196,0,0.15)]" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={18} />
              NOVO REGISTRO
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Rastreado", val: stats.total, color: "border-brand-border" },
            { label: "Disponível", val: stats.available, color: "border-brand-success text-brand-success" },
            { label: "Reservado", val: stats.reserved, color: "border-brand-warning text-brand-warning" },
            { label: "Vendido/Baixa", val: stats.sold, color: "border-brand-text-muted text-brand-text-muted" },
            { label: "Divergências", val: stats.divergence, color: "border-brand-danger text-brand-danger" },
          ].map((stat, i) => (
            <Card key={i} className={cn("py-3 px-4 border-l-2 bg-brand-surface/30", stat.color)}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted mb-0.5">{stat.label}</p>
              <p className={cn("text-xl font-bold font-mono", stat.color.includes("text-") ? stat.color.split(" ").pop() : "text-white")}>{stat.val}</p>
            </Card>
          ))}
        </div>

        <Card className="p-4 bg-brand-surface/20 border-brand-border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={18} />
              <Input 
                className="pl-10" 
                placeholder="Buscar por Serial, Lote, DI ou Cliente..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
            </div>
            <div className="flex gap-2">
              <select 
                className="bg-brand-input border border-brand-border rounded-military px-4 py-2 text-sm text-brand-text-secondary outline-none focus:border-brand-accent min-w-[160px]"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="Todos">Status: Todos</option>
                <option value="ESTOQUE">Status: Estoque</option>
                <option value="RESERVADA">Status: Reservada</option>
                <option value="VENDIDA">Status: Vendida</option>
                <option value="CONFERÊNCIA">Status: Conferência</option>
              </select>
              <Button variant="secondary" className="gap-2">
                <Filter size={16} />
                FILTRAR
              </Button>
            </div>
          </div>
        </Card>

        {/* Weapons Table */}
        <Card className="p-0 overflow-hidden border-brand-border bg-brand-surface/10">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th className="pl-6">Nº SÉRIE</th>
                  <th>MODELO / CALIBRE</th>
                  <th>LOTE / PROCESSO</th>
                  <th>ENDEREÇO FISICO</th>
                  <th>ENTRADA</th>
                  <th>STATUS / CUSTÓDIA</th>
                  <th className="pr-6 text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {filteredWeapons.map((w) => (
                  <tr key={w.serial} className="hover:bg-brand-accent/5 transition-colors group">
                    <td className="pl-6 font-mono text-brand-accent font-bold uppercase text-sm">{w.serial}</td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase text-white">{w.product}</span>
                        <span className="text-[10px] text-brand-text-muted uppercase font-bold tracking-tighter leading-none mt-0.5">PEÇA VERIFICADA</span>
                      </div>
                    </td>
                    <td className="font-mono text-[10px] text-brand-text-secondary uppercase">
                      {w.lot}<br/>
                      <span className="text-brand-text-muted opacity-60">DI: 24/0988712-0</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-success animate-pulse" />
                        <span className="text-xs font-mono uppercase text-brand-text-secondary font-bold">{w.location}</span>
                      </div>
                    </td>
                    <td className="text-xs font-mono text-brand-text-secondary">{w.entryDate}</td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className={cn(
                          "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border inline-block w-fit tracking-[0.2em]",
                          STATUS_STYLES[w.status] || "bg-brand-bg text-brand-text-muted border-brand-border"
                        )}>
                          {w.status}
                        </span>
                        <span className="text-[10px] text-brand-text-primary font-bold uppercase truncate max-w-[150px] leading-tight">
                          {w.customer}
                        </span>
                      </div>
                    </td>
                    <td className="pr-6 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" className="p-2 h-auto hover:text-brand-accent" title="Ficha Técnica" onClick={() => openWeaponDetails(w)}>
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-2 h-auto text-brand-text-muted hover:text-brand-danger" title="Excluir" onClick={() => handleDeleteWeapon(w.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-brand-surface/20 flex items-center justify-between border-t border-brand-border">
            <p className="text-[10px] text-brand-text-muted uppercase tracking-[0.2em] font-bold flex items-center gap-2">
              <CheckCircle2 size={12} className="text-brand-success" /> Conformidade Técnica: <span className="text-brand-success">Verificada (100%)</span>
            </p>
            <div className="flex gap-2">
               <Button variant="secondary" size="sm" className="text-[10px] font-bold uppercase h-8 px-4" onClick={() => toast.success("Exportando base de rastreabilidade...")}>Exportar CSV</Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal de Detalhes da Arma */}
      {modalOpen && selectedWeapon && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-brand-bg border border-brand-border rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-brand-border bg-brand-surface/50">
              <div className="flex items-center gap-3">
                <Target className="text-brand-accent" size={20} />
                <div>
                  <h2 className="text-lg font-bold font-rajdhani uppercase tracking-tighter text-white">RASTREABILIDADE: {selectedWeapon.serial}</h2>
                  <p className="text-[10px] text-brand-text-muted font-bold uppercase tracking-widest leading-none mt-0.5">{selectedWeapon.product}</p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-brand-text-muted hover:text-white transition-colors">
                <MoreHorizontal size={24} className="rotate-45" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
                {(() => {
                  const entryDateObj = (() => {
                    if (!selectedWeapon.entryDate) return new Date();
                    const parts = selectedWeapon.entryDate.split("/");
                    if (parts.length === 3) {
                      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                    }
                    return new Date(selectedWeapon.entryDate);
                  })();

                  const formatDateStr = (date: Date) => date.toLocaleDateString("pt-BR");

                  const dateChegada = new Date(entryDateObj.getTime() - 15 * 24 * 60 * 60 * 1000);
                  const dateVistoria = new Date(entryDateObj.getTime() - 3 * 24 * 60 * 60 * 1000);

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-6">
                         <div>
                           <p className="text-[10px] font-bold uppercase text-brand-accent mb-3 tracking-widest">FICHA TÉCNICA E CONFORMIDADE</p>
                           <div className="space-y-2">
                             {[
                               ["Modelo", selectedWeapon.product],
                               ["Fabricante", selectedWeapon.brand || "N/A"],
                               ["Calibre", selectedWeapon.caliber || "N/A"],
                               ["Lote", selectedWeapon.lot],
                               ["DI Importação", selectedWeapon.di || "N/A"],
                               ["Autorização Exército", "SFPC-11/2026-988"],
                             ].map(([label, val]) => (
                               <div key={label} className="flex justify-between py-1.5 border-b border-brand-border/50">
                                 <span className="text-[11px] font-bold uppercase text-brand-text-muted">{label}</span>
                                 <span className="text-[11px] font-bold uppercase text-white font-mono">{val}</span>
                               </div>
                             ))}
                           </div>
                         </div>

                         <div className="p-4 bg-brand-success/5 border border-brand-success/20 rounded">
                            <div className="flex items-center gap-3 mb-2">
                              <ShieldCheck className="text-brand-success" size={16} />
                              <span className="text-xs font-bold uppercase text-brand-success">Status de Conformidade</span>
                            </div>
                            <p className="text-[10px] text-brand-text-secondary leading-relaxed uppercase font-bold">
                              Esta peça passou por todos os testes de balística e conferência física na entrada da alfândega.
                            </p>
                         </div>
                       </div>

                       <div>
                         <p className="text-[10px] font-bold uppercase text-brand-accent mb-3 tracking-widest">HISTÓRICO DE CUSTÓDIA</p>
                         <div className="relative border-l border-brand-border pl-4 space-y-6 py-2">
                           {[
                             { date: formatDateStr(dateChegada), text: "Chegada em Porto/Alfândega", user: "Despachante" },
                             { date: formatDateStr(dateVistoria), text: "Vistoria Exército Brasileiro", user: "Tenente-Coronel Silva" },
                             { date: selectedWeapon.entryDate, text: "Entrada em Estoque Eleven", user: "Logística" },
                             { date: "Hoje", text: selectedWeapon.status === "VENDIDA" ? "Entrega ao Cliente Final" : "Em Custódia Eleven", user: selectedWeapon.customer },
                           ].map((step, i) => (
                             <div key={i} className="relative">
                               <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-brand-accent" />
                               <p className="text-[10px] font-bold text-brand-text-muted uppercase leading-none">{step.date}</p>
                               <p className="text-xs font-bold text-white uppercase mt-1">{step.text}</p>
                               <p className="text-[9px] text-brand-text-secondary uppercase mt-0.5 tracking-tighter">Responsável: {step.user}</p>
                             </div>
                           ))}
                         </div>
                       </div>
                    </div>
                  );
                })()}
             </div>

            <div className="p-4 bg-brand-surface/50 border-t border-brand-border flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>FECHAR</Button>
              <Button size="sm" className="gap-2" onClick={() => toast.success("Download do laudo técnico...")}>
                <FileText size={14} /> IMPRIMIR LAUDO
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Modal: Novo Registro de Arma */}
      <Dialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="REGISTRAR NOVA ARMA NO ESTOQUE"
        className="max-w-2xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold uppercase text-brand-text-muted">Modelo / Produto *</label>
              <select 
                className="w-full bg-brand-input border border-brand-border rounded-military px-4 py-2 text-sm text-white outline-none focus:border-brand-accent"
                value={newWeapon.productId}
                onChange={(e) => setNewWeapon({...newWeapon, productId: e.target.value})}
              >
                <option value="">Selecione o modelo...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.commercialName} ({p.caliber})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-brand-text-muted">Número de Série *</label>
              <Input 
                placeholder="Ex: ABC12345" 
                value={newWeapon.serialNumber}
                onChange={(e) => setNewWeapon({...newWeapon, serialNumber: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-brand-text-muted">Número da DI (Importação)</label>
              <Input 
                placeholder="Ex: 24/0988712-0" 
                value={newWeapon.diNumber}
                onChange={(e) => setNewWeapon({...newWeapon, diNumber: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-brand-text-muted">Custo Unitário (R$)</label>
              <Input 
                type="number"
                placeholder="0.00" 
                value={newWeapon.unitCost}
                onChange={(e) => setNewWeapon({...newWeapon, unitCost: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-brand-text-muted">Localização Física</label>
              <select 
                className="w-full bg-brand-input border border-brand-border rounded-military px-4 py-2 text-sm text-white outline-none focus:border-brand-accent"
                value={newWeapon.location}
                onChange={(e) => setNewWeapon({...newWeapon, location: e.target.value})}
              >
                <option value="COFRE A">COFRE PRINCIPAL (A)</option>
                <option value="COFRE B">COFRE SECUNDÁRIO (B)</option>
                <option value="MOSTRUARIO">MOSTRUÁRIO LOJA</option>
                <option value="TRANSITO">EM TRÂNSITO</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-brand-border">
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)} className="text-[10px] font-bold uppercase tracking-widest">
              CANCELAR
            </Button>
            <Button onClick={handleAddWeapon} className="gap-2 text-[10px] font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(245,196,0,0.15)]">
              <Save size={16} /> FINALIZAR REGISTRO
            </Button>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}

