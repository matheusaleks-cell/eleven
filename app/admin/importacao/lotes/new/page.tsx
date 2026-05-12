"use client";

import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Ship, DollarSign, Calculator, ArrowLeft, Save, Globe, Package, Calendar, Anchor, Info, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import { getProducts } from "../../../erp/produtos/actions";
import { createImportLot, getSuppliers } from "../actions";
import { getProjects } from "../../../projetos/actions";
import { maskDecimal } from "@/lib/masks";

export default function NewBatchPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [eta, setEta] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [ptax, setPtax] = useState(5.1240);
  const [freight, setFreight] = useState(0);
  const [insurance, setInsurance] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      getProducts(),
      getSuppliers(),
      getProjects()
    ]).then(([p, s, proj]) => {
      setCatalog(p);
      setSuppliers(s);
      setProjects(proj);
    });
  }, []);

  const totalFob = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.qty * item.unitFob), 0);
  }, [items]);

  const totalBrl = useMemo(() => {
    const totalForeign = totalFob + freight + insurance;
    return totalForeign * ptax;
  }, [totalFob, freight, insurance, ptax]);

  const taxesEst = totalBrl * 0.48; // Estimativa de 48% de impostos totais

  const handleAddItem = () => {
    if (!selectedProduct) {
      toast.error("Selecione um produto no catálogo.");
      return;
    }
    const product = catalog.find(p => p.id === selectedProduct);
    if (!product) return;

    setItems([...items, { 
      id: Math.random().toString(), 
      productId: product.id,
      name: product.commercialName, 
      qty: 1, 
      unitFob: product.priceB2B || (product.priceB2C * 0.6) 
    }]);
    toast.success(`${product.commercialName} adicionado ao lote.`);
  };

  const handleSave = async () => {
    if (items.length === 0) {
      toast.error("Adicione ao menos um item ao lote.");
      return;
    }

    const res = await createImportLot({
      supplierId,
      projectId,
      originCountry: "Turquia",
      currency,
      exchangeRate: ptax,
      fobTotal: totalFob,
      freightTotal: freight,
      insuranceTotal: insurance,
      eta,
      items: items.map(i => ({
        productId: i.productId,
        quantity: i.qty,
        unitFob: i.unitFob
      }))
    });

    if (res.success) {
      toast.success("Lote de Importação registrado no banco de dados!");
      router.push("/admin/importacao/lotes");
    } else {
      toast.error("Falha ao salvar lote.");
    }
  };

  return (
    <DashboardLayout role="ADMIN" userName="Admin Eleven" userEmail="admin@elevenfirearms.com.br">
      <div className="flex flex-col gap-8 animate-fade-in pb-12">
        {/* Header */}
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Link href="/admin/importacao/lotes">
                 <Button variant="ghost" size="sm" className="p-2 h-auto text-brand-text-muted hover:text-white">
                    <ArrowLeft size={20} />
                 </Button>
              </Link>
              <div>
                 <h1 className="text-2xl font-bold tracking-tight font-rajdhani uppercase text-white">INICIAR NOVO LOTE</h1>
                 <p className="text-brand-text-secondary text-xs uppercase tracking-widest font-bold">Abertura de processo de importação internacional</p>
              </div>
           </div>
           <Button className="gap-2 shadow-[0_0_15px_rgba(245,196,0,0.1)]" onClick={handleSave}>
              <Save size={18} />
              SALVAR PROCESSO
           </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           
           {/* Left: Data Form */}
           <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Basic Info */}
              <Card className="p-8 border-brand-border bg-brand-surface/20">
                 <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent mb-6 flex items-center gap-2">
                    <Globe size={16} /> DADOS DE ORIGEM & FORNECEDOR
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                       <label className="text-xs font-bold uppercase tracking-military text-brand-text-secondary">Fornecedor *</label>
                       <select 
                        className="w-full bg-brand-input border border-brand-border rounded-military px-4 py-2.5 text-sm text-white outline-none focus:border-brand-accent"
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                       >
                          <option value="">Selecionar Fornecedor...</option>
                          {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.country})</option>
                          ))}
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-bold uppercase tracking-military text-brand-text-secondary">Projeto de Investimento (Opcional)</label>
                       <select 
                        className="w-full bg-brand-input border border-brand-border rounded-military px-4 py-2.5 text-sm text-white outline-none focus:border-brand-accent"
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                       >
                          <option value="">Nenhum Projeto (Lote Avulso)</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                       </select>
                    </div>
                    <Input label="Código do Lote (Auto)" placeholder="BATCH-2026-XXXX" disabled />
                    <Input label="País de Origem" defaultValue="Turquia" />
                    <div className="space-y-1">
                       <label className="text-xs font-bold uppercase tracking-military text-brand-text-secondary">Data Estimada (ETA)</label>
                       <input 
                        type="date" 
                        className="w-full bg-brand-input border border-brand-border rounded-military px-4 py-2 text-sm text-white outline-none focus:border-brand-accent" 
                        value={eta}
                        onChange={(e) => setEta(e.target.value)}
                       />
                    </div>
                 </div>
              </Card>

              {/* Financial Inputs */}
              <Card className="p-8 border-brand-border bg-brand-surface/20">
                 <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent mb-6 flex items-center gap-2">
                    <DollarSign size={16} /> VALORES DA IMPORTAÇÃO (MOEDA ESTRANGEIRA)
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                       <label className="text-xs font-bold uppercase tracking-military text-brand-text-secondary">Moeda</label>
                       <select 
                        className="w-full bg-brand-input border border-brand-border rounded-military px-4 py-2.5 text-sm text-white outline-none focus:border-brand-accent"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                       >
                          <option value="USD">USD - Dólar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - Libra</option>
                       </select>
                    </div>
                    <Input 
                      label="Taxa de Câmbio (Ptax)" 
                      value={ptax}
                      onChange={(e) => setPtax(Number(maskDecimal(e.target.value)))}
                    />
                    <Input 
                      label="Valor FOB Total" 
                      value={totalFob}
                      disabled
                    />
                    <Input 
                      label="Frete Internacional" 
                      value={freight}
                      onChange={(e) => setFreight(Number(maskDecimal(e.target.value)))}
                    />
                    <Input 
                      label="Seguro" 
                      value={insurance}
                      onChange={(e) => setInsurance(Number(maskDecimal(e.target.value)))}
                    />
                    <div className="flex items-end">
                       <Button variant="secondary" className="w-full gap-2 h-10" onClick={() => toast.success("Cálculos atualizados!")}>
                          <Calculator size={16} /> RECALCULAR
                       </Button>
                    </div>
                 </div>
              </Card>

              {/* Items Table */}
              <Card className="p-0 border-brand-border bg-brand-surface/20 overflow-hidden">
                 <div className="p-6 border-b border-brand-border bg-brand-bg/40 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                       <Package size={16} className="text-brand-accent" /> PRODUTOS NO LOTE
                    </h3>
                    <div className="flex items-center gap-3">
                       <select 
                        className="bg-brand-bg border border-brand-border rounded px-3 py-1 text-[10px] text-white outline-none focus:border-brand-accent h-8"
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                       >
                          <option value="">SELECIONAR PRODUTO...</option>
                          {catalog.map(p => (
                            <option key={p.id} value={p.id}>{p.sku} - {p.commercialName}</option>
                          ))}
                       </select>
                       <Button variant="ghost" size="sm" className="text-[10px] gap-2 h-8 text-brand-accent border border-brand-accent/20 hover:bg-brand-accent/10" onClick={handleAddItem}>
                          <Plus size={14} /> ADICIONAR AO LOTE
                       </Button>
                    </div>
                 </div>
                 <div className="p-0">
                    <table className="table-base">
                       <thead>
                          <tr>
                             <th>SKU / Produto</th>
                             <th>Qtd</th>
                             <th>Valor Unit. (FOB)</th>
                             <th>Total (FOB)</th>
                             <th className="text-right">Ação</th>
                          </tr>
                       </thead>
                       <tbody>
                          {items.map((item) => (
                            <tr key={item.id}>
                              <td className="text-xs font-bold uppercase">{item.name}</td>
                              <td>
                                <input 
                                  type="number" 
                                  value={item.qty}
                                  onChange={(e) => setItems(items.map(i => i.id === item.id ? { ...i, qty: Number(e.target.value) } : i))}
                                  className="w-16 bg-brand-bg border border-brand-border rounded px-2 py-1 text-xs text-white"
                                />
                              </td>
                              <td className="font-mono text-xs">USD {item.unitFob.toLocaleString()}</td>
                              <td className="font-mono text-xs font-bold">USD {(item.qty * item.unitFob).toLocaleString()}</td>
                              <td className="text-right">
                                 <button 
                                  className="text-brand-text-muted hover:text-brand-danger p-2"
                                  onClick={() => setItems(items.filter(i => i.id !== item.id))}
                                 >
                                   <Trash2 size={16} />
                                 </button>
                              </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </Card>
           </div>

           {/* Right: Summary & Timeline */}
           <div className="lg:col-span-4 flex flex-col gap-6">
              <Card className="p-6 border-brand-accent/20 bg-brand-accent/5">
                 <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent mb-6 flex items-center gap-2">
                    <Calculator size={16} /> RESUMO NACIONALIZADO (EST.)
                 </h3>
                 <div className="space-y-4">
                    <div className="flex justify-between text-xs border-b border-brand-border pb-2">
                       <span className="text-brand-text-muted uppercase font-bold">Total FOB (BRL)</span>
                       <span className="text-white font-mono font-bold">R$ {totalBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-xs border-b border-brand-border pb-2">
                       <span className="text-brand-text-muted uppercase font-bold">Impostos (Estimados)</span>
                       <span className="text-white font-mono font-bold text-brand-danger">R$ {taxesEst.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-xs border-b border-brand-border pb-2">
                       <span className="text-brand-text-muted uppercase font-bold">Despesas Aduaneiras</span>
                       <span className="text-white font-mono font-bold">R$ 12.000,00</span>
                    </div>
                    <div className="pt-2 flex justify-between items-center">
                       <span className="text-sm font-bold text-brand-accent uppercase tracking-widest">Custo Final</span>
                       <span className="text-2xl font-bold font-mono text-white">R$ {(totalBrl + taxesEst + 12000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                    </div>
                 </div>
              </Card>

              <Card className="p-6 border-brand-border bg-brand-bg/50">
                 <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-text-muted mb-6 flex items-center gap-2">
                    <Calendar size={16} /> TIMELINE PREVISTA
                 </h3>
                 <div className="space-y-6">
                    {[
                      { label: "Data de Compra", date: "Hoje", icon: <DollarSign size={14} />, active: true },
                      { label: "Previsão de Embarque", date: "+15 dias", icon: <Ship size={14} />, active: false },
                      { label: "Previsão de Chegada", date: "+45 dias", icon: <Anchor size={14} />, active: false },
                    ].map((step, i) => (
                      <div key={i} className="flex gap-4 relative">
                         {i < 2 && <div className="absolute left-[7px] top-6 w-0.5 h-6 bg-brand-border" />}
                         <div className={cn(
                           "w-4 h-4 rounded-full mt-1 z-10 flex items-center justify-center text-[8px]",
                           step.active ? "bg-brand-accent text-brand-bg" : "bg-brand-border text-brand-text-muted"
                         )}>
                            {step.icon}
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[10px] font-bold text-white uppercase tracking-wider leading-none">{step.label}</span>
                             <span className="text-[9px] font-bold text-brand-text-muted uppercase mt-1">{step.date}</span>
                          </div>
                      </div>
                    ))}
                 </div>
              </Card>

              <div className="p-6 rounded-xl border border-brand-warning/20 bg-brand-warning/[0.02] flex items-start gap-4">
                 <Info size={20} className="text-brand-warning shrink-0" />
                 <p className="text-[10px] text-brand-text-secondary uppercase font-bold leading-tight">
                    Os valores de impostos são estimativas baseadas nos NCMs dos produtos vinculados e podem variar no desembaraço.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
