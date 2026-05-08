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
  value: z.any(), // Changed to any to avoid Resolver conflict with unknown/number during prod build
  priority: z.enum(["low", "medium", "high"]),
  status: z.string()
});

export type LeadFormData = {
  name: string;
  email?: string;
  phone: string;
  interest: string;
  value: number;
  priority: "low" | "medium" | "high";
  status: string;
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
      status: initialData?.status || "NOVO"
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => onSubmit({ ...data, value: Number(data.value) }))} className="space-y-5">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="text-[10px] font-bold text-brand-text-muted uppercase mb-1.5 block tracking-widest">Nome do Cliente</label>
          <Input {...register("name")} placeholder="Ex: Ricardo Oliveira" />
          {errors.name && <p className="text-brand-danger text-[10px] mt-1 uppercase font-bold">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-brand-text-muted uppercase mb-1.5 block tracking-widest">E-mail (Opcional)</label>
            <Input {...register("email")} type="email" placeholder="cliente@email.com" />
            {errors.email && <p className="text-brand-danger text-[10px] mt-1 uppercase font-bold">{errors.email.message}</p>}
          </div>
          <div>
            <label className="text-[10px] font-bold text-brand-text-muted uppercase mb-1.5 block tracking-widest">Telefone / WhatsApp</label>
            <Input {...register("phone")} placeholder="(00) 00000-0000" />
            {errors.phone && <p className="text-brand-danger text-[10px] mt-1 uppercase font-bold">{errors.phone.message}</p>}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-brand-text-muted uppercase mb-1.5 block tracking-widest">Produto de Interesse</label>
          <Input {...register("interest")} placeholder="Ex: VR-12P Carrera" />
          {errors.interest && <p className="text-brand-danger text-[10px] mt-1 uppercase font-bold">{errors.interest.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-brand-text-muted uppercase mb-1.5 block tracking-widest">Valor Estimado (R$)</label>
            <Input {...register("value")} type="number" step="0.01" />
            {errors.value && <p className="text-brand-danger text-[10px] mt-1 uppercase font-bold">{errors.value.message}</p>}
          </div>
          <div>
            <label className="text-[10px] font-bold text-brand-text-muted uppercase mb-1.5 block tracking-widest">Prioridade</label>
            <select 
              {...register("priority")}
              className="w-full bg-brand-input border border-brand-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-accent appearance-none"
              style={{ background: "#0F0F0F" }}
            >
              <option value="low">FRIO (Baixa)</option>
              <option value="medium">MÉDIO</option>
              <option value="high">URGENTE (Alta)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-brand-border">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
