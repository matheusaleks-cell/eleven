"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MoneyDisplay } from "@/components/shared/MoneyDisplay";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ArrowLeft, User, Building, Landmark, Briefcase, Plus, Trash2, Save, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatMoney } from "@/lib/calculations";
import { getInvestorDetails, updateInvestor, deleteInvestorProject } from "../actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function InvestorDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [investor, setInvestor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("RESUMO");
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<any>({
    name: "",
    email: "",
    phone: "",
    cpfCnpj: "",
    rg: "",
    address: "",
    bankDetails: "",
    bankReferences: "",
    commercialRefs: "",
    profession: "",
  });

  useEffect(() => {
    const s = localStorage.getItem("eleven_session");
    if (!s) { router.push("/admin/login"); return; }
    setSession(JSON.parse(s));
    fetchInvestor();
  }, []);

  async function fetchInvestor() {
    setLoading(true);
    try {
      const data = await getInvestorDetails(params.id);
      if (data) {
        setInvestor(data);
        setFormData({
          name: data.name,
          email: data.email,
          phone: data.phone,
          cpfCnpj: data.cpfCnpj,
          rg: data.rg,
          address: data.address,
          bankDetails: data.bankDetails,
          bankReferences: data.bankReferences,
          commercialRefs: data.commercialRefs,
          profession: data.profession,
        });
      } else {
        router.push("/admin/investidores");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar investidor.");
    } finally {
      setLoading(false);
    }
  }

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      const res = await updateInvestor(params.id, formData);
      if (res.success) {
        toast.success("Dados atualizados com sucesso!");
        fetchInvestor();
      } else {
        toast.error(res.error || "Erro ao atualizar dados.");
      }
    } catch (error) {
      toast.error("Erro na comunicação com o servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (confirm(`Deseja realmente remover o projeto "${projectName}" deste investidor?`)) {
      try {
        const res = await deleteInvestorProject(projectId);
        if (res.success) {
          toast.success("Projeto removido!");
          fetchInvestor();
        } else {
          toast.error(res.error);
        }
      } catch (error) {
        toast.error("Erro ao remover projeto.");
      }
    }
  };

  if (!session || loading) {
    return (
      <DashboardLayout role="ADMIN" userName="Admin" userEmail="admin@eleven.com" pageTitle="Carregando...">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="ADMIN" userName={session.name} userEmail={session.email}>
      <div className="flex flex-col gap-6 animate-fade-in pb-12">
        {/* Back and Title */}
        <div className="flex items-center gap-4">
          <Link href="/admin/investidores" className="p-2 bg-brand-surface border border-brand-border rounded-lg text-brand-text-muted hover:text-brand-accent transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-rajdhani uppercase text-white">PERFIL DO INVESTIDOR</h1>
            <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">{investor.name} • {investor.email}</p>
          </div>
        </div>

        {/* Stats Header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <Card className="bg-brand-surface/40 border-brand-border">
              <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.2em]">Capital Alocado</span>
              <p className="text-xl font-bold mt-1 text-white">{formatMoney(investor.stats.totalInvested)}</p>
           </Card>
           <Card className="bg-brand-surface/40 border-brand-border">
              <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.2em]">Retorno Recebido</span>
              <p className="text-xl font-bold mt-1 text-brand-success">{formatMoney(investor.stats.totalReceived)}</p>
           </Card>
           <Card className="bg-brand-surface/40 border-brand-border">
              <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.2em]">ROI Projetado</span>
              <p className={cn("text-xl font-bold mt-1", investor.stats.roi >= 0 ? "text-brand-accent" : "text-brand-danger")}>
                {investor.stats.roi.toFixed(1)}%
              </p>
           </Card>
           <Card className="bg-brand-surface/40 border-brand-border">
              <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.2em]">Ciclos Concluídos</span>
              <p className="text-xl font-bold mt-1 text-white">{investor.stats.totalCycles}</p>
           </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-brand-border">
          {["RESUMO", "DADOS CADASTRAIS", "PROJETOS"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-3 text-[11px] font-black tracking-widest uppercase transition-all relative",
                activeTab === tab ? "text-brand-accent" : "text-brand-text-muted hover:text-white"
              )}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-accent" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === "RESUMO" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <Card className="space-y-4">
                <h3 className="text-xs font-black text-brand-accent uppercase tracking-widest">Informações de Conta</h3>
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-brand-border/30 pb-2">
                    <span className="text-[10px] font-bold text-brand-text-muted uppercase">Status da Conta</span>
                    <StatusBadge status="ACTIVE" />
                  </div>
                  <div className="flex justify-between border-b border-brand-border/30 pb-2">
                    <span className="text-[10px] font-bold text-brand-text-muted uppercase">Membro desde</span>
                    <span className="text-xs font-bold text-white">{new Date(investor.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between border-b border-brand-border/30 pb-2">
                    <span className="text-[10px] font-bold text-brand-text-muted uppercase">Projetos Ativos</span>
                    <span className="text-xs font-bold text-white">{investor.stats.activeProjects}</span>
                  </div>
                </div>
              </Card>

              <Card className="space-y-4">
                <h3 className="text-xs font-black text-brand-accent uppercase tracking-widest">Atalhos Rápidos</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="secondary" className="gap-2 text-[10px] font-bold">
                    <Plus size={14} /> NOVO APORTE
                  </Button>
                  <Button variant="secondary" className="gap-2 text-[10px] font-bold">
                    <Save size={14} /> RELATÓRIO PDF
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "DADOS CADASTRAIS" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Pessoais */}
                <Card className="space-y-4">
                  <h3 className="text-xs font-black text-brand-accent uppercase tracking-widest flex items-center gap-2">
                    <User size={14} /> Dados Pessoais
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-brand-text-muted uppercase">Nome Completo</label>
                        <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-10 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-brand-text-muted uppercase">CPF/CNPJ</label>
                        <Input value={formData.cpfCnpj} onChange={(e) => setFormData({...formData, cpfCnpj: e.target.value})} className="h-10 text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-brand-text-muted uppercase">RG</label>
                        <Input value={formData.rg} onChange={(e) => setFormData({...formData, rg: e.target.value})} className="h-10 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-brand-text-muted uppercase">Profissão</label>
                        <Input value={formData.profession} onChange={(e) => setFormData({...formData, profession: e.target.value})} className="h-10 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-brand-text-muted uppercase">Endereço Completo</label>
                      <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="h-10 text-sm" />
                    </div>
                  </div>
                </Card>

                {/* Bancários */}
                <Card className="space-y-4">
                  <h3 className="text-xs font-black text-brand-accent uppercase tracking-widest flex items-center gap-2">
                    <Landmark size={14} /> Dados Bancários e Recebimento
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-brand-text-muted uppercase">Dados Bancários (Banco/Ag/CC)</label>
                      <textarea 
                        className="w-full bg-brand-input border border-brand-border rounded px-4 py-2 text-sm text-white outline-none focus:border-brand-accent min-h-[80px]"
                        value={formData.bankDetails}
                        onChange={(e) => setFormData({...formData, bankDetails: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-brand-text-muted uppercase">Referências Comerciais/Bancárias</label>
                      <Input value={formData.bankReferences} onChange={(e) => setFormData({...formData, bankReferences: e.target.value})} className="h-10 text-sm" />
                    </div>
                  </div>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleUpdate} disabled={isSaving} className="gap-2 min-w-[200px]">
                  {isSaving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                  SALVAR ALTERAÇÕES
                </Button>
              </div>
            </div>
          )}

          {activeTab === "PROJETOS" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-black text-brand-text-muted uppercase tracking-[0.2em]">Portfólio de Aportes Ativos</h3>
                <Button variant="secondary" size="sm" className="h-8 gap-2 text-[10px] font-black">
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

                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-[9px] font-black text-brand-text-muted uppercase">Capital Alocado</p>
                          <p className="text-sm font-mono font-bold text-white">{formatMoney(project.currentCapital)}</p>
                        </div>
                        <StatusBadge status={project.status} />
                        <div className="flex gap-2">
                          <Link href={`/admin/projetos/${project.id}`} className="p-2 text-brand-text-muted hover:text-brand-accent transition-colors">
                            <ExternalLink size={18} />
                          </Link>
                          <button 
                            onClick={() => handleDeleteProject(project.id, project.name)}
                            className="p-2 text-brand-text-muted hover:text-brand-danger transition-colors"
                          >
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
                  <p className="text-[11px] font-black text-brand-text-muted uppercase tracking-widest">Nenhum projeto vinculado a este investidor.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
