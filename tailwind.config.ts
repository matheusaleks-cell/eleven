import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        rajdhani: ["Rajdhani", "sans-serif"],
        mono: ["Roboto Mono", "monospace"],
      },
      colors: {
        brand: {
          bg:           "#1A1A1A",
          surface:      "#242424",
          input:        "#2E2E2E",
          tertiary:     "#2E2E2E",
          accent:       "#F5C400",
          "accent-hover": "#D4A900",
          border:       "#333333",
          "border-accent": "#F5C400",
          "text-primary":   "#FFFFFF",
          "text-secondary": "#A0A0A0",
          "text-muted":     "#606060",
          success:      "#4CAF50",
          danger:       "#E53935",
          warning:      "#FF9800",
        },
      },
      borderRadius: {
        military: "2px",
      },
      boxShadow: {
        modal: "0 4px 20px rgba(0,0,0,0.6)",
        card: "0 2px 8px rgba(0,0,0,0.4)",
      },
      letterSpacing: {
        military: "0.1em",
        table: "0.08em",
      },
    },
  },
  plugins: [],
};

export default config;
