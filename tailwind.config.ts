import type { Config } from "tailwindcss";
const { heroui } = require("@heroui/theme");

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "selector",
  plugins: [
    heroui({
      themes: {
        light: {},
        dark: {},
      },
    }),
  ],
};
export default config;
