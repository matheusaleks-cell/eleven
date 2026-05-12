"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Plus, ArrowLeft, Shield, Landmark, FileText, Calendar } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getInvestors } from "../../investidores/actions";
import { createProject } from "../actions";
import { maskCurrency } from "@/lib/masks";

export default function AdminNewProjectPage() {
  const router = useRouter();
  const [investors, setInvestors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [form, setForm] = useState({ 
    name: "", 
    product: "", 
    investorId: "", 
    capital: "", 
    maxCycles: "8", 
    splitPct: "50", 
    notes: "",
    contractNumber: "",
    startDate: new Date().toISOString().split('T')[0],
    bankAccount: "",
    pixKey: "",
    payoutRule: "REINVEST",
    taxProfile: "PF"
  });

  useEffect(() => {
    const s = localStorage.getItem("eleven_session");
    if (!s) { router.push("/admin/login"); return; }
    const parsed = JSON.parse(s);
    if (parsed.role !== "ADMIN") { router.push("/investor"); return; }
    setSession(parsed);
    
    fetchInvestors();
  }, []);

  async function fetchInvestors() {
    const data = await getInvestors();
    setInvestors(data);
  }

  const handleSubmit = async () => {
    const rawCapital = form.capital.replace(/\D/g, "");
    if (!form.name || !form.product || !form.investorId || !rawCapital) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const result = await createProject({
        ...form,
        productName: form.product,
        initialCapital: (parseFloat(rawCapital) / 100).toString(),
        createdById: session.id,
      });

      if (result.success) {
        toast.success(`Projeto "${form.name}" criado com sucesso!`);
        router.push("/admin/projetos");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro interno ao criar projeto");
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = { background: "#0F0F0F", border: "1px solid #2A2A2A", borderRadius: "2px", color: "#FFFFFF", padding: "10px 12px", fontSize: "14px", width: "100%", outline: "none", fontFamily: "'Rajdhani', sans-serif" };

  if (!session) return null;

  return (
    <DashboardLayout role="ADMIN" userName={session.name} userEmail={session.email} pageTitle="Novo Projeto">
      <div className="mb-6">
        <Link href="/admin/projetos" className="inline-flex items-center gap-2 text-sm" style={{ color: "#A0A0A0", textDecoration: "none", fontFamily: "'Rajdhani', sans-serif" }}
          onMouseOver={(e) => (e.currentTarget as HTMLElement).style.color = "#F5C400"}
          onMouseOut={(e) => (e.currentTarget as HTMLElement).style.color = "#A0A0A0"}>
          <ArrowLeft size={14} /> Voltar
        </Link>
      </div>

      <div className="max-w-2xl">
        <h1 style={{ color: "#FFFFFF", fontSize: "24px", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", marginBottom: 4 }}>Novo Projeto</h1>
        <p style={{ color: "#606060", fontSize: "14px", fontFamily: "'Rajdhani', sans-serif", marginBottom: 24 }}>Configure o projeto de investimento e os parâmetros do ciclo</p>

        <div className="rounded-[4px] p-6" style={{ background: "#242424", border: "1px solid #333" }}>
          <div className="section-divider mb-4">★ Informações do Projeto ★</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="sm:col-span-2">
              <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Nome do Projeto *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VR-12P · Francisco · Lote 01" style={fieldStyle} onFocus={(e) => (e.currentTarget.style.borderColor = "#F5C400")} onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")} />
            </div>
            <div>
              <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Produto *</label>
              <input type="text" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} placeholder="Vezir Arms VR-12P" style={fieldStyle} onFocus={(e) => (e.currentTarget.style.borderColor = "#F5C400")} onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")} />
            </div>
            <div>
              <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Investidor *</label>
              <select value={form.investorId} onChange={(e) => setForm({ ...form, investorId: e.target.value })} style={{ ...fieldStyle, cursor: "pointer" }}>
                <option value="">Selecione...</option>
                {investors.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Capital Inicial (R$) *</label>
              <input 
                type="text" 
                value={form.capital} 
                onChange={(e) => setForm({ ...form, capital: maskCurrency(e.target.value) })} 
                placeholder="R$ 0,00" 
                style={{ ...fieldStyle, fontFamily: "'Roboto Mono', monospace" }} 
                onFocus={(e) => (e.currentTarget.style.borderColor = "#F5C400")} 
                onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")} 
              />
            </div>
          </div>

          <div className="section-divider mb-4">★ Compliance & Jurídico ★</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Nº do Contrato</label>
              <input type="text" value={form.contractNumber} onChange={(e) => setForm({ ...form, contractNumber: e.target.value })} placeholder="CTR-2025-XXX" style={fieldStyle} />
            </div>
            <div>
              <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Data de Início</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={fieldStyle} />
            </div>
            <div>
              <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Perfil Tributário</label>
              <select value={form.taxProfile} onChange={(e) => setForm({ ...form, taxProfile: e.target.value })} style={{ ...fieldStyle, cursor: "pointer" }}>
                <option value="PF">Pessoa Física (Retenção na Fonte)</option>
                <option value="PJ">Pessoa Jurídica (Emissão de NF)</option>
              </select>
            </div>
            <div>
              <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Regra de Payout</label>
              <select value={form.payoutRule} onChange={(e) => setForm({ ...form, payoutRule: e.target.value })} style={{ ...fieldStyle, cursor: "pointer" }}>
                <option value="REINVEST">Reinvestimento Automático</option>
                <option value="WITHDRAW">Saque de Lucros (Mensal)</option>
              </select>
            </div>
          </div>

          <div className="section-divider mb-4">★ Dados Financeiros ★</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Chave PIX</label>
              <input type="text" value={form.pixKey} onChange={(e) => setForm({ ...form, pixKey: e.target.value })} placeholder="E-mail, CPF ou Aleatória" style={fieldStyle} />
            </div>
            <div>
              <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Conta Bancária (Se não houver PIX)</label>
              <input type="text" value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} placeholder="Ag, Conta e Banco" style={fieldStyle} />
            </div>
          </div>

          <div className="section-divider mb-4">★ Parâmetros do Ciclo ★</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Número Máximo de Ciclos * (1–20)</label>
              <input type="number" min="1" max="20" value={form.maxCycles} onChange={(e) => setForm({ ...form, maxCycles: e.target.value })} style={{ ...fieldStyle, fontFamily: "'Roboto Mono', monospace" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#F5C400")} onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")} />
              <p style={{ color: "#606060", fontSize: "11px", fontFamily: "'Rajdhani', sans-serif", marginTop: 4 }}>Padrão: 8 ciclos (Aplicação + 7 Reaplicações)</p>
            </div>
            <div>
              <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Lucro para o Investidor (%) * (1–99)</label>
              <input type="number" min="1" max="99" value={form.splitPct} onChange={(e) => setForm({ ...form, splitPct: e.target.value })} style={{ ...fieldStyle, fontFamily: "'Roboto Mono', monospace" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#F5C400")} onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")} />
              <p style={{ color: "#606060", fontSize: "11px", fontFamily: "'Rajdhani', sans-serif", marginTop: 4 }}>Empresa recebe: {100 - parseInt(form.splitPct || "50")}%</p>
            </div>
          </div>

          <div className="mb-6">
            <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Observações</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Notas internas sobre o projeto..." style={{ ...fieldStyle, resize: "vertical" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#F5C400")} onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")} />
          </div>

          <div className="flex gap-3">
            <Link href="/admin/projetos" className="flex-1 flex items-center justify-center py-3 rounded-[2px] font-bold uppercase text-sm" style={{ border: "1px solid #333", color: "#A0A0A0", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.1em", textDecoration: "none" }}>Cancelar</Link>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[2px] font-bold uppercase text-sm disabled:opacity-50"
              style={{ background: "#F5C400", color: "#1A1A1A", border: "none", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.1em", cursor: loading ? "not-allowed" : "pointer" }}
            >
              <Plus size={15} /> ★ {loading ? "CRIANDO..." : "Criar Projeto"}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
