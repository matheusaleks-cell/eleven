"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { searchCustomersForLead } from "@/app/admin/crm/funil/actions";
import { Search, X, CheckCircle2, Building2, User } from "lucide-react";

const leadSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().min(8, "Telefone inválido"),
  interest: z.string().min(2, "Informe o interesse"),
  value: z.any(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.string(),
  source: z.string().min(1, "Informe a origem"),
  customerType: z.enum(["PF", "PJ", "CAC", "GOV"]),
  documentStatus: z.enum(["NONE", "PENDING", "ACTIVE"]),
  category: z.string().min(1, "Informe a categoria"),
  assignedTo: z.string().min(1, "Atribua um vendedor"),
  notes: z.string().optional(),
  taxId: z.string().min(11, "CPF/CNPJ inválido"),
  state: z.string().min(2, "Informe a UF"),
  city: z.string().min(2, "Informe a cidade"),
  crNumber: z.string().optional(),
  crValidity: z.string().optional(),
});

export type LeadFormData = {
  name: string;
  email?: string;
  phone: string;
  interest: string;
  value: number;
  priority: "low" | "medium" | "high";
  status: string;
  source: string;
  customerType: "PF" | "PJ" | "CAC" | "GOV";
  documentStatus: "NONE" | "PENDING" | "ACTIVE";
  category: string;
  assignedTo: string;
  notes?: string;
  taxId: string;
  state: string;
  city: string;
  crNumber?: string;
  crValidity?: string;
};

interface LeadFormProps {
  initialData?: Partial<LeadFormData>;
  products?: { id: string; commercialName: string }[];
  onSubmit: (data: LeadFormData) => void;
  onCancel: () => void;
  submitLabel?: string;
}


