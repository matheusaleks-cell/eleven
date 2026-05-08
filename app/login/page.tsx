"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Shield } from "lucide-react";


const USERS = [
  { email: "admin@elevenfirearms.com.br", password: "Admin@123", role: "ADMIN", name: "Administrador" },
  { email: "francisco@email.com", password: "Invest@123", role: "INVESTOR", name: "Francisco" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Find user in mock USERS
      const user = USERS.find(u => u.email === email && u.password === password);
      
      if (!user) {
        setError("E-mail ou senha inválidos.");
        setLoading(false);
        return;
      }

      // Set session in localStorage
      localStorage.setItem("eleven_session", JSON.stringify({
        email: user.email,
        name: user.name,
        role: user.role
      }));

      // Redirect based on role
      if (user.role === "ADMIN") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/investidor";
      }
    } catch (err) {
      setError("Ocorreu um erro ao tentar entrar.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "#111111" }}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 40px,
            #F5C400 40px,
            #F5C400 41px
          ), repeating-linear-gradient(
            90deg,
            transparent,
            transparent 40px,
            #F5C400 40px,
            #F5C400 41px
          )`,
        }}
      />

      {/* Accent line top */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "#F5C400" }} />

      <div
        className="relative w-full max-w-sm mx-4 animate-fade-in"
        style={{ animationDelay: "0.1s" }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="mb-6 p-6 rounded-[4px]"
            style={{ background: "rgba(245,196,0,0.06)", border: "1px solid rgba(245,196,0,0.15)" }}
          >
            <Image
              src="/logos/logo-alta-a.png"
              alt="Eleven Firearms"
              width={160}
              height={52}
              className="object-contain animate-fade-in"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </div>
          <p
            style={{
              color: "#F5C400",
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
            }}
          >
            ★ Sistema de Gestão de Investimentos ★
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-[4px] p-8"
          style={{
            background: "#1A1A1A",
            border: "1px solid #2A2A2A",
            borderTop: "3px solid #F5C400",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
          }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Shield size={16} style={{ color: "#F5C400" }} />
            <h1
              style={{
                color: "#FFFFFF",
                fontSize: "18px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: "'Rajdhani', sans-serif",
              }}
            >
              Acesso ao Sistema
            </h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label
                style={{
                  color: "#A0A0A0",
                  fontSize: "11px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                E-mail
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#606060" }}
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  className="input-base pl-10"
                  style={{
                    background: "#0F0F0F",
                    border: "1px solid #2A2A2A",
                    color: "#FFFFFF",
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: 15,
                  }}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label
                style={{
                  color: "#A0A0A0",
                  fontSize: "11px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Senha
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#606060" }}
                />
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="input-base pl-10 pr-10"
                  style={{
                    background: "#0F0F0F",
                    border: "1px solid #2A2A2A",
                    color: "#FFFFFF",
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: 15,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#606060", background: "none", border: "none", cursor: "pointer" }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-[2px]"
                style={{ background: "rgba(229,57,53,0.1)", border: "1px solid rgba(229,57,53,0.3)" }}
              >
                <span style={{ color: "#E53935", fontSize: 13, fontFamily: "'Rajdhani', sans-serif" }}>
                  {error}
                </span>
              </div>
            )}

            <button
              id="btn-login"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-[2px] font-bold uppercase tracking-widest transition-all duration-150 mt-2"
              style={{
                background: loading ? "#D4A900" : "#F5C400",
                color: "#1A1A1A",
                fontSize: "14px",
                letterSpacing: "0.15em",
                fontFamily: "'Rajdhani', sans-serif",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
              }}
              onMouseOver={(e) => {
                if (!loading) (e.currentTarget as HTMLElement).style.background = "#D4A900";
              }}
              onMouseOut={(e) => {
                if (!loading) (e.currentTarget as HTMLElement).style.background = "#F5C400";
              }}
            >
              {loading ? "Verificando..." : "★ Entrar"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p
          className="text-center mt-6"
          style={{ color: "#333", fontSize: "12px", fontFamily: "'Rajdhani', sans-serif" }}
        >
          Eleven Firearms © 2025 · Acesso restrito
        </p>

        {/* Demo credentials */}
        <div
          className="mt-4 p-3 rounded-[2px]"
          style={{ background: "rgba(245,196,0,0.04)", border: "1px solid #2A2A2A" }}
        >
          <p style={{ color: "#606060", fontSize: "11px", fontFamily: "'Rajdhani', sans-serif", marginBottom: 4 }}>
            ACESSO DEMO:
          </p>
          <p style={{ color: "#A0A0A0", fontSize: "12px", fontFamily: "'Roboto Mono', monospace" }}>
            Admin: admin@elevenfirearms.com.br / Admin@123
          </p>
          <p style={{ color: "#A0A0A0", fontSize: "12px", fontFamily: "'Roboto Mono', monospace" }}>
            Investidor: francisco@email.com / Invest@123
          </p>
        </div>
      </div>
    </div>
  );
}
