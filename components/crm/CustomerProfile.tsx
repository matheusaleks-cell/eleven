"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  User, Building2, Mail, Phone, MapPin, ShoppingBag,
  Clock, FileText, Download, ExternalLink, ShieldCheck,
  TrendingUp, CreditCard, Calendar, Plus, Printer,
  FileText as FileIcon, Trash2, Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadCustomerDocument, getDocumentContent, deleteCustomerDocument } from "@/app/admin/crm/clientes/actions";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { generateAnexoP } from "./AnexoPGenerator";
import { SaleModal } from "./SaleModal";



const REQUIRED_DOC_TYPES = [
  { key: "CR", label: "Certificado de Registro (CR)" },
  { key: "CNPJ", label: "Comprovante CNPJ" },
  { key: "COMPROVANTE_ENDERECO", label: "Comprovante de Endereço" },
  { key: "CNH_RESPONSAVEL", label: "CNH do Responsável" },
];

function DocsTab({ customer, onRefresh, handleDownload }: {
  customer: any;
  onRefresh?: () => void;
  handleDownload: (id: string, name: string) => void;
}) {
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const triggerUpload = (docKey: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png,.webp";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploadingKey(docKey);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        try {
          const res = await uploadCustomerDocument(customer.id, {
            name: file.name,
            type: file.type.split("/")[1]?.toUpperCase() || "PDF",
            category: docKey,
            size: (file.size / 1024 / 1024).toFixed(2) + " MB",
            base64Data: base64,
          });
          if (res.success) {
            toast.success("Documento enviado com sucesso!");
            if (onRefresh) onRefresh();
          } else {
            toast.error("Erro ao enviar documento.");
          }
        } catch {
          toast.error("Falha no envio. Verifique o tamanho do arquivo (máx. 15 MB).");
        } finally {
          setUploadingKey(null);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleDelete = async (docId: string, docName: string) => {
    setDeletingId(docId);
    const res = await deleteCustomerDocument(docId);
    setDeletingId(null);
    if (res.success) {
      toast.success(`"${docName}" excluído.`);
      if (onRefresh) onRefresh();
    } else {
      toast.error("Erro ao excluir documento.");
    }
  };

  const getDocsByKey = (key: string) =>
    (customer.documents || []).filter((d: any) => d.category === key);

  const otherDocs = (customer.documents || []).filter(
    (d: any) => !REQUIRED_DOC_TYPES.some((t) => t.key === d.category)
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Required document slots */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-white uppercase tracking-widest">Documentos Obrigatórios</h3>
        {REQUIRED_DOC_TYPES.map((docType) => {
          const docs = getDocsByKey(docType.key);
          const uploaded = docs.length > 0;
          return (
            <div key={docType.key} className={cn(
              "p-4 rounded-lg border transition-all",
              uploaded ? "bg-brand-success/5 border-brand-success/30" : "bg-brand-surface/30 border-brand-border"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded flex items-center justify-center border",
                    uploaded ? "bg-brand-success border-brand-success text-black" : "border-brand-border"
                  )}>
                    {uploaded && <ShieldCheck size={12} />}
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-white uppercase tracking-tight">{docType.label}</p>
                    {docs.map((d: any) => (
                      <p key={d.id} className="text-[10px] text-brand-text-muted font-bold">{d.name} • {d.size}</p>
                    ))}
                    {!uploaded && (
                      <p className="text-[10px] text-brand-text-muted font-bold">Não enviado</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 gap-1.5 text-[10px] font-bold uppercase tracking-wider"
                    disabled={uploadingKey === docType.key}
                    onClick={() => triggerUpload(docType.key)}
                  >
                    <Upload size={12} />
                    {uploadingKey === docType.key ? "Enviando..." : uploaded ? "Substituir" : "Enviar"}
                  </Button>
                  {docs.map((d: any) => (
                    <div key={d.id} className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDownload(d.id, d.name)}
                      >
                        <Download size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-brand-danger hover:bg-brand-danger/10"
                        disabled={deletingId === d.id}
                        onClick={() => handleDelete(d.id, d.name)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Other documents */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-white uppercase tracking-widest">Outros Documentos</h3>
          <Button
            variant="secondary"
            size="sm"
            className="gap-2 text-[10px] font-bold uppercase tracking-wider"
            disabled={uploadingKey === "OUTROS"}
            onClick={() => triggerUpload("OUTROS")}
          >
            <Plus size={14} /> Adicionar
          </Button>
        </div>
        {otherDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {otherDocs.map((doc: any) => (
              <div key={doc.id} className="p-4 bg-brand-surface/30 border border-brand-border rounded-lg flex items-center justify-between group hover:border-brand-accent/50 transition-all">
                <div>
                  <p className="text-[11px] font-black text-white uppercase tracking-tight">{doc.category}</p>
                  <p className="text-[10px] text-brand-text-muted font-bold">{doc.name} • {doc.size}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDownload(doc.id, doc.name)}>
                    <Download size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-brand-danger hover:bg-brand-danger/10"
                    disabled={deletingId === doc.id}
                    onClick={() => handleDelete(doc.id, doc.name)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-brand-input/30 border border-dashed border-brand-border rounded-xl text-center">
            <p className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest">
              Nenhum documento adicional.
            </p>
          </div>
        )}
      </div>

      {/* Compliance Checklist */}
      <Card className="bg-brand-accent/5 border-brand-accent/20 p-4">
        <h4 className="text-[10px] font-black text-brand-accent uppercase tracking-widest mb-3">Checklist de Conformidade</h4>
        <div className="grid grid-cols-2 gap-3">
          {REQUIRED_DOC_TYPES.map((item) => {
            const isUploaded = (customer.documents || []).some((d: any) => d.category === item.key);
            return (
              <div key={item.key} className="flex items-center gap-2 text-[10px] font-bold text-white/80">
                <div className={cn(
                  "w-4 h-4 rounded flex items-center justify-center border flex-shrink-0",
                  isUploaded ? "bg-brand-success border-brand-success text-black" : "border-brand-border"
                )}>
                  {isUploaded && <ShieldCheck size={10} />}
                </div>
                {item.label}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

interface CustomerProfileProps {
  customer: any;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export function CustomerProfile({ customer, isOpen, onClose, onRefresh }: CustomerProfileProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "docs">("overview");
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);


  if (!customer) return null;

  const handleDownload = async (docId: string, fileName: string) => {
    try {
      const loadToast = toast.loading("Preparando download...");
      const res = await getDocumentContent(docId);
      toast.dismiss(loadToast);
      
      if (!res?.base64Data) {
        toast.error("Conteúdo do arquivo não encontrado.");
        return;
      }

      // Converte Base64 para Blob para um download mais robusto
      const parts = res.base64Data.split(';base64,');
      const contentType = parts[0].split(':')[1];
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);

      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }

      const blob = new Blob([uInt8Array], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Limpeza
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success("Download iniciado!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao realizar download.");
    }
  };


  return (
    <Dialog 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Perfil do Cliente: ${customer.name}`}
      className="max-w-4xl"
    >
      <div className="flex flex-col gap-6">
        {/* Header Profile Info */}
        <div className="flex items-start gap-6 p-6 bg-brand-accent/5 border border-brand-accent/20 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            {customer.type === "B2B" ? <Building2 size={120} /> : <User size={120} />}
          </div>
          
          <div className="w-24 h-24 bg-brand-input rounded-2xl border-2 border-brand-accent flex items-center justify-center text-brand-accent font-black text-3xl shadow-[0_0_20px_rgba(245,196,0,0.2)]">
            {customer.name.charAt(0)}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">{customer.name}</h2>
              <span className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest",
                customer.badge === "VIP" ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" : 
                customer.badge === "PLATINUM" ? "bg-slate-300/20 text-slate-300 border-slate-300/30" :
                "bg-brand-success/20 text-brand-success border-brand-success/30"
              )}>
                {customer.badge || "STANDARD"}
              </span>
              <span className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest opacity-60",
                customer.type === "B2B" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-brand-success/20 text-brand-success border-brand-success/30"
              )}>
                {customer.type}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-brand-text-muted">
              <div className="flex items-center gap-2 text-xs font-bold">
                <FileText size={14} className="text-brand-accent" /> {customer.document}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <MapPin size={14} className="text-brand-accent" /> {customer.city || "S/C"} - {customer.state}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <Mail size={14} className="text-brand-accent" /> {customer.email || "Não informado"}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <Phone size={14} className="text-brand-accent" /> {customer.phone}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-2 border-b border-brand-border">
          {[
            { id: "overview", label: "Visão Geral", icon: TrendingUp },
            { id: "orders", label: "Pedidos & Compras", icon: ShoppingBag },
            { id: "docs", label: "Documentação & CR", icon: ShieldCheck },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-6 py-3 text-[11px] font-black uppercase tracking-[0.15em] flex items-center gap-2 transition-all border-b-2",
                activeTab === tab.id 
                  ? "border-brand-accent text-brand-accent bg-brand-accent/5" 
                  : "border-transparent text-brand-text-muted hover:text-white"
              )}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <Card className="bg-brand-surface/40 border-brand-border p-6 space-y-4">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <CreditCard size={14} className="text-brand-accent" /> Resumo Financeiro
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-brand-border/50">
                    <span className="text-[10px] font-bold text-brand-text-muted uppercase">Total Gasto (LTV)</span>
                    <span className="text-lg font-mono font-black text-brand-accent">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(customer.totalSpent)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-brand-border/50">
                    <span className="text-[10px] font-bold text-brand-text-muted uppercase">Ticket Médio</span>
                    <span className="text-sm font-mono font-bold text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(customer.totalSpent / Math.max(1, customer.ordersCount || 1))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[10px] font-bold text-brand-text-muted uppercase">Status Financeiro</span>
                    <span className="text-[10px] font-black px-2 py-1 bg-brand-success/20 text-brand-success rounded border border-brand-success/30 uppercase">REGULAR</span>
                  </div>
                </div>
              </Card>

              <Card className="bg-brand-surface/40 border-brand-border p-6 space-y-4 flex flex-col">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Clock size={14} className="text-brand-accent" /> Atividade Recente
                </h3>
                <div className="space-y-4 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                   {customer.ordersCount > 0 && (
                     <div className="flex gap-4">
                        <div className="w-1 h-12 bg-brand-accent rounded-full" />
                        <div>
                           <p className="text-[11px] font-black text-white uppercase">Pedido Finalizado</p>
                           <p className="text-[10px] text-brand-text-muted font-bold">{customer.lastOrder}</p>
                        </div>
                     </div>
                   )}
                   
                   {customer.documents && customer.documents.map((doc: any) => (
                     <div key={doc.id} className="flex gap-4">
                        <div className="w-1 h-12 bg-blue-500 rounded-full" />
                        <div>
                           <p className="text-[11px] font-black text-white uppercase">Documento Enviado</p>
                           <p className="text-[10px] text-brand-text-muted font-bold">{doc.category}: {doc.name}</p>
                        </div>
                     </div>
                   ))}

                   <div className="flex gap-4 opacity-70">
                      <div className="w-1 h-12 bg-brand-border rounded-full" />
                      <div>
                         <p className="text-[11px] font-black text-white uppercase">Cliente Cadastrado</p>
                         <p className="text-[10px] text-brand-text-muted font-bold">Base de Dados Eleven</p>
                      </div>
                   </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-3 animate-fade-in max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
               {customer.salesOrders && customer.salesOrders.length > 0 ? (
                 customer.salesOrders.map((order: any) => (
                    <div key={order.id} className="p-4 bg-brand-surface/40 border border-brand-border rounded-lg flex justify-between items-center group hover:border-brand-accent/50 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="p-2 bg-brand-accent/10 rounded border border-brand-accent/20 text-brand-accent">
                             <ShoppingBag size={16} />
                          </div>
                          <div>
                             <p className="text-[11px] font-black text-white uppercase tracking-tight">PEDIDO #{order.orderNumber}</p>
                             <p className="text-[10px] text-brand-text-muted font-bold uppercase">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-mono font-black text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalValue)}
                          </p>
                          <span className="text-[9px] font-black px-1.5 py-0.5 bg-brand-success/10 text-brand-success rounded border border-brand-success/20 uppercase">
                            {order.status}
                          </span>
                       </div>
                    </div>
                 ))
               ) : (
                  <div className="bg-brand-input/50 border border-brand-border p-8 rounded-xl text-center">
                    <ShoppingBag size={48} className="mx-auto text-brand-text-muted mb-4 opacity-20" />
                    <p className="text-[11px] font-black text-brand-text-muted uppercase tracking-widest">
                      Nenhum pedido registrado para este cliente.
                    </p>
                  </div>
               )}
            </div>
          )}

          {activeTab === "docs" && (
            <DocsTab
              customer={customer}
              onRefresh={onRefresh}
              handleDownload={handleDownload}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-brand-border">
          <Button 
            className="gap-2 text-[10px] font-bold tracking-widest uppercase bg-brand-accent text-black"
            onClick={() => setIsSaleModalOpen(true)}
          >
            <Plus size={16} /> LANÇAR VENDA
          </Button>
          <Button 
            variant="secondary" 
            className="gap-2 text-[10px] font-bold tracking-widest uppercase"
            onClick={() => router.push("/admin/erp/produtos")}
          >
            <ExternalLink size={16} /> ABRIR NO ERP
          </Button>
          <Button onClick={onClose} className="text-[10px] font-bold tracking-widest uppercase">
            FECHAR PERFIL
          </Button>
        </div>
      </div>

      <SaleModal 
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        customer={customer}
        onSuccess={() => {
          if (onRefresh) onRefresh();
          setActiveTab("orders");
        }}
      />
    </Dialog>

  );
}
