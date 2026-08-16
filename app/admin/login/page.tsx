"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, ShieldAlert } from "lucide-react";
import { signIn } from "next-auth/react";
import { loginUser } from "@/app/actions/auth";

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
      const authRes = await loginUser(email, password);

      if (!authRes.success) {
        setError(authRes.error || "Credenciais administrativas inválidas.");
        setLoading(false);
        return;
      }

      if (authRes.user.role !== "ADMIN") {
        setError("Esta área é exclusiva para administradores.");
        setLoading(false);
        return;
      }

      // Autentica na sessão do NextAuth (cookies para middleware/layouts)
      await signIn("credentials", { email, password, redirect: false });

      localStorage.setItem(
        "eleven_session",
        JSON.stringify({
          id: authRes.user.id,
          email: authRes.user.email,
          name: authRes.user.name,
          role: authRes.user.role,
        })
      );

      window.location.href = "/admin";
    } catch {
      setError("Erro ao tentar entrar no painel administrativo.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{ background: "#080808" }}
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
          <div className="mb-6">
            <Image
              src="/logos/logo-vertical-white.png"
              alt="Eleven Firearms"
              width={160}
              height={160}
              className="object-contain"
              priority
            />
          </div>
          <p
            style={{
              color: "#F5C400",
              fontSize: "10px",
              letterSpacing: "0.5em",
              textTransform: "uppercase",
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              opacity: 0.9,
            }}
          >
            Painel Administrativo
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "rgba(20, 20, 20, 0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(245, 196, 0, 0.15)",
            boxShadow: "0 40px 100px -20px rgba(0, 0, 0, 0.8)",
          }}
        >
          {/* Card Header Top Border - Dual color for Master */}
          <div className="bg-gradient-to-r from-[#D4A900] via-[#F5C400] to-[#D4A900] h-[2px] w-full" />
          
          <div className="p-10">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-10 h-10 rounded-lg bg-[#F5C400]/10 flex items-center justify-center border border-[#F5C400]/20">
                <ShieldCheck size={18} className="text-[#F5C400]" />
              </div>
              <h1
                style={{
                  color: "#FFFFFF",
                  fontSize: "20px",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  fontFamily: "'Rajdhani', sans-serif",
                }}
              >
                Entrar
              </h1>
            </div>

            <form onSubmit={handleLogin} className="space-y-8">
              {/* Email */}
              <div className="space-y-3">
                <label
                  style={{
                    color: "#555",
                    fontSize: "11px",
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    display: "block",
                  }}
                >
                  E-mail
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
                        paddingLeft: '52px',
                        paddingRight: '16px',
                        paddingTop: '14px',
                        paddingBottom: '14px',
                        background: '#0A0A0A',
                        border: '1px solid #1A1A1A',
                        borderRadius: '6px',
                        color: '#FFF',
                        width: '100%',
                        fontSize: '14px',
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
                        e.currentTarget.style.borderColor = '#1A1A1A';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.background = '#0A0A0A';
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
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    display: "block",
                  }}
                >
                  Senha
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
                        paddingLeft: '52px',
                        paddingRight: '52px',
                        paddingTop: '14px',
                        paddingBottom: '14px',
                        background: '#0A0A0A',
                        border: '1px solid #1A1A1A',
                        borderRadius: '6px',
                        color: '#FFF',
                        width: '100%',
                        fontSize: '14px',
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
                        e.currentTarget.style.borderColor = '#1A1A1A';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.background = '#0A0A0A';
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
                <div className="flex justify-end">
                  <a
                    href="/esqueci-senha"
                    className="text-[10px] text-[#444] hover:text-[#F5C400] uppercase tracking-[0.15em] font-bold transition-colors"
                  >
                    Esqueci minha senha
                  </a>
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
                className="w-full py-4 rounded-lg font-bold uppercase tracking-[0.25em] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 relative overflow-hidden group"
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
                <span className="relative z-10">{loading ? "Entrando..." : "Entrar"}</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
            </form>
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
              Eleven Firearms Group
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
