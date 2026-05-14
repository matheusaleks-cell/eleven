"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "ADMIN" | "INVESTOR";
  userName: string;
  userEmail: string;
  pageTitle?: string;
}

export function DashboardLayout({ children, role, userName, userEmail, pageTitle }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Robust screen width detection
  useEffect(() => {
    const checkScreen = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#1A1A1A", display: "flex", width: "100%" }}>
      {/* Sidebar - Always active, handles its own visibility internal logic but we help it */}
      <Sidebar
        role={role}
        userName={userName}
        userEmail={userEmail}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main area — offset by sidebar on desktop */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          flex: 1,
          width: "100%",
          marginLeft: isDesktop ? "280px" : "0",
          transition: "margin-left 0.3s cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden"
        }}
      >
        <Header
          onMobileMenuOpen={() => setMobileOpen(true)}
          userName={userName}
          role={role}
          pageTitle={pageTitle}
        />

        <main
          style={{
            flex: 1,
            padding: isDesktop ? "32px" : "16px",
            width: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
