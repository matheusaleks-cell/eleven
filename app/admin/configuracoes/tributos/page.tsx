"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getTaxConfigs, createTaxConfig, updateTaxConfig } from "../actions";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Save, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

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
  const [configList, setConfigList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    id: "",
    name: "Configuração padrão 2025",
    ii: "18.00",
    ipi: "55.00",
    pisPasep: "2.10",
    cofins: "9.65",
    icmsImport: "25.00",
    icmsSale: "18.00",
    simplesNacional: "8.00",
    siscomexFixed: "154.23",
    description: "",
    isDefault: true
  });

  useEffect(() => {
    const s = localStorage.getItem("eleven_session");
    if (!s) { router.push("/admin/login"); return; }
    const parsed = JSON.parse(s);
    if (parsed.role !== "ADMIN") { router.push("/investidor"); return; }
    setSession(parsed);
    loadConfigs();
  }, []);

  async function loadConfigs() {
    setLoading(true);
    const res = await getTaxConfigs();
    if (res.success && res.configs.length > 0) {
      setConfigList(res.configs);
      const active = res.configs.find((c: any) => c.isDefault) || res.configs[0];
      setConfig({
        id: active.id,
        name: active.name,
        ii: active.ii.toString(),
        ipi: active.ipi.toString(),
        pisPasep: active.pisPasep.toString(),
        cofins: active.cofins.toString(),
        icmsImport: active.icmsImport.toString(),
        icmsSale: active.icmsSale.toString(),
        simplesNacional: active.simplesNacional.toString(),
        siscomexFixed: active.siscomexFixed.toString(),
        description: active.description || "",
        isDefault: active.isDefault
      });
    }
    setLoading(false);
  }

  const handleSave = async (isNew: boolean) => {
    try {
      const cleanValue = (val: string) => {
        if (typeof val !== 'string') return val;
        const num = Number(val.replace(/\D/g, "")) / 100;
        return isNaN(num) ? 0 : num;
      };

      const payload = {
        ...config,
        siscomexFixed: cleanValue(config.siscomexFixed),
        ii: parseFloat(config.ii),
        ipi: parseFloat(config.ipi),
        pisPasep: parseFloat(config.pisPasep),
        cofins: parseFloat(config.cofins),
        icmsImport: parseFloat(config.icmsImport),
        icmsSale: parseFloat(config.icmsSale),
        simplesNacional: parseFloat(config.simplesNacional)
      };

      if (isNew || !config.id) {
        const res = await createTaxConfig({...payload, isDefault: true});
        if (res.success) {
          toast.success("Nova configuração salva e ativada com sucesso!");
          loadConfigs();
        } else {
          toast.error(res.error);
        }
      } else {
        const res = await updateTaxConfig(config.id, {...payload, isDefault: true});
        if (res.success) {
          toast.success("Configuração atualizada e ativada!");
          loadConfigs();
        } else {
          toast.error(res.error);
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      toast.error("Erro ao salvar configuração.");
    }
  };

  if (!session || loading) return null;

  const Field = ({ label, value, k, suffix = "%" }: { label: string; value: string; k: string; suffix?: string }) => {
    const handleValueChange = (val: string) => {
      if (suffix === "R$") {
        const numeric = val.replace(/\D/g, "");
        const formatted = new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(Number(numeric) / 100);
        setConfig({ ...config, [k]: formatted });
      } else {
        setConfig({ ...config, [k]: val });
      }
    };

    return (
      <div>
        <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>{label}</label>
        <div className="relative">
          <input
            type={suffix === "R$" ? "text" : "number"}
            step="any"
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            style={fieldStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#F5C400")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#606060", fontSize: "12px", fontFamily: "'Rajdhani', sans-serif" }}>{suffix}</span>
        </div>
      </div>
    );
  };

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
            <Field label="II — Imposto de Importação (%)" value={config.ii} key="ii" />
            <Field label="IPI (%)" value={config.ipi} key="ipi" />
            <Field label="PIS-PASEP (%)" value={config.pisPasep} key="pisPasep" />
            <Field label="COFINS (%)" value={config.cofins} key="cofins" />
            <Field label="ICMS Importação — Alíquota (%)" value={config.icmsImport} key="icmsImport" />
            <Field label="Taxa de Siscomex (R$)" value={config.siscomexFixed} key="siscomexFixed" suffix="R$" />
          </div>

          <div className="section-divider mb-8">★ Tributação sobre Vendas ★</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <Field label="ICMS Venda (%)" value={config.icmsSale} key="icmsSale" />
            <Field label="Simples Nacional (%)" value={config.simplesNacional} key="simplesNacional" />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleSave(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[2px] font-bold uppercase"
              style={{ border: "1px solid #F5C400", color: "#F5C400", background: "transparent", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.1em", cursor: "pointer", fontSize: "13px" }}
            >
              <Save size={15} /> Salvar como Nova Configuração
            </button>
            <button
              onClick={() => handleSave(false)}
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
                {configList.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-6 text-brand-text-muted text-xs uppercase font-bold">Nenhuma configuração registrada no banco.</td></tr>
                ) : (
                  configList.map((tc: any) => (
                    <tr key={tc.id}>
                      <td style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>{tc.name}</td>
                      <td className="hidden md:table-cell" style={{ fontFamily: "'Roboto Mono', monospace", color: "#A0A0A0", fontSize: "13px" }}>{tc.ii}%</td>
                      <td className="hidden md:table-cell" style={{ fontFamily: "'Roboto Mono', monospace", color: "#A0A0A0", fontSize: "13px" }}>{tc.ipi}%</td>
                      <td className="hidden lg:table-cell" style={{ fontFamily: "'Roboto Mono', monospace", color: "#A0A0A0", fontSize: "13px" }}>{tc.icmsImport}%</td>
                      <td className="hidden lg:table-cell" style={{ color: "#606060", fontFamily: "'Rajdhani', sans-serif", fontSize: "13px" }}>{new Date(tc.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td>{tc.isDefault ? <StatusBadge status="ACTIVE" /> : <StatusBadge status="PENDING" />}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
