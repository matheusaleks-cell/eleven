import type { MetadataRoute } from "next";

// Convenção de arquivo do Next: servido em /manifest.webmanifest e
// injetado automaticamente no <head>. É o que permite "Adicionar à tela
// de início" e rodar em standalone (sem a barra do navegador).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eleven Firearms · Sistema de Investimentos",
    short_name: "Eleven",
    description:
      "Plataforma de gestão de ciclos de investimento — Eleven Firearms",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#1A1A1A",
    theme_color: "#1A1A1A",
    icons: [
      {
        src: "/logos/logo-vertical-yellow.png",
        sizes: "800x800",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
