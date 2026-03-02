import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#05060c",
        inkDeep: "#03040a",
        neon: "#3ad3ff",
        neonPurple: "#9a4dff",
        neonCyan: "#37fff2",
        neonPink: "#ff4fbf",
        electric: "#29b6f6",
        ember: "#ff6b35",
        panel: "#0c1020",
        glass: "rgba(255,255,255,0.06)"
      },
      boxShadow: {
        glow: "0 0 25px rgba(58,211,255,0.45)",
        neon: "0 0 18px rgba(154,77,255,0.5)",
        cyan: "0 0 18px rgba(55,255,242,0.45)",
        pink: "0 0 18px rgba(255,79,191,0.45)"
      },
      keyframes: {
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" }
        },
        "float-soft": {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" }
        },
        "pulse-soft": {
          "0%,100%": { transform: "scale(1)", opacity: "0.95" },
          "50%": { transform: "scale(1.03)", opacity: "1" }
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" }
        },
        flicker: {
          "0%": { opacity: "0.9" },
          "50%": { opacity: "1" },
          "100%": { opacity: "0.85" }
        }
      },
      animation: {
        "gradient-slow": "gradient-shift 14s ease infinite",
        "float-soft": "float-soft 6s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2.8s ease-in-out infinite",
        marquee: "marquee 18s linear infinite",
        flicker: "flicker 2.5s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
