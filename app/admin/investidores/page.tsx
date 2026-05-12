"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MoneyDisplay } from "@/components/shared/MoneyDisplay";
import { Plus, Search, Eye, X, User } from "lucide-react";
import Link from "next/link";
import { getInvestors, createInvestor } from "./actions";
import { toast } from "sonner";
import { maskPhone } from "@/lib/masks";

export default function AdminInvestorsPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  
  // Dados do banco
  const [investors, setInvestors] = useState<any[]>([]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const data = await getInvestors();
      setInvestors(data);
    } catch (error) {
      toast.error("Erro ao carregar investidores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const s = localStorage.getItem("eleven_session");
    if (!s) { router.push("/admin/login"); return; }
    const parsed = JSON.parse(s);
    if (parsed.role !== "ADMIN") { router.push("/investor"); return; }
    setSession(parsed);
    refreshData();
  }, []);

  const filtered = (investors || []).filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      await createInvestor(form);
      toast.success("Investidor cadastrado com sucesso!");
      setShowModal(false);
      setForm({ name: "", email: "", phone: "", password: "" });
      refreshData();
    } catch (error) {
      toast.error("Erro ao cadastrar investidor.");
    }
  };

  if (!session) return null;

  return (
    <DashboardLayout role="ADMIN" userName={session.name} userEmail={session.email} pageTitle="Investidores">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 style={{ color: "#FFFFFF", fontSize: "24px", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>Investidores</h1>
          <p style={{ color: "#606060", fontSize: "14px", fontFamily: "'Rajdhani', sans-serif" }}>{investors.length} investidores cadastrados</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[2px] font-bold uppercase"
          style={{ background: "#F5C400", color: "#1A1A1A", fontSize: "13px", letterSpacing: "0.12em", fontFamily: "'Rajdhani', sans-serif", border: "none", cursor: "pointer" }}
        >
          <Plus size={16} /> Novo Investidor
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#606060" }} />
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base pl-9"
          style={{ fontFamily: "'Rajdhani', sans-serif" }}
        />
      </div>

      {/* Table */}
      <div className="rounded-[4px]" style={{ background: "#242424", border: "1px solid #333" }}>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Nome</th>
                <th className="hidden md:table-cell">E-mail</th>
                <th className="hidden lg:table-cell">Telefone</th>
                <th className="hidden md:table-cell">Projetos</th>
                <th className="hidden xl:table-cell">Total Investido</th>
                <th className="hidden xl:table-cell">Total Recebido</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((investor) => {
                return (
                  <tr key={investor.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center rounded-full" style={{ width: 34, height: 34, background: "rgba(245,196,0,0.1)", border: "1px solid rgba(245,196,0,0.2)", color: "#F5C400", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "14px", flexShrink: 0 }}>
                          {investor.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600, fontFamily: "'Rajdhani', sans-serif", fontSize: "15px" }}>{investor.name}</span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell" style={{ color: "#A0A0A0", fontFamily: "'Roboto Mono', monospace", fontSize: "12px" }}>{investor.email}</td>
                    <td className="hidden lg:table-cell" style={{ color: "#A0A0A0", fontFamily: "'Rajdhani', sans-serif" }}>{investor.phone || "—"}</td>
                    <td className="hidden md:table-cell" style={{ color: "#F5C400", fontFamily: "'Roboto Mono', monospace", fontWeight: 700 }}>{investor.projectsCount}</td>
                    <td className="hidden xl:table-cell"><MoneyDisplay value={investor.totalInvested || 0} size="sm" /></td>
                    <td className="hidden xl:table-cell"><MoneyDisplay value={investor.totalReceived || 0} size="sm" /></td>
                    <td className="text-right">
                      <Link
                        href={`/admin/investidores/${investor.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[2px] text-xs font-bold uppercase transition-all"
                        style={{ border: "1px solid #F5C400", color: "#F5C400", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.1em", textDecoration: "none" }}
                        onMouseOver={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(245,196,0,0.1)"}
                        onMouseOut={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                      >
                        <Eye size={12} /> Ver
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setShowModal(false)} style={{ background: "rgba(0,0,0,0.8)" }} />
          <div className="relative w-full max-w-md animate-fade-in" style={{ background: "#1A1A1A", border: "1px solid #333", borderTop: "3px solid #F5C400", borderRadius: "4px", padding: "24px", boxShadow: "0 4px 40px rgba(0,0,0,0.7)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ color: "#FFFFFF", fontSize: "18px", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>NOVO INVESTIDOR</h2>
              <button onClick={() => setShowModal(false)} style={{ color: "#606060", background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div className="space-y-4">
              {[
                { label: "Nome Completo *", key: "name", type: "text", placeholder: "Francisco Silva" },
                { label: "E-mail *", key: "email", type: "email", placeholder: "investidor@email.com" },
                { label: "Telefone", key: "phone", type: "tel", placeholder: "(11) 99999-0000" },
                { label: "Senha Inicial *", key: "password", type: "password", placeholder: "••••••••" },
              ].map((f) => (
                <div key={f.key}>
                  <label style={{ color: "#A0A0A0", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, display: "block", marginBottom: 5 }}>{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm({ ...form, [f.key]: f.key === "phone" ? maskPhone(val) : val });
                    }}
                    className="input-base"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-[2px] font-bold uppercase text-sm" style={{ border: "1px solid #333", color: "#A0A0A0", background: "transparent", fontFamily: "'Rajdhani', sans-serif", cursor: "pointer" }}>Cancelar</button>
              <button onClick={handleCreate} className="flex-1 py-2.5 rounded-[2px] font-bold uppercase text-sm" style={{ background: "#F5C400", color: "#1A1A1A", border: "none", fontFamily: "'Rajdhani', sans-serif", cursor: "pointer" }}>★ Criar</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
