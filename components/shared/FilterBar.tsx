"use client";

import { Calendar, Users, X, Filter as FilterIcon } from "lucide-react";
import { mockUsers } from "@/lib/mock-data";

interface FilterBarProps {
  startDate: string;
  endDate: string;
  investorId: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onInvestorChange: (val: string) => void;
  onClear: () => void;
  onFilter?: () => void;
  showInvestorFilter?: boolean;
  investors?: Array<{ id: string; name: string }>;
}

export function FilterBar({
  startDate,
  endDate,
  investorId,
  onStartDateChange,
  onEndDateChange,
  onInvestorChange,
  onClear,
  onFilter,
  showInvestorFilter = true,
  investors = [],
}: FilterBarProps) {

  const inputBaseStyle = {
    background: "#242424",
    border: "1px solid #333",
    borderRadius: "2px",
    color: "#FFFFFF",
    padding: "8px 12px",
    fontSize: "14px",
    fontFamily: "'Rajdhani', sans-serif",
    outline: "none",
    height: "40px",
  };

  return (
    <div
      className="flex flex-wrap items-end rounded-[4px]"
      style={{ background: "#1E1E1E", border: "1px solid #2A2A2A", padding: "var(--space-5)", gap: "var(--space-5)" }}
    >
      {/* Período */}
      <div className="flex flex-col gap-1.5">
        <label style={{ color: "#888", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: "'Rajdhani', sans-serif" }}>
          Início
        </label>
        <div className="relative">
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            style={{ ...inputBaseStyle, paddingLeft: "36px", width: "160px" }}
          />
          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#F5C400" }} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label style={{ color: "#888", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: "'Rajdhani', sans-serif" }}>
          Fim
        </label>
        <div className="relative">
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            style={{ ...inputBaseStyle, paddingLeft: "36px", width: "160px" }}
          />
          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#F5C400" }} />
        </div>
      </div>

      {/* Investidor (apenas para Admin) */}
      {showInvestorFilter && (
        <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
          <label style={{ color: "#888", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: "'Rajdhani', sans-serif" }}>
            Investidor
          </label>
          <div className="relative">
            <select
              value={investorId}
              onChange={(e) => onInvestorChange(e.target.value)}
              style={{ ...inputBaseStyle, paddingLeft: "36px", width: "100%", appearance: "none", cursor: "pointer" }}
            >
              <option value="ALL">Todos os Investidores</option>
              {investors.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.name}
                </option>
              ))}
            </select>
            <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#F5C400" }} />
          </div>
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-2">
        <button
          onClick={onClear}
          title="Limpar Filtros"
          style={{
            height: "40px",
            width: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "1px solid #333",
            borderRadius: "2px",
            color: "#606060",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.color = "#FFFFFF"}
          onMouseOut={(e) => e.currentTarget.style.color = "#606060"}
        >
          <X size={18} />
        </button>

        <button
          onClick={onFilter}
          style={{
            height: "40px",
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#F5C400",
            border: "none",
            borderRadius: "2px",
            color: "#1A1A1A",
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            cursor: "pointer",
            transition: "all 0.15s"
          }}
          onMouseOver={(e) => e.currentTarget.style.background = "#D4A900"}
          onMouseOut={(e) => e.currentTarget.style.background = "#F5C400"}
        >
          <FilterIcon size={14} />
          Filtrar
        </button>
      </div>
    </div>
  );
}
