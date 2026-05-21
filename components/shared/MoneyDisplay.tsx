"use client";

import { formatMoney } from "@/lib/calculations";

interface MoneyDisplayProps {
  value: number;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  colored?: boolean;
  noSymbol?: boolean;
}

const sizes = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl font-bold",
  xl: "text-5xl font-extrabold",
};

export function MoneyDisplay({ value, className = "", size = "md", colored = false, noSymbol = false }: MoneyDisplayProps) {
  const safe = !isFinite(value) || isNaN(value) ? 0 : value;
  const color = colored ? (safe >= 0 ? "text-green-400" : "text-red-400") : "";
  const formatted = noSymbol ? safe.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : formatMoney(safe);
  return (
    <span
      className={`font-mono tracking-tight ${sizes[size]} ${color} ${className}`}
      style={{ fontFamily: "'Roboto Mono', monospace" }}
    >
      {formatted}
    </span>
  );
}
