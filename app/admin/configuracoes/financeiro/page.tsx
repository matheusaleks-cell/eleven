"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Percent, Wallet, ArrowRight, Settings2, ShieldCheck, DollarSign, RefreshCw, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FinancialSettingsPage() {
  return (
    <DashboardLayout role="ADMIN" userName="Admin Eleven" userEmail="admin@elevenfirearms.com.br">
      <div className="flex flex-col gap-8 animate-fade-in pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-accent/10 rounded border border-brand-accent/20 text-brand-accent">
              <Settings2 size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1 font-rajdhani uppercase">CONFIGURAÇÕES FINANCEIRAS</h1>
              <p className="text-brand-text-secondary text-sm font-medium uppercase tracking-wider text-[10px]">Definição das Regras de Distribuição, Split de Lucros e Parâmetros de Reinvestimento.</p>
            </div>
          </div>
          <Button className="gap-2 shadow-[0_0_15px_rgba(245,196,0,0.1)]">
            <CheckCircle2 size={18} />
            SALVAR ALTERAÇÕES
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
                          <Input label="Participação Investidor (%)" type="number" defaultValue={50} />
                          <p className="text-[10px] text-brand-text-muted uppercase leading-relaxed">
                             Percentual do lucro líquido transferido para a conta do investidor ao fim de cada ciclo.
                          </p>
                       </div>
                       <div className="space-y-4">
                          <Input label="Participação Empresa (%)" type="number" defaultValue={35} />
                          <p className="text-[10px] text-brand-text-muted uppercase leading-relaxed">
                             Margem de operação da Eleven Firearms para custos administrativos e lucro próprio.
                          </p>
                       </div>
                       <div className="space-y-4">
                          <Input label="Reserva de Contingência (%)" type="number" defaultValue={10} />
                          <p className="text-[10px] text-brand-text-muted uppercase leading-relaxed">
                             Fundo de segurança retido para variações cambiais ou despesas alfandegárias extras.
                          </p>
                       </div>
                       <div className="space-y-4">
                          <Input label="Taxa de Reinvestimento (%)" type="number" defaultValue={5} />
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
                             <span className="text-2xl font-mono">100.00%</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <span className="text-[10px] font-bold text-brand-text-muted uppercase">Status da Regra</span>
                          <p className="text-brand-success text-xs font-bold uppercase tracking-widest mt-1">✓ Equilibrada</p>
                       </div>
                    </div>
                 </div>
              </Card>

              <Card className="p-0 border-brand-border bg-brand-surface/20 overflow-hidden">
                 <div className="p-6 border-b border-brand-border bg-brand-bg/40 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                       <RefreshCw size={16} className="text-brand-success" /> CICLOS & REINVESTIMENTO
                    </h3>
                 </div>
                 <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <Input label="Máximo de Ciclos Padrão" type="number" defaultValue={8} />
                       <p className="text-[10px] text-brand-text-muted uppercase leading-relaxed">
                          Quantidade de reaplicações automáticas de capital antes da liquidação total.
                       </p>
                    </div>
                    <div className="space-y-4">
                       <Input label="Saldo Mínimo para Novo Lote (R$)" type="number" defaultValue={10000} />
                       <p className="text-[10px] text-brand-text-muted uppercase leading-relaxed">
                          Valor acumulado necessário no fundo de reinvestimento para abrir uma nova cota.
                       </p>
                    </div>
                 </div>
              </Card>
           </div>

           {/* Right: Commissions & Fees */}
           <div className="flex flex-col gap-6">
              <Card className="p-6 border-brand-border bg-brand-bg/50">
                 <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent mb-6 flex items-center gap-2">
                    <DollarSign size={16} /> TAXAS & COMISSÕES
                 </h3>
                 <div className="space-y-6">
                    <Input label="Comissão Comercial (%)" type="number" defaultValue={3} />
                    <Input label="Taxa de Custódia Mensal (R$)" type="number" defaultValue={0} />
                    <Input label="Multa por Resgate Antecipado (%)" type="number" defaultValue={15} />
                    
                    <div className="h-px bg-brand-border my-2" />
                    
                    <div className="flex items-center gap-3 p-4 bg-brand-input rounded border border-brand-border">
                       <Info size={16} className="text-brand-text-muted" />
                       <p className="text-[10px] text-brand-text-muted uppercase font-bold leading-tight">
                          Essas taxas são aplicadas sobre o Valor Bruto de Venda antes do split.
                       </p>
                    </div>
                 </div>
              </Card>

              <Card className="p-6 border-brand-border bg-brand-bg/50 border-dashed">
                 <div className="flex flex-col items-center text-center gap-4">
                    <div className="p-3 bg-brand-input rounded-full text-brand-text-muted">
                       <History size={24} />
                    </div>
                    <div>
                       <h4 className="text-xs font-bold text-white uppercase tracking-wider">Histórico de Alterações</h4>
                       <p className="text-[10px] text-brand-text-muted mt-1 uppercase">Última mudança: 12/03/2026 por admin@eleven</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-[10px] uppercase tracking-widest text-brand-accent">
                       VER AUDITORIA COMPLETA
                    </Button>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

import { History } from "lucide-react";
