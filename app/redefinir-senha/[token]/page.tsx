"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, Lock, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { validateResetToken, resetPassword } from "@/app/actions/password-reset";

export default function RedefinirSenhaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [checking, setChecking] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [loginHref, setLoginHref] = useState("/login");

  useEffect(() => {
    validateResetToken(token).then((res) => {
      setTokenValid(res.valid);
      setChecking(false);
    });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const res = await resetPassword(token, newPassword);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Não foi possível redefinir a senha.");
      return;
    }

    setLoginHref(res.role === "ADMIN" ? "/admin/login" : "/login");
    setDone(true);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{ background: "#080808" }}
    >
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#F5C400 1px, transparent 1px), linear-gradient(90deg, #F5C400 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-[120px]"
        style={{ background: "#F5C400" }}
      />

      <div className="relative w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-10">
          <div className="mb-6">
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
                opacity: 0.9,
              }}
            >
              Nova Senha
            </p>
            <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-[#F5C400]/40" />
          </div>
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "rgba(18, 18, 18, 0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            boxShadow: "0 40px 100px -20px rgba(0, 0, 0, 0.8)",
          }}
        >
          <div className="bg-gradient-to-r from-[#F5C400] via-[#D4A900] to-[#F5C400] h-[2px] w-full" />

          <div className="p-10">
            {checking ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-8 h-8 border-2 border-[#F5C400] border-t-transparent rounded-full animate-spin" />
                <p style={{ color: "#666", fontSize: "11px", fontFamily: "'Rajdhani', sans-serif", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                  Verificando link...
                </p>
              </div>
            ) : !tokenValid ? (
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <XCircle size={26} className="text-red-500/80" />
                </div>
                <h1 style={{ color: "#FFFFFF", fontSize: "16px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif" }}>
                  Link inválido ou expirado
                </h1>
                <p style={{ color: "#888", fontSize: "13px", fontFamily: "'Rajdhani', sans-serif", lineHeight: 1.6 }}>
                  Esse link de redefinição já foi usado ou não é mais válido. Solicite um novo.
                </p>
                <a
                  href="/esqueci-senha"
                  className="text-[10px] text-[#F5C400] hover:underline uppercase tracking-[0.3em] font-bold mt-2"
                >
                  Solicitar novo link
                </a>
              </div>
            ) : done ? (
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="w-14 h-14 rounded-full bg-[#F5C400]/10 flex items-center justify-center border border-[#F5C400]/20">
                  <CheckCircle2 size={26} className="text-[#F5C400]" />
                </div>
                <h1 style={{ color: "#FFFFFF", fontSize: "16px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif" }}>
                  Senha redefinida
                </h1>
                <p style={{ color: "#888", fontSize: "13px", fontFamily: "'Rajdhani', sans-serif", lineHeight: 1.6 }}>
                  Sua senha foi atualizada com sucesso. Já pode entrar com a senha nova.
                </p>
                <a
                  href={loginHref}
                  className="w-full py-4 rounded-lg font-bold uppercase tracking-[0.25em] transition-all duration-300 active:scale-[0.98] text-center mt-2"
                  style={{ background: "#F5C400", color: "#000000", fontSize: "13px", fontFamily: "'Rajdhani', sans-serif" }}
                >
                  Ir para o login
                </a>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-10 h-10 rounded-lg bg-[#F5C400]/10 flex items-center justify-center border border-[#F5C400]/20">
                    <Lock size={18} className="text-[#F5C400]" />
                  </div>
                  <h1 style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif" }}>
                    Nova Senha
                  </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <label style={{ color: "#666", fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, display: "block", marginLeft: "2px" }}>
                      Senha nova
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                        <Lock size={18} className="text-[#444] transition-colors duration-300 group-focus-within:text-[#F5C400]" />
                      </div>
                      <input
                        type={showPw ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="Mínimo 6 caracteres"
                        style={{
                          paddingLeft: "52px", paddingRight: "52px", paddingTop: "14px", paddingBottom: "14px",
                          background: "#0A0A0A", border: "1px solid #1A1A1A", borderRadius: "6px", color: "#FFF",
                          width: "100%", fontSize: "14px", fontFamily: "'Rajdhani', sans-serif", outline: "none",
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

                  <div className="space-y-3">
                    <label style={{ color: "#666", fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, display: "block", marginLeft: "2px" }}>
                      Confirmar senha
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                        <Lock size={18} className="text-[#444] transition-colors duration-300 group-focus-within:text-[#F5C400]" />
                      </div>
                      <input
                        type={showPw ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Repita a senha"
                        style={{
                          paddingLeft: "52px", paddingRight: "16px", paddingTop: "14px", paddingBottom: "14px",
                          background: "#0A0A0A", border: "1px solid #1A1A1A", borderRadius: "6px", color: "#FFF",
                          width: "100%", fontSize: "14px", fontFamily: "'Rajdhani', sans-serif", outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/5 border border-red-500/10">
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
                      background: loading ? "#D4A900" : "#F5C400", color: "#000000", fontSize: "14px",
                      fontFamily: "'Rajdhani', sans-serif", boxShadow: "0 10px 30px -10px rgba(245, 196, 0, 0.3)",
                      border: "none", cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "Salvando..." : "Redefinir Senha"}
                  </button>
                </form>
              </>
            )}
          </div>
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
      `}</style>
    </div>
  );
}
