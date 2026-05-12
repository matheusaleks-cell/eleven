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
          minHeight: "100vh",
          flex: 1,
          width: "100%",
          marginLeft: isDesktop ? "280px" : "0", // Match sidebar width
          transition: "margin-left 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <Header
          onMobileMenuOpen={() => setMobileOpen(true)}
          userName={userName}
          role={role}
          pageTitle={pageTitle}
        />

        {/* Page content */}
        <main
          style={{
            flex: 1,
            padding: isDesktop ? "60px" : "30px",
            width: "100%",
            maxWidth: "1600px",
            margin: "0 auto",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
