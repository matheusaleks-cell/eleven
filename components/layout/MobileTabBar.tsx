"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  CreditCard,
  FileText,
  User,
} from "lucide-react";

interface TabItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

// Espelha o investorNav do Sidebar — mesma ordem, rótulos curtos para caber na tab bar
const investorTabs: TabItem[] = [
  { label: "Início", href: "/investidor", icon: <LayoutDashboard size={20} /> },
  { label: "Projetos", href: "/investidor/projetos", icon: <FolderKanban size={20} /> },
  { label: "Extrato", href: "/investidor/extrato", icon: <CreditCard size={20} /> },
  { label: "Docs", href: "/investidor/documentos", icon: <FileText size={20} /> },
  { label: "Perfil", href: "/investidor/perfil", icon: <User size={20} /> },
];

export function MobileTabBar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/investidor" ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="app-tabbar backdrop-blur-md" aria-label="Navegação principal">
      {investorTabs.map((tab) => {
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="app-tabbar-item"
            data-active={active}
            aria-current={active ? "page" : undefined}
          >
            <span className="app-tabbar-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
