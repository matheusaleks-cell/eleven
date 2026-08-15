"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { User, Mail, Phone, MapPin, Landmark, Briefcase, Calendar, Shield, CreditCard, ArrowLeft } from "lucide-react";
import { getInvestorProfile } from "../actions";
import Link from "next/link";
import { toast } from "sonner";

export default function PerfilPage() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPassModal, setShowPassModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = () => {
    const s = localStorage.getItem("eleven_session");
    if (s) {
      const parsed = JSON.parse(s);
      setSession(parsed);
      getInvestorProfile().then((res) => {
        if (res.success) setProfile(res.data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      toast.error("Informe sua senha atual.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setUpdating(true);
    try {
      const res = await import("../actions").then(m => m.updateMyPassword(currentPassword, newPassword));
      if (res.success) {
        toast.success("Senha atualizada com sucesso!");
        setShowPassModal(false);
        setCurrentPassword("");
        setNewPassword("");
      } else {
        toast.error(res.error || "Erro ao atualizar senha.");
      }
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setUpdating(false);
    }
  };

  const handleRequestChange = () => {
    const subject = encodeURIComponent("Solicitação de Alteração Cadastral - Eleven Firearms");
    const body = encodeURIComponent(`Olá Suporte,\n\nGostaria de solicitar a alteração dos meus dados cadastrais.\n\nInvestidor: ${session.name}\nE-mail: ${session.email}`);
    window.location.href = `mailto:suporte@elevenfirearms.com?subject=${subject}&body=${body}`;
  };

  if (loading || !session) {
    return (
      <DashboardLayout role="INVESTOR" userName="Carregando..." userEmail="" pageTitle="Carregando...">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const renderInfoRow = (label: string, value: string | null | undefined, icon?: React.ReactNode) => (
    <div className="flex flex-col gap-1 border-b border-brand-border/20 pb-3">
      <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest flex items-center gap-2">
        {icon} {label}
      </span>
      <span className="text-sm font-bold text-white uppercase">{value || "—"}</span>
    </div>
  );

  let addressObj: any = {};
  try { addressObj = JSON.parse(profile?.address || "{}"); } catch { addressObj = {}; }

  let bankObj: any = {};
  try { bankObj = JSON.parse(profile?.bankDetails || "{}"); } catch { bankObj = {}; }

  return (
    <DashboardLayout role="INVESTOR" userName={session.name} userEmail={session.email}>
      <div className="flex flex-col gap-8 animate-fade-in pb-12 max-w-5xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/investidor" className="p-2 bg-brand-surface border border-brand-border rounded-lg text-brand-text-muted hover:text-brand-accent transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1 font-rajdhani uppercase text-white">MEUS DADOS CADASTRAIS</h1>
            <p className="text-brand-text-secondary text-sm font-medium uppercase tracking-wider text-[10px]">Confira suas informações pessoais, de endereço e bancárias registradas.</p>
          </div>
        </div>

        {/* Banner: dados incompletos */}
        {!profile?.phone && !profile?.cpfCnpj && !profile?.address && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-brand-accent/20 bg-brand-accent/5">
            <span className="text-brand-accent mt-0.5 text-lg leading-none">ⓘ</span>
            <div>
              <p className="text-[11px] font-black text-brand-accent uppercase tracking-wider">Dados cadastrais incompletos</p>
              <p className="text-[10px] text-brand-text-muted mt-0.5 leading-relaxed">
                Seus dados pessoais, de endereço e bancários ainda não foram preenchidos. Entre em contato com o administrador ou use o botão &ldquo;Solicitar Alteração de Dados&rdquo; abaixo para providenciar o cadastro completo.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Coluna 1: Dados Pessoais */}
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6 space-y-6 bg-brand-surface/20">
              <h3 className="text-xs font-black text-brand-accent uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                <User size={14} /> Informações Pessoais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderInfoRow("Nome Completo", profile?.name)}
                {renderInfoRow("E-mail Principal", profile?.email, <Mail size={12} />)}
                {renderInfoRow("Telefone / WhatsApp", profile?.phone, <Phone size={12} />)}
                {renderInfoRow("Profissão", profile?.profession, <Briefcase size={12} />)}
                {renderInfoRow("CPF / CNPJ", profile?.cpfCnpj)}
                {renderInfoRow("RG", profile?.rg)}
              </div>
            </Card>

            <Card className="p-6 space-y-6 bg-brand-surface/20">
              <h3 className="text-xs font-black text-brand-accent uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                <MapPin size={14} /> Endereço Residencial
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  {renderInfoRow("Logradouro", addressObj.logradouro ? `${addressObj.logradouro}, ${addressObj.numero || ""}` : null)}
                </div>
                {renderInfoRow("Bairro", addressObj.bairro)}
                {renderInfoRow("Complemento", addressObj.complemento)}
                {renderInfoRow("Cidade", addressObj.cidade)}
                {renderInfoRow("Estado / UF", addressObj.estado)}
                {renderInfoRow("CEP", addressObj.cep)}
              </div>
            </Card>
          </div>

          {/* Coluna 2: Dados Bancários e Segurança */}
          <div className="space-y-6">
            <Card className="p-6 space-y-6 bg-brand-accent/5 border-brand-accent/20">
              <h3 className="text-xs font-black text-brand-accent uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                <Landmark size={14} /> Dados para Recebimento
              </h3>
              <div className="space-y-4">
                {renderInfoRow("Banco", bankObj.banco || profile?.bankDetails)}
                {renderInfoRow("Agência", bankObj.agencia)}
                {renderInfoRow("Conta", bankObj.conta ? `${bankObj.conta} (${bankObj.tipoConta || "CORRENTE"})` : null)}
                {renderInfoRow("Chave PIX", bankObj.pixKey, <CreditCard size={12} />)}
              </div>
              <div className="pt-4 mt-4 border-t border-brand-accent/10">
                <p className="text-[9px] text-brand-accent/60 uppercase font-black leading-relaxed">
                  Estes são os dados utilizados para a distribuição de lucros e encerramento de ciclos.
                </p>
                <Button 
                  variant="secondary" 
                  className="w-full text-[10px] font-black uppercase mt-4 border-dashed"
                  onClick={handleRequestChange}
                >
                  SOLICITAR ALTERAÇÃO DE DADOS
                </Button>
              </div>
            </Card>

            <Card className="p-6 space-y-4 bg-brand-surface/20">
              <h3 className="text-xs font-black text-brand-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                <Shield size={14} /> Segurança
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-[10px] font-bold text-brand-text-muted uppercase">
                  <span>Membro desde</span>
                  <span className="text-white">{new Date(profile?.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-brand-text-muted uppercase">
                  <span>Status da Conta</span>
                  <span className="text-brand-success">Ativa</span>
                </div>
              </div>
              <Button 
                className="w-full text-[10px] font-black uppercase mt-2 shadow-[0_0_15px_rgba(245,196,0,0.1)]"
                onClick={() => setShowPassModal(true)}
              >
                ALTERAR MINHA SENHA
              </Button>
              <p className="text-[9px] text-center text-brand-text-muted italic">
                A senha deve conter no mínimo 6 caracteres.
              </p>
            </Card>
          </div>

        </div>
      </div>

      {/* Modal Troca de Senha */}
      {showPassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md p-6 bg-brand-surface border-brand-accent/30 shadow-2xl">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-4">Redefinir Senha</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Senha Atual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-brand-input border border-brand-border rounded px-4 py-2.5 text-white text-sm outline-none focus:border-brand-accent/50 transition-all"
                  placeholder="Sua senha atual"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Nova Senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-brand-input border border-brand-border rounded px-4 py-2.5 text-white text-sm outline-none focus:border-brand-accent/50 transition-all"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1 text-[10px] font-bold" onClick={() => { setShowPassModal(false); setCurrentPassword(""); }}>CANCELAR</Button>
                <Button 
                  className="flex-1 text-[10px] font-bold" 
                  onClick={handleUpdatePassword}
                  disabled={updating}
                >
                  {updating ? "SALVANDO..." : "CONFIRMAR"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}

