import type { Config } from "tailwindcss";

/**
 * Politpuls — Schwarz-Rot-Gold design tokens.
 * Tailwind handles base resets + utility layout; the precise component
 * styling lives in CSS variables (app/globals.css) + inline styles, which
 * is where the PoliQuest design language was authored.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pq: {
          black: "#14130F",
          ink: "#1F1D17",
          "ink-soft": "#4A463C",
          "ink-mute": "#807A6A",
          line: "#E8E2D2",
          "line-soft": "#F0EADB",
          paper: "#FBF6E9",
          "paper-2": "#F4ECD6",
          gold: "#F6C414",
          "gold-deep": "#C48A05",
          "gold-soft": "#FFE9A0",
          red: "#D81E26",
          "red-deep": "#9B1219",
          "red-soft": "#FCE0DF",
          green: "#2E9F5D",
          "green-deep": "#166B3A",
          "green-soft": "#D8F0DE",
          blue: "#1B5FAE",
          "blue-soft": "#DCEAF7",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
