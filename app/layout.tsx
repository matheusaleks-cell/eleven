import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import SessionProviderWrapper from "@/components/providers/SessionProviderWrapper";

export const metadata: Metadata = {
  title: "Eleven Firearms · Sistema de Investimentos",
  description: "Plataforma de gestão de ciclos de investimento — Eleven Firearms",
  // Faz o iOS abrir em tela cheia (sem barra do Safari) quando salvo na tela de início
  appleWebApp: {
    capable: true,
    title: "Eleven",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.png",
    apple: "/logos/logo-vertical-yellow.png",
  },
};

// viewport-fit=cover libera as safe areas (notch / barra de gestos) para o layout
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1A1A1A",
  colorScheme: "dark",
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
        <SessionProviderWrapper>
          {children}
          <Toaster position="top-right" richColors theme="dark" />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
