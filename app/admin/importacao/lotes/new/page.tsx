"use client";

import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAdminSession } from "@/lib/hooks/use-session";
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
import { getProjects, getProjectById } from "../../../projetos/actions";
import { isValidDecimalInput, parseDecimalInput } from "@/lib/masks";
import { parseProductMix, productMixLabel } from "@/lib/product-mix";

export default function NewBatchPage() {
  const session = useAdminSession();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [eta, setEta] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [ptax, setPtax] = useState("5,12");
  const [freight, setFreight] = useState("US$ 0,00");
  const [insurance, setInsurance] = useState("US$ 0,00");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [addQty, setAddQty] = useState(1);
  const [addUnitPrice, setAddUnitPrice] = useState("0"); // texto livre — ver isValidDecimalInput/parseDecimalInput
  const [items, setItems] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);

  // Vindo de "Abrir Novo Ciclo" no projeto: já deixa o projeto escolhido e volta pra ele ao salvar.
  const [returnProjectId, setReturnProjectId] = useState("");

  useEffect(() => {
    const pid = new URLSearchParams(window.location.search).get("projectId");
    if (pid) {
      setProjectId(pid);
      setReturnProjectId(pid);
    }

    Promise.all([
      getProducts(),
      getSuppliers(),
      getProjects(),
      pid ? getProjectById(pid) : Promise.resolve(null),
    ]).then(([p, s, proj, project]) => {
      setCatalog(p);
      setSuppliers(s);
      setProjects(proj);
      if (project) prefillFromProject(project, p);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Novo ciclo de um projeto: parte do último lote dele (produto, quantidade, FOB unitário,
  // fornecedor e câmbio). Tudo continua editável na tabela antes de salvar.
  const prefillFromProject = (project: any, catalogList: any[]) => {
    const lots: any[] = project.importLots || [];
    const last = lots[lots.length - 1];
    const toInput = (n: number) => (Number.isFinite(n) && n > 0 ? n.toFixed(2).replace(".", ",") : "0");

    // Projeto com mais de um modelo: um item por produto, com a quantidade definida no projeto
    // e o FOB unitário médio do ciclo anterior.
    const mix = parseProductMix(project.productMix);
    if (mix.length > 1) {
      const lastQtyMix = last?.quantityItems || 0;
      const unitFobMix = lastQtyMix > 0 ? (last?.fobValue || 0) / lastQtyMix : 0;
      setItems(mix.map((m) => ({ id: Math.random().toString(), productId: m.productId, name: m.name, qty: m.quantity || 1, unitFob: toInput(unitFobMix) })));
      if (last?.supplierId) setSupplierId(last.supplierId);
      if (last?.currency) setCurrency(last.currency);
      if (last?.exchangeRate) setPtax(toInput(last.exchangeRate));
      toast.info(`Produtos do projeto preenchidos (${productMixLabel(mix)}). Ajuste se precisar.`);
      return;
    }

    let lotProducts: any[] = mix.length === 1
      ? catalogList.filter((c: any) => c.id === mix[0].productId)
      : last?.products || [];
    if (lotProducts.length === 0) {
      const byName = catalogList.find(
        (c: any) => String(c.commercialName).trim().toUpperCase() === String(project.productName || "").trim().toUpperCase()
      );
      if (byName) lotProducts = [byName];
    }
    if (lotProducts.length === 0) return;

    // Quantidade: a que veio do card "Ciclo proposto" (?qty=), senão a do próximo ciclo
    // salva no projeto, senão a do último lote.
    const qtyParam = Number(new URLSearchParams(window.location.search).get("qty"));
    const qty = (Number.isInteger(qtyParam) && qtyParam > 0 ? qtyParam : 0) || project.nextCycleQuantity || last?.quantityItems || 0;
    const lastQty = last?.quantityItems || 0;
    const unitFob = lastQty > 0 ? (last?.fobValue || 0) / lastQty : 0;
    const single = lotProducts.length === 1;

    setItems(
      lotProducts.map((prod: any) => ({
        id: Math.random().toString(),
        productId: prod.id,
        name: prod.commercialName,
        qty: single ? qty || 1 : 0,
        unitFob: single ? toInput(unitFob) : "0",
      }))
    );
    if (last?.supplierId) setSupplierId(last.supplierId);
    if (last?.currency) setCurrency(last.currency);
    if (last?.exchangeRate) setPtax(toInput(last.exchangeRate));

    toast.info(
      single && qty > 0
        ? `Produtos preenchidos a partir do ciclo anterior (${qty} un.). Ajuste se precisar.`
        : "Produtos do ciclo anterior preenchidos. Ajuste as quantidades."
    );
  };

  // Helper para limpar máscara
  const cleanCurrency = (val: string) => {
    const num = Number(val.replace(/\D/g, "")) / 100;
    return isNaN(num) ? 0 : num;
  };

  // Efeito para reformatar frete e seguro quando a moeda do lote mudar
  useEffect(() => {
    setFreight(prev => {
      const numeric = cleanCurrency(prev);
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: currency,
      }).format(numeric);
    });
    setInsurance(prev => {
      const numeric = cleanCurrency(prev);
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: currency,
      }).format(numeric);
    });
  }, [currency]);

  const totalFob = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.qty * parseDecimalInput(item.unitFob)), 0);
  }, [items]);

  const importSummary = useMemo(() => {
    const fob = totalFob;
    const freightVal = cleanCurrency(freight);
    const insuranceVal = cleanCurrency(insurance);
    const rate = parseDecimalInput(ptax);

    // Fórmulas exatas do preset VR12_PUMP_PRESET
    const iiRate = 0.18;
    const ipiRate = 0.55;
    const pisRate = 0.021;
    const cofinsRate = 0.0965;
    const icmsFactor = 0.75;
    const icmsRate = 0.25;
    const siscomexFixed = 154.23;
    const custoOpFixed = 7884;

    const va = (fob + freightVal + insuranceVal) * rate;
    const ii = va * iiRate;
    const ipi = (va + ii) * ipiRate;
    const pis = va * pisRate;
    const cofins = va * cofinsRate;
    const siscomex = siscomexFixed;
    const baseNormal = va + ii + ipi + pis + cofins + siscomex;
    const baseAlterada = baseNormal / icmsFactor;
    const icms = baseAlterada * icmsRate;
    const custoOp = custoOpFixed;
    
    const totalTaxes = ii + ipi + pis + cofins + icms;
    const totalFees = siscomex + custoOp;
    const totalCost = baseAlterada + custoOp;

    return {
      fobBrl: fob * rate,
      va,
      ii,
      ipi,
      pis,
      cofins,
      siscomex,
      icms,
      custoOp,
      totalTaxes,
      totalFees,
      totalCost
    };
  }, [totalFob, freight, insurance, ptax]);

  const handleAddItem = () => {
    if (!selectedProduct) {
      toast.error("Selecione um produto no catálogo.");
      return;
    }
    
    let itemName = "";
    let productId = "";
    
    if (selectedProduct === "GENERIC") {
      itemName = "ITEM GENÉRICO / OUTROS";
      productId = "generic-id";
    } else {
      const product = catalog.find(p => p.id === selectedProduct);
      if (!product) return;
      itemName = product.commercialName;
      productId = product.id;
    }

    setItems([...items, {
      id: Math.random().toString(),
      productId: productId,
      name: itemName,
      qty: addQty,
      unitFob: parseDecimalInput(addUnitPrice) > 0 ? addUnitPrice : "0"
    }]);

    toast.success(`${itemName} adicionado ao lote.`);
    // Reset inputs
    setAddQty(1);
    setAddUnitPrice("0");
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
      exchangeRate: parseDecimalInput(ptax),
      fobTotal: totalFob,
      freightTotal: cleanCurrency(freight),
      insuranceTotal: cleanCurrency(insurance),
      eta,
      items: items.map(i => ({
        productId: i.productId,
        quantity: i.qty,
        unitFob: parseDecimalInput(i.unitFob)
      }))
    });

    if (res.success) {
      toast.success(returnProjectId ? "Novo ciclo aberto no projeto!" : "Lote de Importação registrado no banco de dados!");
      router.push(returnProjectId ? `/admin/projetos/${returnProjectId}` : "/admin/importacao/lotes");
    } else {
      toast.error("Falha ao salvar lote.");
    }
  };

  return (
    <DashboardLayout role="ADMIN" userName={session.userName} userEmail={session.userEmail}>
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
                      inputMode="decimal"
                      placeholder="5,12"
                      onChange={(e) => isValidDecimalInput(e.target.value) && setPtax(e.target.value)}
                    />
                    <Input 
                      label="Valor FOB Total" 
                      value={totalFob.toLocaleString('pt-BR', { style: 'currency', currency: currency })}
                      disabled
                    />
                    <Input 
                      label="Frete Internacional" 
                      value={freight}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        const formatted = new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: currency,
                        }).format(Number(value) / 100);
                        setFreight(formatted);
                      }}
                    />
                    <Input 
                      label="Seguro" 
                      value={insurance}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        const formatted = new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: currency,
                        }).format(Number(value) / 100);
                        setInsurance(formatted);
                      }}
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
                        onChange={(e) => {
                          setSelectedProduct(e.target.value);
                          const p = catalog.find(item => item.id === e.target.value);
                          if (p) setAddUnitPrice(String(p.priceB2B || (p.priceB2C * 0.6)).replace(".", ","));
                          else if (e.target.value === "GENERIC") setAddUnitPrice("0");
                        }}
                       >
                          <option value="">SELECIONAR PRODUTO...</option>
                          <option value="GENERIC">+ ITEM AVULSO / FORA DO CATÁLOGO</option>
                          {catalog.map(p => (
                            <option key={p.id} value={p.id}>{p.sku} - {p.commercialName}</option>
                          ))}
                       </select>
                       <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            placeholder="Qtd"
                            value={addQty}
                            onChange={(e) => setAddQty(Number(e.target.value))}
                            className="w-12 bg-brand-bg border border-brand-border rounded px-2 py-1 text-[10px] text-white h-8"
                          />
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="Valor FOB"
                            value={addUnitPrice}
                            onChange={(e) => isValidDecimalInput(e.target.value) && setAddUnitPrice(e.target.value)}
                            className="w-20 bg-brand-bg border border-brand-border rounded px-2 py-1 text-[10px] text-white h-8"
                          />
                       </div>
                       <Button variant="ghost" size="sm" className="text-[10px] gap-2 h-8 text-brand-accent border border-brand-accent/20 hover:bg-brand-accent/10" onClick={handleAddItem}>
                          <Plus size={14} /> ADICIONAR
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
                               <td className="font-mono text-xs">
                                <div className="flex items-center gap-1">
                                  <span className="text-brand-text-muted">USD</span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={item.unitFob}
                                    onChange={(e) => isValidDecimalInput(e.target.value) && setItems(items.map(i => i.id === item.id ? { ...i, unitFob: e.target.value } : i))}
                                    className="w-20 bg-brand-bg border border-brand-border rounded px-2 py-1 text-xs text-white font-mono"
                                  />
                                </div>
                              </td>
                              <td className="font-mono text-xs font-bold text-brand-accent">USD {(item.qty * parseDecimalInput(item.unitFob)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>

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
                       <span className="text-white font-mono font-bold">R$ {importSummary.fobBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-xs border-b border-brand-border pb-2">
                       <span className="text-brand-text-muted uppercase font-bold">Impostos (Estimados)</span>
                       <span className="text-white font-mono font-bold text-brand-danger">R$ {importSummary.totalTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-xs border-b border-brand-border pb-2">
                       <span className="text-brand-text-muted uppercase font-bold">Despesas Aduaneiras</span>
                       <span className="text-white font-mono font-bold">R$ {importSummary.totalFees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="pt-2 flex justify-between items-center">
                       <span className="text-sm font-bold text-brand-accent uppercase tracking-widest">Custo Final</span>
                       <span className="text-2xl font-bold font-mono text-white">R$ {importSummary.totalCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
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
