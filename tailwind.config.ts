import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#edf4ea",
        paper: "#0f1411",
        line: "#2a352e",
        muted: "#9aaa9f",
        core: "#4db7a7",
        pulse: "#e09a55",
        growth: "#a4cf6f",
        focus: "#7aa7e8",
        ember: "#e06464",
      },
      boxShadow: {
        soft: "0 18px 42px rgba(0, 0, 0, 0.24)",
        glow: "0 18px 60px rgba(77, 183, 167, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
