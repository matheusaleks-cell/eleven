"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileBarChart2,
  Settings,
  Receipt,
  User,
  FileText,
  LogOut,
  ChevronRight,
  X,
  CreditCard,
  Package,
  Ship,
  Target,
  ShoppingCart,
  Settings2,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const adminNav: NavItem[] = [
  { label: "Dashboard",    href: "/admin",            icon: <LayoutDashboard size={18} /> },
  { label: "CRM Vendas",   href: "/admin/crm/funil",  icon: <Users size={18} /> },
  { label: "Clientes",     href: "/admin/crm/clientes", icon: <User size={18} /> },
  { label: "ERP Operacional", href: "/admin/erp/produtos", icon: <Package size={18} /> },
  { label: "Importação",   href: "/admin/importacao/lotes", icon: <Ship size={18} /> },
  { label: "Mapa de Armas", href: "/admin/mapa-de-armas", icon: <Target size={18} /> },
  { label: "Financeiro",   href: "/admin/financeiro", icon: <CreditCard size={18} /> },
  { label: "Loja",         href: "/loja",             icon: <ShoppingCart size={18} /> },
  { label: "Projetos",     href: "/admin/projetos",   icon: <FolderKanban size={18} /> },
  { label: "Relatórios",   href: "/admin/relatorios", icon: <FileBarChart2 size={18} /> },
];

const investorNav: NavItem[] = [
  { label: "Dashboard",     href: "/investidor",           icon: <LayoutDashboard size={18} /> },
  { label: "Meus Projetos", href: "/investidor/projetos",  icon: <FolderKanban size={18} /> },
  { label: "Extrato",       href: "/investidor/extrato",   icon: <CreditCard size={18} /> },
  { label: "Documentos",    href: "/investidor/documentos", icon: <FileText size={18} /> },
];

interface SidebarProps {
  role: "ADMIN" | "INVESTOR";
  userName: string;
  userEmail: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function SidebarContent({ role, userName, userEmail, onMobileClose, pathname, settingsOpen, setSettingsOpen, isDesktop }: any) {
  const mainNav = role === "ADMIN" ? adminNav : investorNav;

  const handleLogout = () => {
    localStorage.removeItem("eleven_session");
    window.location.href = "/login";
  };

  const isActive = (href: string) => {
    if (href === "/admin" || href === "/investidor") return pathname === href;
    return pathname.startsWith(href);
  };

  const NavLink = ({ item }: { item: NavItem }) => (
    <Link
      href={item.href}
      onClick={onMobileClose}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        borderRadius: "2px",
        background: isActive(item.href) ? "rgba(245,196,0,0.10)" : "transparent",
        color: isActive(item.href) ? "#F5C400" : "#A0A0A0",
        borderLeft: isActive(item.href) ? "2px solid #F5C400" : "2px solid transparent",
        fontWeight: isActive(item.href) ? 600 : 400,
        textDecoration: "none",
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: "15px",
        letterSpacing: "0.03em",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
        marginBottom: 2,
      }}
    >
      <span style={{ color: isActive(item.href) ? "#F5C400" : "#555", flexShrink: 0 }}>{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: "#161616",
        borderRight: "1px solid #242424",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #242424", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <Image src="/logos/logo-alta-a.png" alt="Eleven Firearms" width={130} height={42} style={{ objectFit: "contain", filter: "brightness(0) invert(1)", width: "auto", height: "42px" }} />
        {!isDesktop && (
          <button onClick={onMobileClose} style={{ color: "#555", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        )}
      </div>

      <div style={{ padding: "10px 20px 8px" }}>
        <span style={{ fontSize: "10px", letterSpacing: "0.18em", color: "#F5C400", textTransform: "uppercase", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>
          ★ {role === "ADMIN" ? "Administrador" : "Investidor"} ★
        </span>
      </div>

      <div style={{ height: 1, background: "#242424", margin: "0 16px 8px" }} />

      <nav style={{ flex: 1, padding: "4px 8px", overflowY: "auto" }}>
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {role === "ADMIN" && (
          <>
            <div style={{ height: 1, background: "#242424", margin: "12px 8px" }} />
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", width: "100%", background: "transparent", border: "none", 
                borderLeft: "2px solid transparent", color: settingsOpen ? "#F5C400" : "#A0A0A0", cursor: "pointer", fontFamily: "'Rajdhani', sans-serif", fontSize: "15px"
              }}
            >
              <Settings size={18} style={{ color: settingsOpen ? "#F5C400" : "#555" }} />
              <span style={{ flex: 1, textAlign: "left" }}>Configurações</span>
              <ChevronRight size={14} style={{ transform: settingsOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", color: "#555" }} />
            </button>
            {settingsOpen && (
              <div style={{ paddingLeft: 16 }}>
                <NavLink item={{ label: "Regras Financeiras", href: "/admin/configuracoes/financeiro", icon: <Settings2 size={16} /> }} />
                <NavLink item={{ label: "Tributos", href: "/admin/configuracoes/tributos", icon: <Receipt size={16} /> }} />
                <NavLink item={{ label: "Minha Conta", href: "/admin/conta", icon: <User size={16} /> }} />
              </div>
            )}
          </>
        )}
      </nav>

      <div style={{ borderTop: "1px solid #242424", padding: "14px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(245,196,0,0.12)", border: "1px solid rgba(245,196,0,0.25)", color: "#F5C400", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ color: "#FFFFFF", fontFamily: "'Rajdhani', sans-serif", fontSize: "14px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</p>
            <p style={{ color: "#555", fontFamily: "'Rajdhani', sans-serif", fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail}</p>
          </div>
        </div>
        <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: "2px", border: "1px solid #2A2A2A", color: "#666", background: "none", width: "100%", cursor: "pointer", fontSize: "13px" }}>
          <LogOut size={14} />
          <span>Sair da Conta</span>
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ role, userName, userEmail, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkScreen = () => setIsDesktop(window.innerWidth >= 1024);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    if (pathname.startsWith("/admin/configuracoes")) setSettingsOpen(true);
    return () => window.removeEventListener("resize", checkScreen);
  }, [pathname]);

  if (!mounted) return null;

  const contentProps = { role, userName, userEmail, onMobileClose, pathname, settingsOpen, setSettingsOpen, isDesktop };

  return (
    <>
      {/* Desktop sidebar */}
      {isDesktop && (
        <aside
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            width: 260,
            zIndex: 30,
          }}
        >
          <SidebarContent {...contentProps} />
        </aside>
      )}

      {/* Mobile drawer */}
      {!isDesktop && (
        <>
          {mobileOpen && (
            <div
              onClick={onMobileClose}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(2px)",
                zIndex: 40,
              }}
            />
          )}
          <aside
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              bottom: 0,
              width: 280,
              zIndex: 50,
              transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
              transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            <SidebarContent {...contentProps} />
          </aside>
        </>
      )}
    </>
  );
}
