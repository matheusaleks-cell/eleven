"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { mockUsers } from "@/lib/mock-data";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminAccountPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("eleven_session");
    if (!s) { router.push("/login"); return; }
    setSession(JSON.parse(s));
  }, []);

  if (!session) return null;

  const fieldStyle = { background: "#0F0F0F", border: "1px solid #2A2A2A", borderRadius: "2px", color: "#FFFFFF", padding: "10px 12px", fontSize: "14px", width: "100%", outline: "none", fontFamily: "'Rajdhani', sans-serif" };

  return (
    <DashboardLayout role="ADMIN" userName={session.name} userEmail={session.email} pageTitle="Minha Conta">
      <div className="max-w-lg">
        <h1 style={{ color: "#FFFFFF", fontSize: "24px", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", marginBottom: 20 }}>Minha Conta</h1>
        <div className="rounded-[4px] p-6" style={{ background: "#242424", border: "1px solid #333" }}>
          <div className="space-y-4">
            {[
              { label: "Nome", type: "text", value: session.name },
              { label: "E-mail", type: "email", value: session.email, disabled: true },
              { label: "Função", type: "text", value: "Administrador", disabled: true },
            ].map((f) => (
              <div key={f.label}>
                <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>{f.label}</label>
                <input type={f.type} defaultValue={f.value} disabled={f.disabled} style={{ ...fieldStyle, color: f.disabled ? "#606060" : "#FFFFFF", cursor: f.disabled ? "not-allowed" : "text" }} onFocus={(e) => !f.disabled && (e.currentTarget.style.borderColor = "#F5C400")} onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")} />
              </div>
            ))}
          </div>
          <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }} className="mt-5 flex items-center gap-2 px-4 py-2.5 rounded-[2px] font-bold uppercase" style={{ background: "#F5C400", color: "#1A1A1A", border: "none", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.1em", cursor: "pointer", fontSize: "13px" }}>
            <Save size={14} /> {saved ? "✓ Salvo!" : "Salvar"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
