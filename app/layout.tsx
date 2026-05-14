import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Eleven Firearms · Sistema de Investimentos",
  description: "Plataforma de gestão de ciclos de investimento — Eleven Firearms",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Rajdhani:wght@400;600;700&family=Roboto+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" style={{ background: "#1A1A1A", color: "#FFFFFF", margin: 0 }}>
        {children}
        <Toaster position="top-right" richColors theme="dark" />
      </body>
    </html>
  );
}
