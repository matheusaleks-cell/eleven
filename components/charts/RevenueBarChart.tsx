"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface RevenueBarChartProps {
  data: any[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0]?.value ?? 0;
    const formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(value);

    return (
      <div
        style={{
          background: "#1A1A1A",
          border: "1px solid #333",
          borderRadius: "4px",
          padding: "10px 14px",
          fontFamily: "'Rajdhani', sans-serif",
        }}
      >
        <p style={{ color: "#606060", fontSize: "12px", marginBottom: 4 }}>{label}</p>
        <p style={{ color: "#F5C400", fontSize: "16px", fontWeight: 700 }}>{formatted}</p>
      </div>
    );
  }
  return null;
};

export function RevenueBarChart({ data, height = 300 }: RevenueBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#444",
          fontFamily: "'Rajdhani', sans-serif",
        }}
      >
        Aguardando dados...
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#444"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            dy={10}
            tick={{ fontFamily: "'Rajdhani', sans-serif", fill: "#606060" }}
          />
          <YAxis
            stroke="#444"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tick={{ fontFamily: "'Rajdhani', sans-serif", fill: "#606060" }}
            tickFormatter={(v) =>
              new Intl.NumberFormat("pt-BR", {
                notation: "compact",
                compactDisplay: "short",
                maximumFractionDigits: 0,
              }).format(v)
            }
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="value" radius={[3, 3, 0, 0]} animationDuration={1200}>
            {data.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === data.length - 1 ? "#F5C400" : "#8B7000"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
