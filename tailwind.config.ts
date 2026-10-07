import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          alt: "var(--surface-alt)",
        },
        border: "var(--border)",
        text: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
        },
        ink: "var(--ink)",
        // Acentos da marca Markah
        magenta: "var(--magenta)",
        laranja: "var(--laranja)",
        amarelo: "var(--amarelo)",
        verde: "var(--verde)",
        ciano: "var(--ciano)",
        violeta: "var(--violeta)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-sora)", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        pill: "999px",
        input: "8px",
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(0, 0, 0, 0.06)",
        hover: "0 8px 24px rgba(0, 0, 0, 0.08)",
      },
      maxWidth: {
        container: "1280px",
      },
    },
  },
  plugins: [],
};

export default config;
