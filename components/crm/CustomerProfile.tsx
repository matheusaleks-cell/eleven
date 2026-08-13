"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  User, Building2, Mail, Phone, MapPin, ShoppingBag,
  Clock, FileText, Download, ExternalLink, ShieldCheck,
  TrendingUp, CreditCard, Calendar, Plus, Printer,
  FileText as FileIcon, Trash2, Upload, AlertTriangle, Edit2, Save, Search,
  Pencil, Layers, Package, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadCustomerDocument, getDocumentContent, deleteCustomerDocument, updateCustomer } from "@/app/admin/crm/clientes/actions";
import { updateSalesOrder, deleteSalesOrder } from "@/app/admin/crm/vendas/actions";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { SaleModal } from "./SaleModal";
import { maskCPF, maskCNPJ, maskPhone } from "@/lib/masks";



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
  const [isEditing, setIsEditing] = useState(false);

  // Edição de pedido (vendas)
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editPayment, setEditPayment] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editTotal, setEditTotal] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(false);

  const openEditOrder = (order: any) => {
    setEditingOrder(order);
    setEditStatus(order.status);
    setEditPayment(order.paymentMethod || "PIX");
    setEditNotes(order.notes || "");
    setEditTotal(String(order.totalValue || ""));
    setConfirmDelete(false);
  };

  const closeEditOrder = () => {
    setEditingOrder(null);
    setConfirmDelete(false);
  };

  const handleSaveEditOrder = async () => {
    if (!editingOrder) return;
    setSavingEdit(true);
    const res = await updateSalesOrder(editingOrder.id, {
      status: editStatus,
      paymentMethod: editPayment,
      notes: editNotes,
      totalValue: parseFloat(editTotal) || editingOrder.totalValue,
    });
    setSavingEdit(false);
    if (res.success) {
      toast.success("Pedido atualizado com sucesso.");
      closeEditOrder();
      if (onRefresh) onRefresh();
    } else {
      toast.error(res.error || "Erro ao atualizar pedido.");
    }
  };

  const handleDeleteOrder = async () => {
    if (!editingOrder) return;
    setDeletingOrder(true);
    const res = await deleteSalesOrder(editingOrder.id);
    setDeletingOrder(false);
    if (res.success) {
      toast.success("Pedido excluído e estoque restaurado.");
      closeEditOrder();
      if (onRefresh) onRefresh();
    } else {
      toast.error(res.error || "Erro ao excluir pedido.");
    }
  };
  const [editForm, setEditForm] = useState<any>({
    name: "", 
    type: "B2C", 
    document: "", 
    email: "", 
    phone: "", 
    state: "", 
    city: "", 
    address: "", 
    crNumber: "", 
    category: "", 
    rg: "", 
    birthDate: "", 
    source: "", 
    notes: "",
    fantasyName: "",
    stateRegistration: "",
    responsibleName: "",
    storeEmail: "",
    cep: "",
    addressNumber: "",
    addressComplement: "",
    neighborhood: "",
    crValidityDate: ""
  });

  const startEditing = () => {
    setEditForm({
      name: customer.name || "",
      type: customer.type || "B2C",
      document: customer.document || "",
      email: customer.email || "",
      phone: customer.phone || "",
      state: customer.state || "",
      city: customer.city || "",
      address: customer.address || "",
      crNumber: customer.crNumber || "",
      category: customer.category || (customer.type === "B2B" ? "LOJA DE ARMAS" : "CAC"),
      rg: customer.rg || "",
      birthDate: customer.birthDate ? new Date(customer.birthDate).toISOString().split('T')[0] : "",
      source: customer.source || "",
      notes: customer.notes || "",
      fantasyName: customer.fantasyName || "",
      stateRegistration: customer.stateRegistration || "",
      responsibleName: customer.responsibleName || "",
      storeEmail: customer.storeEmail || "",
      cep: customer.cep || "",
      addressNumber: customer.addressNumber || "",
      addressComplement: customer.addressComplement || "",
      neighborhood: customer.neighborhood || "",
      crValidityDate: customer.crValidityDate ? new Date(customer.crValidityDate).toISOString().split('T')[0] : ""
    });
    setIsEditing(true);
  };

  const handleCNPJLookup = async (cnpj: string) => {
    const cleanCNPJ = cnpj.replace(/\D/g, "");
    if (cleanCNPJ.length !== 14) {
      toast.error("CNPJ inválido para busca.");
      return;
    }

    toast.loading("Buscando dados do CNPJ...", { id: "cnpj-lookup" });
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
      if (!response.ok) throw new Error("CNPJ não encontrado.");
      const data = await response.json();
      
      setEditForm((prev: any) => ({
        ...prev,
        name: data.razao_social,
        fantasyName: data.nome_fantasia || data.razao_social,
        cep: data.cep,
        address: data.logradouro,
        addressNumber: data.numero,
        addressComplement: data.complemento,
        neighborhood: data.bairro,
        city: data.municipio,
        state: data.uf,
        email: data.email || prev.email,
        phone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.slice(0,2)}) ${data.ddd_telefone_1.slice(2)}` : prev.phone
      }));
      toast.success("Dados preenchidos com sucesso!", { id: "cnpj-lookup" });
    } catch (error) {
      toast.error("Erro ao buscar CNPJ. Verifique o número ou preencha manualmente.", { id: "cnpj-lookup" });
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm.name || !editForm.document || !editForm.phone || !editForm.state) {
      toast.error("Por favor, preencha todos os campos obrigatórios (Nome, Documento, Telefone e UF).");
      return;
    }

    toast.loading("Salvando alterações...", { id: "save-customer" });
    try {
      const res = await updateCustomer(customer.id, editForm);
      if (res.success) {
        toast.success("Cadastro atualizado com sucesso!", { id: "save-customer" });
        setIsEditing(false);
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.error || "Erro ao salvar alterações.", { id: "save-customer" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar alterações no servidor.", { id: "save-customer" });
    }
  };


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

  const renderDetailRow = (label: string, value: React.ReactNode, icon?: React.ReactNode) => (
    <div className="flex justify-between items-center py-2.5 border-b border-brand-border/30 text-[11px]">
      <span className="font-bold text-brand-text-muted uppercase tracking-wider flex items-center gap-1.5">
        {icon} {label}
      </span>
      <span className="font-bold text-white uppercase text-right max-w-[65%] truncate" title={typeof value === 'string' ? value : undefined}>
        {value || "—"}
      </span>
    </div>
  );

  const getCrStatus = (validityDateStr: string | null | undefined) => {
    if (!validityDateStr) return { label: "NÃO INFORMADA", colorClass: "text-brand-text-muted bg-brand-input/40 border-brand-border/40" };
    try {
      const validityDate = new Date(validityDateStr);
      if (isNaN(validityDate.getTime())) {
        return { label: "NÃO INFORMADA", colorClass: "text-brand-text-muted bg-brand-input/40 border-brand-border/40" };
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      validityDate.setHours(0, 0, 0, 0);

      const diffTime = validityDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return { label: "VENCIDO / EXPIRADO", colorClass: "text-brand-danger bg-brand-danger/10 border-brand-danger/20 animate-pulse font-black" };
      } else if (diffDays <= 30) {
        return { label: `PRESTES A VENCER (${diffDays} DIAS)`, colorClass: "text-brand-warning bg-brand-warning/10 border-brand-warning/20 font-black" };
      } else {
        return { label: "ATIVO / VÁLIDO", colorClass: "text-brand-success bg-brand-success/10 border-brand-success/20" };
      }
    } catch {
      return { label: "ERRO DE ANÁLISE", colorClass: "text-brand-danger bg-brand-danger/10 border-brand-danger/20" };
    }
  };


  return (
    <Dialog 
      isOpen={isOpen} 
      onClose={() => {
        if (isEditing) {
          if (confirm("Deseja descartar as alterações?")) {
            setIsEditing(false);
          }
        } else {
          onClose();
        }
      }} 
      title={isEditing ? `Editar Cadastro: ${customer.name}` : `Perfil do Cliente: ${customer.name}`}
      className="max-w-5xl"
    >
      {isEditing ? (
        <div className="space-y-8 max-h-[75vh] overflow-y-auto pr-4 custom-scrollbar">
          {/* Toggle B2B/B2C */}
          <div className="flex justify-center p-1 bg-brand-input rounded-xl border border-brand-border w-fit mx-auto mb-6">
             <button
               type="button"
               className={cn(
                 "px-8 py-2.5 rounded-lg text-sm font-black transition-all",
                 editForm.type === "B2B" ? "bg-brand-accent text-black shadow-lg" : "text-brand-text-muted hover:text-white"
               )}
               onClick={() => setEditForm({...editForm, type: "B2B", category: "LOJA DE ARMAS"})}
             >
               B2B (LOJA / CLUBE)
             </button>
             <button
               type="button"
               className={cn(
                 "px-8 py-2.5 rounded-lg text-sm font-black transition-all",
                 editForm.type === "B2C" ? "bg-brand-accent text-black shadow-lg" : "text-brand-text-muted hover:text-white"
               )}
               onClick={() => setEditForm({...editForm, type: "B2C", category: "CAC"})}
             >
               B2C (PESSOA FÍSICA)
             </button>
          </div>

          {/* Seção 1: Dados Pessoais / Institucionais */}
          <div className="space-y-6">
             <h3 className="text-sm font-black text-brand-accent uppercase tracking-widest flex items-center gap-2">
                <User size={16} /> {editForm.type === "B2B" ? "DADOS INSTITUCIONAIS / RAZÃO SOCIAL" : "DADOS PESSOAIS / IDENTIFICAÇÃO"}
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 md:col-span-3">
                    <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">
                      {editForm.type === "B2B" ? "Razão Social *" : "Nome Completo *"}
                    </label>
                    <Input 
                      className="h-12 text-base"
                      placeholder={editForm.type === "B2B" ? "Ex: Clube de Tiro Eleven LTDA" : "Ex: João Silva"} 
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    />
                </div>
                
                {editForm.type === "B2B" ? (
                  <>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Nome Fantasia *</label>
                        <Input 
                          className="h-12 text-base"
                          placeholder="Como o clube é conhecido" 
                          value={editForm.fantasyName}
                          onChange={(e) => setEditForm({...editForm, fantasyName: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Inscrição Estadual (IE)</label>
                        <Input 
                          className="h-12 text-base"
                          placeholder="ISENTO ou número" 
                          value={editForm.stateRegistration}
                          onChange={(e) => setEditForm({...editForm, stateRegistration: e.target.value})}
                        />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">RG</label>
                        <Input 
                          className="h-12 text-base"
                          placeholder="0.000.000-0" 
                          value={editForm.rg}
                          onChange={(e) => setEditForm({...editForm, rg: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Data de Nascimento</label>
                        <Input 
                          className="h-12 text-base"
                          type="date"
                          value={editForm.birthDate}
                          onChange={(e) => setEditForm({...editForm, birthDate: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">CPF *</label>
                        <Input 
                          className="h-12 text-base"
                          placeholder="000.000.000-00" 
                          value={editForm.document}
                          onChange={(e) => setEditForm({...editForm, document: maskCPF(e.target.value)})}
                        />
                    </div>
                  </>
                )}

                {editForm.type === "B2B" && (
                  <div className="space-y-2">
                     <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">CNPJ *</label>
                     <div className="flex gap-2">
                        <Input 
                          className="h-12 text-base"
                          placeholder="00.000.000/0000-00" 
                          value={editForm.document}
                          onChange={(e) => setEditForm({...editForm, document: maskCNPJ(e.target.value)})}
                        />
                        <Button 
                          type="button"
                          variant="secondary" 
                          className="h-12 px-4 shrink-0"
                          onClick={() => handleCNPJLookup(editForm.document)}
                          title="Buscar dados via CNPJ"
                        >
                          <Search size={18} />
                        </Button>
                     </div>
                  </div>
                )}

                <div className="space-y-2">
                   <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Responsável Legal</label>
                   <Input 
                     className="h-12 text-base"
                     placeholder="Nome do Presidente/Dono" 
                     value={editForm.responsibleName}
                     onChange={(e) => setEditForm({...editForm, responsibleName: e.target.value})}
                   />
                </div>
             </div>
          </div>

          {/* Seção 2: Contato e Endereço */}
          <div className="space-y-6 pt-6 border-t border-brand-border/30">
             <h3 className="text-sm font-black text-brand-accent uppercase tracking-widest flex items-center gap-2">
                <MapPin size={16} /> CONTATO E LOCALIZAÇÃO
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">E-mail</label>
                   <Input 
                     className="h-12 text-base"
                     placeholder="cliente@email.com" 
                     value={editForm.email}
                     onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Telefone *</label>
                   <Input 
                     className="h-12 text-base"
                     placeholder="(00) 00000-0000" 
                     value={editForm.phone}
                     onChange={(e) => setEditForm({...editForm, phone: maskPhone(e.target.value)})}
                   />
                </div>
                {editForm.type === "B2B" && (
                  <div className="space-y-2 md:col-span-2">
                     <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">E-mail da Loja (Secundário)</label>
                     <Input 
                       className="h-12 text-base"
                       placeholder="loja@dominio.com.br" 
                       value={editForm.storeEmail}
                       onChange={(e) => setEditForm({...editForm, storeEmail: e.target.value})}
                     />
                  </div>
                )}
                <div className="space-y-2 md:col-span-2">
                   <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">CEP</label>
                   <div className="flex gap-2">
                     <Input 
                       className="h-12 text-base max-w-[240px]"
                       placeholder="00000-000" 
                       value={editForm.cep}
                       onChange={async (e) => {
                         const val = e.target.value.replace(/\D/g, '');
                         const formattedCep = val.replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
                         setEditForm((prev: any) => ({ ...prev, cep: formattedCep }));
                         if (val.length === 8) {
                           try {
                             const res = await fetch(`https://viacep.com.br/ws/${val}/json/`);
                             const data = await res.json();
                             if (!data.erro) {
                               setEditForm((prev: any) => ({
                                 ...prev,
                                 address: data.logradouro || prev.address,
                                 neighborhood: data.bairro || prev.neighborhood,
                                 city: data.localidade || prev.city,
                                 state: data.uf || prev.state
                               }));
                             }
                           } catch (err) {}
                         }
                       }}
                     />
                   </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                   <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Logradouro / Rua</label>
                   <Input 
                     className="h-12 text-base"
                     placeholder="Ex: Avenida Paulista" 
                     value={editForm.address}
                     onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Número</label>
                   <Input 
                     className="h-12 text-base"
                     placeholder="Ex: 1000" 
                     value={editForm.addressNumber}
                     onChange={(e) => setEditForm({...editForm, addressNumber: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Complemento</label>
                   <Input 
                     className="h-12 text-base"
                     placeholder="Ex: Sala 42" 
                     value={editForm.addressComplement}
                     onChange={(e) => setEditForm({...editForm, addressComplement: e.target.value})}
                   />
                </div>
                <div className="space-y-2 md:col-span-2">
                   <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Bairro</label>
                   <Input 
                     className="h-12 text-base"
                     placeholder="Ex: Bela Vista" 
                     value={editForm.neighborhood}
                     onChange={(e) => setEditForm({...editForm, neighborhood: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Cidade</label>
                   <Input 
                     className="h-12 text-base"
                     placeholder="Ex: São Paulo" 
                     value={editForm.city}
                     onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Estado (UF) *</label>
                   <Input 
                     className="h-12 text-base"
                     placeholder="SP" 
                     value={editForm.state}
                     onChange={(e) => setEditForm({...editForm, state: e.target.value})}
                   />
                </div>
             </div>
          </div>

          {/* Seção 3: Conformidade Técnica */}
          <div className="space-y-6 pt-6 border-t border-brand-border/30">
             <h3 className="text-sm font-black text-brand-warning uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={16} /> CONFORMIDADE LEGAL (SIGMA/SINARM)
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Número do CR (Certificado de Registro)</label>
                   <Input 
                     className="h-12 text-base"
                     placeholder="Ex: 123456" 
                     value={editForm.crNumber}
                     onChange={(e) => setEditForm({...editForm, crNumber: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Validade do CR</label>
                   <Input 
                     className="h-12 text-base"
                     type="date"
                     value={editForm.crValidityDate}
                     onChange={(e) => setEditForm({...editForm, crValidityDate: e.target.value})}
                   />
                </div>
                <div className="space-y-2 md:col-span-2">
                   <label className="text-[11px] font-bold uppercase text-brand-text-muted tracking-widest">Categoria do Cliente</label>
                   <select 
                     className="w-full bg-brand-input border border-brand-border rounded-military px-4 py-3 text-base text-white outline-none focus:border-brand-accent transition-all"
                     value={editForm.category}
                     onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                     style={{ background: "#0F0F0F" }}
                   >
                      {editForm.type === "B2B" ? (
                         <>
                            <option value="LOJA DE ARMAS">LOJA DE ARMAS</option>
                            <option value="CLUBE DE TIRO">CLUBE DE TIRO</option>
                            <option value="INSTRUTOR">INSTRUTOR (PJ)</option>
                            <option value="OUTROS">OUTROS (PJ)</option>
                         </>
                      ) : (
                         <>
                            <option value="CAC">CAC (COLECIONADOR, ATIRADOR, CAÇADOR)</option>
                            <option value="POLICIAL">POLICIAL (FEDERAL/ESTADUAL)</option>
                            <option value="GM">GM (GUARDA MUNICIPAL)</option>
                            <option value="MILITAR">MILITAR (FORÇAS ARMADAS)</option>
                            <option value="CIVIL">CIVIL COM POSSE</option>
                            <option value="MAGISTRADO">MAGISTRADO / PROMOTOR</option>
                         </>
                      )}
                   </select>
                </div>
             </div>
          </div>

          {/* Seção 4: Inteligência Comercial */}
          <div className="space-y-4 pt-4 border-t border-brand-border/30">
             <h3 className="text-xs font-black text-brand-text-muted uppercase tracking-widest flex items-center gap-2">
                <ShoppingBag size={14} /> INTELIGÊNCIA COMERCIAL
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase text-brand-text-muted">Origem do Lead</label>
                   <Input 
                     placeholder="Ex: Instagram, Indicação..." 
                     value={editForm.source}
                     onChange={(e) => setEditForm({...editForm, source: e.target.value})}
                   />
                </div>
                <div className="space-y-2 col-span-2">
                   <label className="text-[10px] font-bold uppercase text-brand-text-muted">Observações Internas</label>
                   <textarea 
                     className="w-full bg-brand-input border border-brand-border rounded-military px-4 py-2 text-sm text-white outline-none focus:border-brand-accent min-h-[80px]"
                     placeholder="Preferências, histórico de contato, perfil de interesse..."
                     value={editForm.notes}
                     onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                     style={{ background: "#0F0F0F" }}
                   />
                </div>
             </div>
          </div>

          {/* Footer para salvar/cancelar edição */}
          <div className="flex justify-end gap-3 pt-6 border-t border-brand-border">
             <Button variant="secondary" onClick={() => setIsEditing(false)} className="text-[10px] font-bold tracking-widest uppercase">
                CANCELAR
             </Button>
             <Button onClick={handleSaveEdit} className="gap-2 text-[10px] font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(245,196,0,0.15)] bg-brand-accent text-black">
                <Save size={16} /> SALVAR ALTERAÇÕES
             </Button>
          </div>
        </div>
      ) : (
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
              <div className="space-y-6 animate-fade-in">
                {/* Primeira linha: Financeiro e Atividade */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                               <p className="text-[11px] font-black text-white uppercase">Última Compra</p>
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

                {/* Segunda linha: Dados Cadastrais e Endereço */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-brand-surface/40 border-brand-border p-6 space-y-4">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                      {customer.type === "B2B" ? <Building2 size={14} className="text-brand-accent" /> : <User size={14} className="text-brand-accent" />}
                      Dados do Cadastro
                    </h3>
                    <div className="space-y-1">
                      {customer.type === "B2B" ? (
                        <>
                          {renderDetailRow("Razão Social", customer.name)}
                          {renderDetailRow("Nome Fantasia", customer.fantasyName)}
                          {renderDetailRow("CNPJ", customer.document)}
                          {renderDetailRow("Inscrição Estadual", customer.stateRegistration || "ISENTO")}
                          {renderDetailRow("Responsável Técnico", customer.responsibleName)}
                          {renderDetailRow("E-mail Comercial", customer.storeEmail)}
                        </>
                      ) : (
                        <>
                          {renderDetailRow("Nome Completo", customer.name)}
                          {renderDetailRow("CPF", customer.document)}
                          {renderDetailRow("RG", customer.rg)}
                          {renderDetailRow("Data de Nascimento", customer.birthDate ? new Date(customer.birthDate).toLocaleDateString('pt-BR') : "Não informada", <Calendar size={12} />)}
                          {renderDetailRow("Categoria", customer.category)}
                          {renderDetailRow("Origem Lead", customer.source)}
                        </>
                      )}
                    </div>
                  </Card>

                  <Card className="bg-brand-surface/40 border-brand-border p-6 space-y-4">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={14} className="text-brand-accent" /> Endereço de Cadastro
                    </h3>
                    <div className="space-y-1">
                      {renderDetailRow("CEP", customer.cep)}
                      {renderDetailRow("Logradouro", customer.address)}
                      {renderDetailRow("Número", customer.addressNumber)}
                      {renderDetailRow("Complemento", customer.addressComplement)}
                      {renderDetailRow("Bairro", customer.neighborhood)}
                      {renderDetailRow("Cidade / UF", (customer.city || customer.state) ? `${customer.city || "Não informada"} - ${customer.state || ""}` : "Não informada")}
                    </div>
                  </Card>
                </div>

                {/* Terceira linha: Certificado de Registro (CR) e Observações */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-brand-surface/40 border-brand-border p-6 space-y-4">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck size={14} className="text-brand-accent" /> Certificado de Registro (CR)
                    </h3>
                    <div className="space-y-1">
                      {renderDetailRow("Número do CR", customer.crNumber || "Não cadastrado")}
                      {renderDetailRow("Data de Validade", customer.crValidityDate ? new Date(customer.crValidityDate).toLocaleDateString('pt-BR') : "Não cadastrada", <Calendar size={12} />)}
                      {customer.crNumber && (
                        <div className="flex justify-between items-center py-2.5 text-[11px]">
                          <span className="font-bold text-brand-text-muted uppercase tracking-wider flex items-center gap-1.5">
                            <AlertTriangle size={12} className="text-brand-accent" /> Status do CR
                          </span>
                          <span className={cn(
                            "text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider",
                            getCrStatus(customer.crValidityDate).colorClass
                          )}>
                            {getCrStatus(customer.crValidityDate).label}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="bg-brand-surface/40 border-brand-border p-6 space-y-4 flex flex-col">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <FileText size={14} className="text-brand-accent" /> Observações Internas
                    </h3>
                    <div className="flex-1 p-3 bg-brand-input/30 border border-brand-border/60 rounded-military min-h-[100px] text-xs font-medium text-brand-text-secondary leading-relaxed overflow-y-auto max-h-[150px] whitespace-pre-wrap">
                      {customer.notes ? customer.notes : (
                        <span className="italic text-brand-text-muted font-bold">Nenhuma observação interna registrada.</span>
                      )}
                    </div>
                  </Card>
                </div>
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
                         <div className="flex items-center gap-4">
                            <div className="text-right">
                               <p className="text-sm font-mono font-black text-white">
                                 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalValue)}
                               </p>
                               <span className={cn(
                                 "text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider",
                                 order.status === "PAGO" ? "bg-brand-success/10 text-brand-success border-brand-success/20" :
                                 order.status === "PENDENTE" ? "bg-brand-warning/10 text-brand-warning border-brand-warning/20" :
                                 "bg-brand-text-muted/10 text-brand-text-muted border-brand-text-muted/20"
                               )}>
                                 {order.status}
                               </span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-8 h-8 rounded p-0 hover:bg-brand-accent/10 text-brand-text-muted hover:text-brand-accent border border-transparent hover:border-brand-accent/20 transition-all"
                              onClick={() => openEditOrder(order)}
                              title="Editar Pedido"
                            >
                              <Pencil size={14} />
                            </Button>
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
              onClick={startEditing}
            >
              <Edit2 size={16} /> EDITAR CADASTRO
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
      )}

      <SaleModal 
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        customer={customer}
        onSuccess={() => {
          if (onRefresh) onRefresh();
          setActiveTab("orders");
        }}
      />

      {/* Edit Order Modal */}
      {editingOrder && (() => {
        const products = (() => {
          try { return JSON.parse(editingOrder.products || "[]"); } catch { return []; }
        })();
        const fmtBRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
        
        const getLotInfoLocal = (order: any) => {
          const weapons: any[] = order.weapons || [];
          if (weapons.length === 0) return null;
          const investorWeapons = weapons.filter((w: any) => w.importLot?.investmentProjectId);
          const ownWeapons = weapons.filter((w: any) => !w.importLot?.investmentProjectId);
          if (investorWeapons.length > 0 && ownWeapons.length === 0) {
            const project = investorWeapons[0].importLot?.investmentProject;
            return { type: "INVESTIDOR", label: `${project?.investor?.name ?? "Investidor"} — ${project?.name ?? ""}` };
          }
          if (ownWeapons.length > 0 && investorWeapons.length === 0) {
            return { type: "PROPRIO", label: "Lote Próprio" };
          }
          const project = investorWeapons[0]?.importLot?.investmentProject;
          return { type: "MISTO", label: `Misto — Inv: ${investorWeapons.length} / Próprio: ${ownWeapons.length}${project ? ` (${project.investor?.name})` : ""}` };
        };

        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeEditOrder} />
            <div
              className="relative w-full animate-fade-in flex flex-col"
              style={{
                maxWidth: 580,
                maxHeight: "90vh",
                background: "#1A1A1A",
                border: "1px solid #333",
                borderTop: "3px solid #F5C400",
                borderRadius: 4,
                boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border shrink-0">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest font-rajdhani">DETALHES DO PEDIDO</h3>
                  <p className="text-[10px] text-brand-text-muted mt-0.5 font-mono">
                    {editingOrder.orderNumber} · {new Date(editingOrder.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <button onClick={closeEditOrder} className="text-brand-text-muted hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Info do pedido */}
                <div className="px-5 pt-4 pb-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FileText size={11} className="text-brand-accent" />
                    <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest">Informações do Pedido</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 p-3 bg-brand-surface/30 rounded border border-brand-border">
                    <div>
                      <p className="text-[8px] font-bold text-brand-text-muted uppercase tracking-widest mb-0.5">Cliente</p>
                      <p className="text-xs font-bold text-white uppercase truncate">{customer.name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-brand-text-muted uppercase tracking-widest mb-0.5">Documento</p>
                      <p className="text-xs font-mono text-white">{customer.document || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-brand-text-muted uppercase tracking-widest mb-0.5">Tipo</p>
                      <p className="text-xs font-bold text-brand-text-secondary uppercase">{customer.type || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Produtos */}
                {products.length > 0 && (
                  <div className="px-5 pb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Package size={11} className="text-brand-accent" />
                      <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest">Itens do Pedido</span>
                    </div>
                    <div className="border border-brand-border rounded overflow-hidden">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-brand-surface/50">
                            <th className="px-3 py-2 text-[8px] font-black text-brand-text-muted uppercase tracking-widest">Produto</th>
                            <th className="px-3 py-2 text-[8px] font-black text-brand-text-muted uppercase tracking-widest text-center">Qtd</th>
                            <th className="px-3 py-2 text-[8px] font-black text-brand-text-muted uppercase tracking-widest text-right">Unit.</th>
                            <th className="px-3 py-2 text-[8px] font-black text-brand-text-muted uppercase tracking-widest text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/30">
                          {products.map((item: any, i: number) => (
                            <tr key={i} className="hover:bg-brand-surface/20">
                              <td className="px-3 py-2">
                                <p className="text-[11px] font-bold text-white uppercase">{item.name}</p>
                                <p className="text-[9px] font-mono text-brand-text-muted">{item.sku}</p>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className="text-xs font-bold text-white">{item.quantity}</span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <span className="text-xs font-mono text-brand-text-secondary">{fmtBRL(item.price)}</span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <span className="text-xs font-mono font-black text-brand-accent">{fmtBRL(item.price * item.quantity)}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Origem do Lote */}
                {(() => {
                  const lotInfo = getLotInfoLocal(editingOrder);
                  if (!lotInfo) return null;
                  const colorMap: Record<string, string> = {
                    INVESTIDOR: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                    PROPRIO: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                    MISTO: "bg-brand-surface/30 text-brand-text-muted border-brand-border",
                  };
                  return (
                    <div className="px-5 pb-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Layers size={11} className="text-brand-accent" />
                        <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest">Origem do Lote</span>
                      </div>
                      <div className={cn("flex items-center gap-2 px-3 py-2 rounded border text-[10px] font-bold uppercase", colorMap[lotInfo.type])}>
                        {lotInfo.type === "INVESTIDOR" && <User size={11} />}
                        {lotInfo.type === "PROPRIO" && <Building2 size={11} />}
                        {lotInfo.type === "MISTO" && <Layers size={11} />}
                        {lotInfo.label}
                      </div>
                    </div>
                  );
                })()}

                {/* Campos editáveis */}
                <div className="px-5 pb-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CreditCard size={11} className="text-brand-accent" />
                    <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest">Editar Pedido</span>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest">Status</label>
                        <select
                          className="w-full bg-brand-input border border-brand-border rounded px-3 py-2 text-sm text-white outline-none focus:border-brand-accent"
                          value={editStatus}
                          onChange={e => setEditStatus(e.target.value)}
                          style={{ background: "#1A1A1A" }}
                        >
                          <option value="PAGO">PAGO / FINALIZADO</option>
                          <option value="PENDENTE">PENDENTE</option>
                          <option value="RASCUNHO">RASCUNHO</option>
                          <option value="CANCELADO">CANCELADO</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest">Forma de Pagamento</label>
                        <select
                          className="w-full bg-brand-input border border-brand-border rounded px-3 py-2 text-sm text-white outline-none focus:border-brand-accent"
                          value={editPayment}
                          onChange={e => setEditPayment(e.target.value)}
                          style={{ background: "#1A1A1A" }}
                        >
                          <option value="PIX">PIX</option>
                          <option value="CARTÃO CRÉDITO">CARTÃO CRÉDITO</option>
                          <option value="BOLETO">BOLETO</option>
                          <option value="DINHEIRO">DINHEIRO</option>
                          <option value="TRANSFERÊNCIA">TRANSFERÊNCIA</option>
                          <option value="CHEQUE">CHEQUE</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest">Valor Total (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full bg-brand-input border border-brand-border rounded px-3 py-2 text-sm text-brand-accent font-mono font-black outline-none focus:border-brand-accent"
                        value={editTotal}
                        onChange={e => setEditTotal(e.target.value)}
                        style={{ background: "#1A1A1A" }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest">Observações</label>
                      <textarea
                        className="w-full bg-brand-input border border-brand-border rounded px-3 py-2 text-sm text-white outline-none focus:border-brand-accent"
                        rows={3}
                        style={{ resize: "none", background: "#1A1A1A" }}
                        value={editNotes}
                        onChange={e => setEditNotes(e.target.value)}
                        placeholder="Notas adicionais sobre o pedido..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-brand-border shrink-0">
                {confirmDelete ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-brand-danger/10 border border-brand-danger/30 rounded">
                      <AlertTriangle size={16} className="text-brand-danger shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-brand-danger uppercase">Confirmar Exclusão</p>
                        <p className="text-[10px] text-brand-text-muted mt-0.5">
                          O pedido será excluído e as armas vinculadas voltarão ao estoque. Esta ação não pode ser desfeita.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 py-2.5 rounded text-[10px] font-black uppercase tracking-widest border border-brand-border text-brand-text-muted hover:text-white transition-all bg-transparent"
                      >
                        Não, Voltar
                      </button>
                      <button
                        onClick={handleDeleteOrder}
                        disabled={deletingOrder}
                        className="flex-1 py-2.5 rounded text-[10px] font-black uppercase tracking-widest"
                        style={{ background: deletingOrder ? "#333" : "#dc2626", color: deletingOrder ? "#606060" : "#fff" }}
                      >
                        {deletingOrder ? "Excluindo..." : "Sim, Excluir Pedido"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded text-[10px] font-black uppercase tracking-widest border border-brand-danger/40 text-brand-danger hover:bg-brand-danger/10 transition-all bg-transparent"
                    >
                      <Trash2 size={13} /> Excluir
                    </button>
                    <button
                      onClick={closeEditOrder}
                      className="flex-1 py-2.5 rounded text-[10px] font-black uppercase tracking-widest border border-brand-border text-brand-text-muted hover:text-white transition-all bg-transparent"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveEditOrder}
                      disabled={savingEdit}
                      className="flex-[2] py-2.5 rounded text-[10px] font-black uppercase tracking-widest"
                      style={{ background: savingEdit ? "#333" : "#F5C400", color: savingEdit ? "#606060" : "#1A1A1A" }}
                    >
                      {savingEdit ? "Salvando..." : "★ Salvar Alterações"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </Dialog>

  );
}
