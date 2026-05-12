"use client";

import { useState, useEffect } from "react";
import { Menu, Bell } from "lucide-react";
import Image from "next/image";
import { getGlobalHeaderStats } from "@/app/admin/actions";
import { MoneyDisplay } from "@/components/shared/MoneyDisplay";

interface HeaderProps {
  onMobileMenuOpen: () => void;
  userName: string;
  role: "ADMIN" | "INVESTOR";
  pageTitle?: string;
}

export function Header({ onMobileMenuOpen, userName, role, pageTitle }: HeaderProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  const [stats, setStats] = useState({ monthlySales: 0, inventoryValue: 0, averageMargin: 32.5, lastUsdRate: 5.82 });

  useEffect(() => {
    const checkScreen = () => setIsDesktop(window.innerWidth >= 1024);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    
    // Carregar estatísticas reais do banco
    const loadStats = async () => {
      try {
        const data = await getGlobalHeaderStats();
        setStats(data);
      } catch (error) {
        console.error("Erro ao carregar stats do header");
      }
    };
    
    loadStats();

    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        height: 80,
        background: "#161616",
        borderBottom: "1px solid #242424",
        gap: 24,
      }}
    >
      {/* Left side */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
        {/* Mobile hamburger - show only if NOT desktop */}
        {!isDesktop && (
          <button
            onClick={onMobileMenuOpen}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px",
              border: "1px solid #2A2A2A",
              borderRadius: "2px",
              background: "transparent",
              color: "#A0A0A0",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Menu size={18} />
          </button>
        )}

        {/* Mobile logo - show only if NOT desktop */}
        {!isDesktop && (
          <div>
            <Image
              src="/logos/logo-alta-a.png"
              alt="Eleven Firearms"
              width={100}
              height={32}
              style={{ objectFit: "contain", filter: "brightness(0) invert(1)", width: "auto", height: "32px" }}
            />
          </div>
        )}

        {/* Page title — show only on desktop */}
        {isDesktop && pageTitle && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                color: "#555",
                fontSize: "12px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: "'Rajdhani', sans-serif",
              }}
            >
              {role === "ADMIN" ? "Admin" : "Investidor"}
            </span>
            <span style={{ color: "#333", fontSize: "16px" }}>/</span>
            <span
              style={{
                color: "#FFFFFF",
                fontSize: "15px",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontFamily: "'Rajdhani', sans-serif",
              }}
            >
              {pageTitle}
            </span>
          </div>
        )}
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        
        {isDesktop && role === "ADMIN" && (
          <div style={{ display: "flex", alignItems: "center", gap: 20, paddingRight: 20, borderRight: "1px solid #242424" }}>
            {/* Margem Média */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span style={{ color: "#555", fontSize: "9px", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.1em", lineHeight: 1 }}>MARGEM MÉDIA</span>
              <span style={{ color: "#F5C400", fontSize: "14px", fontWeight: 700, fontFamily: "'Roboto Mono', monospace", lineHeight: 1.2 }}>{stats.averageMargin}%</span>
            </div>

            {/* Patrimônio */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span style={{ color: "#555", fontSize: "9px", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.1em", lineHeight: 1 }}>PATRIMÔNIO (ESTOQUE)</span>
              <div style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 700, fontFamily: "'Roboto Mono', monospace", lineHeight: 1.2 }}>
                <MoneyDisplay value={stats.inventoryValue} size="sm" noSymbol />
              </div>
            </div>

            {/* Vendas Mês */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span style={{ color: "#555", fontSize: "9px", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.1em", lineHeight: 1 }}>VENDAS MÊS</span>
              <div style={{ color: "#4CAF50", fontSize: "14px", fontWeight: 700, fontFamily: "'Roboto Mono', monospace", lineHeight: 1.2 }}>
                <MoneyDisplay value={stats.monthlySales} size="sm" />
              </div>
            </div>
          </div>
        )}

        {/* Market Rate Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", borderRight: "1px solid #242424", marginRight: 4 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ color: "#555", fontSize: "10px", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.05em", lineHeight: 1 }}>USD ATUAL</span>
            <span style={{ color: "#4CAF50", fontSize: "14px", fontWeight: 700, fontFamily: "'Roboto Mono', monospace", lineHeight: 1.2 }}>R$ {stats.lastUsdRate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4CAF50", boxShadow: "0 0 6px #4CAF50" }} />
        </div>

        {/* User info */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(245,196,0,0.12)",
              border: "1px solid rgba(245,196,0,0.25)",
              color: "#F5C400",
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: "15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          {isDesktop && (
            <div>
              <p
                style={{
                  color: "#FFFFFF",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  lineHeight: "1.2",
                  whiteSpace: "nowrap",
                }}
              >
                {userName}
              </p>
              <p
                style={{
                  color: "#555",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                }}
              >
                {role === "ADMIN" ? "Administrador" : "Investidor"}
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
