import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ueno: {
          blue: "#0066FF",
          dark: "#0A1628",
          gray: "#F5F7FA",
          green: "#00C853",
          red: "#FF3D00",
          orange: "#FF9100",
          yellow: "#FFD600",
        },
      },
    },
  },
  plugins: [],
};
export default config;
