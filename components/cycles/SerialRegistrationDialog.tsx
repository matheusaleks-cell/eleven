"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { registerLotSerials } from "@/app/admin/importacao/lotes/actions";

const label = "text-[10px] font-bold uppercase tracking-widest text-brand-text-muted";
const field =
  "w-full bg-brand-input border border-brand-border rounded px-3 py-2 text-sm text-white outline-none focus:border-brand-accent";

// Cadastro das séries (armas) do lote de um ciclo, direto do card do ciclo em andamento.
// Separado do fechamento: as séries entram quando as armas chegam; o fechamento só no fim.
export function SerialRegistrationDialog({
  lot,
  cycleLabel,
  onClose,
  onSaved,
}: {
  lot: any | null;
  cycleLabel?: string;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [productId, setProductId] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const products: any[] = lot?.products || [];
  const registered: any[] = lot?.weapons || [];
  const expected: number = lot?.quantityItems || 0;
  const remaining = Math.max(0, expected - registered.length);

  useEffect(() => {
    setText("");
    setProductId(products.length === 1 ? products[0].id : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lot?.id]);

  const parsed = useMemo(() => text.split(/[\n,;]/).map((s) => s.trim()).filter(Boolean), [text]);
  const repeated = useMemo(() => [...new Set(parsed.filter((s, i) => parsed.indexOf(s) !== i))], [parsed]);
  const alreadyThere = useMemo(() => {
    const set = new Set(registered.map((w) => w.serialNumber));
    return parsed.filter((s) => set.has(s));
  }, [parsed, registered]);
  const tooMany = expected > 0 && parsed.length > remaining;

  const handleSave = async () => {
    if (!lot) return;
    if (!productId) return toast.error("Selecione o produto.");
    if (parsed.length === 0) return toast.error("Informe ao menos um número de série.");
    if (repeated.length > 0) return toast.error(`Série repetida na lista: ${repeated.join(", ")}`);
    if (tooMany) return toast.error(`Faltam só ${remaining} série(s) para completar o lote.`);
    setSaving(true);
    const res: any = await registerLotSerials(lot.id, productId, parsed);
    setSaving(false);
    if (res.success) {
      toast.success(`${res.count ?? parsed.length} arma(s) cadastrada(s) no ${lot.batchCode}.`);
      setText("");
      onSaved?.();
      onClose();
    } else {
      toast.error(res.error || "Erro ao cadastrar as séries.");
    }
  };

  return (
    <Dialog isOpen={!!lot} onClose={onClose} title="Cadastrar Séries" className="max-w-xl">
      {lot && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded border border-brand-border bg-brand-bg/40">
              <p className={label}>Ciclo / Lote</p>
              <p className="text-xs font-bold text-white mt-1">{cycleLabel || "—"}</p>
              <p className="text-[11px] font-mono text-brand-text-secondary">{lot.batchCode}</p>
            </div>
            <div className="p-3 rounded border border-brand-border bg-brand-bg/40">
              <p className={label}>Cadastradas</p>
              <p className="text-xl font-bold font-mono text-white">{registered.length}<span className="text-sm text-brand-text-muted"> / {expected || "?"}</span></p>
            </div>
            <div className="p-3 rounded border border-brand-border bg-brand-bg/40">
              <p className={label}>Faltam</p>
              <p className={"text-xl font-bold font-mono " + (remaining > 0 ? "text-brand-warning" : "text-brand-success")}>{remaining}</p>
            </div>
          </div>

          <div className="space-y-1">
            <label className={label}>Produto</label>
            <select className={field} value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Selecione...</option>
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>{p.commercialName}{p.sku ? ` — ${p.sku}` : ""}</option>
              ))}
            </select>
            {products.length === 0 && (
              <p className="text-[11px] text-brand-warning">Este lote não tem produto vinculado. Ajuste o lote em Importação → Lotes.</p>
            )}
          </div>

          <div className="space-y-1">
            <label className={label}>Números de série (1 por linha, ou separados por vírgula)</label>
            <textarea
              className={field + " font-mono"}
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"599-H26PD-32\n599-H26PD-33\n..."}
            />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
              <span className="text-brand-text-secondary">{parsed.length} série(s) na lista</span>
              {repeated.length > 0 && <span className="text-brand-danger">Repetidas: {repeated.join(", ")}</span>}
              {alreadyThere.length > 0 && <span className="text-brand-danger">Já cadastradas neste lote: {alreadyThere.join(", ")}</span>}
              {tooMany && <span className="text-brand-danger">Passa da quantidade do lote (faltam {remaining})</span>}
            </div>
          </div>

          {registered.length > 0 && (
            <details className="rounded border border-brand-border bg-brand-bg/40">
              <summary className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-brand-text-muted cursor-pointer">
                Ver séries já cadastradas ({registered.length})
              </summary>
              <div className="px-3 pb-3 max-h-40 overflow-y-auto text-[11px] font-mono text-brand-text-secondary leading-relaxed">
                {registered.map((w: any) => w.serialNumber).join(", ")}
              </div>
            </details>
          )}

          <p className="text-[10px] text-brand-text-muted uppercase">
            As armas entram em estoque no lote deste ciclo, com o custo unitário do lote.
          </p>

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-[2px] font-bold uppercase text-sm border border-brand-border text-brand-text-secondary">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || parsed.length === 0 || repeated.length > 0 || tooMany || !productId}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[2px] font-bold uppercase text-sm bg-brand-accent text-brand-bg disabled:opacity-50"
            >
              <Plus size={14} /> {saving ? "Cadastrando..." : `Cadastrar ${parsed.length || ""} série(s)`}
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
