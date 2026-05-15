"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MoneyDisplay } from "@/components/shared/MoneyDisplay";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  ArrowLeft, User, Landmark, Briefcase, Plus, Trash2, Save,
  ExternalLink, Lock, FileText, Printer, Phone, Mail, MapPin,
  Building, CreditCard, Shield
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatMoney } from "@/lib/calculations";
import {
  getInvestorDetails, updateInvestor, deleteInvestorProject, updateInvestorPassword
} from "../actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function InvestorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [investor, setInvestor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("RESUMO");
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Form State — Dados Pessoais
  const [formData, setFormData] = useState<any>({
    name: "",
    email: "",
    phone: "",
    cpfCnpj: "",
    rg: "",
    profession: "",
    // Endereço detalhado
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    // Bancário detalhado
    banco: "",
    agencia: "",
    conta: "",
    tipoConta: "CORRENTE",
    pixKey: "",
    // Referências
    bankReferences: "",
    commercialRefs: "",
  });

  // Senha
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const s = localStorage.getItem("eleven_session");
    if (!s) { router.push("/admin/login"); return; }
    setSession(JSON.parse(s));
    fetchInvestor();
  }, []);

  async function fetchInvestor() {
    setLoading(true);
    try {
      const data = await getInvestorDetails(id);
      if (data) {
        setInvestor(data);
        // Tenta parsear endereço e banco como JSON, fallback para string plana
        let addrObj: any = {};
        let bankObj: any = {};
        try { addrObj = JSON.parse(data.address || "{}"); } catch { addrObj = {}; }
        try { bankObj = JSON.parse(data.bankDetails || "{}"); } catch { bankObj = {}; }

        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          cpfCnpj: data.cpfCnpj || "",
          rg: data.rg || "",
          profession: data.profession || "",
          cep: addrObj.cep || "",
          logradouro: addrObj.logradouro || (typeof data.address === "string" && !data.address.startsWith("{") ? data.address : ""),
          numero: addrObj.numero || "",
          complemento: addrObj.complemento || "",
          bairro: addrObj.bairro || "",
          cidade: addrObj.cidade || "",
          estado: addrObj.estado || "",
          banco: bankObj.banco || (typeof data.bankDetails === "string" && !data.bankDetails.startsWith("{") ? data.bankDetails : ""),
          agencia: bankObj.agencia || "",
          conta: bankObj.conta || "",
          tipoConta: bankObj.tipoConta || "CORRENTE",
          pixKey: bankObj.pixKey || "",
          bankReferences: data.bankReferences || "",
          commercialRefs: data.commercialRefs || "",
        });
      } else {
        router.push("/admin/investidores");
      }
    } catch (error) {
      toast.error("Erro ao carregar investidor.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCep(cep: string) {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData((prev: any) => ({
          ...prev,
          logradouro: data.logradouro || "",
          bairro: data.bairro || "",
          cidade: data.localidade || "",
          estado: data.uf || "",
        }));
      }
    } catch { /* silent */ }
  }

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      const addressJson = JSON.stringify({
        cep: formData.cep, logradouro: formData.logradouro,
        numero: formData.numero, complemento: formData.complemento,
        bairro: formData.bairro, cidade: formData.cidade, estado: formData.estado,
      });
      const bankJson = JSON.stringify({
        banco: formData.banco, agencia: formData.agencia,
        conta: formData.conta, tipoConta: formData.tipoConta, pixKey: formData.pixKey,
      });
      const res = await updateInvestor(id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        cpfCnpj: formData.cpfCnpj,
        rg: formData.rg,
        profession: formData.profession,
        address: addressJson,
        bankDetails: bankJson,
        bankReferences: formData.bankReferences,
        commercialRefs: formData.commercialRefs,
      });
      if (res.success) {
        toast.success("Dados atualizados com sucesso!");
        fetchInvestor();
      } else {
        toast.error(res.error || "Erro ao atualizar dados.");
      }
    } catch {
      toast.error("Erro na comunicação com o servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setIsSavingPassword(true);
    try {
      const res = await updateInvestorPassword(id, newPassword);
      if (res.success) {
        toast.success("Senha atualizada com sucesso!");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.error || "Erro ao atualizar senha.");
      }
    } catch {
      toast.error("Erro na comunicação com o servidor.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (confirm(`Deseja realmente remover o projeto "${projectName}"?`)) {
      try {
        const res = await deleteInvestorProject(projectId);
        if (res.success) { toast.success("Projeto removido!"); fetchInvestor(); }
        else toast.error(res.error);
      } catch { toast.error("Erro ao remover projeto."); }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!session || loading || !investor) {
    return (
      <DashboardLayout role="ADMIN" userName="Admin" userEmail="admin@eleven.com" pageTitle="Carregando...">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const inputClass = "w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-sm px-3 py-2 text-sm text-white outline-none focus:border-brand-accent transition-colors";
  const labelClass = "text-[9px] font-black text-brand-text-muted uppercase tracking-widest block mb-1";

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          nav, aside, header, .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-card { border: 1px solid #ccc !important; background: white !important; }
        }
      `}</style>

      <DashboardLayout role="ADMIN" userName={session.name} userEmail={session.email}>
        <div className="flex flex-col gap-6 animate-fade-in pb-12">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/investidores" className="p-2 bg-brand-surface border border-brand-border rounded-lg text-brand-text-muted hover:text-brand-accent transition-colors no-print">
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold tracking-tight font-rajdhani uppercase text-white">PERFIL DO INVESTIDOR</h1>
                <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">{investor.name} • {investor.email}</p>
              </div>
            </div>
            <div className="flex gap-2 no-print">
              <Button
                variant="secondary"
                className="gap-2 text-[10px] font-bold"
                onClick={handlePrint}
              >
                <Printer size={14} /> RELATÓRIO PDF
              </Button>
              <Button
                className="gap-2 text-[10px] font-bold"
                onClick={() => router.push(`/admin/projetos/novo?investorId=${id}`)}
              >
                <Plus size={14} /> NOVO APORTE
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-brand-surface/40 border-brand-border print-card">
              <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.2em]">Capital Alocado</span>
              <p className="text-xl font-bold mt-1 text-white font-mono">{formatMoney(investor.stats.totalInvested)}</p>
            </Card>
            <Card className="bg-brand-surface/40 border-brand-border print-card">
              <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.2em]">Retorno Recebido</span>
              <p className="text-xl font-bold mt-1 text-brand-success font-mono">{formatMoney(investor.stats.totalReceived)}</p>
            </Card>
            <Card className="bg-brand-surface/40 border-brand-border print-card">
              <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.2em]">ROI Realizado</span>
              <p className={cn("text-xl font-bold mt-1", investor.stats.roi >= 0 ? "text-brand-accent" : "text-brand-danger")}>
                {investor.stats.roi.toFixed(1)}%
              </p>
            </Card>
            <Card className="bg-brand-surface/40 border-brand-border print-card">
              <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.2em]">Ciclos Concluídos</span>
              <p className="text-xl font-bold mt-1 text-white">{investor.stats.totalCycles}</p>
            </Card>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-8 border-b border-brand-border no-print overflow-x-auto">
            {["RESUMO", "DADOS CADASTRAIS", "PROJETOS"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-2 py-4 text-[11px] font-black tracking-widest uppercase transition-all relative whitespace-nowrap",
                  activeTab === tab ? "text-brand-accent" : "text-brand-text-muted hover:text-white"
                )}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-accent" />}
              </button>
            ))}
          </div>

          {/* ── RESUMO ── */}
          {activeTab === "RESUMO" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <Card className="space-y-4">
                <h3 className="text-xs font-black text-brand-accent uppercase tracking-widest flex items-center gap-2">
                  <User size={14} /> Informações do Investidor
                </h3>
                <div className="space-y-4">
                  {[
                    { label: "Status da Conta", value: <StatusBadge status="ACTIVE" /> },
                    { label: "Membro desde", value: new Date(investor.createdAt).toLocaleDateString("pt-BR") },
                    { label: "Projetos Ativos", value: investor.stats.activeProjects },
                    { label: "CPF/CNPJ", value: investor.cpfCnpj || "—" },
                    { label: "Profissão", value: investor.profession || "—" },
                    { label: "Telefone", value: investor.phone || "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between border-b border-brand-border/20 pb-3">
                      <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-tight">{label}</span>
                      <span className="text-xs font-bold text-white">{value as any}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="space-y-4">
                <h3 className="text-xs font-black text-brand-accent uppercase tracking-widest flex items-center gap-2">
                  <Landmark size={14} /> Dados Bancários
                </h3>
                <div className="space-y-4">
                  {(() => {
                    let bankObj: any = {};
                    try { bankObj = JSON.parse(investor.bankDetails || "{}"); } catch { bankObj = {}; }
                    return [
                      { label: "Banco", value: bankObj.banco || investor.bankDetails || "—" },
                      { label: "Agência", value: bankObj.agencia || "—" },
                      { label: "Conta", value: bankObj.conta ? `${bankObj.conta} (${bankObj.tipoConta || "CORRENTE"})` : "—" },
                      { label: "Chave PIX", value: bankObj.pixKey || "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between border-b border-brand-border/20 pb-3">
                        <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-tight">{label}</span>
                        <span className="text-xs font-bold text-white">{value}</span>
                      </div>
                    ));
                  })()}
                </div>
              </Card>
            </div>
          )}

          {/* ── DADOS CADASTRAIS ── */}
          {activeTab === "DADOS CADASTRAIS" && (
            <div className="space-y-8 animate-fade-in">

              {/* Dados Pessoais */}
              <Card className="p-6 space-y-6">
                <h3 className="text-xs font-black text-brand-accent uppercase tracking-widest flex items-center gap-2">
                  <User size={14} /> Dados Pessoais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Nome Completo</label>
                    <input className={inputClass} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Profissão</label>
                    <input className={inputClass} value={formData.profession} onChange={(e) => setFormData({ ...formData, profession: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>CPF / CNPJ</label>
                    <input className={inputClass} value={formData.cpfCnpj} onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>RG</label>
                    <input className={inputClass} value={formData.rg} onChange={(e) => setFormData({ ...formData, rg: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Telefone</label>
                    <input className={inputClass} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div className="md:col-span-3">
                    <label className={labelClass}>E-mail de Acesso</label>
                    <input className={inputClass} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                </div>
              </Card>

              {/* Endereço */}
              <Card className="p-6 space-y-6">
                <h3 className="text-xs font-black text-brand-accent uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={14} /> Endereço
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className={labelClass}>CEP</label>
                    <input
                      className={inputClass}
                      value={formData.cep}
                      onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                      onBlur={(e) => fetchCep(e.target.value)}
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Logradouro</label>
                    <input className={inputClass} value={formData.logradouro} onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Número</label>
                    <input className={inputClass} value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Complemento</label>
                    <input className={inputClass} value={formData.complemento} onChange={(e) => setFormData({ ...formData, complemento: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Bairro</label>
                    <input className={inputClass} value={formData.bairro} onChange={(e) => setFormData({ ...formData, bairro: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Cidade</label>
                    <input className={inputClass} value={formData.cidade} onChange={(e) => setFormData({ ...formData, cidade: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Estado (UF)</label>
                    <input className={inputClass} value={formData.estado} maxLength={2} onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })} />
                  </div>
                </div>
              </Card>

              {/* Bancário */}
              <Card className="p-6 space-y-6">
                <h3 className="text-xs font-black text-brand-accent uppercase tracking-widest flex items-center gap-2">
                  <Landmark size={14} /> Dados Bancários e Recebimento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Banco</label>
                    <input className={inputClass} value={formData.banco} placeholder="Ex: Itaú, Bradesco, Nubank..." onChange={(e) => setFormData({ ...formData, banco: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Tipo de Conta</label>
                    <select className={inputClass + " cursor-pointer"} value={formData.tipoConta} onChange={(e) => setFormData({ ...formData, tipoConta: e.target.value })}>
                      <option value="CORRENTE">Conta Corrente</option>
                      <option value="POUPANCA">Conta Poupança</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Agência</label>
                    <input className={inputClass} value={formData.agencia} placeholder="0000" onChange={(e) => setFormData({ ...formData, agencia: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Conta</label>
                    <input className={inputClass} value={formData.conta} placeholder="00000-0" onChange={(e) => setFormData({ ...formData, conta: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Chave PIX</label>
                    <input className={inputClass} value={formData.pixKey} placeholder="CPF, e-mail, celular ou aleatória" onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })} />
                  </div>
                  <div className="md:col-span-3">
                    <label className={labelClass}>Referências Bancárias / Comerciais</label>
                    <input className={inputClass} value={formData.bankReferences} onChange={(e) => setFormData({ ...formData, bankReferences: e.target.value })} />
                  </div>
                </div>
              </Card>

              {/* Segurança */}
              <Card className="p-6 space-y-6 border-brand-accent/30 bg-brand-accent/5">
                <h3 className="text-xs font-black text-brand-accent uppercase tracking-widest flex items-center gap-2">
                  <Shield size={14} /> Segurança — Redefinir Senha de Acesso
                </h3>
                <p className="text-[11px] text-brand-text-muted">Defina uma nova senha de acesso para a área do investidor. Mínimo de 6 caracteres.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Nova Senha</label>
                    <input
                      type="password"
                      className={inputClass}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Confirmar Nova Senha</label>
                    <input
                      type="password"
                      className={inputClass}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    variant="secondary"
                    onClick={handlePasswordUpdate}
                    disabled={isSavingPassword || !newPassword}
                    className="gap-2 min-w-[200px]"
                  >
                    {isSavingPassword ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Lock size={14} />}
                    ATUALIZAR SENHA
                  </Button>
                </div>
              </Card>

              {/* Salvar */}
              <div className="flex justify-end pt-4">
                <Button onClick={handleUpdate} disabled={isSaving} className="gap-2 min-w-[220px]">
                  {isSaving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                  SALVAR ALTERAÇÕES
                </Button>
              </div>
            </div>
          )}

          {/* ── PROJETOS ── */}
          {activeTab === "PROJETOS" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-black text-brand-text-muted uppercase tracking-[0.2em]">Portfólio de Aportes</h3>
                <Button
                  size="sm"
                  className="h-8 gap-2 text-[10px] font-black"
                  onClick={() => router.push(`/admin/projetos/novo?investorId=${id}`)}
                >
                  <Plus size={14} /> ADICIONAR PROJETO
                </Button>
              </div>

              {investor.projects.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {investor.projects.map((project: any) => (
                    <Card key={project.id} className="p-4 bg-brand-surface/40 border-brand-border flex justify-between items-center group hover:border-brand-accent/50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-brand-accent/10 rounded border border-brand-accent/20 text-brand-accent">
                          <Briefcase size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-brand-accent transition-colors">{project.name}</p>
                          <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-tight">
                            {project.product_name} • Ciclo {project.currentCycle}/{project.max_cycles}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[9px] font-black text-brand-text-muted uppercase">Capital Alocado</p>
                          <p className="text-sm font-mono font-bold text-white">{formatMoney(project.currentCapital)}</p>
                        </div>
                        <StatusBadge status={project.status} />
                        <div className="flex gap-2">
                          <Link href={`/admin/projetos/${project.id}`} className="p-2 text-brand-text-muted hover:text-brand-accent transition-colors">
                            <ExternalLink size={18} />
                          </Link>
                          <button onClick={() => handleDeleteProject(project.id, project.name)} className="p-2 text-brand-text-muted hover:text-brand-danger transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-brand-surface/20 border border-brand-border p-12 rounded-xl text-center">
                  <Briefcase size={48} className="mx-auto text-brand-text-muted mb-4 opacity-20" />
                  <p className="text-[11px] font-black text-brand-text-muted uppercase tracking-widest mb-4">Nenhum projeto vinculado a este investidor.</p>
                  <Button onClick={() => router.push(`/admin/projetos/novo?investorId=${id}`)} className="gap-2">
                    <Plus size={14} /> CRIAR PRIMEIRO PROJETO
                  </Button>
                </div>
              )}
            </div>
          )}

        </div>
      </DashboardLayout>
    </>
  );
}
