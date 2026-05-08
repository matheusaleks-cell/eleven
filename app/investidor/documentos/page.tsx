"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileText, Download, Search, Filter, Shield, Calendar, Eye, FileArchive, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

const DOCUMENTOS = [
  { id: "1", nome: "Contrato de Investimento - Lote 01 (VR-12P)", tipo: "CONTRATO", data: "12/01/2026", tamanho: "1.2 MB", status: "ASSINADO" },
  { id: "2", nome: "Certificado de Propriedade de Cotas", tipo: "CERTIFICADO", data: "15/01/2026", tamanho: "450 KB", status: "DISPONÍVEL" },
  { id: "3", nome: "Demonstrativo de Resultados - Q1 2026", tipo: "RELATÓRIO", data: "01/04/2026", tamanho: "2.8 MB", status: "DISPONÍVEL" },
  { id: "4", nome: "Termo de Ciência e Reinvestimento", tipo: "TERMO", data: "15/04/2026", tamanho: "890 KB", status: "ASSINADO" },
];


export default function DocumentosPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const s = localStorage.getItem("eleven_session");
      if (!s) {
        window.location.href = "/login";
        return;
      }
      const parsed = JSON.parse(s);
      setSession(parsed);
    } catch (e) {
      window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-brand-accent font-bold uppercase tracking-widest text-[10px] animate-pulse">Sincronizando Sessão...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <DashboardLayout role="INVESTOR" userName={session.name} userEmail={session.email}>
      <div className="flex flex-col gap-8 animate-fade-in pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-accent/10 rounded border border-brand-accent/20 text-brand-accent shadow-[0_0_15px_rgba(245,196,0,0.1)]">
              <Shield size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1 font-rajdhani uppercase text-white">CENTRAL DE DOCUMENTOS</h1>
              <p className="text-brand-text-secondary text-sm font-medium uppercase tracking-wider text-[10px]">Acesso seguro a contratos, certificados e relatórios de conformidade.</p>
            </div>
          </div>
          <Button variant="secondary" className="gap-2">
            <FileArchive size={18} /> BAIXAR TODOS (.ZIP)
          </Button>
        </div>

        {/* Security Info */}
        <Card className="p-4 bg-brand-success/5 border border-brand-success/20 flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-success/10 rounded-full text-brand-success">
                 <CheckCircle2 size={20} />
              </div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Todos os documentos possuem assinatura digital e validade jurídica para fins de auditoria.</p>
           </div>
           <Button variant="ghost" size="sm" className="text-[10px] text-brand-success hover:bg-brand-success/10 gap-2 font-bold uppercase tracking-[0.2em]">
              VERIFICAR AUTENTICIDADE
           </Button>
        </Card>

        {/* Filters */}
        <div className="flex gap-4">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={18} />
             <Input className="pl-10 h-11" placeholder="Buscar por nome do documento ou tipo..." />
           </div>
           <Button variant="secondary" className="gap-2 h-11">
             <Filter size={16} /> FILTRAR POR TIPO
           </Button>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
           {DOCUMENTOS.map((doc) => (
              <Card key={doc.id} className="p-0 border-brand-border bg-brand-surface/20 hover:border-brand-accent/40 transition-all group flex overflow-hidden">
                 <div className="w-24 flex flex-col items-center justify-center bg-brand-bg/60 border-r border-brand-border group-hover:bg-brand-accent/5 transition-colors">
                    <FileText size={40} className="text-brand-text-muted group-hover:text-brand-accent transition-colors" />
                    <span className="text-[9px] font-bold text-brand-text-muted uppercase mt-2">{doc.tamanho}</span>
                 </div>
                 
                 <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                       <div className="flex justify-between items-start mb-2">
                          <span className="text-[9px] font-bold text-brand-accent uppercase tracking-widest border border-brand-accent/20 px-1.5 py-0.5 rounded bg-brand-accent/5">
                             {doc.tipo}
                          </span>
                          <span className={cn(
                             "text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border",
                             doc.status === "ASSINADO" ? "bg-brand-success/10 text-brand-success border-brand-success/20" : "bg-brand-text-muted/10 text-brand-text-muted border-brand-border"
                          )}>
                             {doc.status}
                          </span>
                       </div>
                       <h3 className="text-sm font-bold text-white group-hover:text-brand-accent transition-colors leading-tight mb-1">{doc.nome}</h3>
                       <div className="flex items-center gap-2 text-brand-text-muted">
                          <Calendar size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-tighter">Emitido em: {doc.data}</span>
                       </div>
                    </div>
                    
                    <div className="flex gap-2 mt-6">
                       <Button variant="ghost" size="sm" className="flex-1 h-9 text-[10px] gap-2 border border-brand-border hover:border-brand-accent/50 group-hover:bg-brand-accent/5 font-bold uppercase tracking-widest">
                          <Eye size={14} /> VISUALIZAR
                       </Button>
                       <Button size="sm" className="flex-1 h-9 text-[10px] gap-2 font-bold uppercase tracking-widest">
                          <Download size={14} /> BAIXAR
                       </Button>
                    </div>
                 </div>
              </Card>
           ))}
        </div>

        {/* Empty State / Upload Request */}
        <Card className="mt-8 p-8 border-dashed border-brand-border/50 bg-brand-bg/20 flex flex-col items-center text-center">
           <FileText size={32} className="text-brand-text-muted mb-4 opacity-30" />
           <p className="text-xs font-bold text-brand-text-muted uppercase tracking-widest max-w-sm">Não encontrou o documento que procurava? Solicite uma cópia autenticada à nossa central de conformidade.</p>
           <Button variant="ghost" className="mt-4 text-[10px] uppercase font-bold text-brand-accent hover:underline">
              SOLICITAR DOCUMENTO ADICIONAL
           </Button>
        </Card>
      </div>
    </DashboardLayout>
  );
}
