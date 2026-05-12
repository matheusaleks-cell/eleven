"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InvestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const sessionStr = localStorage.getItem("eleven_session");
    
    if (!sessionStr) {
      window.location.href = "/login";
      return;
    }

    try {
      const session = JSON.parse(sessionStr);
      // Se for ADMIN, permite ver (opcional, mas geralmente admin pode tudo)
      // Ou redireciona se quiser separação rígida:
      /*
      if (session.role !== "INVESTOR") {
        window.location.href = "/admin/login";
        return;
      }
      */
      setAuthorized(true);
    } catch (e) {
      window.location.href = "/login";
    }
  }, []);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111111]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#F5C400] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#F5C400] font-bold uppercase tracking-widest text-[10px] animate-pulse">
            Sincronizando Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