export function LeadForm({ initialData, products = [], onSubmit, onCancel, submitLabel = "Salvar Lead" }: LeadFormProps) {

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema) as any,
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      interest: initialData?.interest || "",
      value: initialData?.value || 0,
      priority: (initialData?.priority as any) || "medium",
      status: initialData?.status || "NOVO",
      source: initialData?.source || "INSTAGRAM",
      customerType: initialData?.customerType || "PF",
      documentStatus: initialData?.documentStatus || "NONE",
      category: initialData?.category || "ARMAS",
      assignedTo: initialData?.assignedTo || "ADMIN",
      notes: initialData?.notes || "",
      taxId: initialData?.taxId || "",
      state: initialData?.state || "",
      city: initialData?.city || "",
      crNumber: initialData?.crNumber || "",
      crValidity: initialData?.crValidity || "",
    },
  });

  const [customerSearch, setCustomerSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [linkedCustomer, setLinkedCustomer] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (customerSearch.length < 2) { setSearchResults([]); setShowDropdown(false); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const results = await searchCustomersForLead(customerSearch);
      setSearchResults(results);
      setShowDropdown(true);
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [customerSearch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectCustomer = (c: any) => {
    setLinkedCustomer(c);
    setCustomerSearch("");
    setShowDropdown(false);
    setValue("name", c.name);
    setValue("email", c.email || "");
    setValue("phone", c.phone || "");
    setValue("taxId", c.document || "");
    setValue("state", c.state || "");
    setValue("city", c.city || "");
    setValue("customerType", c.type === "B2B" ? "PJ" : "PF");
    if (c.crNumber) setValue("crNumber", c.crNumber);
  };

  return (
    <form onSubmit={handleSubmit((data) => {
      const cleanValue = typeof data.value === "string" 
        ? Number((data.value as string).replace(/\D/g, "")) / 100 
        : Number(data.value);
      onSubmit({ ...data, value: cleanValue });
    })} className="space-y-8 max-h-[70vh] overflow-y-auto px-2 custom-scrollbar">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Seção: Busca na Base de Clientes */}
        <div className="space-y-3 md:col-span-2">
          <h4 className="text-[14px] font-bold text-brand-accent uppercase tracking-[0.2em] border-b border-brand-accent/20 pb-3">
            Vincular a Cliente da Base (Opcional)
          </h4>
          {linkedCustomer ? (
            <div className="flex items-center justify-between p-4 bg-brand-success/10 border border-brand-success/30 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-brand-success shrink-0" />
                <div>
                  <p className="text-[12px] font-black text-white uppercase tracking-tight">{linkedCustomer.name}</p>
                  <p className="text-[10px] text-brand-text-muted font-bold">
                    {linkedCustomer.document} · {linkedCustomer.city && `${linkedCustomer.city} - `}{linkedCustomer.state}
                    {linkedCustomer.type === "B2B" ? " · LOJA / B2B" : " · PESSOA FÍSICA"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLinkedCustomer(null)}
                className="p-1 text-brand-text-muted hover:text-white transition-colors"
                title="Desvincular"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div ref={searchRef} className="relative">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  className="w-full bg-brand-input border border-brand-border rounded h-12 pl-11 pr-10 text-base text-white focus:outline-none focus:border-brand-accent placeholder:text-brand-text-muted/50"
                  style={{ background: "#0F0F0F" }}
                  placeholder="Buscar por nome ou CNPJ na base de clientes..."
                />
                {searching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-brand-surface border border-brand-border rounded-lg shadow-2xl overflow-hidden max-h-52 overflow-y-auto">
                  {searchResults.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCustomer(c)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-brand-accent/10 transition-colors text-left border-b border-brand-border/30 last:border-0"
                    >
                      <div className={`p-1.5 rounded ${c.type === "B2B" ? "bg-blue-500/20 text-blue-400" : "bg-brand-success/20 text-brand-success"}`}>
                        {c.type === "B2B" ? <Building2 size={13} /> : <User size={13} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-black text-white uppercase tracking-tight truncate">{c.name}</p>
                        <p className="text-[10px] text-brand-text-muted font-bold truncate">
                          {c.document} · {c.city && `${c.city} - `}{c.state}
                        </p>
                      </div>
                      <span className={`ml-auto text-[9px] font-black px-2 py-0.5 rounded border shrink-0 ${c.type === "B2B" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-brand-success/10 text-brand-success border-brand-success/20"}`}>
                        {c.type === "B2B" ? "LOJA" : "PF"}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {showDropdown && searchResults.length === 0 && customerSearch.length >= 2 && !searching && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-brand-surface border border-brand-border rounded-lg px-4 py-3 shadow-xl">
                  <p className="text-[11px] text-brand-text-muted font-bold uppercase text-center">
                    Nenhum cliente encontrado — preencha os dados manualmente abaixo.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Seção: Informações Básicas */}
        <div className="space-y-5 md:col-span-2">
          <h4 className="text-[14px] font-bold text-brand-accent uppercase tracking-[0.2em] border-b border-brand-accent/20 pb-3">Informações Básicas</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-[12px] font-bold text-brand-text-muted uppercase mb-2 block tracking-widest">Nome do Cliente</label>
              <Input {...register("name")} className="h-12 text-base px-4" placeholder="Ex: Ricardo Oliveira" />
              {errors.name && <p className="text-brand-danger text-[11px] mt-1.5 uppercase font-bold">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-[12px] font-bold text-brand-text-muted uppercase mb-2 block tracking-widest">E-mail</label>
              <Input {...register("email")} type="email" className="h-12 text-base px-4" placeholder="cliente@email.com" />
              {errors.email && <p className="text-brand-danger text-[11px] mt-1.5 uppercase font-bold">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-[12px] font-bold text-brand-text-muted uppercase mb-2 block tracking-widest">Telefone / WhatsApp</label>
              <Input {...register("phone")} className="h-12 text-base px-4" placeholder="(00) 00000-0000" />
              {errors.phone && <p className="text-brand-danger text-[11px] mt-1.5 uppercase font-bold">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="text-[12px] font-bold text-brand-text-muted uppercase mb-2 block tracking-widest">Origem do Lead</label>
              <select 
                {...register("source")}
                className="w-full bg-brand-input border border-brand-border rounded h-12 px-4 text-base text-white focus:outline-none focus:border-brand-accent appearance-none"
                style={{ background: "#0F0F0F" }}
              >
                <option value="INSTAGRAM">INSTAGRAM</option>
                <option value="YOUTUBE">YOUTUBE</option>
                <option value="SITE">SITE OFICIAL</option>
                <option value="INDICACAO">INDICAÇÃO</option>
                <option value="EVENTO">EVENTO / FEIRA</option>
                <option value="OUTROS">OUTROS</option>
              </select>
            </div>
          </div>
        </div>

        {/* Seção: Dados Fiscais e Localização */}
        <div className="space-y-5 md:col-span-2">
          <h4 className="text-[14px] font-bold text-brand-accent uppercase tracking-[0.2em] border-b border-brand-accent/20 pb-3">Dados Fiscais e Localização</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-1">
              <label className="text-[12px] font-bold text-brand-text-muted uppercase mb-2 block tracking-widest">CPF / CNPJ</label>
              <Input {...register("taxId")} className="h-12 text-base px-4 font-mono" placeholder="000.000.000-00" />
              {errors.taxId && <p className="text-brand-danger text-[11px] mt-1.5 uppercase font-bold">{errors.taxId.message}</p>}
            </div>
            <div>
              <label className="text-[12px] font-bold text-brand-text-muted uppercase mb-2 block tracking-widest">Estado (UF)</label>
              <select 
                {...register("state")}
                className="w-full bg-brand-input border border-brand-border rounded h-12 px-4 text-base text-white focus:outline-none focus:border-brand-accent appearance-none"
                style={{ background: "#0F0F0F" }}
              >
                <option value="">Selecione...</option>
                <option value="AC">Acre</option>
                <option value="AL">Alagoas</option>
                <option value="AP">Amapá</option>
                <option value="AM">Amazonas</option>
                <option value="BA">Bahia</option>
                <option value="CE">Ceará</option>
                <option value="DF">Distrito Federal</option>
                <option value="ES">Espírito Santo</option>
                <option value="GO">Goiás</option>
                <option value="MA">Maranhão</option>
                <option value="MT">Mato Grosso</option>
                <option value="MS">Mato Grosso do Sul</option>
                <option value="MG">Minas Gerais</option>
                <option value="PA">Pará</option>
                <option value="PB">Paraíba</option>
                <option value="PR">Paraná</option>
                <option value="PE">Pernambuco</option>
                <option value="PI">Piauí</option>
                <option value="RJ">Rio de Janeiro</option>
                <option value="RN">Rio Grande do Norte</option>
                <option value="RS">Rio Grande do Sul</option>
                <option value="RO">Rondônia</option>
                <option value="RR">Roraima</option>
                <option value="SC">Santa Catarina</option>
                <option value="SP">São Paulo</option>
                <option value="SE">Sergipe</option>
                <option value="TO">Tocantins</option>
              </select>
            </div>
            <div>
              <label className="text-[12px] font-bold text-brand-text-muted uppercase mb-2 block tracking-widest">Cidade</label>
              <Input {...register("city")} className="h-12 text-base px-4" placeholder="Ex: São Paulo" />
            </div>
          </div>
        </div>

        {/* Seção: Qualificação e Regulação */}
        <div className="space-y-5 md:col-span-2">
          <h4 className="text-[14px] font-bold text-brand-accent uppercase tracking-[0.2em] border-b border-brand-accent/20 pb-3">Qualificação e Regulação</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="text-[12px] font-bold text-brand-text-muted uppercase mb-2 block tracking-widest">Tipo de Cliente</label>
              <select 
                {...register("customerType")}
                className="w-full bg-brand-input border border-brand-border rounded h-12 px-4 text-base text-white focus:outline-none focus:border-brand-accent appearance-none"
                style={{ background: "#0F0F0F" }}
              >
                <option value="PF">PESSOA FÍSICA</option>
                <option value="PJ">PESSOA JURÍDICA (EMPRESA)</option>
                <option value="CAC">CAC (COLECIONADOR/ATIRADOR/CAÇADOR)</option>
                <option value="GOV">ÓRGÃO PÚBLICO / SEGURANÇA</option>
              </select>
            </div>
            <div>
              <label className="text-[12px] font-bold text-brand-text-muted uppercase mb-2 block tracking-widest">Status de CR</label>
              <select 
                {...register("documentStatus")}
                className="w-full bg-brand-input border border-brand-border rounded h-12 px-4 text-base text-white focus:outline-none focus:border-brand-accent appearance-none"
                style={{ background: "#0F0F0F" }}
              >
                <option value="NONE">NÃO POSSUI CR</option>
                <option value="PENDING">EM PROCESSO / VENCIDO</option>
                <option value="ACTIVE">CR ATIVO E REGULAR</option>
              </select>
            </div>
            <div>
              <label className="text-[12px] font-bold text-brand-text-muted uppercase mb-2 block tracking-widest">Vendedor</label>
              <select 
                {...register("assignedTo")}
                className="w-full bg-brand-input border border-brand-border rounded h-12 px-4 text-base text-brand-accent font-bold focus:outline-none focus:border-brand-accent appearance-none"
                style={{ background: "#0F0F0F" }}
              >
                <option value="ADMIN">ADMIN ELEVEN</option>
                <option value="RODRIGO">RODRIGO MOURA</option>
                <option value="BEATRIZ">BEATRIZ SILVA</option>
                <option value="CARLOS">CARLOS EDUARDO</option>
              </select>
            </div>
          </div>
        </div>

        {/* Seção: Interesse e Negócio */}
        <div className="space-y-5 md:col-span-2">
          <h4 className="text-[14px] font-bold text-brand-accent uppercase tracking-[0.2em] border-b border-brand-accent/20 pb-3">Interesse e Negócio</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-[12px] font-bold text-brand-text-muted uppercase mb-2 block tracking-widest">Categoria de Interesse</label>
              <select 
                {...register("category")}
                className="w-full bg-brand-input border border-brand-border rounded h-12 px-4 text-base text-white focus:outline-none focus:border-brand-accent appearance-none"
                style={{ background: "#0F0F0F" }}
              >
                <option value="ARMAS">ARMAS DE FOGO</option>
                <option value="ACESSORIOS">ACESSÓRIOS / MUNIÇÃO</option>
                <option value="INVESTIMENTO">INVESTIMENTO EM PROJETOS</option>
                <option value="B2B">REVENDA / B2B</option>
                <option value="IMPORTACAO">IMPORTAÇÃO DIRETA</option>
              </select>
            </div>
            <div>
              <label className="text-[12px] font-bold text-brand-text-muted uppercase mb-2 block tracking-widest">Produto / Projeto Específico</label>
              <select 
                {...register("interest")}
                className="w-full bg-brand-input border border-brand-border rounded h-12 px-4 text-base text-white focus:outline-none focus:border-brand-accent appearance-none"
                style={{ background: "#0F0F0F" }}
              >
                <option value="">Selecione o produto...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.commercialName}>
                    {p.commercialName}
                  </option>
                ))}
                <option value="OUTRO">OUTRO PRODUTO</option>
              </select>


              {errors.interest && <p className="text-brand-danger text-[11px] mt-1.5 uppercase font-bold">{errors.interest.message}</p>}
            </div>

            <div>
              <label className="text-[12px] font-bold text-brand-text-muted uppercase mb-2 block tracking-widest">Valor Estimado (R$)</label>
              <Input 
                {...register("value")} 
                className="h-12 text-base px-4 font-mono"
                placeholder="R$ 0,00"
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  const formatted = new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(value) / 100);
                  e.target.value = formatted;
                }}
              />
              {errors.value && <p className="text-brand-danger text-[11px] mt-1.5 uppercase font-bold">{errors.value.message}</p>}
            </div>
            <div>
              <label className="text-[12px] font-bold text-brand-text-muted uppercase mb-2 block tracking-widest">Prioridade Comercial</label>
              <select 
                {...register("priority")}
                className="w-full bg-brand-input border border-brand-border rounded h-12 px-4 text-base text-white focus:outline-none focus:border-brand-accent appearance-none"
                style={{ background: "#0F0F0F" }}
              >
                <option value="low">FRIO (Baixa)</option>
                <option value="medium">MORNO (Média)</option>
                <option value="high">QUENTE (Urgente)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <div>
              <label className="text-[12px] font-bold text-brand-text-muted uppercase mb-2 block tracking-widest">Nº CR (Exército)</label>
              <Input {...register("crNumber")} placeholder="Ex: 113397" className="h-12 text-base px-4" />
            </div>
            <div>
              <label className="text-[12px] font-bold text-brand-text-muted uppercase mb-2 block tracking-widest">Validade do CR</label>
              <Input {...register("crValidity")} placeholder="Ex: 13/01/2033" className="h-12 text-base px-4" />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-3">
          <label className="text-[12px] font-bold text-brand-text-muted uppercase mb-2 block tracking-widest">Observações Iniciais</label>
          <textarea 
            {...register("notes")}
            className="w-full bg-brand-input border border-brand-border rounded-lg p-5 text-base text-white focus:outline-none focus:border-brand-accent min-h-[140px] resize-none"
            placeholder="Detalhes sobre a necessidade do cliente, objeções ou histórico..."
            style={{ background: "#0F0F0F" }}
          ></textarea>
        </div>
      </div>

      <div className="flex gap-4 pt-8 border-t border-brand-border sticky bottom-0 bg-brand-surface py-4">
        <Button type="button" variant="ghost" className="flex-1 h-14 text-[13px] font-bold uppercase tracking-[0.2em]" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1 h-14 text-[13px] font-bold uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(245,196,0,0.2)]">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
