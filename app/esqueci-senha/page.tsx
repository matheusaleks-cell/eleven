"use client";

import { useState } from "react";
import Image from "next/image";
import { Mail, KeyRound, CheckCircle2 } from "lucide-react";
import { requestPasswordReset } from "@/app/actions/password-reset";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await requestPasswordReset(email);
    setLoading(false);
    setSent(true);
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
              Recuperar Acesso
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
            {sent ? (
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="w-14 h-14 rounded-full bg-[#F5C400]/10 flex items-center justify-center border border-[#F5C400]/20">
                  <CheckCircle2 size={26} className="text-[#F5C400]" />
                </div>
                <h1
                  style={{
                    color: "#FFFFFF",
                    fontSize: "16px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontFamily: "'Rajdhani', sans-serif",
                  }}
                >
                  Verifique seu e-mail
                </h1>
                <p style={{ color: "#888", fontSize: "13px", fontFamily: "'Rajdhani', sans-serif", lineHeight: 1.6 }}>
                  Se <strong style={{ color: "#ccc" }}>{email}</strong> estiver cadastrado, você vai receber um link
                  de redefinição em instantes. O link expira em 1 hora.
                </p>
                <a
                  href="/login"
                  className="text-[10px] text-[#444] hover:text-[#F5C400] uppercase tracking-[0.3em] font-bold transition-all duration-500 mt-2"
                >
                  Voltar ao login
                </a>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-10 h-10 rounded-lg bg-[#F5C400]/10 flex items-center justify-center border border-[#F5C400]/20">
                    <KeyRound size={18} className="text-[#F5C400]" />
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
                    Esqueci Minha Senha
                  </h1>
                </div>

                <p style={{ color: "#666", fontSize: "12px", fontFamily: "'Rajdhani', sans-serif", lineHeight: 1.6, marginBottom: "28px" }}>
                  Informe o e-mail da sua conta. Vamos te enviar um link pra você escolher uma senha nova.
                </p>

                <form onSubmit={handleSubmit} className="space-y-8">
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
                        marginLeft: "2px",
                      }}
                    >
                      E-mail
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
                          paddingLeft: "52px",
                          paddingRight: "16px",
                          paddingTop: "14px",
                          paddingBottom: "14px",
                          background: "#0A0A0A",
                          border: "1px solid #1A1A1A",
                          borderRadius: "6px",
                          color: "#FFF",
                          width: "100%",
                          fontSize: "14px",
                          fontFamily: "'Rajdhani', sans-serif",
                          transition: "all 0.3s ease",
                          outline: "none",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "rgba(245, 196, 0, 0.4)";
                          e.currentTarget.style.boxShadow = "0 0 0 4px rgba(245, 196, 0, 0.05)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "#1A1A1A";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      />
                    </div>
                  </div>

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
                      border: "none",
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "Enviando..." : "Enviar Link de Redefinição"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {!sent && (
          <div className="mt-12 flex flex-col items-center gap-3">
            <a
              href="/login"
              className="text-[10px] text-[#444] hover:text-[#F5C400] uppercase tracking-[0.3em] font-bold transition-all duration-500"
            >
              Voltar ao login
            </a>
          </div>
        )}
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
