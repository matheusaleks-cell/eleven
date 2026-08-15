"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  FileText,
  Download,
  Search,
  Shield,
  Calendar,
  Eye,
  FileArchive,
  CheckCircle2,
  Loader2,
  FileImage,
  FileUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getMyDocuments } from "../actions";

// ─── types ───────────────────────────────────────────────────────────────────

interface InvestorDocument {
  id: string;
  name: string;
  type: string;
  category: string;
  size: string;
  base64Data: string;
  createdAt: string;
  realizedValue?: number | null;
  realizedDate?: string | null;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function getCategoryColor(category: string) {
  const map: Record<string, string> = {
    "RG / CNH": "text-blue-400 border-blue-400/20 bg-blue-400/5",
    "CPF": "text-purple-400 border-purple-400/20 bg-purple-400/5",
    "Comprovante de Residência": "text-green-400 border-green-400/20 bg-green-400/5",
    "Contrato de Investimento": "text-brand-accent border-brand-accent/20 bg-brand-accent/5",
    "Dados Bancários": "text-orange-400 border-orange-400/20 bg-orange-400/5",
    "INVOICE": "text-emerald-400 border-emerald-400/20 bg-emerald-400/5",
    "PACKING LIST": "text-teal-400 border-teal-400/20 bg-teal-400/5",
    "LICENÇA DE IMPORTAÇÃO / LPCO": "text-amber-400 border-amber-400/20 bg-amber-400/5",
    "SWIFT – COMPROVANTE DE PAGTO/CÂMBIO": "text-yellow-400 border-yellow-400/20 bg-yellow-400/5",
    "AWB EMBARQUE": "text-cyan-400 border-cyan-400/20 bg-cyan-400/5",
    "TERMO DE VISTORIA EXÉRCITO BRASILEIRO": "text-pink-400 border-pink-400/20 bg-pink-400/5",
    "PAGTO TRIBUTOS FEDERAIS": "text-indigo-400 border-indigo-400/20 bg-indigo-400/5",
    "PAGTO GARE ICMS": "text-violet-400 border-violet-400/20 bg-violet-400/5",
    "PGTO ARMAZENAGEM": "text-rose-400 border-rose-400/20 bg-rose-400/5",
    "NFe ENTRADA": "text-lime-400 border-lime-400/20 bg-lime-400/5",
    "Outros": "text-brand-text-muted border-brand-border bg-brand-input",
  };
  return map[category] ?? "text-brand-text-muted border-brand-border bg-brand-input";
}

// ─── download helper ──────────────────────────────────────────────────────────

function downloadDoc(doc: InvestorDocument) {
  const a = document.createElement("a");
  a.href = doc.base64Data; // already a full data URL
  a.download = doc.name;
  a.click();
}

// ─── viewer modal ─────────────────────────────────────────────────────────────

function DocViewer({ doc, onClose }: { doc: InvestorDocument; onClose: () => void }) {
  const isPdf = doc.type === "PDF";
  const src = doc.base64Data; // already a full data URL (data:<mime>;base64,...)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-brand-surface border border-brand-border rounded-lg overflow-hidden shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-brand-border">
          <div className="flex items-center gap-3">
            {isPdf ? <FileText size={18} className="text-brand-accent" /> : <FileImage size={18} className="text-brand-accent" />}
            <span className="font-bold text-white text-sm truncate max-w-xs">{doc.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadDoc(doc)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-brand-accent/30 text-brand-accent text-xs font-bold uppercase hover:bg-brand-accent/10 transition-all"
            >
              <Download size={12} /> Baixar
            </button>
            <button onClick={onClose} className="text-brand-text-muted hover:text-white transition-colors p-1">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-brand-bg">
          {isPdf ? (
            <iframe src={src} className="w-full h-[75vh]" title={doc.name} />
          ) : (
            <img src={src} alt={doc.name} className="max-w-full max-h-[75vh] object-contain mx-auto p-4" />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function DocumentosPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<InvestorDocument[]>([]);
  const [search, setSearch] = useState("");
  const [viewingDoc, setViewingDoc] = useState<InvestorDocument | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem("eleven_session");
      if (!s) { window.location.href = "/login"; return; }
      const parsed = JSON.parse(s);
      setSession(parsed);

      // Buscar documentos do banco de dados
      getMyDocuments().then((res) => {
        if (res.success) {
          setDocuments(
            res.documents.map((d: any) => ({
              ...d,
              createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt),
            })) as InvestorDocument[]
          );
        }
        setLoading(false);
      });
    } catch {
      window.location.href = "/login";
    }
  }, []);

