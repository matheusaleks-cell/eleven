"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import {
  projectFutureBatches,
  calcImportCostBRL,
  calcImportBreakdown,
  VR12_PUMP_PRESET,
  type SimulatorInputs,
  type BatchProjection,
} from "@/lib/calculations";

import { Dialog } from "@/components/ui/Dialog";
import {
  TrendingUp,
  Package,
  DollarSign,
  BarChart3,
  RefreshCw,
  Zap,
  ArrowRight,
  Target,
  Layers,
  AlertTriangle,
  FileDown,
  ChevronDown,
  ChevronUp,
  Eye,
  Printer,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── helpers ───────────────────────────────────────────────────────────────

function fmtBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function fmtBRL2(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function fmtPct(value: number) {
  return value.toFixed(1) + "%";
}

// ─── input field ───────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  id: string;
  value: number;
  step?: number;
  min?: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
}

function Field({ label, id, value, onChange, prefix, suffix, hint }: FieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  const formattedValue = useMemo(() => {
    if (isFocused) return value.toString().replace(".", ",");
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 4,
    }).format(value);
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(",", ".");
    const num = parseFloat(raw);
    if (!isNaN(num)) onChange(num);
    else if (raw === "") onChange(0);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-text-muted">
        {label}
      </label>
      <div className={cn(
        "flex items-center gap-2 bg-brand-input border rounded px-3 py-2 transition-all",
        isFocused ? "border-brand-accent shadow-[0_0_10px_rgba(245,196,0,0.1)]" : "border-brand-border"
      )}>
        {prefix && <span className="text-brand-text-muted text-sm font-bold shrink-0">{prefix}</span>}
        <input
          id={id}
          type="text"
          value={formattedValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="bg-transparent text-white text-sm font-mono w-full outline-none"
        />
        {suffix && <span className="text-brand-text-muted text-sm shrink-0">{suffix}</span>}
      </div>
      {hint && <p className="text-[10px] text-brand-text-muted leading-tight">{hint}</p>}
    </div>
  );
}

// ─── batch row ─────────────────────────────────────────────────────────────

function BatchRow({ b, isLast }: { b: BatchProjection; isLast: boolean }) {
  const pct = Math.min((b.investorROI / 100) * 100, 100);

  return (
    <div className={`grid grid-cols-[80px_1fr] gap-4 p-4 rounded-lg border transition-all ${
      b.batchNumber === 1
        ? "border-[rgba(245,196,0,0.4)] bg-[rgba(245,196,0,0.05)]"
        : "border-[rgba(51,51,51,0.6)] hover:border-brand-border"
    }`}>
      <div className="flex flex-col items-center justify-center gap-1">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg font-rajdhani border-2 ${
          b.batchNumber === 1
            ? "border-brand-accent text-brand-accent bg-[rgba(245,196,0,0.1)]"
            : "border-brand-border text-brand-text-secondary bg-brand-input"
        }`}>
          {b.batchNumber}
        </div>
        <span className="text-[9px] text-brand-text-muted uppercase font-bold tracking-widest">LOTE</span>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <div>
            <p className="text-[9px] text-brand-text-muted uppercase font-bold tracking-wider mb-0.5">Unidades</p>
            <p className="text-base font-bold font-mono text-white">{b.quantity}</p>
          </div>
          <div>
            <p className="text-[9px] text-brand-text-muted uppercase font-bold tracking-wider mb-0.5">Aporte</p>
            <p className="text-base font-bold font-mono text-white">{fmtBRL(b.totalImportCostBRL)}</p>
          </div>
          <div>
            <p className="text-[9px] text-brand-text-muted uppercase font-bold tracking-wider mb-0.5">Faturamento</p>
            <p className="text-base font-bold font-mono text-white">{fmtBRL(b.grossRevenue)}</p>
          </div>
          <div>
            <p className="text-[9px] text-brand-text-muted uppercase font-bold tracking-wider mb-0.5">Lucro Líquido</p>
            <p className="text-base font-bold font-mono text-brand-success">{fmtBRL(b.netLiquidProfit)}</p>
          </div>
          <div>
            <p className="text-[9px] text-brand-text-muted uppercase font-bold tracking-wider mb-0.5">Investidor</p>
            <p className="text-base font-bold font-mono text-brand-accent">{fmtBRL(b.investorShare)}</p>
          </div>
          <div>
            <p className="text-[9px] text-brand-text-muted uppercase font-bold tracking-wider mb-0.5">ROI Lote</p>
            <p className="text-base font-bold font-mono text-brand-success">{fmtPct(b.investorROI)}</p>
          </div>
        </div>

        <div className="h-1.5 rounded-full bg-brand-border overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-accent to-brand-success transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>

        {!isLast && (
          <div className="flex items-center gap-2 text-[10px] text-brand-text-muted font-bold uppercase tracking-wider">
            <ArrowRight size={12} className="text-brand-accent" />
            <span>
              Capital para Lote {b.batchNumber + 1}:{" "}
              <span className="text-white">{fmtBRL(b.nextBatchCapital)}</span>
              {" · "}
              Capacidade:{" "}
              <span className="text-brand-accent">≈ {b.nextBatchQuantity} un.</span>
              {b.carryover > 1 && (
                <span className="ml-2 text-brand-text-muted">
                  (sobra {fmtBRL(b.carryover)} vai para reserva)
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── report content ─────────────────────────────────────────────────────────

function ReportContent({
  investorName,
  sessionName,
  initialAporte,
  totalInvestorEarnings,
  globalROI,
  totalFaturamento,
  inputs,
  breakdown,
  batches,
  totalCompanyEarnings,
}: {
  investorName: string;
  sessionName: string;
  initialAporte: number;
  totalInvestorEarnings: number;
  globalROI: number;
  totalFaturamento: number;
  inputs: SimulatorInputs;
  breakdown: any;
  batches: BatchProjection[];
  totalCompanyEarnings: number;
}) {
  const maxRevenue = useMemo(
    () => Math.max(...batches.map((b) => b.grossRevenue), 1),
    [batches]
  );

  const costComposition = useMemo(() => {
    const total = breakdown.total || 1;
    return [
      { label: "Valor CIF (USD/BRL)", val: breakdown.va, pct: (breakdown.va / total) * 100, color: "bg-slate-700", hex: "#334155" },
      { label: "II + IPI", val: breakdown.ii + breakdown.ipi, pct: ((breakdown.ii + breakdown.ipi) / total) * 100, color: "bg-amber-600", hex: "#d97706" },
      { label: "PIS/COFINS/Siscomex/Op", val: breakdown.pis + breakdown.cofins + breakdown.siscomex + breakdown.custoOp, pct: ((breakdown.pis + breakdown.cofins + breakdown.siscomex + breakdown.custoOp) / total) * 100, color: "bg-blue-600", hex: "#2563eb" },
      { label: "ICMS Gross-up", val: breakdown.icms, pct: (breakdown.icms / total) * 100, color: "bg-emerald-600", hex: "#059669" },
    ];
  }, [breakdown]);

  return (
    <div className="bg-white text-slate-900 font-sans text-xs p-8 leading-relaxed w-full max-w-4xl mx-auto border border-slate-200 rounded flex flex-col justify-between min-h-[270mm]">
      <div>
        {/* Cabeçalho da Proposta com Logo */}
        <div className="flex justify-between items-center border-b-2 border-amber-500 pb-5 mb-8">
          <div className="flex items-center gap-4">
            <img
              src="/logos/logo-alta-preto.png"
              alt="Eleven Firearms"
              className="h-12 w-auto object-contain shrink-0"
              onError={(e) => {
                // Fallback se o PNG não for encontrado na rota relativa
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div className="h-10 w-[1px] bg-slate-300 mx-1 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-slate-900 text-amber-400 font-black text-[10px] px-2.5 py-0.5 tracking-widest uppercase rounded" style={{ backgroundColor: "#0f172a", color: "#f5c400", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
                  ELEVEN FIREARMS
                </span>
                <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                  Inteligência em Operações Internacionais
                </span>
              </div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Simulação de Escalada de Lotes & Aportes
              </h1>
              {investorName && (
                <p className="text-xs font-bold text-amber-800 mt-1">
                  Investidor / Proposta: <span className="text-slate-900 font-extrabold">{investorName}</span>
                </p>
              )}
            </div>
          </div>
          <div className="text-right text-[9.5px] text-slate-500 leading-relaxed shrink-0">
            <p className="font-black text-slate-900 uppercase tracking-wider">PROJEÇÃO ESTRATÉGICA</p>
            <p>Emissão: {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
            <p>Responsável: <span className="font-semibold text-slate-700">{sessionName || "Administrador"}</span></p>
          </div>
        </div>

        {/* 3 KPIs Principais em Destaque */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="border border-slate-300 bg-slate-50/80 rounded-xl p-4 text-center shadow-sm">
            <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1.5">
              Aporte Inicial (Lote 1)
            </span>
            <span className="text-lg font-black text-slate-900 font-mono">{fmtBRL(initialAporte)}</span>
          </div>
          <div className="border border-amber-300 bg-amber-50/80 rounded-xl p-4 text-center shadow-sm">
            <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-amber-800 block mb-1.5">
              Lucro Acumulado Investidor
            </span>
            <span className="text-lg font-black text-amber-700 font-mono">{fmtBRL(totalInvestorEarnings)}</span>
          </div>
          <div className="border border-emerald-300 bg-emerald-50/80 rounded-xl p-4 text-center shadow-sm">
            <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-emerald-800 block mb-1.5">
              ROI Global Acumulado
            </span>
            <span className="text-lg font-black text-emerald-700 font-mono">+{fmtPct(globalROI)}</span>
          </div>
        </div>

        {/* Operação & Custo Aduaneiro */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 mb-12">
          {/* Dados da Operação */}
          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
            <div className="bg-slate-900 text-amber-400 font-bold px-5 py-3.5 text-[11px] uppercase tracking-wider border-b border-slate-800" style={{ backgroundColor: "#0f172a", color: "#f5c400", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
              1. Parâmetros da Operação
            </div>
            <div className="p-3">
              <table className="w-full text-[10.5px] border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200/80">
                    <td className="py-3.5 px-4 text-slate-600 font-medium">Qtd Inicial / Preço Venda:</td>
                    <td className="py-3.5 px-4 font-bold text-right text-slate-900">{inputs.initialQuantity} un. @ {fmtBRL(inputs.salePricePerUnit)}</td>
                  </tr>
                  <tr className="border-b border-slate-200/80">
                    <td className="py-3.5 px-4 text-slate-600 font-medium">FOB / Frete Unitário:</td>
                    <td className="py-3.5 px-4 font-mono text-right text-slate-800">US$ {inputs.fobUnitUSD.toFixed(2)} / US$ {inputs.freightUnitUSD.toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-slate-200/80">
                    <td className="py-3.5 px-4 text-slate-600 font-medium">Câmbio BRL/USD:</td>
                    <td className="py-3.5 px-4 font-mono text-right text-slate-800">R$ {inputs.exchangeRate.toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-slate-200/80">
                    <td className="py-3.5 px-4 text-slate-600 font-medium">Impostos Venda / OpEx:</td>
                    <td className="py-3.5 px-4 font-mono text-right text-slate-800">{(inputs.salesTaxRate * 100).toFixed(1)}% / {(inputs.opExRate * 100).toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">Split Investidor / Lotes:</td>
                    <td className="py-3.5 px-4 font-bold text-amber-800 text-right">{(inputs.investorSplitPct * 100).toFixed(0)}% ({inputs.numBatches} lotes)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Custo Aduaneiro Lote 1 */}
          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
            <div className="bg-slate-900 text-amber-400 font-bold px-5 py-3.5 text-[11px] uppercase tracking-wider border-b border-slate-800" style={{ backgroundColor: "#0f172a", color: "#f5c400", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
              2. Custo Aduaneiro Lote 1 (Cálculo Real)
            </div>
            <div className="p-3">
              <table className="w-full text-[10.5px] border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200/80">
                    <td className="py-3 px-4 text-slate-600 font-medium">Valor Aduaneiro (CIF):</td>
                    <td className="py-3 px-4 font-mono text-right text-slate-800">{fmtBRL2(breakdown.va)}</td>
                  </tr>
                  <tr className="border-b border-slate-200/80">
                    <td className="py-3 px-4 text-slate-600 font-medium">II / IPI:</td>
                    <td className="py-3 px-4 font-mono text-right text-slate-800">{fmtBRL2(breakdown.ii)} / {fmtBRL2(breakdown.ipi)}</td>
                  </tr>
                  <tr className="border-b border-slate-200/80">
                    <td className="py-3 px-4 text-slate-600 font-medium">PIS / COFINS / Siscomex / Op:</td>
                    <td className="py-3 px-4 font-mono text-right text-slate-800">{fmtBRL2(breakdown.pis + breakdown.cofins + breakdown.siscomex + breakdown.custoOp)}</td>
                  </tr>
                  <tr className="border-b border-slate-200/80">
                    <td className="py-3 px-4 text-slate-600 font-medium">ICMS Importação (Gross-up):</td>
                    <td className="py-3 px-4 font-mono text-right text-slate-800">{fmtBRL2(breakdown.icms)}</td>
                  </tr>
                  <tr className="bg-amber-50/80 font-bold">
                    <td className="py-3.5 px-4 text-slate-900 uppercase">Custo Total Aporte Lote 1:</td>
                    <td className="py-3.5 px-4 font-mono text-amber-900 font-black text-right text-xs">{fmtBRL2(breakdown.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── SEÇÃO DE GRÁFICOS VISUAIS NO PDF ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 mb-14">
          {/* Gráfico 1: Escalada por Lote (Faturamento vs Lucro Investidor) */}
          <div className="border border-slate-300 rounded-xl p-6 bg-slate-50/50 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-800">
                Gráfico: Faturamento vs Lucro Investidor (R$)
              </span>
              <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md" style={{ backgroundColor: "#fef3c7", color: "#b45309", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
                Por Lote
              </span>
            </div>
            
            <div className="space-y-4 my-3">
              {batches.map((b) => {
                const revPct = (b.grossRevenue / maxRevenue) * 100;
                const invPct = (b.investorShare / maxRevenue) * 100;
                return (
                  <div key={b.batchNumber} className="space-y-1.5">
                    <div className="flex justify-between text-[9.5px] font-bold">
                      <span className="text-slate-700">Lote #{b.batchNumber} ({b.quantity} un.)</span>
                      <span className="text-amber-800 font-mono">Fat: {fmtBRL(b.grossRevenue)} | Inv: {fmtBRL(b.investorShare)}</span>
                    </div>
                    {/* Barra de Faturamento */}
                    <div className="h-3 rounded-full bg-slate-200 overflow-hidden relative flex" style={{ backgroundColor: "#e2e8f0", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${revPct}%`,
                          backgroundColor: "#1e293b",
                          printColorAdjust: "exact",
                          WebkitPrintColorAdjust: "exact",
                        }}
                      />
                      <div
                        className="h-full rounded-full transition-all -ml-1"
                        style={{
                          width: `${Math.max(invPct, 2)}%`,
                          backgroundColor: "#f59e0b",
                          printColorAdjust: "exact",
                          WebkitPrintColorAdjust: "exact",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 text-[9.5px] font-bold text-slate-600 pt-4 border-t border-slate-200 mt-4">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded inline-block" style={{ backgroundColor: "#1e293b", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }} />
                Faturamento Bruto
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded inline-block" style={{ backgroundColor: "#f59e0b", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }} />
                Lucro do Investidor
              </span>
            </div>
          </div>

          {/* Gráfico 2: Composição do Custo Aduaneiro (Lote 1) */}
          <div className="border border-slate-300 rounded-xl p-6 bg-slate-50/50 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-800">
                Gráfico: Composição do Custo Lote 1 (%)
              </span>
              <span className="text-[9px] font-bold text-slate-700 bg-slate-200 px-2.5 py-1 rounded-md" style={{ backgroundColor: "#e2e8f0", color: "#334155", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
                Breakdown Aduaneiro
              </span>
            </div>

            {/* Stacked Bar Visual */}
            <div className="my-3">
              <div className="h-6 rounded-lg overflow-hidden flex border border-slate-300 shadow-inner bg-slate-100">
                {costComposition.map((item, idx) => (
                  <div
                    key={idx}
                    className="h-full transition-all flex items-center justify-center text-[8.5px] font-bold text-white"
                    style={{
                      width: `${item.pct}%`,
                      backgroundColor: item.hex,
                      printColorAdjust: "exact",
                      WebkitPrintColorAdjust: "exact",
                    }}
                    title={`${item.label}: ${item.pct.toFixed(1)}%`}
                  >
                    {item.pct > 10 ? `${item.pct.toFixed(0)}%` : ""}
                  </div>
                ))}
              </div>

              {/* Legenda Detalhada do Gráfico */}
              <div className="grid grid-cols-2 gap-3 mt-5 text-[9.5px]">
                {costComposition.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: item.hex, printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }} />
                      <span className="text-slate-700 font-medium truncate">{item.label}</span>
                    </div>
                    <span className="font-bold font-mono text-slate-900">{fmtBRL(item.val)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[9px] text-slate-500 text-center pt-4 border-t border-slate-200 mt-4">
              *Calculado com ICMS gross-up e alíquotas oficiais de importação.
            </div>
          </div>
        </div>

        {/* Projeção Detalhada Lote a Lote */}
        <div className="border border-slate-300 rounded-xl overflow-hidden mt-12 mb-12 shadow-sm bg-white">
          <div className="bg-slate-900 text-amber-400 font-bold px-6 py-4 text-[11.5px] uppercase tracking-wider flex justify-between items-center border-b border-slate-800" style={{ backgroundColor: "#0f172a", color: "#f5c400", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
            <span>3. Projeção de Escalada Lote a Lote</span>
            <span className="text-[9.5px] text-slate-300 font-normal">Reaplicação dos lucros no próximo lote</span>
          </div>
          <div className="p-3">
            <table className="w-full text-[10.5px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-300 font-extrabold text-slate-700 uppercase tracking-wider text-[9.5px]">
                  <th className="py-3.5 px-4 text-center">Lote</th>
                  <th className="py-3.5 px-4 text-right">Qtd</th>
                  <th className="py-3.5 px-4 text-right">Aporte Lote</th>
                  <th className="py-3.5 px-4 text-right">Faturamento</th>
                  <th className="py-3.5 px-4 text-right">Lucro Líquido</th>
                  <th className="py-3.5 px-4 text-right text-amber-800">Lucro Investidor</th>
                  <th className="py-3.5 px-4 text-center text-emerald-800">ROI Lote</th>
                  <th className="py-3.5 px-4 text-right">Cap. Próx. Lote</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.batchNumber} className={`border-b border-slate-200 transition-colors ${
                    b.batchNumber === 1 ? "bg-amber-50/80 font-bold" : "even:bg-slate-50/40"
                  }`}>
                    <td className="py-4 px-4 text-center font-bold font-mono text-xs">#{b.batchNumber}</td>
                    <td className="py-4 px-4 text-right font-mono">{b.quantity} un</td>
                    <td className="py-4 px-4 text-right font-mono">{fmtBRL(b.totalImportCostBRL)}</td>
                    <td className="py-4 px-4 text-right font-mono">{fmtBRL(b.grossRevenue)}</td>
                    <td className="py-4 px-4 text-right font-mono">{fmtBRL(b.netLiquidProfit)}</td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-amber-800">{fmtBRL(b.investorShare)}</td>
                    <td className="py-4 px-4 text-center font-mono font-bold text-emerald-700">{fmtPct(b.investorROI)}</td>
                    <td className="py-4 px-4 text-right font-mono text-slate-700">{fmtBRL(b.nextBatchCapital)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumo Final Totais */}
        <div className="border border-slate-300 bg-slate-50/90 rounded-xl p-6 mt-10 mb-10 shadow-sm">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                Total Aporte L1
              </span>
              <span className="text-base font-bold font-mono text-slate-900">{fmtBRL(initialAporte)}</span>
            </div>
            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-800 block mb-1">
                Lucro Acumulado Investidor
              </span>
              <span className="text-base font-black font-mono text-amber-700">{fmtBRL(totalInvestorEarnings)} ({fmtPct(globalROI)} ROI)</span>
            </div>
            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                Faturamento Bruto Projetado
              </span>
              <span className="text-base font-bold font-mono text-slate-900">{fmtBRL(totalFaturamento)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé com Assinaturas e Isenção */}
      <div className="border-t border-slate-300 pt-4 mt-auto">
        <p className="text-[8.5px] text-slate-500 text-justify leading-relaxed mb-6">
          <strong>AVISO LEGAL:</strong> Projeção financeira estimativa baseada em parâmetros operacionais e tributários informados nesta data. Variações nas alíquotas de impostos, alterações cambiais (BRL/USD) e custos aduaneiros pontuais poderão alterar os resultados efetivos.
        </p>

        <div className="grid grid-cols-2 gap-16 pt-3">
          <div className="text-center border-t border-slate-400 pt-1.5">
            <p className="text-[9.5px] font-bold text-slate-800 uppercase">{investorName || "Investidor / Cliente"}</p>
            <p className="text-[8px] text-slate-500">De acordo / Aceite da Proposta</p>
          </div>
          <div className="text-center border-t border-slate-400 pt-1.5">
            <p className="text-[9.5px] font-bold text-slate-800 uppercase">Eleven Firearms</p>
            <p className="text-[8px] text-slate-500">Diretoria de Operações e Investimentos</p>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── page ──────────────────────────────────────────────────────────────────

export default function SimuladorPage() {
  const [session] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const s = localStorage.getItem("eleven_session");
      return s ? JSON.parse(s) : { name: "Admin", email: "admin@eleven.com" };
    }
    return { name: "Admin", email: "admin@eleven.com" };
  });

  const [inputs, setInputs] = useState<SimulatorInputs>(VR12_PUMP_PRESET);
  const [showTaxes, setShowTaxes] = useState(false);
  const [investorName, setInvestorName] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);

  const set = useCallback(
    (key: keyof SimulatorInputs) => (v: number) =>
      setInputs((prev) => ({ ...prev, [key]: v })),
    []
  );

  const batches = useMemo(() => projectFutureBatches(inputs), [inputs]);

  // Breakdown do custo do lote 1 para conferência
  const breakdown = useMemo(
    () => calcImportBreakdown(inputs.initialQuantity, inputs),
    [inputs]
  );

  const [isExporting, setIsExporting] = useState(false);

  // Função direta e limpa para exportar PDF sem abrir modais sobrepostos
  const handleExportPDF = () => {
    setIsExporting(true);
    toast.info("Gerando PDF da proposta...");
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 200);
  };

  const totalInvestorEarnings = batches[batches.length - 1]?.cumulativeInvestorEarnings ?? 0;
  const totalCompanyEarnings = batches.reduce((acc, b) => acc + b.companyShare, 0);
  const totalFaturamento = batches.reduce((acc, b) => acc + b.grossRevenue, 0);
  const initialAporte = batches[0]?.totalImportCostBRL ?? 0;
  const globalROI = initialAporte > 0 ? (totalInvestorEarnings / initialAporte) * 100 : 0;
  const lastBatch = batches[batches.length - 1];

  return (
    <DashboardLayout
      role="ADMIN"
      userName={session.name}
      userEmail={session.email}
      pageTitle="Simulador de Investimento"
    >
      {/* ── TELA PRINCIPAL DO SISTEMA (OCULTA NA IMPRESSÃO) ── */}
      <div className="flex flex-col gap-8 pb-10 animate-fade-in no-print">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-rajdhani uppercase mb-1">
              Simulador de Escalada de Lotes
            </h1>
            <p className="text-brand-text-muted text-sm">
              Projeção com cálculo real de importação (II · IPI · PIS · COFINS · ICMS gross-up).
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              className="gap-2 text-xs border-brand-accent/40 text-brand-accent hover:bg-brand-accent/10 font-bold"
              onClick={() => setShowReportModal(true)}
            >
              <Eye size={14} />
              VISUALIZAR RELATÓRIO PDF
            </Button>
            <Button
              variant="primary"
              className="gap-2 text-xs font-bold"
              onClick={handleExportPDF}
              disabled={isExporting}
            >
              <Printer size={14} />
              IMPRIMIR / EXPORTAR PDF
            </Button>
            <Button
              variant="secondary"
              className="gap-2 text-xs"
              onClick={() => setInputs(VR12_PUMP_PRESET)}
            >
              <RefreshCw size={14} />
              RESTAURAR PRESET VR12
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">

          {/* ── Painel de Inputs ── */}
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[80vh] pr-2 custom-scrollbar">

            <Card className="flex flex-col gap-6">
              <CardTitle className="gap-2">
                <Package size={14} />
                Produto e Operação
              </CardTitle>

              <div className="flex flex-col gap-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-accent border-b border-brand-border pb-2">
                  Dados da Proposta
                </p>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="invName" className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-text-muted">
                    Nome do Investidor / Proposta
                  </label>
                  <div className="flex items-center gap-2 bg-brand-input border border-brand-border rounded px-3 py-2 focus-within:border-brand-accent transition-all">
                    <input
                      id="invName"
                      type="text"
                      placeholder="Ex: Francisco Fiuza"
                      value={investorName}
                      onChange={(e) => setInvestorName(e.target.value)}
                      className="bg-transparent text-white text-sm w-full outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-brand-text-muted leading-tight">Exibido no cabeçalho do relatório em PDF</p>
                </div>

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-accent border-b border-brand-border pb-2 mt-2">
                  Dados do Lote
                </p>
                <Field id="qty" label="Quantidade Inicial" value={inputs.initialQuantity}
                  onChange={set("initialQuantity")} suffix="un." />
                <Field id="fob" label="FOB Unitário" value={inputs.fobUnitUSD}
                  onChange={set("fobUnitUSD")} prefix="US$"
                  hint="Preço do fornecedor por unidade (sem frete)" />
                <Field id="freight" label="Frete Internacional Unitário" value={inputs.freightUnitUSD}
                  onChange={set("freightUnitUSD")} prefix="US$"
                  hint="Frete por unidade (CIF = FOB + Frete)" />
                <Field id="exchange" label="Câmbio (BRL/USD)" value={inputs.exchangeRate}
                  onChange={set("exchangeRate")} prefix="R$" />
                <Field id="sale" label="Preço de Venda Unitário" value={inputs.salePricePerUnit}
                  onChange={set("salePricePerUnit")} prefix="R$" />
              </div>

              {/* Breakdown do custo (somente leitura) */}
              <div className="rounded-lg bg-brand-accent/5 border border-brand-accent/20 p-4 space-y-2">
                <p className="text-[9px] font-black text-brand-accent uppercase tracking-widest mb-3">
                  Custo Real Calculado — Lote 1
                </p>
                {[
                  { label: "Valor Aduaneiro (CIF × câmbio)", value: breakdown.va },
                  { label: `II (${(inputs.iiRate * 100).toFixed(1)}% sobre VA)`, value: breakdown.ii },
                  { label: `IPI (${(inputs.ipiRate * 100).toFixed(1)}% sobre VA+II)`, value: breakdown.ipi },
                  { label: `PIS (${(inputs.pisRate * 100).toFixed(2)}%)`, value: breakdown.pis },
                  { label: `COFINS (${(inputs.cofinsRate * 100).toFixed(2)}%)`, value: breakdown.cofins },
                  { label: "Taxa de Siscomex (fixo)", value: breakdown.siscomex },
                  { label: "ICMS gross-up (÷ 0,75)", value: breakdown.icms },
                  { label: "Custo Operacional Aduaneiro (fixo)", value: breakdown.custoOp },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center text-[10px]">
                    <span className="text-brand-text-muted font-bold">{row.label}</span>
                    <span className="font-mono text-white">{fmtBRL2(row.value)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-[11px] pt-2 border-t border-brand-accent/20 font-black">
                  <span className="text-brand-accent uppercase tracking-wider">TOTAL APORTE LOTE 1</span>
                  <span className="font-mono text-brand-accent">{fmtBRL2(breakdown.total)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-accent border-b border-brand-border pb-2">
                  Deduções sobre Vendas
                </p>
                <Field id="salesTax" label="Simples Nacional / Impostos Venda" value={inputs.salesTaxRate * 100}
                  onChange={(v) => set("salesTaxRate")(v / 100)} suffix="%" />
                <Field id="opex" label="Despesas Operacionais" value={inputs.opExRate * 100}
                  onChange={(v) => set("opExRate")(v / 100)} suffix="%"
                  hint="Percentual sobre o faturamento" />
                <Field id="split" label="Split do Investidor" value={inputs.investorSplitPct * 100}
                  onChange={(v) => set("investorSplitPct")(v / 100)} suffix="%"
                  hint="% do lucro líquido destinado ao investidor" />
                <Field id="batches" label="Nº de Lotes a Projetar" value={inputs.numBatches}
                  onChange={set("numBatches")} suffix="lotes" />
              </div>

              {/* Alíquotas de Importação (avançado) */}
              <div className="flex flex-col gap-3">
                <button
                  className="flex items-center justify-between w-full text-[10px] font-bold uppercase tracking-[0.15em] text-brand-accent border-b border-brand-border pb-2"
                  onClick={() => setShowTaxes(!showTaxes)}
                >
                  <span>Alíquotas de Importação</span>
                  {showTaxes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showTaxes && (
                  <div className="flex flex-col gap-3">
                    <Field id="ii" label="II — Imposto de Importação" value={inputs.iiRate * 100}
                      onChange={(v) => set("iiRate")(v / 100)} suffix="%" />
                    <Field id="ipi" label="IPI (sobre VA + II)" value={inputs.ipiRate * 100}
                      onChange={(v) => set("ipiRate")(v / 100)} suffix="%" />
                    <Field id="pis" label="PIS/PASEP (sobre VA)" value={inputs.pisRate * 100}
                      onChange={(v) => set("pisRate")(v / 100)} suffix="%" />
                    <Field id="cofins" label="COFINS (sobre VA)" value={inputs.cofinsRate * 100}
                      onChange={(v) => set("cofinsRate")(v / 100)} suffix="%" />
                    <Field id="icmsFactor" label="Fator ICMS (gross-up)" value={inputs.icmsFactor}
                      onChange={set("icmsFactor")} hint="Normalmente 0,75 (ICMS 25% por dentro)" />
                    <Field id="siscomex" label="Taxa de Siscomex (R$ fixo/lote)" value={inputs.siscomexFixed}
                      onChange={set("siscomexFixed")} prefix="R$" />
                    <Field id="custoOp" label="Custo Operacional Aduaneiro (R$ fixo/lote)" value={inputs.custoOpFixed}
                      onChange={set("custoOpFixed")} prefix="R$" />
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ── Resultados na Tela ── */}
          <div className="flex flex-col gap-6">

            <div className="flex items-start gap-4 p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
              <div className="bg-yellow-500/10 p-2 rounded-full text-yellow-500 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest">Sensibilidade Cambial e Operacional</p>
                <p className="text-[11px] text-brand-text-secondary leading-relaxed">
                  Projeção em cenário estático. <span className="text-white font-bold">Variações no câmbio (USD/BRL)</span>,
                  impostos e custos logísticos impactam a rentabilidade real. Use como referência estratégica.
                </p>
              </div>
            </div>

            {/* KPIs globais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card accent className="p-4 flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={14} className="text-brand-accent" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted">ROI Total</span>
                </div>
                <p className="text-2xl font-bold font-mono text-brand-accent">{fmtPct(globalROI)}</p>
                <p className="text-[9px] text-brand-text-muted">sobre o 1º aporte</p>
              </Card>
              <Card className="p-4 flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-brand-success" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted">Faturamento Total</span>
                </div>
                <p className="text-2xl font-bold font-mono text-white">{fmtBRL(totalFaturamento)}</p>
                <p className="text-[9px] text-brand-text-muted">{inputs.numBatches} lotes</p>
              </Card>
              <Card className="p-4 flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <Target size={14} className="text-brand-accent" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted">Ganhos Investidor</span>
                </div>
                <p className="text-2xl font-bold font-mono text-brand-accent">{fmtBRL(totalInvestorEarnings)}</p>
                <p className="text-[9px] text-brand-text-muted">acumulado</p>
              </Card>
              <Card className="p-4 flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <Layers size={14} className="text-brand-text-muted" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted">Lote Final</span>
                </div>
                <p className="text-2xl font-bold font-mono text-white">{lastBatch?.quantity ?? 0}</p>
                <p className="text-[9px] text-brand-text-muted">unidades no lote {inputs.numBatches}</p>
              </Card>
            </div>

            {/* Gráfico de barras */}
            <Card className="p-6">
              <CardTitle className="gap-2 mb-6">
                <BarChart3 size={16} className="text-brand-accent" />
                Escalada de Quantidade por Lote (unidades)
              </CardTitle>
              <div className="flex items-end gap-3 h-48 pt-6 pb-2 border-b border-brand-border/60">
                {batches.map((b) => {
                  const maxQty = Math.max(...batches.map((x) => x.quantity), 1);
                  const heightPct = Math.max((b.quantity / maxQty) * 100, 10);
                  const opacity = 0.35 + (b.batchNumber / batches.length) * 0.65;
                  return (
                    <div key={b.batchNumber} className="flex-1 h-full flex flex-col justify-end items-center gap-2 group">
                      <span className="text-xs font-bold font-mono text-brand-accent group-hover:scale-110 transition-transform">
                        {b.quantity} un
                      </span>
                      <div
                        className="w-full rounded-t-md transition-all duration-500 relative flex items-end justify-center"
                        style={{
                          height: `${heightPct}%`,
                          background: b.batchNumber === 1
                            ? "linear-gradient(to top, rgba(245,196,0,0.25), rgba(245,196,0,0.85))"
                            : `linear-gradient(to top, rgba(245,196,0,0.15), rgba(245,196,0,${opacity}))`,
                          borderTop: "3px solid #F5C400",
                          boxShadow: "0 -2px 10px rgba(245,196,0,0.2)",
                        }}
                      >
                        <span className="text-[9px] font-mono font-bold text-slate-900 bg-brand-accent px-1 rounded-t mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          +{fmtPct(b.investorROI)}
                        </span>
                      </div>
                      <span className="text-[10px] text-brand-text-muted font-bold tracking-wider uppercase mt-1">
                        L{b.batchNumber}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Projeção por lote */}
            <Card className="p-5">
              <CardTitle className="gap-2 mb-5">
                <Package size={14} />
                Projeção Detalhada por Lote
              </CardTitle>
              <div className="flex flex-col gap-3">
                {batches.map((b, idx) => (
                  <BatchRow key={b.batchNumber} b={b} isLast={idx === batches.length - 1} />
                ))}
              </div>
            </Card>

            {/* Resultado Final */}
            <Card className="p-5">
              <CardTitle className="gap-2 mb-4">
                <TrendingUp size={14} />
                Resultado Final Consolidado
              </CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col p-4 rounded-lg border border-[rgba(245,196,0,0.3)] bg-[rgba(245,196,0,0.05)]">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted mb-2">Aporte Inicial</p>
                  <p className="text-xl font-bold font-mono text-white">{fmtBRL(initialAporte)}</p>
                  <p className="text-[9px] text-brand-text-muted mt-1">Capital investido no Lote 1</p>
                </div>
                <div className="flex flex-col p-4 rounded-lg border border-[rgba(76,175,80,0.3)] bg-[rgba(76,175,80,0.05)]">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted mb-2">Total Investidor</p>
                  <p className="text-xl font-bold font-mono text-brand-success">{fmtBRL(totalInvestorEarnings)}</p>
                  <p className="text-[9px] text-brand-text-muted mt-1">Lucros acumulados ({fmtPct(globalROI)} ROI)</p>
                </div>
                <div className="flex flex-col p-4 rounded-lg border border-brand-border bg-[rgba(36,36,36,0.5)]">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted mb-2">Total Empresa</p>
                  <p className="text-xl font-bold font-mono text-white">{fmtBRL(totalCompanyEarnings)}</p>
                  <p className="text-[9px] text-brand-text-muted mt-1">Dividendos operacionais</p>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </div>

      {/* ── MODAL DE VISUALIZAÇÃO DO RELATÓRIO PDF NA TELA ── */}
      <Dialog
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Visualização da Proposta (Relatório PDF)"
        className="max-w-4xl bg-brand-surface border-brand-accent"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-brand-border pb-3 no-print">
            <p className="text-xs text-brand-text-secondary">
              Relatório executivo formatado para apresentação e exportação em PDF.
            </p>
            <div className="flex gap-2">
              <Button
                variant="primary"
                className="gap-2 text-xs font-bold"
                onClick={() => window.print()}
              >
                <Printer size={14} />
                IMPRIMIR / SALVAR PDF
              </Button>
              <Button
                variant="secondary"
                className="text-xs"
                onClick={() => setShowReportModal(false)}
              >
                FECHAR
              </Button>
            </div>
          </div>

          <div className="bg-white text-slate-900 rounded-md shadow-2xl p-4 overflow-y-auto max-h-[75vh] custom-scrollbar border border-slate-200">
            <ReportContent
              investorName={investorName}
              sessionName={session.name}
              initialAporte={initialAporte}
              totalInvestorEarnings={totalInvestorEarnings}
              globalROI={globalROI}
              totalFaturamento={totalFaturamento}
              inputs={inputs}
              breakdown={breakdown}
              batches={batches}
              totalCompanyEarnings={totalCompanyEarnings}
            />
          </div>
        </div>
      </Dialog>

      {/* ── SEÇÃO EXCLUSIVA PARA IMPRESSÃO IMPERCEPTÍVEL NA TELA ── */}
      <div className="hidden print:block">
        <ReportContent
          investorName={investorName}
          sessionName={session.name}
          initialAporte={initialAporte}
          totalInvestorEarnings={totalInvestorEarnings}
          globalROI={globalROI}
          totalFaturamento={totalFaturamento}
          inputs={inputs}
          breakdown={breakdown}
          batches={batches}
          totalCompanyEarnings={totalCompanyEarnings}
        />
      </div>
    </DashboardLayout>
  );
}
