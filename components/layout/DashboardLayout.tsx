"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "ADMIN" | "INVESTOR";
  userName: string;
  userEmail: string;
  pageTitle?: string;
}

export function DashboardLayout({ children, role, userName, userEmail, pageTitle }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // No mobile o investidor navega pela tab bar inferior; o admin continua no drawer
  const useTabBar = role === "INVESTOR";

  return (
    <div className="app-shell">
      <Sidebar
        role={role}
        userName={userName}
        userEmail={userEmail}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Área principal — o recuo da sidebar no desktop é feito por CSS (sem flash no load) */}
      <div className="app-main">
        <Header
          onMobileMenuOpen={() => setMobileOpen(true)}
          userName={userName}
          role={role}
          pageTitle={pageTitle}
        />

        <main className={cn("app-content custom-scrollbar", useTabBar && "app-content--tabbar")}>
          {children}
        </main>

        {useTabBar && <MobileTabBar />}
      </div>
    </div>
  );
}