  const filtered = documents.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-brand-accent font-bold uppercase tracking-widest text-[10px] animate-pulse">Carregando Documentos...</p>
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
              <h1 className="text-2xl font-bold tracking-tight mb-1 font-rajdhani uppercase text-white">Central de Documentos</h1>
              <p className="text-brand-text-secondary text-sm font-medium uppercase tracking-wider text-[10px]">
                Acesso seguro a contratos, certificados e relatórios de conformidade.
              </p>
            </div>
          </div>
          {documents.length > 0 && (
            <Button variant="secondary" className="gap-2 w-fit" onClick={() => documents.forEach((d) => downloadDoc(d))}>
              <FileArchive size={18} /> BAIXAR TODOS
            </Button>
          )}
        </div>

        {/* Security Info */}
        <Card className="p-4 bg-brand-success/5 border border-brand-success/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-success/10 rounded-full text-brand-success">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-xs font-bold text-white uppercase tracking-wider">
              Todos os documentos são armazenados com segurança e vinculados ao seu perfil.
            </p>
          </div>
          <span className="text-[10px] text-brand-success font-bold uppercase tracking-wider">
            {documents.length} documento(s) disponível(eis)
          </span>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou categoria..."
            className="w-full bg-brand-input border border-brand-border rounded pl-10 pr-4 py-2.5 text-white text-sm outline-none focus:border-brand-accent/60 transition-colors placeholder:text-brand-text-muted/50"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          />
        </div>

        {/* Documents Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((doc) => (
              <Card
                key={doc.id}
                className="p-0 border-brand-border bg-brand-surface/20 hover:border-brand-accent/40 transition-all group flex overflow-hidden"
              >
                <div className="w-20 flex flex-col items-center justify-center bg-brand-bg/60 border-r border-brand-border group-hover:bg-brand-accent/5 transition-colors shrink-0">
                  {doc.type === "IMAGE" ? (
                    <FileImage size={32} className="text-brand-text-muted group-hover:text-brand-accent transition-colors" />
                  ) : (
                    <FileText size={32} className="text-brand-text-muted group-hover:text-brand-accent transition-colors" />
                  )}
                  <span className="text-[8px] font-bold text-brand-text-muted uppercase mt-2 text-center px-1">{doc.size}</span>
                </div>

                <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className={cn("text-[8px] font-bold uppercase tracking-widest border px-1.5 py-0.5 rounded shrink-0", getCategoryColor(doc.category))}>
                        {doc.category}
                      </span>
                      <span className="text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border bg-brand-success/10 text-brand-success border-brand-success/20 shrink-0">
                        DISPONÍVEL
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-brand-accent transition-colors leading-tight mb-1 truncate">
                      {doc.name}
                    </h3>
                    <div className="flex items-center gap-2 text-brand-text-muted">
                      <Calendar size={11} />
                      <span className="text-[10px] font-bold uppercase">Enviado em: {fmtDate(doc.createdAt)}</span>
                    </div>
                    {doc.realizedValue !== null && doc.realizedValue !== undefined && (
                      <div className="mt-2 p-1.5 bg-brand-bg/50 rounded border border-brand-border/40 flex justify-between items-center text-[9px] font-medium">
                        <div className="flex items-center gap-1">
                          <span className="text-brand-text-muted uppercase">Lançado:</span>
                          <span className="font-mono text-brand-accent font-bold">
                            R$ {Number(doc.realizedValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-brand-text-muted uppercase">Em:</span>
                          <span className="font-mono text-white">
                            {doc.realizedDate ? fmtDate(doc.realizedDate) : fmtDate(doc.createdAt)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setViewingDoc(doc)}
                      className="flex-1 flex items-center justify-center gap-1.5 h-8 text-[10px] font-bold uppercase tracking-wider border border-brand-border rounded hover:border-brand-accent/50 hover:bg-brand-accent/5 text-brand-text-muted hover:text-white transition-all"
                    >
                      <Eye size={12} /> VISUALIZAR
                    </button>
                    <button
                      onClick={() => downloadDoc(doc)}
                      className="flex-1 flex items-center justify-center gap-1.5 h-8 text-[10px] font-bold uppercase tracking-wider bg-brand-accent text-brand-bg rounded hover:bg-brand-accent-hover transition-all"
                    >
                      <Download size={12} /> BAIXAR
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <Card className="py-16 border-dashed border-brand-border/50 bg-brand-bg/20 flex flex-col items-center text-center">
            <FileUp size={36} className="text-brand-text-muted mb-4 opacity-30" />
            <p className="text-sm font-bold text-white uppercase tracking-wider mb-2">Nenhum documento disponível</p>
            <p className="text-xs font-bold text-brand-text-muted uppercase tracking-widest max-w-xs">
              {search
                ? "Nenhum documento encontrado para esta busca."
                : "Seus documentos aparecerão aqui quando forem enviados pelo administrador."
              }
            </p>
          </Card>
        )}
      </div>

      {/* Viewer Modal */}
      {viewingDoc && <DocViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />}
    </DashboardLayout>
  );
}
