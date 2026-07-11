import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // هوية قشطوطة بلبن
        brand: {
          DEFAULT: "#0875C9", // الأزرق الأساسي
          dark: "#064E9C", // الأزرق الداكن
          light: "#55C2F2", // الأزرق الفاتح
        },
        ink: "#10264B", // النص الداكن
        cloud: "#F6F9FC", // خلفية رمادية فاتحة جدًا
        accent: "#FFB703", // التنبيه والعروض
      },
      fontFamily: {
        sans: ["var(--font-cairo)", "Tahoma", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.75rem",
      },
      boxShadow: {
        soft: "0 8px 24px rgba(8,117,201,0.10)",
        card: "0 4px 16px rgba(16,38,75,0.08)",
        lift: "0 14px 40px rgba(8,117,201,0.20)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up .4s ease both",
        "pop-in": "pop-in .3s ease both",
      },
    },
  },
  plugins: [],
};
export default config;
