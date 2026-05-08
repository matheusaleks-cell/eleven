"use client";

type Status = "ACTIVE" | "COMPLETED" | "PENDING" | "CANCELLED" | "IN_PROGRESS";

const statusMap: Record<Status, { label: string; bg: string; color: string; border: string }> = {
  ACTIVE: {
    label: "ATIVO",
    bg: "rgba(245,196,0,0.1)",
    color: "#F5C400",
    border: "rgba(245,196,0,0.35)",
  },
  COMPLETED: {
    label: "CONCLUÍDO",
    bg: "rgba(76,175,80,0.1)",
    color: "#4CAF50",
    border: "rgba(76,175,80,0.35)",
  },
  PENDING: {
    label: "PENDENTE",
    bg: "rgba(96,96,96,0.15)",
    color: "#A0A0A0",
    border: "rgba(96,96,96,0.35)",
  },
  IN_PROGRESS: {
    label: "EM ANDAMENTO",
    bg: "rgba(245,196,0,0.1)",
    color: "#F5C400",
    border: "rgba(245,196,0,0.35)",
  },
  CANCELLED: {
    label: "CANCELADO",
    bg: "rgba(229,57,53,0.1)",
    color: "#E53935",
    border: "rgba(229,57,53,0.35)",
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const cfg = statusMap[status] ?? statusMap.PENDING;
  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        fontSize: "11px",
        letterSpacing: "0.1em",
        padding: "2px 8px",
        borderRadius: "2px",
        fontWeight: 700,
        fontFamily: "'Rajdhani', sans-serif",
        display: "inline-block",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}
