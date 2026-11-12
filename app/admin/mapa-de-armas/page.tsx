"use client";

import React, { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAdminSession } from "@/lib/hooks/use-session";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, Filter, ShieldCheck, QrCode, MoreHorizontal, Target, History, CheckCircle2, Plus, Eye, Trash2, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { useEffect, useCallback } from "react";
import { getWeapons, updateWeaponStatus, getWeaponStats, createWeapon, deleteWeapon, getProducts, getWeaponMovements, exportWeaponMovementsPdf } from "./actions";

const MONTH_NAMES_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// Dados agora vêm do banco de dados via Server Actions

const STATUS_STYLES: Record<string, string> = {
  ESTOQUE: "bg-brand-success/10 text-brand-success border-brand-success/20",
  RESERVADA: "bg-brand-warning/10 text-brand-warning border-brand-warning/20",
  VENDIDA: "bg-brand-text-muted/10 text-brand-text-muted border-brand-text-muted/20",
  "CONFERÊNCIA": "bg-brand-accent/10 text-brand-accent border-brand-accent/20",
  IMPORTADA: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

const filterSelectClass =
  "w-full bg-brand-input border border-brand-border rounded-military px-3 py-2 text-sm text-brand-text-secondary outline-none focus:border-brand-accent disabled:opacity-50";
const filterLabelClass = "text-[9px] font-bold uppercase tracking-widest text-brand-text-muted";

export default function WeaponsMapPage() {
  const session = useAdminSession();
  const [weapons, setWeapons] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, available: 0, reserved: 0, sold: 0, divergence: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterProject, setFilterProject] = useState(""); // "" = todos, "__none__" = Estoque Eleven
  const [filterLot, setFilterLot] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [onlyDivergence, setOnlyDivergence] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  // Extrato de movimentação (entrada/reserva/venda/devolução) + exportação real em PDF mensal/anual
  const [showMovementsModal, setShowMovementsModal] = useState(false);
  const [movements, setMovements] = useState<any[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const now = new Date();
  const [movementMonth, setMovementMonth] = useState(now.getMonth() + 1);
  const [movementYear, setMovementYear] = useState(now.getFullYear());
  const [movementScope, setMovementScope] = useState<"month" | "year">("month");
  const [exportingPdf, setExportingPdf] = useState(false);

  const loadMovements = async (month: number, year: number) => {
    setLoadingMovements(true);
    try {
      const data = await getWeaponMovements(movementScope === "month" ? { month, year } : { year });
      setMovements(data);
    } finally {
      setLoadingMovements(false);
    }
  };

  const handleExportMovementsPdf = async () => {
    setExportingPdf(true);
    try {
      const periodLabel = movementScope === "month"
        ? `${MONTH_NAMES_PT[movementMonth - 1]}/${movementYear}`
        : `Ano de ${movementYear}`;
      const res = await exportWeaponMovementsPdf(
        movementScope === "month" ? { month: movementMonth, year: movementYear, periodLabel } : { year: movementYear, periodLabel }
      );
      if (!res.success || !res.base64) {
        toast.error(res.error || "Erro ao gerar PDF.");
        return;
      }
      const byteChars = atob(res.base64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `movimentacoes_${movementScope === "month" ? `${movementYear}-${String(movementMonth).padStart(2, "0")}` : movementYear}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("PDF gerado com sucesso!");
    } finally {
      setExportingPdf(false);
    }
  };
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

  // Opções dos filtros, derivadas das próprias armas (só aparece o que existe).
  const filterOptions = useMemo(() => {
    const projects = new Map<string, string>();
    const products = new Set<string>();
    const customers = new Set<string>();
    let hasNoProject = false;
    for (const w of weapons) {
      if (w.projectId) projects.set(w.projectId, w.projectName);
      else hasNoProject = true;
      if (w.product) products.add(w.product);
      if (w.customerName) customers.add(w.customerName);
    }
    const sortPt = (a: string, b: string) => a.localeCompare(b, "pt-BR");
    return {
      projects: [...projects.entries()].sort((a, b) => sortPt(a[1], b[1])),
      hasNoProject,
      products: [...products].sort(sortPt),
      customers: [...customers].sort(sortPt),
    };
  }, [weapons]);

  // Ciclos (lotes) do projeto escolhido.
  const cycleOptions = useMemo(() => {
    if (!filterProject || filterProject === "__none__") return [];
    const m = new Map<string, string>();
    for (const w of weapons) {
      if (w.projectId === filterProject) m.set(w.lot, w.cycleLabel ? `${w.cycleLabel} · ${w.lot}` : w.lot);
    }
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [weapons, filterProject]);

  // Todos os filtros, menos o de status: usado também para contar cada status nos cartões.
  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return weapons.filter(w => {
      if (q) {
        const hay = [w.serial, w.product, w.customerName, w.lot, w.di, w.projectName].map(v => String(v || "").toLowerCase());
        if (!hay.some(v => v.includes(q))) return false;
      }
      if (filterProject === "__none__" ? !!w.projectId : filterProject && w.projectId !== filterProject) return false;
      if (filterLot && w.lot !== filterLot) return false;
      if (filterProduct && w.product !== filterProduct) return false;
      if (filterCustomer && w.customerName !== filterCustomer) return false;
      if (filterFrom && w.entryDateIso < filterFrom) return false;
      if (filterTo && w.entryDateIso > filterTo) return false;
      if (onlyDivergence && !w.hasDivergence) return false;
      return true;
    });
  }, [weapons, search, filterProject, filterLot, filterProduct, filterCustomer, filterFrom, filterTo, onlyDivergence]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const w of baseFiltered) c[w.status] = (c[w.status] || 0) + 1;
    return c;
  }, [baseFiltered]);

  const filteredWeapons = useMemo(
    () => (filterStatus === "Todos" ? baseFiltered : baseFiltered.filter(w => w.status === filterStatus)),
    [baseFiltered, filterStatus]
  );

  const activeFilterCount =
    (search.trim() ? 1 : 0) + (filterStatus !== "Todos" ? 1 : 0) + (filterProject ? 1 : 0) + (filterLot ? 1 : 0) +
    (filterProduct ? 1 : 0) + (filterCustomer ? 1 : 0) + (filterFrom ? 1 : 0) + (filterTo ? 1 : 0) + (onlyDivergence ? 1 : 0);

  const clearFilters = () => {
    setSearch("");
    setFilterStatus("Todos");
    setFilterProject("");
    setFilterLot("");
    setFilterProduct("");
    setFilterCustomer("");
    setFilterFrom("");
    setFilterTo("");
    setOnlyDivergence(false);
  };

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

  const handleExportCSV = () => {
    if (filteredWeapons.length === 0) {
      toast.error("Nenhuma arma para exportar.");
      return;
    }
    const headers = ["Numero_Serie", "Produto", "Marca", "Calibre", "Status", "Localizacao", "Lote", "Projeto", "Ciclo", "DI", "Data_Entrada", "Cliente"];
    const rows = filteredWeapons.map(w => [
      w.serial, w.product, w.brand, w.caliber, w.status, w.location, w.lot, w.projectName || "Estoque Eleven", w.cycleNumber || "", w.di, w.entryDate, w.customer,
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map((val: any) => `"${String(val ?? "").replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mapa-de-armas_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Base de rastreabilidade exportada!");
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
        {/* Cartões = atalhos de status. Contam o que está dentro dos outros filtros. */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { key: "Todos", label: "Total Rastreado", val: baseFiltered.length, color: "border-brand-border", text: "text-white" },
            { key: "ESTOQUE", label: "Disponível", val: statusCounts.ESTOQUE || 0, color: "border-brand-success", text: "text-brand-success" },
            { key: "RESERVADA", label: "Reservado", val: statusCounts.RESERVADA || 0, color: "border-brand-warning", text: "text-brand-warning" },
            { key: "VENDIDA", label: "Vendido/Baixa", val: statusCounts.VENDIDA || 0, color: "border-brand-text-muted", text: "text-brand-text-muted" },
          ].map((stat) => {
            const active = filterStatus === stat.key;
            return (
              <button
                key={stat.key}
                type="button"
                onClick={() => setFilterStatus(stat.key)}
                aria-pressed={active}
                className={cn(
                  "text-left py-3 px-4 rounded border border-l-2 bg-brand-surface/30 transition-all hover:bg-brand-surface/60",
                  stat.color,
                  active ? "ring-1 ring-brand-accent bg-brand-surface/70" : "border-brand-border/60"
                )}
              >
                <p className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted mb-0.5">{stat.label}</p>
                <p className={cn("text-xl font-bold font-mono", stat.text)}>{stat.val}</p>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setOnlyDivergence(v => !v)}
            aria-pressed={onlyDivergence}
            className={cn(
              "text-left py-3 px-4 rounded border border-l-2 border-brand-danger bg-brand-surface/30 transition-all hover:bg-brand-surface/60",
              onlyDivergence ? "ring-1 ring-brand-danger bg-brand-surface/70" : "border-brand-border/60"
            )}
          >
            <p className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted mb-0.5">Divergências</p>
            <p className="text-xl font-bold font-mono text-brand-danger">{baseFiltered.filter(w => w.hasDivergence).length}</p>
          </button>
        </div>

        <Card className="p-4 bg-brand-surface/20 border-brand-border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={18} />
              <Input
                className="pl-10 pr-9"
                placeholder="Buscar por série, modelo, lote, DI, projeto ou cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Limpar busca"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
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
            <select
              className={cn(filterSelectClass, "md:w-56")}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Status"
            >
              <option value="Todos">Status: todos</option>
              <option value="ESTOQUE">Em estoque</option>
              <option value="RESERVADA">Reservada</option>
              <option value="VENDIDA">Vendida</option>
              <option value="IMPORTADA">Importada (a chegar)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mt-3">
            <label className="flex flex-col gap-1">
              <span className={filterLabelClass}>Projeto</span>
              <select
                className={filterSelectClass}
                value={filterProject}
                onChange={(e) => { setFilterProject(e.target.value); setFilterLot(""); }}
              >
                <option value="">Todos</option>
                {filterOptions.projects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                {filterOptions.hasNoProject && <option value="__none__">Estoque Eleven (sem projeto)</option>}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={filterLabelClass}>Ciclo / Lote</span>
              <select
                className={filterSelectClass}
                value={filterLot}
                onChange={(e) => setFilterLot(e.target.value)}
                disabled={cycleOptions.length === 0}
                title={cycleOptions.length === 0 ? "Escolha um projeto primeiro" : undefined}
              >
                <option value="">{cycleOptions.length === 0 ? "Escolha o projeto" : "Todos os ciclos"}</option>
                {cycleOptions.map(([lot, label]) => <option key={lot} value={lot}>{label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={filterLabelClass}>Modelo</span>
              <select className={filterSelectClass} value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)}>
                <option value="">Todos</option>
                {filterOptions.products.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={filterLabelClass}>Cliente</span>
              <select className={filterSelectClass} value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)}>
                <option value="">Todos</option>
                {filterOptions.customers.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={filterLabelClass}>Entrada de</span>
              <input type="date" className={filterSelectClass} value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={filterLabelClass}>Entrada até</span>
              <input type="date" className={filterSelectClass} value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-brand-border/40">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-text-muted">
              Mostrando <span className="text-white">{filteredWeapons.length}</span> de {weapons.length} armas
              {onlyDivergence && <span className="text-brand-danger"> · só com divergência</span>}
            </p>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-brand-accent hover:underline"
              >
                <X size={13} /> Limpar filtros ({activeFilterCount})
              </button>
            )}
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
                        <span className={cn(
                          "text-[10px] uppercase font-bold tracking-tighter leading-none mt-0.5",
                          w.hasDivergence ? "text-brand-danger" : "text-brand-text-muted"
                        )}>
                          {w.hasDivergence ? "DIVERGÊNCIA" : "SEM DIVERGÊNCIA"}
                        </span>
                      </div>
                    </td>
                    <td className="font-mono text-[10px] text-brand-text-secondary uppercase">
                      {w.lot}<br/>
                      {w.projectName ? (
                        <span className="block normal-case font-sans text-[10px] font-bold text-brand-accent leading-tight mt-0.5" title={`${w.projectName} — ${w.cycleLabel}`}>
                          {w.projectName}
                          <span className="block font-normal text-brand-text-secondary">{w.cycleLabel}</span>
                        </span>
                      ) : (
                        <span className="block normal-case font-sans text-[10px] text-brand-text-muted leading-tight mt-0.5">Estoque Eleven (sem projeto)</span>
                      )}
                      <span className="text-brand-text-muted opacity-60">DI: {w.di}</span>
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
              <CheckCircle2 size={12} className={stats.divergence > 0 ? "text-brand-danger" : "text-brand-success"} />
              Sem Divergências: <span className={stats.divergence > 0 ? "text-brand-danger" : "text-brand-success"}>
                {stats.total > 0 ? (((stats.total - stats.divergence) / stats.total) * 100).toFixed(1) : "100.0"}% ({stats.total - stats.divergence}/{stats.total})
              </span>
            </p>
            <div className="flex gap-2">
               <Button variant="secondary" size="sm" className="text-[10px] font-bold uppercase h-8 px-4" onClick={() => { setShowMovementsModal(true); loadMovements(movementMonth, movementYear); }}>
                 <History size={12} className="mr-1.5" /> Movimentações
               </Button>
               <Button variant="secondary" size="sm" className="text-[10px] font-bold uppercase h-8 px-4" onClick={handleExportCSV}>Exportar CSV</Button>
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
                  // Linha do tempo construída SOMENTE a partir de datas reais gravadas na arma.
                  // Etapas sem data registrada no sistema (ex: vistoria do Exército) são omitidas
                  // em vez de inventadas.
                  const steps: { date: string; text: string }[] = [];
                  if (selectedWeapon.entryDate) {
                    steps.push({ date: selectedWeapon.entryDate, text: `Entrada em Estoque ${selectedWeapon.owner || "Eleven"}` });
                  }
                  if (selectedWeapon.customsClearanceDate) {
                    steps.push({ date: selectedWeapon.customsClearanceDate, text: "Desembaraço Aduaneiro" });
                  }
                  if (selectedWeapon.status === "VENDIDA" && selectedWeapon.saleDate) {
                    steps.push({ date: selectedWeapon.saleDate, text: `Venda registrada${selectedWeapon.customer ? ` — ${selectedWeapon.customer}` : ""}` });
                  } else {
                    steps.push({ date: "Atual", text: selectedWeapon.status === "VENDIDA" ? "Vendida" : `Em custódia — ${selectedWeapon.owner || "Eleven"}` });
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-6">
                         <div>
                           <p className="text-[10px] font-bold uppercase text-brand-accent mb-3 tracking-widest">FICHA TÉCNICA</p>
                           <div className="space-y-2">
                             {[
                               ["Modelo", selectedWeapon.product],
                               ["Fabricante", selectedWeapon.brand || "N/A"],
                               ["Calibre", selectedWeapon.caliber || "N/A"],
                               ["Lote", selectedWeapon.lot],
                               ["Projeto", selectedWeapon.projectName || "Estoque Eleven"],
                               ["Ciclo", selectedWeapon.cycleLabel || "—"],
                               ["DI Importação", selectedWeapon.di || "N/A"],
                             ].map(([label, val]) => (
                               <div key={label} className="flex justify-between py-1.5 border-b border-brand-border/50">
                                 <span className="text-[11px] font-bold uppercase text-brand-text-muted">{label}</span>
                                 <span className="text-[11px] font-bold uppercase text-white font-mono">{val}</span>
                               </div>
                             ))}
                           </div>
                         </div>

                         <div className={cn(
                           "p-4 rounded border",
                           selectedWeapon.hasDivergence ? "bg-brand-danger/5 border-brand-danger/20" : "bg-brand-success/5 border-brand-success/20"
                         )}>
                            <div className="flex items-center gap-3 mb-2">
                              <ShieldCheck className={selectedWeapon.hasDivergence ? "text-brand-danger" : "text-brand-success"} size={16} />
                              <span className={cn("text-xs font-bold uppercase", selectedWeapon.hasDivergence ? "text-brand-danger" : "text-brand-success")}>
                                {selectedWeapon.hasDivergence ? "Divergência Registrada" : "Sem Divergências Registradas"}
                              </span>
                            </div>
                            <p className="text-[10px] text-brand-text-secondary leading-relaxed uppercase font-bold">
                              {selectedWeapon.observations || (selectedWeapon.hasDivergence ? "Verifique as observações do registro." : "Nenhuma observação cadastrada para esta peça.")}
                            </p>
                         </div>
                       </div>

                       <div>
                         <p className="text-[10px] font-bold uppercase text-brand-accent mb-3 tracking-widest">HISTÓRICO DE CUSTÓDIA</p>
                         <div className="relative border-l border-brand-border pl-4 space-y-6 py-2">
                           {steps.map((step, i) => (
                             <div key={i} className="relative">
                               <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-brand-accent" />
                               <p className="text-[10px] font-bold text-brand-text-muted uppercase leading-none">{step.date}</p>
                               <p className="text-xs font-bold text-white uppercase mt-1">{step.text}</p>
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

      {/* Modal de Movimentações (extrato real de entrada/saída) */}
      <Dialog
        isOpen={showMovementsModal}
        onClose={() => setShowMovementsModal(false)}
        title="MOVIMENTAÇÃO DE ARMAS"
        className="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest">Período</label>
              <select
                className="bg-brand-input border border-brand-border rounded px-3 py-2 text-xs text-white outline-none focus:border-brand-accent"
                value={movementScope}
                onChange={e => { const v = e.target.value as "month" | "year"; setMovementScope(v); loadMovements(movementMonth, movementYear); }}
              >
                <option value="month">Mensal</option>
                <option value="year">Anual</option>
              </select>
            </div>
            {movementScope === "month" && (
              <div className="space-y-1">
                <label className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest">Mês</label>
                <select
                  className="bg-brand-input border border-brand-border rounded px-3 py-2 text-xs text-white outline-none focus:border-brand-accent"
                  value={movementMonth}
                  onChange={e => { const v = parseInt(e.target.value); setMovementMonth(v); loadMovements(v, movementYear); }}
                >
                  {MONTH_NAMES_PT.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest">Ano</label>
              <select
                className="bg-brand-input border border-brand-border rounded px-3 py-2 text-xs text-white outline-none focus:border-brand-accent"
                value={movementYear}
                onChange={e => { const v = parseInt(e.target.value); setMovementYear(v); loadMovements(movementMonth, v); }}
              >
                {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <Button size="sm" className="gap-2 text-[10px] font-bold uppercase tracking-widest ml-auto" onClick={handleExportMovementsPdf} disabled={exportingPdf}>
              {exportingPdf ? "Gerando..." : <><History size={13} /> Exportar PDF</>}
            </Button>
          </div>

          <div className="max-h-[50vh] overflow-y-auto border border-brand-border rounded">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-brand-surface">
                <tr>
                  <th className="px-3 py-2 text-[9px] font-black text-brand-text-muted uppercase tracking-widest">Data</th>
                  <th className="px-3 py-2 text-[9px] font-black text-brand-text-muted uppercase tracking-widest">Tipo</th>
                  <th className="px-3 py-2 text-[9px] font-black text-brand-text-muted uppercase tracking-widest">Série</th>
                  <th className="px-3 py-2 text-[9px] font-black text-brand-text-muted uppercase tracking-widest">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/30">
                {loadingMovements ? (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-[10px] text-brand-text-muted uppercase font-bold">Carregando...</td></tr>
                ) : movements.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-[10px] text-brand-text-muted uppercase font-bold">Nenhuma movimentação neste período.</td></tr>
                ) : (
                  movements.map(m => (
                    <tr key={m.id}>
                      <td className="px-3 py-2 text-[10px] text-brand-text-secondary font-mono">{m.occurredAt}</td>
                      <td className="px-3 py-2 text-[10px] font-bold uppercase text-white">{m.type}</td>
                      <td className="px-3 py-2 text-[10px] font-mono text-brand-accent">{m.serial}</td>
                      <td className="px-3 py-2 text-[10px] text-brand-text-secondary">{m.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}

