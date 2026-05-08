"use client";

import { formatMoney } from "@/lib/calculations";

interface MoneyDisplayProps {
  value: number;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  colored?: boolean;
}

const sizes = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-3xl font-bold",
};

export function MoneyDisplay({ value, className = "", size = "md", colored = false }: MoneyDisplayProps) {
  const color = colored ? (value >= 0 ? "text-green-400" : "text-red-400") : "";
  return (
    <span
      className={`font-mono tracking-tight ${sizes[size]} ${color} ${className}`}
      style={{ fontFamily: "'Roboto Mono', monospace" }}
    >
      {formatMoney(value)}
    </span>
  );
}
