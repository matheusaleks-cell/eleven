"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { getProjectById, updateProject } from "@/app/admin/projetos/actions";
import { getProducts } from "@/app/admin/erp/produtos/actions";
import { parseProductMix, sameProductName } from "@/lib/product-mix";

const label = "text-[10px] font-bold uppercase tracking-widest text-brand-text-muted";
const field =
  "w-full bg-brand-input border border-brand-border rounded px-3 py-2 text-sm text-white outline-none focus:border-brand-accent";

// "87.130,68" ou "87130,68" -> 87130.68; "87130.68" (sem vírgula) -> 87130.68.
const parseBRL = (v: string) => {
  const s = v.trim().replace(/[R$\s]/g, "");
  const n = s.includes(",") ? parseFloat(s.replace(/\./g, "").replace(",", ".")) : parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
};

const toBRLInput = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";

// Janela de edição dos dados do projeto. Carrega o projeto completo ao abrir (a lista não traz
// todos os campos) e não mexe em lotes, armas nem ciclos.
export function EditProjectDialog({
  projectId,
  onClose,
  onSaved,
}: {
  projectId: string | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lotsCount, setLotsCount] = useState(0);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [selected, setSelected] = useState<{ productId: string; quantity: string }[]>([]);
  const [original, setOriginal] = useState<{ capital: number; split: number } | null>(null);
  const [form, setForm] = useState({
    name: "",
    status: "ACTIVE",
    maxCycles: "",
    initialCapital: "",
    profitSplitPct: "",
    payoutRule: "REINVEST",
    contractNumber: "",
    startDate: "",
    nextCycleQuantity: "",
    notes: "",
  });

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    Promise.all([getProjectById(projectId), getProducts()])
      .then(([p, products]: [any, any[]]) => {
        if (!p) {
          toast.error("Projeto não encontrado.");
          onClose();
          return;
        }
        setCatalog(products || []);
        // Seleção atual: a salva no projeto; senão, o produto do catálogo com o mesmo nome.
        const mix = parseProductMix(p.productMix);
        if (mix.length > 0) {
          setSelected(mix.map((m) => ({ productId: m.productId, quantity: m.quantity ? String(m.quantity) : "" })));
        } else {
          const match = (products || []).find((c: any) => sameProductName(c.commercialName, p.productName));
          setSelected(match ? [{ productId: match.id, quantity: "" }] : []);
        }
        setLotsCount((p.importLots || []).length);
        setOriginal({ capital: p.initialCapital || 0, split: p.profitSplitPct || 0 });
        setForm({
          name: p.name || "",
          status: p.status || "ACTIVE",
          maxCycles: String(p.maxCycles ?? ""),
          initialCapital: toBRLInput(p.initialCapital || 0),
          profitSplitPct: String(Math.round((p.profitSplitPct || 0) * 10000) / 100).replace(".", ","),
          payoutRule: p.payoutRule || "REINVEST",
          contractNumber: p.contractNumber || "",
          startDate: p.startDate ? new Date(p.startDate).toISOString().slice(0, 10) : "",
          nextCycleQuantity: p.nextCycleQuantity ? String(p.nextCycleQuantity) : "",
          notes: p.notes || "",
        });
      })
      .catch(() => toast.error("Erro ao carregar o projeto."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const isSelected = (id: string) => selected.some((s) => s.productId === id);
  const toggleProduct = (id: string) =>
    setSelected((cur) => (cur.some((s) => s.productId === id) ? cur.filter((s) => s.productId !== id) : [...cur, { productId: id, quantity: "" }]));
  const setQty = (id: string, v: string) =>
    setSelected((cur) => cur.map((s) => (s.productId === id ? { ...s, quantity: v } : s)));
  const multi = selected.length > 1;
  const mixTotal = selected.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!projectId) return;
    const capital = parseBRL(form.initialCapital);
    const split = parseBRL(form.profitSplitPct) / 100;
    if (!Number.isFinite(capital) || !Number.isFinite(split)) {
      toast.error("Capital ou participação inválidos.");
      return;
    }
    if (selected.length === 0) {
      toast.error("Selecione ao menos um produto do catálogo.");
      return;
    }
    if (multi && selected.some((s) => !Number.isInteger(Number(s.quantity)) || Number(s.quantity) < 1)) {
      toast.error("Com mais de um produto, informe a quantidade de cada um.");
      return;
    }
    const maxCycles = Number(form.maxCycles);
    const nextQty = form.nextCycleQuantity.trim() === "" ? null : Number(form.nextCycleQuantity);

    if (original && (Math.abs(capital - original.capital) > 0.005 || Math.abs(split - original.split) > 0.00005)) {
      if (!confirm("Capital e/ou participação do investidor foram alterados. Isso muda o patrimônio e o rendimento que o investidor vê no painel. Confirmar?")) return;
    }

    setSaving(true);
    const res = await updateProject(projectId, {
      name: form.name,
      productMix: selected.map((s) => ({ productId: s.productId, quantity: multi ? Number(s.quantity) : null })),
      status: form.status,
      maxCycles,
      initialCapital: capital,
      profitSplitPct: split,
      payoutRule: form.payoutRule,
      contractNumber: form.contractNumber,
      startDate: form.startDate || null,
      nextCycleQuantity: nextQty,
      notes: form.notes,
    });
    setSaving(false);
    if (res.success) {
      toast.success("Projeto atualizado.");
      onSaved?.();
      onClose();
    } else {
      toast.error(res.error || "Falha ao salvar.");
    }
  };

  return (
    <Dialog isOpen={!!projectId} onClose={onClose} title="Editar Projeto" className="max-w-2xl">
      {loading ? (
        <p className="text-sm text-brand-text-muted py-6 text-center">Carregando...</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className={label}>Nome do projeto</label>
              <input className={field} value={form.name} onChange={set("name")} />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <label className={label}>Produto(s) — catálogo do ERP</label>
              {catalog.length === 0 ? (
                <p className="text-xs text-brand-text-muted">Nenhum produto cadastrado no ERP.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {catalog.map((c: any) => {
                    const on = isSelected(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        role="switch"
                        aria-checked={on}
                        onClick={() => toggleProduct(c.id)}
                        className={
                          "flex items-center gap-2 px-3 py-2 rounded border text-xs font-bold uppercase transition-colors " +
                          (on ? "border-brand-accent bg-brand-accent/10 text-brand-accent" : "border-brand-border text-brand-text-muted hover:text-white")
                        }
                      >
                        <span
                          className={"relative inline-block w-7 h-4 rounded-full transition-colors " + (on ? "bg-brand-accent" : "bg-brand-border")}
                        >
                          <span className={"absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all " + (on ? "left-3.5" : "left-0.5")} />
                        </span>
                        {c.commercialName}
                      </button>
                    );
                  })}
                </div>
              )}
              {multi && (
                <div className="mt-2 space-y-2 p-3 rounded border border-brand-border bg-brand-bg/40">
                  <p className="text-[10px] font-bold uppercase text-brand-text-muted">Quantidade por modelo (por ciclo)</p>
                  {selected.map((s) => {
                    const c = catalog.find((x: any) => x.id === s.productId);
                    return (
                      <div key={s.productId} className="flex items-center justify-between gap-3">
                        <span className="text-sm text-white">{c?.commercialName || "Produto"}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={s.quantity}
                            onChange={(e) => setQty(s.productId, e.target.value)}
                            className={field + " w-24"}
                          />
                          <span className="text-xs text-brand-text-muted">un.</span>
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-[10px] text-brand-text-muted text-right">Total: {mixTotal} un. por ciclo</p>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className={label}>Status</label>
              <select className={field} value={form.status} onChange={set("status")}>
                <option value="ACTIVE">Ativo</option>
                <option value="PAUSED">Pausado</option>
                <option value="COMPLETED">Concluído</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className={label}>Capital do aporte (R$)</label>
              <input className={field} value={form.initialCapital} onChange={set("initialCapital")} inputMode="decimal" />
            </div>
            <div className="space-y-1">
              <label className={label}>Participação do investidor (%)</label>
              <input className={field} value={form.profitSplitPct} onChange={set("profitSplitPct")} inputMode="decimal" />
            </div>
            <div className="space-y-1">
              <label className={label}>Máximo de ciclos</label>
              <input className={field} type="number" min={Math.max(1, lotsCount)} step={1} value={form.maxCycles} onChange={set("maxCycles")} />
              {lotsCount > 0 && <p className="text-[10px] text-brand-text-muted">{lotsCount} ciclo(s) já aberto(s)</p>}
            </div>
            <div className="space-y-1">
              <label className={label}>Qtd. do próximo ciclo</label>
              <input className={field} type="number" min={1} step={1} value={form.nextCycleQuantity} onChange={set("nextCycleQuantity")} placeholder="Repete o último" />
            </div>
            <div className="space-y-1">
              <label className={label}>Regra de pagamento</label>
              <select className={field} value={form.payoutRule} onChange={set("payoutRule")}>
                <option value="REINVEST">Reinvestir</option>
                <option value="PAYOUT">Sacar</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className={label}>Data de início</label>
              <input className={field} type="date" value={form.startDate} onChange={set("startDate")} />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className={label}>Nº do contrato</label>
              <input className={field} value={form.contractNumber} onChange={set("contractNumber")} />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className={label}>Observações</label>
              <textarea className={field} rows={3} value={form.notes} onChange={set("notes")} />
            </div>
          </div>
          <p className="text-[10px] text-brand-text-muted uppercase">
            Lotes, armas e ciclos registrados não são alterados aqui.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 rounded-[2px] font-bold uppercase text-sm border border-brand-border text-brand-text-secondary">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-[2px] font-bold uppercase text-sm bg-brand-accent text-brand-bg disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
