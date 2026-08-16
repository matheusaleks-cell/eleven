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
      className="rounded-[4px] transition-all"
      style={{
        background: "#242424",
        border: "1px solid #333",
        borderLeft: accent ? "4px solid #F5C400" : "1px solid #333",
        padding: "var(--space-5)",
      }}
    >
      <div className="flex items-start justify-between" style={{ marginBottom: "var(--space-4)" }}>
        <p
          style={{
            color: "#A0A0A0",
            fontSize: "var(--font-body-sm-size)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
          }}
        >
          {title}
        </p>
        <div
          className="rounded-[2px]"
          style={{
            background: "rgba(245,196,0,0.08)",
            color: "#F5C400",
            padding: "var(--space-2)",
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
              fontWeight: 800,
              fontSize: "32px",
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
            color: "#666",
            fontSize: "14px",
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 500,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
