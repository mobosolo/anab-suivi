import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#eef1ee",
        surface: "#ffffff",
        surfaceSoft: "#f5f6f3",
        ink: "#161d1a",
        inkSoft: "#5d685f",
        inkFaint: "#8b948a",
        line: "#e1e5df",
        green: "#1f6650",
        greenSoft: "#1f66501a",
        greenDeep: "#134336",
        orange: "#d9641e",
        orangeSoft: "#d9641e1a",
        red: "#b3402c",
        redSoft: "#b3402c14",
      },
      fontFamily: {
        head: ["Manrope", "Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
