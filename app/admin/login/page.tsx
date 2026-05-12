"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, ShieldAlert } from "lucide-react";

const USERS = [
  { email: "admin@elevenfirearms.com.br", password: "password123", role: "ADMIN", name: "Administrador Master" },
];

export default function AdminLoginPage() {
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
      const user = USERS.find(u => u.email === email && u.password === password);
      
      if (!user) {
        setError("Credenciais administrativas inválidas.");
        setLoading(false);
        return;
      }

      localStorage.setItem("eleven_session", JSON.stringify({
        email: user.email,
        name: user.name,
        role: user.role
      }));

      window.location.href = "/admin";
    } catch (err) {
      setError("Erro ao tentar entrar no painel administrativo.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{ background: "#050505" }}
    >
      {/* Background pattern - refined grid for admin */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(#F5C400 1px, transparent 1px), linear-gradient(90deg, #F5C400 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />
      
      {/* Intense glow for Admin */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-[0.07] blur-[150px]"
        style={{ background: '#F5C400' }}
      />

      <div
        className="relative w-full max-w-sm animate-fade-in"
        style={{ animationDelay: "0.1s" }}
      >
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="mb-6 transform hover:scale-105 transition-transform duration-700">
            <Image
              src="/logos/logo-vertical-white.png"
              alt="Eleven Firearms"
              width={160}
              height={160}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-center gap-4">
             <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[#F5C400]/40 to-[#F5C400]/60" />
             <p
               style={{
                 color: "#F5C400",
                 fontSize: "11px",
                 letterSpacing: "0.6em",
                 textTransform: "uppercase",
                 fontFamily: "'Rajdhani', sans-serif",
                 fontWeight: 700,
               }}
             >
               Painel Master
             </p>
             <div className="h-[1px] w-12 bg-gradient-to-l from-transparent via-[#F5C400]/40 to-[#F5C400]/60" />
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "rgba(20, 20, 20, 0.9)",
            backdropFilter: "blur(25px)",
            border: "1px solid rgba(245, 196, 0, 0.15)",
            boxShadow: "0 50px 100px -30px rgba(0, 0, 0, 0.9)",
          }}
        >
          {/* Card Header Top Border - Dual color for Master */}
          <div className="bg-gradient-to-r from-[#D4A900] via-[#F5C400] to-[#D4A900] h-[3px] w-full" />
          
          <div className="p-10">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-xl bg-[#F5C400]/10 flex items-center justify-center border border-[#F5C400]/30 shadow-[0_0_20px_rgba(245,196,0,0.1)]">
                <ShieldCheck size={24} className="text-[#F5C400]" />
              </div>
              <div>
                <h1
                  style={{
                    color: "#FFFFFF",
                    fontSize: "22px",
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    fontFamily: "'Rajdhani', sans-serif",
                    lineHeight: 1
                  }}
                >
                  Acesso Master
                </h1>
                <p style={{ color: '#444', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px', fontWeight: 600 }}>Nível de Segurança: Máximo</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-8">
              {/* Email */}
              <div className="space-y-3">
                <label
                  style={{
                    color: "#555",
                    fontSize: "11px",
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    display: "block",
                  }}
                >
                  Identificador Admin
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <Mail size={18} className="text-[#333] transition-colors duration-300 group-focus-within:text-[#F5C400]" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@elevenfirearms.com.br"
                    style={{
                        paddingLeft: '56px',
                        paddingRight: '16px',
                        paddingTop: '16px',
                        paddingBottom: '16px',
                        background: '#080808',
                        border: '1px solid #222',
                        borderRadius: '8px',
                        color: '#FFF',
                        width: '100%',
                        fontSize: '15px',
                        fontFamily: "'Rajdhani', sans-serif",
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        outline: 'none'
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(245, 196, 0, 0.6)';
                        e.currentTarget.style.boxShadow = '0 0 25px rgba(245, 196, 0, 0.08)';
                        e.currentTarget.style.background = '#0C0C0C';
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#222';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.background = '#080808';
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-3">
                <label
                  style={{
                    color: "#555",
                    fontSize: "11px",
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    display: "block",
                  }}
                >
                  Assinatura Digital
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <Lock size={18} className="text-[#333] transition-colors duration-300 group-focus-within:text-[#F5C400]" />
                  </div>
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{
                        paddingLeft: '56px',
                        paddingRight: '56px',
                        paddingTop: '16px',
                        paddingBottom: '16px',
                        background: '#080808',
                        border: '1px solid #222',
                        borderRadius: '8px',
                        color: '#FFF',
                        width: '100%',
                        fontSize: '15px',
                        fontFamily: "'Rajdhani', sans-serif",
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        outline: 'none'
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(245, 196, 0, 0.6)';
                        e.currentTarget.style.boxShadow = '0 0 25px rgba(245, 196, 0, 0.08)';
                        e.currentTarget.style.background = '#0C0C0C';
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#222';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.background = '#080808';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-[#333] hover:text-[#F5C400] transition-colors"
                  >
                    {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="flex items-center gap-3 px-4 py-4 rounded-lg bg-red-950/20 border border-red-500/20 animate-shake"
                >
                  <ShieldAlert size={18} className="text-red-500 shrink-0" />
                  <span className="text-red-500 text-xs font-rajdhani font-bold tracking-[0.15em] uppercase">
                    {error}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 rounded-lg font-bold uppercase tracking-[0.3em] transition-all duration-500 active:scale-[0.97] disabled:opacity-50 relative overflow-hidden group"
                style={{
                  background: loading ? "#D4A900" : "#F5C400",
                  color: "#000000",
                  fontSize: "14px",
                  fontFamily: "'Rajdhani', sans-serif",
                  boxShadow: "0 15px 35px -10px rgba(245, 196, 0, 0.4)",
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                <span className="relative z-10">{loading ? "Processando Protocolo..." : "★ Entrar no Sistema"}</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
            </form>

            {/* Quick Demo Access */}
            <div className="mt-8 pt-8 border-t border-white/5">
              <p className="text-[10px] text-[#222] uppercase tracking-widest font-bold mb-4 text-center">Protocolo de Demonstração</p>
              <div 
                className="p-3 rounded bg-white/[0.01] border border-white/5 cursor-pointer hover:bg-white/[0.03] transition-colors group"
                onClick={() => {
                  setEmail("admin@elevenfirearms.com.br");
                  setPassword("password123");
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#444] font-rajdhani uppercase font-bold group-hover:text-[#F5C400]">Acesso Master Demo</span>
                  <span className="text-[9px] text-[#222] font-mono">admin@elevenfirearms.com.br</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 flex flex-col items-center gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck size={12} className="text-[#333]" />
            <p
              style={{ 
                color: "#222", 
                fontSize: "10px", 
                fontFamily: "'Rajdhani', sans-serif", 
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                fontWeight: 700
              }}
            >
              Eleven Firearms Group · Protocolo de Acesso Master
            </p>
          </div>

          <a 
            href="/login" 
            className="text-[10px] text-[#333] hover:text-[#F5C400] uppercase tracking-[0.4em] font-bold transition-all duration-500 border-b border-transparent hover:border-[#F5C400]/20 pb-1"
          >
            Acesso do Investidor
          </a>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
}
