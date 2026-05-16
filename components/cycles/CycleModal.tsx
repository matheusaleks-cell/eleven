"use client";

import { useState, useEffect } from "react";
import { calculateCycle, getCycleName, formatMoney, TaxConfig } from "@/lib/calculations";
import { X, Calculator } from "lucide-react";

interface CycleModalProps {
  projectName: string;
  cycleNumber: number;
  splitPct: number;
  taxConfig: TaxConfig;
  plannedCapital: number;
  onClose: () => void;
  onSave: (data: any) => void;
}

const inputStyle = {
  background: "#0F0F0F",
  border: "1px solid #2A2A2A",
  borderRadius: "2px",
  color: "#FFFFFF",
  padding: "10px 12px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
  fontFamily: "'Roboto Mono', monospace",
};

function Field({ label, value, onChange, placeholder = "0" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>
        {label}
      </label>
      <input
        type="number"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#F5C400")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
      />
    </div>
  );
}

function ResultRow({ label, value, accent = false, bold = false }: { label: string; value: number; accent?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5" style={{ borderBottom: "1px solid #1A1A1A" }}>
      <span style={{ color: accent ? "#F5C400" : "#A0A0A0", fontSize: "13px", fontFamily: "'Rajdhani', sans-serif", fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{ color: accent ? "#F5C400" : "#FFFFFF", fontFamily: "'Roboto Mono', monospace", fontSize: "13px", fontWeight: bold ? 700 : 400 }}>{formatMoney(value)}</span>
    </div>
  );
}

export function CycleModal({ projectName, cycleNumber, splitPct, taxConfig, plannedCapital, onClose, onSave }: CycleModalProps) {
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [rate, setRate] = useState("");
  const [fob, setFob] = useState("");
  const [freight, setFreight] = useState("");
  const [insurance, setInsurance] = useState("R$ 0,00");
  const [procNum, setProcNum] = useState("");
  const [diNum, setDiNum] = useState("");
  const [diDate, setDiDate] = useState("");
  const [result, setResult] = useState<any>(null);

  // Helper para limpar máscara
  const clean = (val: string) => {
    const num = Number(val.replace(/\D/g, "")) / 100;
    return isNaN(num) ? 0 : num;
  };

  // Calcular em tempo real
  useEffect(() => {
    const q = parseFloat(qty);
    const p = clean(price);
    const r = clean(rate);
    const f = clean(fob);
    const fr = clean(freight);
    const ins = clean(insurance) || 0;

    if (q > 0 && p > 0 && r > 0 && f > 0 && fr >= 0) {
      const res = calculateCycle({ quantity: q, salePricePerUnit: p, exchangeRate: r, fobUSD: f, freightUSD: fr, insuranceUSD: ins, plannedCapital }, taxConfig, splitPct);
      setResult(res);
    } else {
      setResult(null);
    }
  }, [qty, price, rate, fob, freight, insurance]);

  const canSave = result && result.profitToSplit > 0;

  const handleMask = (val: string, setter: (v: string) => void) => {
    const value = val.replace(/\D/g, "");
    const formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value) / 100);
    setter(formatted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onClose} style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(3px)" }} />
      <div
        className="relative w-full overflow-y-auto animate-fade-in"
        style={{ maxWidth: 760, maxHeight: "92vh", background: "#1A1A1A", border: "1px solid #333", borderTop: "3px solid #F5C400", borderRadius: "4px", boxShadow: "0 4px 40px rgba(0,0,0,0.7)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #2A2A2A" }}>
          <div>
            <div className="flex items-center gap-2">
              <Calculator size={16} style={{ color: "#F5C400" }} />
              <h2 style={{ color: "#FFFFFF", fontSize: "18px", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.05em" }}>
                REGISTRAR {getCycleName(cycleNumber).toUpperCase()}
              </h2>
            </div>
            <p style={{ color: "#606060", fontSize: "12px", fontFamily: "'Rajdhani', sans-serif", marginTop: 2 }}>{projectName}</p>
          </div>
          <button onClick={onClose} style={{ color: "#606060", background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Processo */}
          <p style={{ color: "#F5C400", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, marginBottom: 12 }}>
            ★ Informações do Processo (opcionais)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div>
              <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Nº do Processo</label>
              <input type="text" value={procNum} onChange={(e) => setProcNum(e.target.value)} placeholder="PROC-2025-001" style={{ ...inputStyle, fontFamily: "'Rajdhani', sans-serif" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#F5C400")} onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")} />
            </div>
            <div>
              <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Nº da DI</label>
              <input type="text" value={diNum} onChange={(e) => setDiNum(e.target.value)} placeholder="DI-2025-000001" style={{ ...inputStyle, fontFamily: "'Rajdhani', sans-serif" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#F5C400")} onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")} />
            </div>
            <div>
              <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Data da DI</label>
              <input type="date" value={diDate} onChange={(e) => setDiDate(e.target.value)} style={{ ...inputStyle, fontFamily: "'Rajdhani', sans-serif" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#F5C400")} onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")} />
            </div>
          </div>

          {/* Importação */}
          <p style={{ color: "#F5C400", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, marginBottom: 12 }}>
            ★ Dados de Importação
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-brand-text-muted uppercase tracking-widest">Taxa Cambial (USD)</label>
              <input value={rate} onChange={(e) => handleMask(e.target.value, setRate)} placeholder="R$ 0,00" style={inputStyle} />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-brand-text-muted uppercase tracking-widest">Quantidade de Unidades</label>
              <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="20" style={inputStyle} />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-brand-text-muted uppercase tracking-widest">Valor FOB (USD)</label>
              <input value={fob} onChange={(e) => handleMask(e.target.value, setFob)} placeholder="R$ 0,00" style={inputStyle} />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-brand-text-muted uppercase tracking-widest">Frete Internacional (USD)</label>
              <input value={freight} onChange={(e) => handleMask(e.target.value, setFreight)} placeholder="R$ 0,00" style={inputStyle} />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-brand-text-muted uppercase tracking-widest">Seguro (USD)</label>
              <input value={insurance} onChange={(e) => handleMask(e.target.value, setInsurance)} placeholder="R$ 0,00" style={inputStyle} />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-brand-text-muted uppercase tracking-widest">Preço de Venda / Unidade (R$)</label>
              <input value={price} onChange={(e) => handleMask(e.target.value, setPrice)} placeholder="R$ 0,00" style={inputStyle} />
            </div>
          </div>

          {/* Preview */}
          {result ? (
            <div className="rounded-[4px] p-4 animate-fade-in" style={{ background: "#0F0F0F", border: "1px solid #2A2A2A" }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Importação */}
                <div>
                  <p style={{ color: "#F5C400", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, marginBottom: 10 }}>Cálculo de Importação</p>
                  <ResultRow label="Valor Aduaneiro" value={result.customsValueBRL} />
                  <ResultRow label={`II (${(taxConfig.ii_rate*100).toFixed(0)}%)`} value={result.ii} />
                  <ResultRow label={`IPI (${(taxConfig.ipi_rate*100).toFixed(0)}%)`} value={result.ipi} />
                  <ResultRow label="PIS-PASEP" value={result.pisPasep} />
                  <ResultRow label="COFINS" value={result.cofins} />
                  <ResultRow label="Siscomex" value={result.siscomex} />
                  <ResultRow label="Custo Op." value={result.opCost} />
                  <ResultRow label="ICMS Importação" value={result.icmsImport} />
                  <div className="mt-2 pt-2" style={{ borderTop: "1px solid #F5C400" }}>
                    <ResultRow label="CUSTO TOTAL" value={result.totalInvestment} accent bold />
                    <ResultRow label="Custo/unidade" value={result.costPerUnit} />
                  </div>
                </div>

                {/* Vendas */}
                <div>
                  <p style={{ color: "#F5C400", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, marginBottom: 10 }}>Resultado da Venda</p>
                  <ResultRow label="Faturamento" value={result.grossRevenue} />
                  <ResultRow label={`Tributação (${(taxConfig.sales_tax_rate*100).toFixed(1)}%)`} value={result.salesTax} />
                  <ResultRow label={`Custo Op. (${(taxConfig.sales_op_rate*100).toFixed(0)}%)`} value={result.salesOpCost} />
                  <div className="mt-2 pt-2" style={{ borderTop: "1px solid #333" }}>
                    <ResultRow label="SALDO APURADO" value={result.netBalance} bold />
                  </div>
                </div>

                {/* Distribuição */}
                <div>
                  <p style={{ color: "#F5C400", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, marginBottom: 10 }}>Distribuição</p>
                  <ResultRow label="Saldo a dividir" value={result.profitToSplit} />
                  <ResultRow label={`Investidor (${(splitPct*100).toFixed(0)}%)`} value={result.investorShare} accent bold />
                  <ResultRow label={`Empresa (${((1-splitPct)*100).toFixed(0)}%)`} value={result.companyShare} />
                  <div className="mt-2 pt-2" style={{ borderTop: "1px solid #4CAF50" }}>
                    <div className="flex justify-between items-center py-1.5">
                      <span style={{ color: "#4CAF50", fontSize: "13px", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>PRÓXIMO CICLO</span>
                      <span style={{ color: "#4CAF50", fontFamily: "'Roboto Mono', monospace", fontSize: "13px", fontWeight: 700 }}>{formatMoney(result.nextCycleCapital)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[4px] p-8 text-center" style={{ background: "#0F0F0F", border: "1px dashed #2A2A2A" }}>
              <Calculator size={28} style={{ color: "#333", margin: "0 auto 8px" }} />
              <p style={{ color: "#606060", fontFamily: "'Rajdhani', sans-serif", fontSize: "14px" }}>
                Preencha os campos acima para ver o cálculo em tempo real
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-[2px] font-bold uppercase text-sm"
              style={{ border: "1px solid #333", color: "#A0A0A0", background: "transparent", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.1em", cursor: "pointer" }}
            >
              Cancelar
            </button>
            <button
              onClick={() => onSave({ qty, price, rate, fob, freight, insurance, result })}
              disabled={!canSave}
              className="px-6 py-2.5 rounded-[2px] font-bold uppercase text-sm"
              style={{
                background: canSave ? "#F5C400" : "#333",
                color: canSave ? "#1A1A1A" : "#606060",
                border: "none",
                fontFamily: "'Rajdhani', sans-serif",
                letterSpacing: "0.12em",
                cursor: canSave ? "pointer" : "not-allowed",
              }}
            >
              ★ Confirmar Ciclo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
