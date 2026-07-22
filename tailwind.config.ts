import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        panel: "rgb(var(--color-panel) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        core: "rgb(var(--color-core) / <alpha-value>)",
        pulse: "rgb(var(--color-pulse) / <alpha-value>)",
        growth: "rgb(var(--color-growth) / <alpha-value>)",
        focus: "rgb(var(--color-focus) / <alpha-value>)",
        ember: "rgb(var(--color-ember) / <alpha-value>)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        lift: "var(--shadow-lift)",
      },
      borderRadius: { product: "var(--radius)" },
    },
  },
  plugins: [],
};

export default config;
