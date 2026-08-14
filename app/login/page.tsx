"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ShieldAlert } from "lucide-react";
import { signIn, getSession } from "next-auth/react";

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
      const result = await signIn("credentials", { email, password, redirect: false });

      if (!result || result.error) {
        setError("Credenciais inválidas.");
        setLoading(false);
        return;
      }

      const session = await getSession();

      if (!session?.user || session.user.role !== "INVESTOR") {
        setError("Esta área é exclusiva para investidores.");
        setLoading(false);
        return;
      }

      localStorage.setItem("eleven_session", JSON.stringify({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      }));

      window.location.href = "/investidor";
    } catch {
      setError("Ocorreu um erro ao tentar entrar na área do investidor.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{ background: "#080808" }}
    >
      {/* Background pattern - refined grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#F5C400 1px, transparent 1px), linear-gradient(90deg, #F5C400 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* Subtle Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-[120px]"
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
              width={150}
              height={150}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-center gap-4">
             <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-[#F5C400]/40" />
             <p
               style={{
                 color: "#F5C400",
                 fontSize: "10px",
                 letterSpacing: "0.5em",
                 textTransform: "uppercase",
                 fontFamily: "'Rajdhani', sans-serif",
                 fontWeight: 700,
                 opacity: 0.9
               }}
             >
               Área do Investidor
             </p>
             <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-[#F5C400]/40" />
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "rgba(18, 18, 18, 0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            boxShadow: "0 40px 100px -20px rgba(0, 0, 0, 0.8)",
          }}
        >
          {/* Card Header Top Border */}
          <div className="bg-gradient-to-r from-[#F5C400] via-[#D4A900] to-[#F5C400] h-[2px] w-full" />
          
          <div className="p-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-lg bg-[#F5C400]/10 flex items-center justify-center border border-[#F5C400]/20">
                <Lock size={18} className="text-[#F5C400]" />
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
                Autenticação
              </h1>
            </div>

            <form onSubmit={handleLogin} className="space-y-8">
              {/* Email */}
              <div className="space-y-3">
                <label
                  style={{
                    color: "#666",
                    fontSize: "11px",
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    display: "block",
                    marginLeft: "2px"
                  }}
                >
                  E-mail institucional
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <Mail size={18} className="text-[#444] transition-colors duration-300 group-focus-within:text-[#F5C400]" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
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
                        transition: 'all 0.3s ease',
                        outline: 'none'
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(245, 196, 0, 0.4)';
                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(245, 196, 0, 0.05)';
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#1A1A1A';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-3">
                <label
                  style={{
                    color: "#666",
                    fontSize: "11px",
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    display: "block",
                    marginLeft: "2px"
                  }}
                >
                  Chave de acesso
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <Lock size={18} className="text-[#444] transition-colors duration-300 group-focus-within:text-[#F5C400]" />
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
                        transition: 'all 0.3s ease',
                        outline: 'none'
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(245, 196, 0, 0.4)';
                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(245, 196, 0, 0.05)';
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#1A1A1A';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-[#444] hover:text-[#888] transition-colors"
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/5 border border-red-500/10 animate-shake"
                >
                  <ShieldAlert size={16} className="text-red-500/80 shrink-0" />
                  <span className="text-red-500/80 text-[11px] font-rajdhani font-bold tracking-widest uppercase">
                    {error}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-lg font-bold uppercase tracking-[0.25em] transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: loading ? "#D4A900" : "#F5C400",
                  color: "#000000",
                  fontSize: "14px",
                  fontFamily: "'Rajdhani', sans-serif",
                  boxShadow: "0 10px 30px -10px rgba(245, 196, 0, 0.3)",
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? "Processando..." : "Entrar no Dashboard"}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 flex flex-col items-center gap-6">
          <p
            style={{ 
              color: "#333", 
              fontSize: "10px", 
              fontFamily: "'Rajdhani', sans-serif", 
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontWeight: 700
            }}
          >
            Eleven Firearms Group · Autenticação Protegida
          </p>

          <a 
            href="/admin/login" 
            className="text-[10px] text-[#444] hover:text-[#F5C400] uppercase tracking-[0.4em] font-bold transition-all duration-500 border-b border-transparent hover:border-[#F5C400]/20 pb-1"
          >
            Painel Administrativo
          </a>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
}
