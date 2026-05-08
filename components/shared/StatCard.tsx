"use client";

import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: ReactNode;
  icon: ReactNode;
  sub?: string;
  accent?: boolean;
}

export function StatCard({ title, value, icon, sub, accent = false }: StatCardProps) {
  return (
    <div
      className="rounded-[4px] p-6 transition-all"
      style={{
        background: "#242424",
        border: "1px solid #333",
        borderLeft: accent ? "4px solid #F5C400" : "1px solid #333",
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <p
          style={{
            color: "#A0A0A0",
            fontSize: "11px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 600,
          }}
        >
          {title}
        </p>
        <div
          className="p-2.5 rounded-[2px]"
          style={{
            background: "rgba(245,196,0,0.08)",
            color: "#F5C400",
          }}
        >
          {icon}
        </div>
      </div>
      <div style={{ marginBottom: sub ? 8 : 0 }}>
        {typeof value === "string" || typeof value === "number" ? (
          <p
            style={{
              color: "#FFFFFF",
              fontFamily: "'Roboto Mono', monospace",
              fontWeight: 700,
              fontSize: "24px",
            }}
          >
            {value}
          </p>
        ) : (
          value
        )}
      </div>
      {sub && (
        <p
          style={{
            color: "#555",
            fontSize: "12px",
            fontFamily: "'Rajdhani', sans-serif",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
