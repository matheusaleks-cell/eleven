"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
  Calculator, DollarSign, Ship, Truck, Info, 
  Download, PieChart, TrendingUp, AlertTriangle,
  Globe, Package
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getProducts } from "@/app/admin/erp/produtos/actions";
import { isValidDecimalInput, parseDecimalInput } from "@/lib/masks";

export const ImportSimulator = () => {
  const [fobInput, setFobInput] = useState("15000");
  const [freightInput, setFreightInput] = useState("1500");
  const [insurance, setInsurance] = useState(450);
  const [exchangeRateInput, setExchangeRateInput] = useState("5,15");
  const [taxPreset, setTaxPreset] = useState("TURQUIA");
  const [catalog, setCatalog] = useState<any[]>([]);
  const [selectedSku, setSelectedSku] = useState("");

  const fob = useMemo(() => parseDecimalInput(fobInput), [fobInput]);
  const freight = useMemo(() => parseDecimalInput(freightInput), [freightInput]);
  const exchangeRate = useMemo(() => parseDecimalInput(exchangeRateInput), [exchangeRateInput]);

  useEffect(() => {
    getProducts().then(setCatalog);
  }, []);

  const presets: Record<string, any> = {
    TURQUIA: { ii: 0.20, ipi: 0.25, icms: 0.25, pis: 0.021, cofins: 0.0965 },
    EUA: { ii: 0.20, ipi: 0.25, icms: 0.18, pis: 0.021, cofins: 0.0965 },
    EUROPA: { ii: 0.18, ipi: 0.20, icms: 0.18, pis: 0.021, cofins: 0.0965 },
  };

  const results = useMemo(() => {
    const config = presets[taxPreset] || presets.TURQUIA;
    const vmld = (fob + freight + insurance) * exchangeRate; // Valor Aduaneiro em BRL
    
    // Cálculo em Cascata (Padrão RFB)
    const iiVal = vmld * config.ii;
    const ipiVal = (vmld + iiVal) * config.ipi;
    const pisVal = vmld * config.pis;
    const cofinsVal = vmld * config.cofins;
    
    // Base de cálculo do ICMS (base majorada e cálculo por dentro)
    const taxaSiscomex = 500;
    const baseIcms = (vmld + iiVal + ipiVal + pisVal + cofinsVal + taxaSiscomex) / (1 - config.icms);
    const icmsVal = baseIcms * config.icms;
    
    const totalTaxes = iiVal + ipiVal + pisVal + cofinsVal + icmsVal;
    const operationalCosts = 8500; // Despacho, Capatazia, Armazenagem estimadas
    const finalCost = vmld + totalTaxes + operationalCosts;

    return {
      vmld,
      iiVal,
      ipiVal,
      pisVal,
      cofinsVal,
      icmsVal,
      totalTaxes,
      finalCost,
      markup: (finalCost / vmld - 1) * 100,
      taxWeight: (totalTaxes / finalCost) * 100
    };
  }, [fob, freight, insurance, exchangeRate, taxPreset]);

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Presets / Quick Filters */}
      <div className="flex gap-2 bg-brand-bg p-1 rounded-lg border border-brand-border w-fit">
        {Object.keys(presets).map((p) => (
          <button
            key={p}
            onClick={() => setTaxPreset(p)}
            className={cn(
              "px-4 py-1.5 rounded-md text-[9px] font-bold uppercase transition-all tracking-tighter",
              taxPreset === p 
                ? "bg-brand-accent text-brand-bg shadow-lg" 
                : "text-brand-text-muted hover:text-white"
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Configuração */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-4">
             <h4 className="text-xs font-bold text-brand-accent uppercase tracking-widest flex items-center gap-2">
               <Calculator size={14} /> Entrada de Valores
             </h4>
             
             <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-brand-text-muted uppercase">Vincular SKU do Catálogo (Opcional)</label>
                   <select 
                    className="w-full bg-brand-input border border-brand-border rounded px-3 py-2 text-xs text-white outline-none focus:border-brand-accent"
                    value={selectedSku}
                    onChange={(e) => {
                      const p = catalog.find(x => x.id === e.target.value);
                      if (p) {
                        setSelectedSku(p.id);
                        setFobInput(String(p.priceB2B || p.priceB2C * 0.6).replace(".", ","));
                      }
                    }}
                   >
                      <option value="">SIMULAÇÃO AVULSA</option>
                      {catalog.map(p => (
                        <option key={p.id} value={p.id}>{p.sku} - {p.commercialName}</option>
                      ))}
                   </select>
                </div>

                <Input
                  label="Valor FOB Mercadoria (USD)"
                  inputMode="decimal"
                  value={fobInput}
                  onChange={(e) => isValidDecimalInput(e.target.value) && setFobInput(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Logística (USD)"
                    inputMode="decimal"
                    value={freightInput}
                    onChange={(e) => isValidDecimalInput(e.target.value) && setFreightInput(e.target.value)}
                  />
                  <Input
                    label="Câmbio (BRL)"
                    inputMode="decimal"
                    value={exchangeRateInput}
                    onChange={(e) => isValidDecimalInput(e.target.value) && setExchangeRateInput(e.target.value)}
                  />
                </div>
             </div>
          </div>

          <div className="p-4 rounded-xl bg-brand-warning/5 border border-brand-warning/20 flex gap-4">
             <AlertTriangle className="text-brand-warning shrink-0" size={20} />
             <div className="space-y-1">
                <p className="text-[10px] font-bold text-brand-warning uppercase">Risco de Câmbio</p>
                <p className="text-[9px] text-brand-text-secondary uppercase leading-tight font-medium">
                   Uma variação de 5% no câmbio impacta em R$ {(results.finalCost * 0.05).toLocaleString('pt-BR')} no custo final.
                </p>
             </div>
          </div>
        </div>

        {/* Resultado Detalhado */}
        <div className="lg:col-span-7 flex flex-col gap-6">
           <Card className="p-6 bg-brand-surface/40 border-brand-accent/20 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                <Globe size={120} className="text-brand-accent" />
              </div>

              <div className="relative z-10">
                <h4 className="text-xs font-bold text-brand-accent uppercase tracking-widest mb-6 border-b border-brand-border pb-2">Demonstrativo de Nacionalização</h4>
                
                <div className="space-y-3">
                   <div className="flex justify-between text-xs">
                      <span className="text-brand-text-muted font-bold uppercase">Custo Aduaneiro (BRL)</span>
                      <span className="text-white font-mono font-bold">R$ {results.vmld.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-x-8 gap-y-2 py-4 border-y border-brand-border/50">
                      <div className="flex justify-between text-[10px] uppercase">
                         <span className="text-brand-text-muted">II (Importação)</span>
                         <span className="text-white font-bold">R$ {results.iiVal.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between text-[10px] uppercase">
                         <span className="text-brand-text-muted">IPI (Indústria)</span>
                         <span className="text-white font-bold">R$ {results.ipiVal.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between text-[10px] uppercase">
                         <span className="text-brand-text-muted">PIS / COFINS</span>
                         <span className="text-white font-bold">R$ {(results.pisVal + results.cofinsVal).toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between text-[10px] uppercase">
                         <span className="text-brand-text-muted">ICMS (Destino)</span>
                         <span className="text-white font-bold">R$ {results.icmsVal.toLocaleString('pt-BR')}</span>
                      </div>
                   </div>

                   <div className="flex justify-between items-center pt-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-brand-accent uppercase tracking-widest">Custo Final Projetado (DDP)</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-brand-success uppercase">+{results.markup.toFixed(1)}% Markup</span>
                          <span className="text-[10px] font-bold text-brand-danger uppercase">{results.taxWeight.toFixed(1)}% Impostos</span>
                        </div>
                      </div>
                      <span className="text-3xl font-bold font-mono text-white tracking-tighter">
                         R$ {results.finalCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </span>
                   </div>
                </div>
              </div>
           </Card>

           <div className="grid grid-cols-2 gap-4">
              <Button variant="secondary" className="gap-2 text-[10px] font-bold tracking-widest h-12 uppercase" onClick={() => toast.success("PDF da simulação gerado!")}>
                 <Download size={14} /> Baixar PDF
              </Button>
              <Button className="gap-2 text-[10px] font-bold tracking-widest h-12 uppercase shadow-lg">
                 <Ship size={14} /> Iniciar Processo
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
};
