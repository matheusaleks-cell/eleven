"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAdminSession } from "@/lib/hooks/use-session";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Percent, DollarSign, Settings2, ShieldCheck, RefreshCw, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getSplitRules, saveSplitRules } from "@/app/admin/financeiro/actions";

export default function FinancialSettingsPage() {
  const session = useAdminSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState({ investor: 50, company: 35, reserve: 10, reinvest: 5, operationalCost: 15 });

  useEffect(() => {
    getSplitRules().then(r => {
      if (r) setRules(r);
      setLoading(false);
    });
  }, []);

  const total = rules.investor + rules.company + rules.reserve + rules.reinvest;
  const isBalanced = total === 100;

  const handleSave = async () => {
    if (!isBalanced) {
      toast.error(`A soma do split deve ser 100%. Atual: ${total}%`);
      return;
    }
    setSaving(true);
    try {
      const result = await saveSplitRules(rules);
      if (result.success) {
        toast.success("Regras financeiras atualizadas com sucesso!");
      } else {
        toast.error(result.error || "Falha ao salvar regras.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="ADMIN" userName={session.userName} userEmail={session.userEmail}>
      <div className="flex flex-col gap-8 animate-fade-in pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-accent/10 rounded border border-brand-accent/20 text-brand-accent">
              <Settings2 size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1 font-rajdhani uppercase">CONFIGURAÇÕES FINANCEIRAS</h1>
              <p className="text-brand-text-secondary text-sm font-medium uppercase tracking-wider text-[10px]">Fonte única das regras de distribuição de lucro e custo operacional usada em todo o sistema.</p>
            </div>
          </div>
          <Button className="gap-2 shadow-[0_0_15px_rgba(245,196,0,0.1)]" onClick={handleSave} disabled={loading || saving}>
            <CheckCircle2 size={18} />
            {saving ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left: Profit Split Rules */}
           <div className="lg:col-span-2 flex flex-col gap-6">
              <Card className="p-0 border-brand-border bg-brand-surface/20 overflow-hidden">
                 <div className="p-6 border-b border-brand-border bg-brand-bg/40 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                       <Percent size={16} className="text-brand-accent" /> MOTOR DE DISTRIBUIÇÃO (SPLIT)
                    </h3>
                    <span className="text-[9px] font-bold text-brand-text-muted uppercase">Base: Lucro Líquido</span>
                 </div>
                 <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <Input
                            label="Participação Investidor (%)"
                            type="number"
                            value={rules.investor}
                            onChange={(e) => setRules({ ...rules, investor: parseInt(e.target.value) || 0 })}
                          />
                          <p className="text-[10px] text-brand-text-muted uppercase leading-relaxed">
                             Percentual do lucro líquido transferido para a conta do investidor ao fim de cada ciclo.
                          </p>
                       </div>
                       <div className="space-y-4">
                          <Input
                            label="Participação Empresa (%)"
                            type="number"
                            value={rules.company}
                            onChange={(e) => setRules({ ...rules, company: parseInt(e.target.value) || 0 })}
                          />
                          <p className="text-[10px] text-brand-text-muted uppercase leading-relaxed">
                             Margem de operação da Eleven Firearms para custos administrativos e lucro próprio.
                          </p>
                       </div>
                       <div className="space-y-4">
                          <Input
                            label="Reserva de Contingência (%)"
                            type="number"
                            value={rules.reserve}
                            onChange={(e) => setRules({ ...rules, reserve: parseInt(e.target.value) || 0 })}
                          />
                          <p className="text-[10px] text-brand-text-muted uppercase leading-relaxed">
                             Fundo de segurança retido para variações cambiais ou despesas alfandegárias extras.
                          </p>
                       </div>
                       <div className="space-y-4">
                          <Input
                            label="Taxa de Reinvestimento (%)"
                            type="number"
                            value={rules.reinvest}
                            onChange={(e) => setRules({ ...rules, reinvest: parseInt(e.target.value) || 0 })}
                          />
                          <p className="text-[10px] text-brand-text-muted uppercase leading-relaxed">
                             Percentual destinado à ampliação automática de capital para os próximos lotes.
                          </p>
                       </div>
                    </div>

                    <div className="p-6 bg-brand-accent/5 border border-brand-accent/10 rounded-lg flex items-center justify-between">
                       <div className="flex items-center gap-4 text-brand-accent font-bold">
                          <ShieldCheck size={24} />
                          <div className="flex flex-col">
                             <span className="text-xs uppercase tracking-widest leading-none">Total da Regra</span>
                             <span className="text-2xl font-mono">{total.toFixed(2)}%</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <span className="text-[10px] font-bold text-brand-text-muted uppercase">Status da Regra</span>
                          <p className={cn("text-xs font-bold uppercase tracking-widest mt-1", isBalanced ? "text-brand-success" : "text-brand-danger")}>
                            {isBalanced ? "✓ Equilibrada" : "✗ Ajuste necessário"}
                          </p>
                       </div>
                    </div>
                 </div>
              </Card>

              <Card className="p-0 border-brand-border bg-brand-surface/20 overflow-hidden opacity-60">
                 <div className="p-6 border-b border-brand-border bg-brand-bg/40 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                       <RefreshCw size={16} className="text-brand-success" /> CICLOS & REINVESTIMENTO
                    </h3>
                    <span className="text-[8px] font-black text-brand-text-muted uppercase tracking-widest px-2 py-1 rounded border border-brand-border">Em breve</span>
                 </div>
                 <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <Input label="Máximo de Ciclos Padrão" type="number" defaultValue={8} disabled />
                       <p className="text-[10px] text-brand-text-muted uppercase leading-relaxed">
                          Hoje configurado por projeto individualmente (campo &quot;Máx. Ciclos&quot; ao criar o projeto).
                       </p>
                    </div>
                    <div className="space-y-4">
                       <Input label="Saldo Mínimo para Novo Lote (R$)" type="number" defaultValue={10000} disabled />
                       <p className="text-[10px] text-brand-text-muted uppercase leading-relaxed">
                          Ainda não conectado a nenhuma automação de abertura de lote.
                       </p>
                    </div>
                 </div>
              </Card>
           </div>

           {/* Right: Operational cost + Commissions */}
           <div className="flex flex-col gap-6">
              <Card className="p-6 border-brand-border bg-brand-bg/50">
                 <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent mb-6 flex items-center gap-2">
                    <DollarSign size={16} /> CUSTO OPERACIONAL SOBRE VENDA
                 </h3>
                 <div className="space-y-6">
                    <Input
                      label="Custo Operacional (%)"
                      type="number"
                      value={rules.operationalCost}
                      onChange={(e) => setRules({ ...rules, operationalCost: parseInt(e.target.value) || 0 })}
                    />
                    <div className="h-px bg-brand-border my-2" />
                    <div className="flex items-center gap-3 p-4 bg-brand-input rounded border border-brand-border">
                       <Info size={16} className="text-brand-text-muted" />
                       <p className="text-[10px] text-brand-text-muted uppercase font-bold leading-tight">
                          Descontado do valor bruto de cada venda antes do split — usado no Dashboard, Financeiro e na área do investidor.
                       </p>
                    </div>
                 </div>
              </Card>

              <Card className="p-6 border-brand-border bg-brand-bg/50 border-dashed opacity-60">
                 <div className="flex flex-col items-center text-center gap-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Comissões & Multas</h4>
                    <p className="text-[10px] text-brand-text-muted uppercase leading-relaxed">
                       Comissão comercial, custódia mensal e multa por resgate antecipado ainda não são calculadas em nenhuma tela do sistema.
                    </p>
                    <span className="text-[8px] font-black text-brand-text-muted uppercase tracking-widest px-2 py-1 rounded border border-brand-border">Em breve</span>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
