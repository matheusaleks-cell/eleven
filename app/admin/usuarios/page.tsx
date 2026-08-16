"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  X,
  AlertTriangle,
  Mail,
  ArrowUpRight,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllUsers, createAdminUser, updateUserBasicInfo, updateUserPassword, deleteUser } from "./actions";
import { toast } from "sonner";

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string | Date;
}

type RoleFilter = "ALL" | "ADMIN" | "INVESTOR";

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border",
        role === "ADMIN"
          ? "bg-brand-accent/10 text-brand-accent border-brand-accent/20"
          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
      )}
    >
      {role === "ADMIN" ? <ShieldCheck size={9} /> : <UserRound size={9} />}
      {role === "ADMIN" ? "Admin" : "Investidor"}
    </span>
  );
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [session, setSession] = useState({ userName: "Administrador", userEmail: "", userId: "" });

  const [showCreate, setShowCreate] = useState(false);
  const [createRole, setCreateRole] = useState<"ADMIN" | "INVESTOR">("ADMIN");
  const [creating, setCreating] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "", phone: "" });

  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem("eleven_session");
      if (s) {
        const p = JSON.parse(s);
        setSession({ userName: p.name || "Administrador", userEmail: p.email || "", userId: p.id || "" });
      }
    } catch {}
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredUsers = users.filter(u => roleFilter === "ALL" || u.role === roleFilter);
  const adminCount = users.filter(u => u.role === "ADMIN").length;
  const investorCount = users.filter(u => u.role === "INVESTOR").length;

  const openCreate = () => {
    setCreateRole("ADMIN");
    setNewAdmin({ name: "", email: "", password: "", phone: "" });
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      toast.error("Preencha nome, e-mail e senha.");
      return;
    }
    setCreating(true);
    const res = await createAdminUser(newAdmin);
    setCreating(false);
    if (res.success) {
      toast.success("Administrador cadastrado com sucesso!");
      setShowCreate(false);
      loadData();
    } else {
      toast.error(res.error || "Erro ao cadastrar administrador.");
    }
  };

  const openEdit = (user: PlatformUser) => {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email, phone: user.phone || "" });
    setNewPassword("");
    setConfirmDelete(false);
  };

  const closeEdit = () => {
    setEditingUser(null);
    setConfirmDelete(false);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setSavingEdit(true);
    const res = await updateUserBasicInfo(editingUser.id, editForm);
    setSavingEdit(false);
    if (res.success) {
      toast.success("Dados atualizados com sucesso.");
      loadData();
      setEditingUser({ ...editingUser, ...editForm });
    } else {
      toast.error(res.error || "Erro ao atualizar usuário.");
    }
  };

  const handleUpdatePassword = async () => {
    if (!editingUser) return;
    if (!newPassword || newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setSavingPassword(true);
    const res = await updateUserPassword(editingUser.id, newPassword);
    setSavingPassword(false);
    if (res.success) {
      toast.success("Senha atualizada com sucesso!");
      setNewPassword("");
    } else {
      toast.error(res.error || "Erro ao atualizar senha.");
    }
  };

  const handleDelete = async () => {
    if (!editingUser) return;
    setDeleting(true);
    const res = await deleteUser(editingUser.id);
    setDeleting(false);
    if (res.success) {
      toast.success("Usuário excluído.");
      closeEdit();
      loadData();
    } else {
      toast.error(res.error || "Erro ao excluir usuário.");
    }
  };

  return (
    <DashboardLayout role="ADMIN" userName={session.userName} userEmail={session.userEmail}>
      <div className="flex flex-col gap-8 animate-fade-in pb-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-accent/10 rounded border border-brand-accent/20 text-brand-accent">
              <Users size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1 font-rajdhani uppercase text-white">Usuários</h1>
              <p className="text-[10px] text-brand-text-muted font-bold uppercase tracking-wider">Todas as contas com acesso à plataforma — administradores e investidores.</p>
            </div>
          </div>
          <Button className="gap-2" onClick={openCreate}>
            <Plus size={18} />
            Novo Usuário
          </Button>
        </div>

        {/* Filtros por tipo */}
        <div className="flex gap-2">
          {([
            { key: "ALL", label: `Todos (${users.length})` },
            { key: "ADMIN", label: `Administradores (${adminCount})` },
            { key: "INVESTOR", label: `Investidores (${investorCount})` },
          ] as { key: RoleFilter; label: string }[]).map(f => (
            <button
              key={f.key}
              onClick={() => setRoleFilter(f.key)}
              className={cn(
                "px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest border transition-all",
                roleFilter === f.key
                  ? "bg-brand-accent text-brand-bg border-brand-accent"
                  : "border-brand-border text-brand-text-muted hover:text-white"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <Card className="border-brand-border bg-brand-surface/10 shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-surface/50 border-b border-brand-border">
                <th className="px-6 py-4 text-[10px] font-black text-brand-text-muted uppercase tracking-widest">Nome</th>
                <th className="px-6 py-4 text-[10px] font-black text-brand-text-muted uppercase tracking-widest">E-mail</th>
                <th className="px-6 py-4 text-[10px] font-black text-brand-text-muted uppercase tracking-widest">Telefone</th>
                <th className="px-6 py-4 text-[10px] font-black text-brand-text-muted uppercase tracking-widest">Desde</th>
                <th className="px-6 py-4 text-[10px] font-black text-brand-text-muted uppercase tracking-widest text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/30">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Carregando...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-brand-accent/5 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent font-bold text-xs shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white uppercase">{u.name}</span>
                            {u.id === session.userId && (
                              <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-brand-accent/10 text-brand-accent border border-brand-accent/20">Você</span>
                            )}
                          </div>
                          <RoleBadge role={u.role} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs text-brand-text-secondary">{u.email}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs text-brand-text-muted">{u.phone || "—"}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-[10px] font-bold text-brand-text-muted uppercase">
                        {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {u.role === "INVESTOR" && (
                          <Link
                            href={`/admin/investidores/${u.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-wider border border-brand-border text-brand-text-muted hover:text-brand-accent hover:border-brand-accent transition-all"
                          >
                            <ArrowUpRight size={11} /> Perfil Completo
                          </Link>
                        )}
                        <button
                          onClick={() => openEdit(u)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-wider border border-brand-border text-brand-text-muted hover:text-brand-accent hover:border-brand-accent transition-all"
                        >
                          <Pencil size={11} /> Gerenciar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">
                      Nenhum usuário encontrado.
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Modal: Novo Usuário */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div
            className="relative w-full max-w-md animate-fade-in flex flex-col"
            style={{ maxHeight: "90vh", background: "#1A1A1A", border: "1px solid #333", borderTop: "3px solid #F5C400", borderRadius: 4, boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border shrink-0">
              <h3 className="text-sm font-black text-white uppercase tracking-widest font-rajdhani">Novo Usuário</h3>
              <button onClick={() => setShowCreate(false)} className="text-brand-text-muted hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-5 pt-4">
              <div className="flex gap-1 p-1 bg-brand-bg rounded border border-brand-border">
                {(["ADMIN", "INVESTOR"] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setCreateRole(r)}
                    className={cn(
                      "flex-1 py-2 rounded text-[10px] font-black uppercase tracking-wider transition-all",
                      createRole === r ? "bg-brand-surface text-white border border-brand-border" : "text-brand-text-muted hover:text-white"
                    )}
                  >
                    {r === "ADMIN" ? "Administrador" : "Investidor"}
                  </button>
                ))}
              </div>
            </div>

            {createRole === "ADMIN" ? (
              <>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                  <Input label="Nome" value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} placeholder="Nome completo" />
                  <Input label="E-mail" type="email" value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} placeholder="email@elevenfirearms.com.br" />
                  <Input label="Telefone" value={newAdmin.phone} onChange={e => setNewAdmin({ ...newAdmin, phone: e.target.value })} placeholder="(11) 90000-0000" />
                  <Input label="Senha Inicial" type="password" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
                </div>
                <div className="px-5 py-4 border-t border-brand-border shrink-0 flex gap-3">
                  <Button variant="ghost" onClick={() => setShowCreate(false)} className="flex-1 text-[10px] font-black tracking-widest">Cancelar</Button>
                  <Button onClick={handleCreate} disabled={creating} className="flex-[2] text-[10px] font-black tracking-widest">
                    {creating ? "Cadastrando..." : "Cadastrar"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="p-5">
                <p className="text-[11px] text-brand-text-muted leading-relaxed mb-4">
                  Investidor tem um cadastro mais completo (CPF/CNPJ, endereço, dados bancários) — feito na tela própria de investidores.
                </p>
                <Link
                  href="/admin/investidores/novo"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded text-[10px] font-black uppercase tracking-widest bg-brand-accent text-brand-bg hover:bg-brand-accent-hover transition-all"
                >
                  Ir para Cadastro de Investidor
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Gerenciar Usuário */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeEdit} />
          <div
            className="relative w-full animate-fade-in flex flex-col"
            style={{ maxWidth: 480, maxHeight: "90vh", background: "#1A1A1A", border: "1px solid #333", borderTop: "3px solid #F5C400", borderRadius: 4, boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white uppercase tracking-widest font-rajdhani">Gerenciar Usuário</h3>
                <RoleBadge role={editingUser.role} />
              </div>
              <button onClick={closeEdit} className="text-brand-text-muted hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
              {editingUser.role === "INVESTOR" && (
                <Link
                  href={`/admin/investidores/${editingUser.id}`}
                  className="flex items-center justify-between px-4 py-3 rounded border border-brand-accent/30 bg-brand-accent/5 text-brand-accent text-[10px] font-black uppercase tracking-widest hover:bg-brand-accent/10 transition-all"
                >
                  Ver perfil completo (CPF, banco, projetos, documentos)
                  <ArrowUpRight size={14} />
                </Link>
              )}

              {/* Dados */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Mail size={11} className="text-brand-accent" />
                  <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest">Dados Cadastrais</span>
                </div>
                <Input label="Nome" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                <Input label="E-mail" type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                <Input label="Telefone" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="(11) 90000-0000" />
                <Button onClick={handleSaveEdit} disabled={savingEdit} size="sm" className="w-full text-[10px] font-black tracking-widest">
                  {savingEdit ? "Salvando..." : "Salvar Dados"}
                </Button>
              </div>

              {/* Senha */}
              <div className="space-y-3 pt-4 border-t border-brand-border/40">
                <div className="flex items-center gap-1.5">
                  <KeyRound size={11} className="text-brand-accent" />
                  <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest">Redefinir Senha</span>
                </div>
                <Input
                  label="Nova Senha"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
                <Button onClick={handleUpdatePassword} disabled={savingPassword} variant="secondary" size="sm" className="w-full text-[10px] font-black tracking-widest">
                  {savingPassword ? "Salvando..." : "Atualizar Senha"}
                </Button>
              </div>

              {/* Excluir */}
              {editingUser.id !== session.userId && (
                <div className="space-y-3 pt-4 border-t border-brand-border/40">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle size={11} className="text-brand-danger" />
                    <span className="text-[9px] font-black text-brand-danger uppercase tracking-widest">Zona de Risco</span>
                  </div>
                  {confirmDelete ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-brand-danger/10 border border-brand-danger/30 rounded">
                        <AlertTriangle size={16} className="text-brand-danger shrink-0 mt-0.5" />
                        <p className="text-[10px] text-brand-text-muted">Essa conta perde o acesso à plataforma imediatamente. Esta ação não pode ser desfeita.</p>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded text-[10px] font-black uppercase tracking-widest border border-brand-border text-brand-text-muted hover:text-white transition-all">
                          Cancelar
                        </button>
                        <button
                          onClick={handleDelete}
                          disabled={deleting}
                          className="flex-1 py-2.5 rounded text-[10px] font-black uppercase tracking-widest"
                          style={{ background: deleting ? "#333" : "#dc2626", color: deleting ? "#606060" : "#fff" }}
                        >
                          {deleting ? "Excluindo..." : "Sim, Excluir"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded text-[10px] font-black uppercase tracking-widest border border-brand-danger/40 text-brand-danger hover:bg-brand-danger/10 transition-all"
                    >
                      <Trash2 size={13} /> Excluir Usuário
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
