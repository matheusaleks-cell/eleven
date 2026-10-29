"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link2, Unlink } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/calculations";
import {
  getUnlinkedLots,
  linkLotToProject,
  unlinkLotFromProject,
} from "@/app/admin/projetos/actions";

type UnlinkedLot = Awaited<ReturnType<typeof getUnlinkedLots>>[number];

interface LinkedLot {
  id: string;
  batchCode: string;
  status: string;
  weapons?: { currentStatus: string; saleValue: number | null }[];
}

interface LinkLotDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  investorName: string;
  linkedLots: LinkedLot[];
  onChanged: () => void;
}

// Liga um lote existente (sem projeto) a este projeto, ou desfaz um vínculo. Serve para
// recuperar o lote de um projeto excluído sem mexer nas armas: elas ficam presas ao lote.
export function LinkLotDialog({
  isOpen,
  onClose,
  projectId,
  projectName,
  investorName,
  linkedLots,
  onChanged,
}: LinkLotDialogProps) {
  const [lots, setLots] = useState<UnlinkedLot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadLots = async () => {
    setLoading(true);
    try {
      setLots(await getUnlinkedLots());
    } catch {
      toast.error("Erro ao carregar os lotes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedId(null);
      loadLots();
    }
  }, [isOpen]);

  const selected = lots.find((l) => l.id === selectedId) || null;

  const handleLink = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await linkLotToProject(selected.id, projectId);
      if (res.success) {
        toast.success(`Lote ${selected.batchCode} vinculado ao projeto.`);
        setSelectedId(null);
        await loadLots();
        onChanged();
      } else {
        toast.error(res.error || "Erro ao vincular o lote.");
      }
    } catch {
      toast.error("Erro na comunicação com o servidor.");
    } finally {
      setBusy(false);
    }
  };

  const handleUnlink = async (lot: LinkedLot) => {
    if (!confirm(`Desvincular o lote ${lot.batchCode} deste projeto?\n\nEle volta a ser estoque próprio e deixa de aparecer para o investidor.`)) return;
    setBusy(true);
    try {
      const res = await unlinkLotFromProject(lot.id);
      if (res.success) {
        toast.success(`Lote ${lot.batchCode} desvinculado.`);
        await loadLots();
        onChanged();
      } else {
        toast.error(res.error || "Erro ao desvincular o lote.");
      }
    } catch {
      toast.error("Erro na comunicação com o servidor.");
    } finally {
      setBusy(false);
    }
  };

  const labelClass = "text-[10px] font-black text-brand-text-muted uppercase tracking-[0.2em]";

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Vincular lote ao projeto" className="max-w-2xl">
      <div className="space-y-6">
        <p className="text-xs text-brand-text-secondary leading-relaxed">
          Projeto <strong className="text-white">{projectName}</strong> · Investidor{" "}
          <strong className="text-white">{investorName}</strong>. As armas e vendas do lote acompanham o
          vínculo: o que foi vendido nele passa a contar para este investidor.
        </p>

        {/* Lotes já vinculados */}
        <section className="space-y-2">
          <h3 className={labelClass}>Lotes vinculados a este projeto</h3>
          {linkedLots.length === 0 ? (
            <p className="text-xs text-brand-text-muted">Nenhum lote vinculado.</p>
          ) : (
            linkedLots.map((lot) => {
              const sold = (lot.weapons || []).filter((w) => w.currentStatus === "VENDIDA");
              return (
                <div
                  key={lot.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded border border-brand-border bg-brand-bg/40"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white font-mono">{lot.batchCode}</p>
                    <p className="text-[10px] text-brand-text-muted uppercase">
                      {lot.status} · {(lot.weapons || []).length} arma(s) · {sold.length} vendida(s)
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    className="h-auto py-1.5 px-3 gap-1.5 text-[10px] font-bold uppercase shrink-0"
                    disabled={busy}
                    onClick={() => handleUnlink(lot)}
                  >
                    <Unlink size={12} /> Desvincular
                  </Button>
                </div>
              );
            })
          )}
        </section>

        {/* Lotes sem projeto */}
        <section className="space-y-2">
          <h3 className={labelClass}>Lotes sem projeto</h3>
          {loading ? (
            <p className="text-xs text-brand-text-muted">Carregando lotes...</p>
          ) : lots.length === 0 ? (
            <p className="text-xs text-brand-text-muted">Nenhum lote disponível para vincular.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {lots.map((lot) => (
                <button
                  key={lot.id}
                  type="button"
                  onClick={() => setSelectedId(lot.id === selectedId ? null : lot.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded border transition-colors",
                    lot.id === selectedId
                      ? "border-brand-accent bg-brand-accent/10"
                      : "border-brand-border bg-brand-bg/40 hover:border-brand-accent/40"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-white font-mono">{lot.batchCode}</p>
                    <span className="text-[9px] font-bold uppercase text-brand-text-muted">{lot.status}</span>
                  </div>
                  <p className="text-[11px] text-brand-text-secondary mt-0.5">
                    {lot.weapons > 0
                      ? `${lot.weapons} arma(s): ${lot.sold} vendida(s) (${formatMoney(lot.soldValue)}) · ${lot.reserved} reservada(s) · ${lot.inStock} em estoque`
                      : `Sem armas cadastradas · ${lot.quantityItems} un. declaradas`}
                  </p>
                  <p className="text-[10px] text-brand-text-muted mt-0.5">
                    Custo {formatMoney(lot.totalCost)} · criado em {new Date(lot.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        {selected && (
          <div className="p-3 rounded border border-brand-warning/30 bg-brand-warning/5 space-y-3">
            <p className="text-[11px] text-white/90 leading-relaxed">
              Ao vincular, <strong>{selected.weapons} arma(s)</strong> e{" "}
              <strong>{selected.sold} venda(s) ({formatMoney(selected.soldValue)})</strong> do lote{" "}
              <strong>{selected.batchCode}</strong> passam a contar para <strong>{investorName}</strong> neste
              projeto e aparecem no painel dele. Nenhum ciclo é criado automaticamente.
            </p>
            <Button
              className="w-full gap-2 text-[11px] font-black uppercase tracking-widest"
              disabled={busy}
              onClick={handleLink}
            >
              <Link2 size={14} /> {busy ? "Vinculando..." : "Vincular ao projeto"}
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
