import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      maxWidth: {
        "9xl": "100rem",
      },
      fontFamily: {
        heading: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
      },
      keyframes: {
        "cta-shine": {
          "0%": { transform: "translateX(-100%) skewX(-8deg)" },
          "100%": { transform: "translateX(200%) skewX(-8deg)" },
        },
      },
      animation: {
        "cta-shine": "cta-shine 4.5s cubic-bezier(0.35, 0, 0.15, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
