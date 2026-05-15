"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Plus, ArrowLeft, Shield, Landmark, FileText, Calendar } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getInvestors } from "../../investidores/actions";
import { createProject } from "../actions";
import { maskCurrency } from "@/lib/masks";

export default function AdminNewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedInvestorId = searchParams.get("investorId");
  const [investors, setInvestors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ 
    // Step 1: Investidor
    investorId: "", 
    investorName: "",
    cpfCnpj: "",
    rg: "",
    profession: "",
    address: "",
    phone: "",
    email: "",
    bankDetails: "",
    bankReferences: "",
    commercialRefs: "",
    
    // Step 2 & 3: Lote e Financeiro
    name: "", 
    product: "", 
    manufacturer: "",
    model: "",
    quantity: "1",
    costPrice: "",
    salePrice: "",
    capital: "", 
    maxCycles: "8", 
    splitPct: "50", 
    notes: "",
    
    // Step 4: Jurídico
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
    // Auto-selecionar investidor se vier da URL
    if (preselectedInvestorId) {
      const inv = data.find((i: any) => i.id === preselectedInvestorId);
      if (inv) {
        setForm(prev => ({
          ...prev,
          investorId: inv.id,
          investorName: inv.name,
          email: inv.email || "",
          phone: inv.phone || "",
          cpfCnpj: inv.cpfCnpj || "",
          rg: inv.rg || "",
          profession: inv.profession || "",
          address: inv.address || "",
          bankDetails: inv.bankDetails || "",
          bankReferences: inv.bankReferences || "",
          commercialRefs: inv.commercialRefs || "",
        }));
      }
    }
  }

  // Preencher dados ao selecionar investidor
  const handleInvestorSelect = (id: string) => {
    const inv = investors.find(i => i.id === id);
    if (inv) {
      setForm({
        ...form,
        investorId: inv.id,
        investorName: inv.name,
        email: inv.email || "",
        phone: inv.phone || "",
        cpfCnpj: inv.cpfCnpj || "",
        rg: inv.rg || "",
        profession: inv.profession || "",
        address: inv.address || "",
        bankDetails: inv.bankDetails || "",
        bankReferences: inv.bankReferences || "",
        commercialRefs: inv.commercialRefs || ""
      });
    } else {
      setForm({ ...form, investorId: "" });
    }
  };

  // Auto-cálculo do capital
  useEffect(() => {
    const q = parseInt(form.quantity) || 0;
    const cp = parseFloat(form.costPrice.replace(/\D/g, '')) / 100 || 0;
    const total = q * cp;
    if (total > 0) {
      setForm(prev => ({ ...prev, capital: total.toFixed(2) }));
    }
  }, [form.quantity, form.costPrice]);

  const handleSubmit = async () => {
    const rawCapital = form.capital;
    if (!form.name || !form.product || !form.investorId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      // Nota: Idealmente aqui atualizamos também os dados do investidor via API
      const result = await createProject({
        ...form,
        productName: form.product,
        initialCapital: rawCapital,
        profitSplitPct: form.splitPct,
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

  const fieldStyle = { background: "#0F0F0F", border: "1px solid #2A2A2A", borderRadius: "2px", color: "#FFFFFF", padding: "10px 12px", fontSize: "14px", width: "100%", outline: "none", fontFamily: "'Inter', sans-serif" };

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

      <div className="max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
           {[1, 2, 3, 4].map(s => (
             <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === s ? 'bg-brand-accent text-black' : step > s ? 'bg-brand-success text-white' : 'bg-brand-surface border border-brand-border text-brand-text-muted'}`}>
                  {s}
                </div>
                <span className={`text-[10px] font-black tracking-widest uppercase hidden md:block ${step === s ? 'text-white' : 'text-brand-text-muted'}`}>
                  {s === 1 ? "INVESTIDOR" : s === 2 ? "PRODUTO" : s === 3 ? "APORTE" : "JURÍDICO"}
                </span>
                {s < 4 && <div className="w-10 h-px bg-brand-border" />}
             </div>
           ))}
        </div>

        <div className="rounded-[4px] p-6" style={{ background: "#242424", border: "1px solid #333" }}>
          
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="section-divider mb-4">★ DADOS PESSOAIS DO INVESTIDOR ★</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Selecionar Investidor *</label>
                  <select value={form.investorId} onChange={(e) => handleInvestorSelect(e.target.value)} style={{ ...fieldStyle, cursor: "pointer" }}>
                    <option value="">Selecione um investidor já cadastrado...</option>
                    {investors.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                
                {form.investorId && (
                  <>
                    <div>
                      <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Nome Completo</label>
                      <input type="text" value={form.investorName} onChange={(e) => setForm({...form, investorName: e.target.value})} style={fieldStyle} />
                    </div>
                    <div>
                      <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Profissão</label>
                      <input type="text" value={form.profession} onChange={(e) => setForm({...form, profession: e.target.value})} style={fieldStyle} />
                    </div>
                    <div>
                      <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>CPF/CNPJ</label>
                      <input type="text" value={form.cpfCnpj} onChange={(e) => setForm({...form, cpfCnpj: e.target.value})} style={fieldStyle} />
                    </div>
                    <div>
                      <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>RG</label>
                      <input type="text" value={form.rg} onChange={(e) => setForm({...form, rg: e.target.value})} style={fieldStyle} />
                    </div>
                    <div className="md:col-span-2">
                      <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Endereço Completo</label>
                      <input type="text" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} style={fieldStyle} />
                    </div>
                    <div>
                      <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Telefone</label>
                      <input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} style={fieldStyle} />
                    </div>
                    <div>
                      <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>E-mail</label>
                      <input type="text" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} style={fieldStyle} />
                    </div>
                    <div className="md:col-span-2">
                      <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Dados Bancários para Recebimento</label>
                      <input type="text" value={form.bankDetails} onChange={(e) => setForm({...form, bankDetails: e.target.value})} placeholder="Banco, Agência, Conta..." style={fieldStyle} />
                    </div>
                    <div>
                      <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Referências Bancárias</label>
                      <input type="text" value={form.bankReferences} onChange={(e) => setForm({...form, bankReferences: e.target.value})} style={fieldStyle} />
                    </div>
                    <div>
                      <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Referências Comerciais</label>
                      <input type="text" value={form.commercialRefs} onChange={(e) => setForm({...form, commercialRefs: e.target.value})} style={fieldStyle} />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <div className="section-divider mb-4">★ LOTE DE PRODUTOS DO INVESTIDOR ★</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="sm:col-span-2">
                  <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Nome do Lote / Projeto *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Projeto Lote 01" style={fieldStyle} />
                </div>
                <div>
                  <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Produto / Modelo *</label>
                  <input type="text" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} placeholder="Ex: Canik TP9" style={fieldStyle} />
                </div>
                <div>
                  <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Fabricante</label>
                  <input type="text" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} placeholder="Ex: Canik" style={fieldStyle} />
                </div>
                <div>
                  <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Preço de Custo (Unitário)</label>
                  <input type="text" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: maskCurrency(e.target.value) })} placeholder="R$ 0,00" style={fieldStyle} />
                </div>
                <div>
                  <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Preço de Venda (Estimado)</label>
                  <input type="text" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: maskCurrency(e.target.value) })} placeholder="R$ 0,00" style={fieldStyle} />
                </div>
                <div className="sm:col-span-2">
                  <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Quantidade Adquirida no Lote</label>
                  <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} style={fieldStyle} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <div className="section-divider mb-4">★ CADASTRO FINANCEIRO DO APORTE ★</div>
              <div className="p-4 bg-brand-surface border border-brand-border rounded mb-6 flex justify-between items-center">
                 <div>
                    <p className="text-[10px] text-brand-text-muted font-black tracking-widest uppercase mb-1">Cálculo Automático do Aporte</p>
                    <p className="text-[13px] text-white">Qtd: {form.quantity} x Custo: {form.costPrice || "R$ 0,00"}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] text-brand-text-muted font-black tracking-widest uppercase mb-1">Valor Total do Aporte</p>
                    <p className="text-xl font-mono text-brand-accent font-bold">R$ {form.capital ? new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 2}).format(Number(form.capital)) : "0,00"}</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Número Máximo de Ciclos *</label>
                  <input type="number" min="1" max="20" value={form.maxCycles} onChange={(e) => setForm({ ...form, maxCycles: e.target.value })} style={fieldStyle} />
                </div>
                <div>
                  <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Distribuição de Receita (Lucro Investidor %)</label>
                  <input type="number" min="1" max="99" value={form.splitPct} onChange={(e) => setForm({ ...form, splitPct: e.target.value })} style={fieldStyle} />
                </div>
                <div>
                  <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Regra de Payout</label>
                  <select value={form.payoutRule} onChange={(e) => setForm({ ...form, payoutRule: e.target.value })} style={{ ...fieldStyle, cursor: "pointer" }}>
                    <option value="REINVEST">Reinvestimento Automático</option>
                    <option value="WITHDRAW">Saque de Lucros</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Perfil Tributário</label>
                  <select value={form.taxProfile} onChange={(e) => setForm({ ...form, taxProfile: e.target.value })} style={{ ...fieldStyle, cursor: "pointer" }}>
                    <option value="PF">Pessoa Física</option>
                    <option value="PJ">Pessoa Jurídica</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-in">
              <div className="section-divider mb-4">★ ÁREA JURÍDICA E CONTRATO ★</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Nº do Contrato Pré-Fixado</label>
                  <input type="text" value={form.contractNumber} onChange={(e) => setForm({ ...form, contractNumber: e.target.value })} placeholder="Ex: CTR-2025-001" style={fieldStyle} />
                </div>
                <div>
                  <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Data de Início do Contrato</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={fieldStyle} />
                </div>
                <div className="sm:col-span-2">
                  <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>Observações Contratuais</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} style={{ ...fieldStyle, resize: "vertical" }} />
                </div>
              </div>

              <div className="p-6 bg-brand-surface border border-brand-border rounded mb-6 flex flex-col items-center justify-center text-center">
                 <FileText size={48} className="text-brand-accent/50 mb-4" />
                 <h4 className="text-white font-black mb-2 uppercase">Geração de Contrato Automática</h4>
                 <p className="text-sm text-brand-text-muted max-w-md">Ao finalizar este cadastro, um contrato será gerado com as premissas deste aporte e ficará disponível na área do investidor.</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8 pt-6 border-t border-brand-border/30">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="flex-1 flex items-center justify-center py-3 rounded-[2px] font-bold uppercase text-sm" style={{ border: "1px solid #333", color: "#A0A0A0", cursor: "pointer", background: "transparent" }}>
                Voltar
              </button>
            ) : (
              <Link href="/admin/projetos" className="flex-1 flex items-center justify-center py-3 rounded-[2px] font-bold uppercase text-sm" style={{ border: "1px solid #333", color: "#A0A0A0", textDecoration: "none" }}>Cancelar</Link>
            )}

            {step < 4 ? (
              <button onClick={() => setStep(step + 1)} className="flex-1 flex items-center justify-center py-3 rounded-[2px] font-bold uppercase text-sm" style={{ background: "#F5C400", color: "#1A1A1A", border: "none", cursor: "pointer" }}>
                Avançar
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[2px] font-bold uppercase text-sm disabled:opacity-50" style={{ background: "#F5C400", color: "#1A1A1A", border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
                <Shield size={15} /> {loading ? "FINALIZANDO..." : "EMITIR E FINALIZAR"}
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
