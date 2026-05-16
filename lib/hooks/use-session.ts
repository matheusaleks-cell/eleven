"use client";

import { useState, useEffect } from "react";

interface SessionState {
  userName: string;
  userEmail: string;
  userId: string;
}

export function useAdminSession(): SessionState {
  const [session, setSession] = useState<SessionState>({
    userName: "Administrador",
    userEmail: "",
    userId: "",
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("eleven_session");
      if (raw) {
        const p = JSON.parse(raw);
        setSession({
          userName: p.name || "Administrador",
          userEmail: p.email || "",
          userId: p.id || "",
        });
      }
    } catch {}
  }, []);

  return session;
}

export function useInvestorSession(): SessionState {
  const [session, setSession] = useState<SessionState>({
    userName: "Investidor",
    userEmail: "",
    userId: "",
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("eleven_session");
      if (raw) {
        const p = JSON.parse(raw);
        setSession({
          userName: p.name || "Investidor",
          userEmail: p.email || "",
          userId: p.id || "",
        });
      }
    } catch {}
  }, []);

  return session;
}
