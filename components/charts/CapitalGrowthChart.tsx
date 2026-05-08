"use client";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface CapitalGrowthChartProps {
  data: any[];
  height?: number;
}

// Tooltip customizado com formatação em R$
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

export function CapitalGrowthChart({ data, height = 300 }: CapitalGrowthChartProps) {
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
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#F5C400" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#F5C400" stopOpacity={0} />
            </linearGradient>
          </defs>
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
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="capital"
            stroke="#F5C400"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorCapital)"
            dot={{ fill: "#F5C400", strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: "#F5C400", stroke: "#1A1A1A", strokeWidth: 2 }}
            animationDuration={1200}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
