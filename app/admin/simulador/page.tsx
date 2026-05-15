"use client";

import { useState, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  projectFutureBatches,
  RIFLE_22_PRESET,
  type SimulatorInputs,
  type BatchProjection,
} from "@/lib/calculations";
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
} from "lucide-react";

// ─── helpers ───────────────────────────────────────────────────────────────

function fmtBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

function Field({ label, id, value, step = 1, min = 0, onChange, prefix, suffix, hint }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-text-muted">
        {label}
      </label>
      <div className="flex items-center gap-2 bg-brand-input border border-brand-border rounded px-3 py-2 focus-within:border-brand-accent/60 transition-colors">
        {prefix && <span className="text-brand-text-muted text-sm font-bold shrink-0">{prefix}</span>}
        <input
          id={id}
          type="number"
          value={value}
          min={min}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="bg-transparent text-white text-sm font-mono w-full outline-none"
        />
        {suffix && <span className="text-brand-text-muted text-sm shrink-0">{suffix}</span>}
      </div>
      {hint && <p className="text-[10px] text-brand-text-muted">{hint}</p>}
    </div>
  );
}

// ─── batch row ─────────────────────────────────────────────────────────────

function BatchRow({ b, isLast }: { b: BatchProjection; isLast: boolean }) {
  const pct = Math.min((b.investorROI / 100) * 100, 100);

  return (
    <div
      className={`grid grid-cols-[80px_1fr] gap-4 p-4 rounded-lg border transition-all ${
        b.batchNumber === 1
          ? "border-brand-accent/40 bg-brand-accent/5"
          : "border-brand-border/60 hover:border-brand-border"
      }`}
    >
      {/* Lote badge */}
      <div className="flex flex-col items-center justify-center gap-1">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg font-rajdhani border-2 ${
            b.batchNumber === 1
              ? "border-brand-accent text-brand-accent bg-brand-accent/10"
              : "border-brand-border text-brand-text-secondary bg-brand-input"
          }`}
        >
          {b.batchNumber}
        </div>
        <span className="text-[9px] text-brand-text-muted uppercase font-bold tracking-widest">
          LOTE
        </span>
      </div>

      {/* Data */}
      <div className="flex flex-col gap-3">
        {/* Header row */}
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <div>
            <p className="text-[9px] text-brand-text-muted uppercase font-bold tracking-wider mb-0.5">
              Unidades
            </p>
            <p className="text-base font-bold font-mono text-white">{b.quantity}</p>
          </div>
          <div>
            <p className="text-[9px] text-brand-text-muted uppercase font-bold tracking-wider mb-0.5">
              Aporte
            </p>
            <p className="text-base font-bold font-mono text-white">{fmtBRL(b.totalImportCostBRL)}</p>
          </div>
          <div>
            <p className="text-[9px] text-brand-text-muted uppercase font-bold tracking-wider mb-0.5">
              Faturamento
            </p>
            <p className="text-base font-bold font-mono text-white">{fmtBRL(b.grossRevenue)}</p>
          </div>
          <div>
            <p className="text-[9px] text-brand-text-muted uppercase font-bold tracking-wider mb-0.5">
              Lucro Líquido
            </p>
            <p className="text-base font-bold font-mono text-brand-success">
              {fmtBRL(b.netLiquidProfit)}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-brand-text-muted uppercase font-bold tracking-wider mb-0.5">
              Investidor
            </p>
            <p className="text-base font-bold font-mono text-brand-accent">
              {fmtBRL(b.investorShare)}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-brand-text-muted uppercase font-bold tracking-wider mb-0.5">
              ROI Lote
            </p>
            <p className="text-base font-bold font-mono text-brand-success">
              {fmtPct(b.investorROI)}
            </p>
          </div>
        </div>

        {/* ROI bar */}
        <div className="h-1.5 rounded-full bg-brand-border overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-accent to-brand-success transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Next batch */}
        {!isLast && (
          <div className="flex items-center gap-2 text-[10px] text-brand-text-muted font-bold uppercase tracking-wider">
            <ArrowRight size={12} className="text-brand-accent" />
            <span>
              Capital para Lote {b.batchNumber + 1}:{" "}
              <span className="text-white">{fmtBRL(b.nextBatchCapital)}</span>
              {" · "}
              Capacidade:{" "}
              <span className="text-brand-accent">≈ {b.nextBatchQuantity} rifles</span>
            </span>
          </div>
        )}
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

  const [inputs, setInputs] = useState<SimulatorInputs>(RIFLE_22_PRESET);

  const set = useCallback(
    (key: keyof SimulatorInputs) => (v: number) =>
      setInputs((prev) => ({ ...prev, [key]: v })),
    []
  );

  const batches = useMemo(() => projectFutureBatches(inputs), [inputs]);

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
      <div className="flex flex-col gap-8 pb-10 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-rajdhani uppercase mb-1">
              Simulador de Escalada de Lotes
            </h1>
            <p className="text-brand-text-muted text-sm">
              Projete a evolução exponencial do capital com reinvestimento automático.
            </p>
          </div>
          <Button
            variant="secondary"
            className="gap-2 text-xs w-fit"
            onClick={() => setInputs(RIFLE_22_PRESET)}
          >
            <RefreshCw size={14} />
            RESTAURAR PRESET RIFLE .22
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">

          {/* ── Painel de Inputs ── */}
          <div className="flex flex-col gap-4">
            <Card className="flex flex-col gap-6">
              <CardTitle className="gap-2">
                <DollarSign size={14} />
                Premissas do Projeto
              </CardTitle>

              <div className="flex flex-col gap-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-accent border-b border-brand-border pb-2">
                  Produto
                </p>
                <Field
                  id="qty"
                  label="Quantidade Inicial"
                  value={inputs.initialQuantity}
                  step={1}
                  min={1}
                  onChange={set("initialQuantity")}
                  suffix="un."
                />
                <Field
                  id="fob"
                  label="FOB Unitário"
                  value={inputs.fobUnitUSD}
                  step={5}
                  min={1}
                  onChange={set("fobUnitUSD")}
                  prefix="US$"
                  hint="Preço do fornecedor antes dos custos de importação"
                />
                <Field
                  id="exchange"
                  label="Câmbio (BRL/USD)"
                  value={inputs.exchangeRate}
                  step={0.01}
                  min={1}
                  onChange={set("exchangeRate")}
                  prefix="R$"
                />
                <Field
                  id="sale"
                  label="Preço de Venda Unitário"
                  value={inputs.salePricePerUnit}
                  step={100}
                  min={1}
                  onChange={set("salePricePerUnit")}
                  prefix="R$"
                />
              </div>

              <div className="flex flex-col gap-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-accent border-b border-brand-border pb-2">
                  Custos de Importação
                </p>
                <Field
                  id="additional"
                  label="Custos Adicionais Totais"
                  value={inputs.importAdditionalCostBRL}
                  step={500}
                  min={0}
                  onChange={set("importAdditionalCostBRL")}
                  prefix="R$"
                  hint="Frete + II + IPI + PIS/COFINS + ICMS + SISCOMEX + Desembaraço + Armazenagem"
                />
              </div>

              <div className="flex flex-col gap-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-accent border-b border-brand-border pb-2">
                  Alíquotas e Divisão
                </p>
                <Field
                  id="salesTax"
                  label="Impostos sobre Vendas"
                  value={inputs.salesTaxRate * 100}
                  step={0.5}
                  min={0}
                  onChange={(v) => set("salesTaxRate")(v / 100)}
                  suffix="%"
                  hint="Simples Nacional — alíquota estimada"
                />
                <Field
                  id="opex"
                  label="Despesas Operacionais"
                  value={inputs.opExRate * 100}
                  step={0.5}
                  min={0}
                  onChange={(v) => set("opExRate")(v / 100)}
                  suffix="%"
                  hint="Percentual sobre o faturamento"
                />
                <Field
                  id="split"
                  label="Split do Investidor"
                  value={inputs.investorSplitPct * 100}
                  step={5}
                  min={0}
                  onChange={(v) => set("investorSplitPct")(v / 100)}
                  suffix="%"
                  hint="Percentual do lucro líquido destinado ao investidor"
                />
                <Field
                  id="batches"
                  label="Nº de Lotes a Projetar"
                  value={inputs.numBatches}
                  step={1}
                  min={1}
                  onChange={set("numBatches")}
                  suffix="lotes"
                />
              </div>
            </Card>

            {/* Aviso de risco */}
            <div className="flex items-start gap-3 p-4 rounded-lg border border-yellow-800/40 bg-yellow-900/10">
              <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-brand-text-muted leading-relaxed">
                <span className="text-yellow-500 font-bold">Atenção:</span> Este simulador assume câmbio e custos fixos. Variações cambiais e progressividade do Simples Nacional impactam os resultados reais.
              </p>
            </div>
          </div>

          {/* ── Resultados ── */}
          <div className="flex flex-col gap-6">

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

            {/* Gráfico de barras visual (SVG simples) */}
            <Card className="p-5">
              <CardTitle className="gap-2 mb-4">
                <BarChart3 size={14} />
                Escalada de Quantidade por Lote
              </CardTitle>
              <div className="flex items-end gap-3 h-32">
                {batches.map((b) => {
                  const maxQty = Math.max(...batches.map((x) => x.quantity));
                  const heightPct = maxQty > 0 ? (b.quantity / maxQty) * 100 : 0;
                  return (
                    <div
                      key={b.batchNumber}
                      className="flex-1 flex flex-col items-center gap-1.5"
                    >
                      <span className="text-[10px] font-bold font-mono text-brand-accent">
                        {b.quantity}
                      </span>
                      <div className="w-full rounded-t relative" style={{ height: `${Math.max(heightPct, 4)}%` }}>
                        <div
                          className="absolute inset-0 rounded-t"
                          style={{
                            background: b.batchNumber === 1
                              ? "rgba(245,196,0,0.5)"
                              : `rgba(245,196,0,${0.2 + (b.batchNumber / batches.length) * 0.6})`,
                            borderTop: "2px solid #F5C400",
                          }}
                        />
                      </div>
                      <span className="text-[9px] text-brand-text-muted font-bold">
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

            {/* Divisão Final */}
            <Card className="p-5">
              <CardTitle className="gap-2 mb-4">
                <TrendingUp size={14} />
                Resultado Final Consolidado
              </CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col p-4 rounded-lg border border-brand-accent/30 bg-brand-accent/5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted mb-2">Aporte Inicial</p>
                  <p className="text-xl font-bold font-mono text-white">{fmtBRL(initialAporte)}</p>
                  <p className="text-[9px] text-brand-text-muted mt-1">Capital investido no Lote 1</p>
                </div>
                <div className="flex flex-col p-4 rounded-lg border border-brand-success/30 bg-brand-success/5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted mb-2">Total Investidor</p>
                  <p className="text-xl font-bold font-mono text-brand-success">{fmtBRL(totalInvestorEarnings)}</p>
                  <p className="text-[9px] text-brand-text-muted mt-1">Lucros acumulados ({fmtPct(globalROI)} ROI)</p>
                </div>
                <div className="flex flex-col p-4 rounded-lg border border-brand-border bg-brand-surface/50">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted mb-2">Total Empresa</p>
                  <p className="text-xl font-bold font-mono text-white">{fmtBRL(totalCompanyEarnings)}</p>
                  <p className="text-[9px] text-brand-text-muted mt-1">Dividendos operacionais</p>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
