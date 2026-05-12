"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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
};

interface LeadFormProps {
  initialData?: Partial<LeadFormData>;
  onSubmit: (data: LeadFormData) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export function LeadForm({ initialData, onSubmit, onCancel, submitLabel = "Salvar Lead" }: LeadFormProps) {
  const {
    register,
    handleSubmit,
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
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => onSubmit({ ...data, value: Number(data.value) }))} className="space-y-8 max-h-[70vh] overflow-y-auto px-2 custom-scrollbar">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                <option value="SP">São Paulo</option>
                <option value="RJ">Rio de Janeiro</option>
                <option value="MG">Minas Gerais</option>
                <option value="PR">Paraná</option>
                <option value="SC">Santa Catarina</option>
                <option value="RS">Rio Grande do Sul</option>
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
              <Input {...register("interest")} className="h-12 text-base px-4" placeholder="Ex: VR-12P Carrera ou Lote 22" />
              {errors.interest && <p className="text-brand-danger text-[11px] mt-1.5 uppercase font-bold">{errors.interest.message}</p>}
            </div>
            <div>
              <label className="text-[12px] font-bold text-brand-text-muted uppercase mb-2 block tracking-widest">Valor Estimado (R$)</label>
              <Input {...register("value")} type="number" step="0.01" className="h-12 text-base px-4 font-mono" />
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
