"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createInvestor, uploadInvestorDocument } from "../actions";
import { maskPhone } from "@/lib/masks";
import { toast } from "sonner";
import {
  User,
  Mail,
  Lock,
  Phone,
  CreditCard,
  FileText,
  Building2,
  MapPin,
  Landmark,
  Upload,
  X,
  CheckCircle2,
  ArrowLeft,
  ChevronRight,
  Briefcase,
} from "lucide-react";

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

// ─── field components ─────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
}

function Field({ label, id, value, onChange, type = "text", placeholder, required, icon }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-text-muted">
        {label}{required && <span className="text-brand-accent ml-1">*</span>}
      </label>
      <div className="flex items-center gap-2 bg-brand-input border border-brand-border rounded px-3 py-2.5 focus-within:border-brand-accent/60 transition-colors">
        {icon && <span className="text-brand-text-muted shrink-0">{icon}</span>}
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent text-white text-sm w-full outline-none placeholder:text-brand-text-muted/50 font-rajdhani"
          style={{ fontFamily: "'Rajdhani', sans-serif" }}
        />
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  step: number;
  currentStep: number;
}

function Section({ title, icon, children, step, currentStep }: SectionProps) {
  const isActive = step === currentStep;
  const isDone = step < currentStep;

  return (
    <div
      className={`rounded-lg border transition-all overflow-hidden ${
        isActive
          ? "border-brand-accent/40 bg-brand-accent/3"
          : isDone
          ? "border-brand-success/20 bg-brand-success/3"
          : "border-brand-border bg-brand-surface/20 opacity-60"
      }`}
    >
      <div className="flex items-center gap-3 p-5 border-b border-inherit">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
            isActive
              ? "border-brand-accent text-brand-accent bg-brand-accent/10"
              : isDone
              ? "border-brand-success text-brand-success bg-brand-success/10"
              : "border-brand-border text-brand-text-muted bg-brand-input"
          }`}
        >
          {isDone ? <CheckCircle2 size={14} /> : step}
        </div>
        <div className="flex items-center gap-2">
          <span className={isActive ? "text-brand-accent" : isDone ? "text-brand-success" : "text-brand-text-muted"}>
            {icon}
          </span>
          <span
            className={`text-sm font-bold uppercase tracking-wider font-rajdhani ${
              isActive ? "text-white" : isDone ? "text-brand-success" : "text-brand-text-muted"
            }`}
          >
            {title}
          </span>
        </div>
      </div>
      {isActive && <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>}
    </div>
  );
}

// ─── pending doc type ──────────────────────────────────────────────────────────

interface PendingDoc {
  file: File;
  category: string;
  preview?: string;
}

const DOC_CATEGORIES = [
  "RG / CNH",
  "CPF",
  "Comprovante de Residência",
  "Contrato de Investimento",
  "Dados Bancários",
  "Outros",
];

// ─── page ─────────────────────────────────────────────────────────────────────

export default function NovoInvestidorPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  // Sessão
  const [session] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const s = localStorage.getItem("eleven_session");
      return s ? JSON.parse(s) : null;
    }
    return null;
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // ── Step 1: Conta ──────────────────────────────────────────────────────────
  const [conta, setConta] = useState({ name: "", email: "", password: "", confirmPassword: "", phone: "" });

  // ── Step 2: Pessoal ────────────────────────────────────────────────────────
  const [pessoal, setPessoal] = useState({ cpfCnpj: "", rg: "", profession: "" });

  // ── Step 3: Endereço ───────────────────────────────────────────────────────
  const [endereco, setEndereco] = useState({ cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "" });

  // ── Step 4: Bancário ───────────────────────────────────────────────────────
  const [banco, setBanco] = useState({ banco: "", agencia: "", conta: "", tipoConta: "Corrente", pix: "" });

  // ── Step 5: Documentos ────────────────────────────────────────────────────
  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([]);
  const [docCategory, setDocCategory] = useState(DOC_CATEGORIES[0]);

  const canGoNext = () => {
    if (currentStep === 1) {
      if (!conta.name || !conta.email || !conta.password) return false;
      if (conta.password !== conta.confirmPassword) return false;
    }
    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newDocs: PendingDoc[] = files.map((f) => ({
      file: f,
      category: docCategory,
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
    }));
    setPendingDocs((prev) => [...prev, ...newDocs]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeDoc = (idx: number) => {
    setPendingDocs((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Submissão final ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!conta.name || !conta.email || !conta.password) {
      toast.error("Preencha os campos obrigatórios da conta.");
      setCurrentStep(1);
      return;
    }
    if (conta.password !== conta.confirmPassword) {
      toast.error("As senhas não conferem.");
      setCurrentStep(1);
      return;
    }

    setSaving(true);
    try {
      // 1. Criar o usuário
      const addressJson = JSON.stringify(endereco);
      const bankJson = JSON.stringify(banco);

      const result = await createInvestor({
        name: conta.name,
        email: conta.email,
        password: conta.password,
        phone: conta.phone,
        cpfCnpj: pessoal.cpfCnpj,
        rg: pessoal.rg,
        profession: pessoal.profession,
        address: addressJson,
        bankDetails: bankJson,
      });

      if (!result.success) {
        toast.error(result.error || "Erro ao cadastrar investidor.");
        setSaving(false);
        return;
      }

      const investorId = result.investor!.id;

      // 2. Upload dos documentos em paralelo
      if (pendingDocs.length > 0) {
        const uploadPromises = pendingDocs.map(async (pd) => {
          return new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = async () => {
              const base64 = (reader.result as string).split(",")[1];
              await uploadInvestorDocument({
                userId: investorId,
                name: pd.file.name,
                type: pd.file.type.includes("pdf") ? "PDF" : "IMAGE",
                category: pd.category,
                size: fmtFileSize(pd.file.size),
                base64Data: base64,
              });
              resolve();
            };
            reader.readAsDataURL(pd.file);
          });
        });
        await Promise.all(uploadPromises);
      }

      toast.success(`Investidor ${conta.name} cadastrado com sucesso!`);
      router.push(`/admin/investidores/${investorId}`);
    } catch (err) {
      console.error(err);
      toast.error("Erro inesperado ao cadastrar investidor.");
    } finally {
      setSaving(false);
    }
  };

  if (!session) return null;

  const STEPS = [
    { label: "Conta", icon: <User size={14} /> },
    { label: "Pessoal", icon: <FileText size={14} /> },
    { label: "Endereço", icon: <MapPin size={14} /> },
    { label: "Bancário", icon: <Landmark size={14} /> },
    { label: "Documentos", icon: <Upload size={14} /> },
  ];

  return (
    <DashboardLayout role="ADMIN" userName={session.name} userEmail={session.email} pageTitle="Novo Investidor">
      <div className="flex flex-col gap-6 pb-10 animate-fade-in max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded border border-brand-border flex items-center justify-center text-brand-text-muted hover:text-white hover:border-brand-accent/40 transition-all"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-rajdhani uppercase">Cadastro de Investidor</h1>
            <p className="text-brand-text-muted text-sm">Preencha as informações em cada etapa e confirme ao final.</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const step = i + 1;
            const isActive = step === currentStep;
            const isDone = step < currentStep;
            return (
              <div key={step} className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => { if (isDone || isActive) setCurrentStep(step); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? "bg-brand-accent text-brand-bg"
                      : isDone
                      ? "bg-brand-success/10 text-brand-success border border-brand-success/20"
                      : "bg-brand-input text-brand-text-muted border border-brand-border"
                  }`}
                >
                  {isDone ? <CheckCircle2 size={10} /> : s.icon}
                  {s.label}
                </button>
                {i < STEPS.length - 1 && <ChevronRight size={12} className="text-brand-border shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* ── Step 1: Conta ── */}
        {currentStep === 1 && (
          <Card className="flex flex-col gap-5">
            <CardTitle className="gap-2">
              <User size={14} /> Dados de Acesso (Login)
            </CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field id="name" label="Nome Completo" value={conta.name} onChange={(v) => setConta({ ...conta, name: v })} placeholder="Francisco da Silva" required icon={<User size={14} />} />
              </div>
              <Field id="email" label="E-mail" value={conta.email} onChange={(v) => setConta({ ...conta, email: v })} type="email" placeholder="investidor@email.com" required icon={<Mail size={14} />} />
              <Field id="phone" label="Telefone / WhatsApp" value={conta.phone} onChange={(v) => setConta({ ...conta, phone: maskPhone(v) })} placeholder="(11) 99999-0000" icon={<Phone size={14} />} />
              <Field id="password" label="Senha Inicial" value={conta.password} onChange={(v) => setConta({ ...conta, password: v })} type="password" placeholder="••••••••" required icon={<Lock size={14} />} />
              <Field id="confirmPassword" label="Confirmar Senha" value={conta.confirmPassword} onChange={(v) => setConta({ ...conta, confirmPassword: v })} type="password" placeholder="••••••••" required icon={<Lock size={14} />} />
              {conta.password && conta.confirmPassword && conta.password !== conta.confirmPassword && (
                <p className="md:col-span-2 text-xs text-brand-danger font-bold">⚠ As senhas não conferem.</p>
              )}
            </div>
          </Card>
        )}

        {/* ── Step 2: Pessoal ── */}
        {currentStep === 2 && (
          <Card className="flex flex-col gap-5">
            <CardTitle className="gap-2">
              <FileText size={14} /> Documentação Pessoal
            </CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field id="cpfCnpj" label="CPF / CNPJ" value={pessoal.cpfCnpj} onChange={(v) => setPessoal({ ...pessoal, cpfCnpj: v })} placeholder="000.000.000-00" icon={<CreditCard size={14} />} />
              <Field id="rg" label="RG" value={pessoal.rg} onChange={(v) => setPessoal({ ...pessoal, rg: v })} placeholder="00.000.000-0" icon={<FileText size={14} />} />
              <div className="md:col-span-2">
                <Field id="profession" label="Profissão / Ocupação" value={pessoal.profession} onChange={(v) => setPessoal({ ...pessoal, profession: v })} placeholder="Empresário, Médico, Engenheiro..." icon={<Briefcase size={14} />} />
              </div>
            </div>
          </Card>
        )}

        {/* ── Step 3: Endereço ── */}
        {currentStep === 3 && (
          <Card className="flex flex-col gap-5">
            <CardTitle className="gap-2">
              <MapPin size={14} /> Endereço Residencial
            </CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field id="cep" label="CEP" value={endereco.cep} onChange={(v) => setEndereco({ ...endereco, cep: v })} placeholder="00000-000" icon={<MapPin size={14} />} />
              <div className="md:col-span-2">
                <Field id="logradouro" label="Logradouro" value={endereco.logradouro} onChange={(v) => setEndereco({ ...endereco, logradouro: v })} placeholder="Rua, Avenida, etc." icon={<MapPin size={14} />} />
              </div>
              <Field id="numero" label="Número" value={endereco.numero} onChange={(v) => setEndereco({ ...endereco, numero: v })} placeholder="123" icon={<MapPin size={14} />} />
              <Field id="complemento" label="Complemento" value={endereco.complemento} onChange={(v) => setEndereco({ ...endereco, complemento: v })} placeholder="Apto, Sala..." icon={<MapPin size={14} />} />
              <Field id="bairro" label="Bairro" value={endereco.bairro} onChange={(v) => setEndereco({ ...endereco, bairro: v })} placeholder="Bairro" icon={<MapPin size={14} />} />
              <Field id="cidade" label="Cidade" value={endereco.cidade} onChange={(v) => setEndereco({ ...endereco, cidade: v })} placeholder="São Paulo" icon={<MapPin size={14} />} />
              <Field id="estado" label="Estado (UF)" value={endereco.estado} onChange={(v) => setEndereco({ ...endereco, estado: v.toUpperCase().slice(0, 2) })} placeholder="SP" icon={<MapPin size={14} />} />
            </div>
          </Card>
        )}

        {/* ── Step 4: Bancário ── */}
        {currentStep === 4 && (
          <Card className="flex flex-col gap-5">
            <CardTitle className="gap-2">
              <Landmark size={14} /> Dados Bancários
            </CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field id="banco" label="Banco" value={banco.banco} onChange={(v) => setBanco({ ...banco, banco: v })} placeholder="Itaú, Bradesco, Nubank..." icon={<Building2 size={14} />} />
              </div>
              <Field id="agencia" label="Agência" value={banco.agencia} onChange={(v) => setBanco({ ...banco, agencia: v })} placeholder="0000" icon={<Landmark size={14} />} />
              <Field id="contaBanco" label="Conta" value={banco.conta} onChange={(v) => setBanco({ ...banco, conta: v })} placeholder="00000-0" icon={<Landmark size={14} />} />
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-text-muted block mb-1.5">Tipo de Conta</label>
                <select
                  value={banco.tipoConta}
                  onChange={(e) => setBanco({ ...banco, tipoConta: e.target.value })}
                  className="w-full bg-brand-input border border-brand-border rounded px-3 py-2.5 text-white text-sm outline-none focus:border-brand-accent/60 transition-colors"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  <option value="Corrente">Corrente</option>
                  <option value="Poupança">Poupança</option>
                </select>
              </div>
              <Field id="pix" label="Chave PIX" value={banco.pix} onChange={(v) => setBanco({ ...banco, pix: v })} placeholder="CPF, E-mail, Telefone ou aleatória" icon={<CreditCard size={14} />} />
            </div>
          </Card>
        )}

        {/* ── Step 5: Documentos ── */}
        {currentStep === 5 && (
          <Card className="flex flex-col gap-5">
            <CardTitle className="gap-2">
              <Upload size={14} /> Upload de Documentos
            </CardTitle>

            {/* Seletor de categoria + botão de upload */}
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value)}
                className="flex-1 bg-brand-input border border-brand-border rounded px-3 py-2.5 text-white text-sm outline-none focus:border-brand-accent/60 transition-colors"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                {DOC_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 bg-brand-accent text-brand-bg font-bold text-sm uppercase tracking-wider rounded hover:bg-brand-accent-hover transition-all"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                <Upload size={14} /> Selecionar Arquivo
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Lista de arquivos pendentes */}
            {pendingDocs.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center gap-3 py-10 rounded-lg border-2 border-dashed border-brand-border/50 cursor-pointer hover:border-brand-accent/30 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={28} className="text-brand-text-muted opacity-40" />
                <p className="text-xs text-brand-text-muted font-bold uppercase tracking-wider">
                  Clique ou arraste arquivos aqui
                </p>
                <p className="text-[10px] text-brand-text-muted">PDF ou Imagem · Máximo 10MB por arquivo</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {pendingDocs.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded border border-brand-border bg-brand-input"
                  >
                    {doc.preview ? (
                      <img src={doc.preview} alt={doc.file.name} className="w-10 h-10 object-cover rounded border border-brand-border" />
                    ) : (
                      <div className="w-10 h-10 rounded border border-brand-border bg-brand-surface flex items-center justify-center">
                        <FileText size={18} className="text-brand-text-muted" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{doc.file.name}</p>
                      <p className="text-[10px] text-brand-text-muted uppercase tracking-wider">
                        {doc.category} · {fmtFileSize(doc.file.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeDoc(idx)}
                      className="text-brand-text-muted hover:text-brand-danger transition-colors p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center justify-center gap-2 py-2 border border-dashed border-brand-border rounded text-[11px] text-brand-text-muted hover:text-brand-accent hover:border-brand-accent/40 transition-all font-bold uppercase tracking-wider mt-1"
                >
                  <Upload size={12} /> Adicionar mais arquivos
                </button>
              </div>
            )}

            {/* Resumo do cadastro */}
            <div className="mt-2 p-4 rounded-lg border border-brand-accent/20 bg-brand-accent/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent mb-3">Resumo do Cadastro</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                <span className="text-brand-text-muted">Nome:</span>
                <span className="text-white font-bold">{conta.name || "—"}</span>
                <span className="text-brand-text-muted">E-mail:</span>
                <span className="text-white font-bold">{conta.email || "—"}</span>
                <span className="text-brand-text-muted">CPF/CNPJ:</span>
                <span className="text-white font-bold">{pessoal.cpfCnpj || "—"}</span>
                <span className="text-brand-text-muted">Banco:</span>
                <span className="text-white font-bold">{banco.banco || "—"}</span>
                <span className="text-brand-text-muted">Documentos:</span>
                <span className="text-brand-accent font-bold">{pendingDocs.length} arquivo(s)</span>
              </div>
            </div>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between gap-3">
          <Button
            variant="secondary"
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft size={14} /> Anterior
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              onClick={() => {
                if (!canGoNext()) {
                  toast.error("Preencha os campos obrigatórios antes de continuar.");
                  return;
                }
                setCurrentStep((s) => s + 1);
              }}
              className="gap-2"
            >
              Próximo <ChevronRight size={14} />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="gap-2 min-w-[160px] shadow-[0_0_15px_rgba(245,196,0,0.2)]"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-brand-bg border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} /> Cadastrar Investidor
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
