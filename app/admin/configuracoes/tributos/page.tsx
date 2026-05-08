"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { mockTaxConfigs, defaultTaxConfig } from "@/lib/mock-data";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Save, AlertTriangle, CheckCircle } from "lucide-react";

const fieldStyle = {
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

export default function TaxesPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    name: "Configuração padrão 2025",
    ii_rate: "18.00",
    ipi_rate: "55.00",
    pis_rate: "2.10",
    cofins_rate: "9.65",
    icms_rate: "25.00",
    icms_factor: "0.75",
    siscomex_fixed: "154.23",
    operational_fixed: "1740.00",
    sales_tax_rate: "11.00",
    sales_op_rate: "8.00",
  });

  useEffect(() => {
    const s = localStorage.getItem("eleven_session");
    if (!s) { router.push("/login"); return; }
    const parsed = JSON.parse(s);
    if (parsed.role !== "ADMIN") { router.push("/investor"); return; }
    setSession(parsed);
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!session) return null;

  const Field = ({ label, value, key: k, suffix = "%" }: { label: string; value: string; key: string; suffix?: string }) => (
    <div>
      <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>{label}</label>
      <div className="relative">
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => setConfig({ ...config, [k]: e.target.value })}
          style={fieldStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#F5C400")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#606060", fontSize: "12px", fontFamily: "'Rajdhani', sans-serif" }}>{suffix}</span>
      </div>
    </div>
  );

  return (
    <DashboardLayout role="ADMIN" userName={session.name} userEmail={session.email} pageTitle="Configuração de Tributos">
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 style={{ color: "#FFFFFF", fontSize: "24px", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>Configuração de Tributos</h1>
          <p style={{ color: "#606060", fontSize: "14px", fontFamily: "'Rajdhani', sans-serif" }}>Gerencie as alíquotas e custos fixos usados nos cálculos</p>
        </div>

        {/* Alert */}
        <div className="flex items-start gap-3 p-4 rounded-[2px] mb-6" style={{ background: "rgba(255,152,0,0.08)", border: "1px solid rgba(255,152,0,0.25)" }}>
          <AlertTriangle size={16} style={{ color: "#FF9800", flexShrink: 0, marginTop: 1 }} />
          <p style={{ color: "#A0A0A0", fontSize: "13px", fontFamily: "'Rajdhani', sans-serif" }}>
            <strong style={{ color: "#FF9800" }}>Atenção:</strong> Novos ciclos usarão esta configuração. Ciclos já registrados não são afetados — cada ciclo salva um snapshot da configuração vigente.
          </p>
        </div>

        <div className="rounded-[4px] p-8" style={{ background: "#242424", border: "1px solid #333" }}>
          {/* Nome */}
          <div className="mb-8">
            <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 8 }}>Nome da Configuração *</label>
            <input type="text" value={config.name} onChange={(e) => setConfig({ ...config, name: e.target.value })} style={{ ...fieldStyle, fontFamily: "'Rajdhani', sans-serif" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#F5C400")} onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")} />
          </div>

          <div className="section-divider mb-8">★ Tributos de Importação ★</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <Field label="II — Imposto de Importação (%)" value={config.ii_rate} key="ii_rate" />
            <Field label="IPI (%)" value={config.ipi_rate} key="ipi_rate" />
            <Field label="PIS-PASEP (%)" value={config.pis_rate} key="pis_rate" />
            <Field label="COFINS (%)" value={config.cofins_rate} key="cofins_rate" />
            <Field label="ICMS — Alíquota (%)" value={config.icms_rate} key="icms_rate" />
            <Field label="Fator ICMS — RICMS Art. 52 (decimal)" value={config.icms_factor} key="icms_factor" suffix="×" />
            <Field label="Taxa de Siscomex (R$)" value={config.siscomex_fixed} key="siscomex_fixed" suffix="R$" />
            <Field label="Custo Operacional Fixo (R$)" value={config.operational_fixed} key="operational_fixed" suffix="R$" />
          </div>

          <div className="section-divider mb-8">★ Tributação sobre Vendas ★</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <Field label="Taxa sobre Faturamento (%)" value={config.sales_tax_rate} key="sales_tax_rate" />
            <Field label="Custo Operacional sobre Vendas (%)" value={config.sales_op_rate} key="sales_op_rate" />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[2px] font-bold uppercase"
              style={{ border: "1px solid #F5C400", color: "#F5C400", background: "transparent", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.1em", cursor: "pointer", fontSize: "13px" }}
            >
              <Save size={15} /> Salvar como Nova Configuração
            </button>
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[2px] font-bold uppercase"
              style={{ background: "#F5C400", color: "#1A1A1A", border: "none", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.1em", cursor: "pointer", fontSize: "13px" }}
            >
              ★ Ativar Esta Configuração
            </button>
          </div>

          {saved && (
            <div className="flex items-center gap-2 mt-4 p-3 rounded-[2px]" style={{ background: "rgba(76,175,80,0.1)", border: "1px solid rgba(76,175,80,0.3)" }}>
              <CheckCircle size={14} style={{ color: "#4CAF50" }} />
              <span style={{ color: "#4CAF50", fontSize: "13px", fontFamily: "'Rajdhani', sans-serif" }}>Configuração salva com sucesso!</span>
            </div>
          )}
        </div>

        {/* History */}
        <div className="section-divider mt-8 mb-4">★ Histórico de Configurações ★</div>
        <div className="rounded-[4px]" style={{ background: "#242424", border: "1px solid #333" }}>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th className="hidden md:table-cell">II</th>
                  <th className="hidden md:table-cell">IPI</th>
                  <th className="hidden lg:table-cell">ICMS</th>
                  <th className="hidden lg:table-cell">Criado em</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mockTaxConfigs.map((tc) => (
                  <tr key={tc.id}>
                    <td style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>{tc.name}</td>
                    <td className="hidden md:table-cell" style={{ fontFamily: "'Roboto Mono', monospace", color: "#A0A0A0", fontSize: "13px" }}>{(tc.ii_rate * 100).toFixed(2)}%</td>
                    <td className="hidden md:table-cell" style={{ fontFamily: "'Roboto Mono', monospace", color: "#A0A0A0", fontSize: "13px" }}>{(tc.ipi_rate * 100).toFixed(2)}%</td>
                    <td className="hidden lg:table-cell" style={{ fontFamily: "'Roboto Mono', monospace", color: "#A0A0A0", fontSize: "13px" }}>{(tc.icms_rate * 100).toFixed(2)}%</td>
                    <td className="hidden lg:table-cell" style={{ color: "#606060", fontFamily: "'Rajdhani', sans-serif", fontSize: "13px" }}>{tc.created_at}</td>
                    <td>{tc.is_active ? <StatusBadge status="ACTIVE" /> : <StatusBadge status="PENDING" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
