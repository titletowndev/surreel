import type { Config } from "tailwindcss";

/**
 * Surreel — Apple-grade design system.
 *
 * Near-monochrome chrome (white-on-black with Apple's tuned label grays),
 * frosted-glass depth over a soft ambient glow, and color used sparingly:
 * Apple system colors for data viz, green for "savings / positive".
 *
 * Token names are kept stable (ink / bone / amber / velvet) so existing markup
 * keeps working, but their VALUES are remapped to the Apple palette:
 *   amber  → system blue   (general interactive accent)
 *   velvet → system red    (destructive)
 *   bone   → label greys
 *   ink    → black / graphite surfaces
 */
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces — black + graphite
        ink: {
          900: "#000000", // canvas
          850: "#0C0C0E", // solid fields
          800: "#141416", // raised solid
          700: "#1C1C1F",
          600: "#2A2A2E",
          500: "#3A3A3F",
        },
        // Text — Apple label greys
        bone: {
          DEFAULT: "#F5F5F7",
          dim: "rgba(235,235,245,0.60)",
          faint: "rgba(235,235,245,0.30)",
        },
        // Interactive accent (was amber) → Apple system blue
        amber: {
          DEFAULT: "#0A84FF",
          soft: "#409CFF",
          deep: "#0060DF",
          glow: "#0A84FF",
        },
        // Destructive (was velvet) → Apple system red
        velvet: {
          DEFAULT: "#FF453A",
          soft: "#FF6961",
          deep: "#D70015",
        },
        // Apple system colors for data viz
        sys: {
          blue: "#0A84FF",
          indigo: "#5E5CE6",
          teal: "#64D2FF",
          green: "#30D158",
          mint: "#66D4CF",
          orange: "#FF9F0A",
          pink: "#FF375F",
          purple: "#BF5AF2",
        },
        positive: "#30D158",
        negative: "#FF453A",
      },
      fontFamily: {
        // Real SF Pro on Apple devices via the system stack.
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          "sans-serif",
        ],
        body: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"Helvetica Neue"',
          "system-ui",
          "sans-serif",
        ],
        mono: ['"SF Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        hero: "0 24px 70px -28px rgba(0,0,0,0.85)",
        card: "0 18px 50px -26px rgba(0,0,0,0.8)",
        glow: "0 0 50px -16px rgba(10,132,255,0.45)",
        glass: "inset 0 0.5px 0 0 rgba(255,255,255,0.08)",
      },
      backgroundImage: {
        ambient:
          "radial-gradient(55% 45% at 12% -5%, rgba(94,92,230,0.16), transparent 60%), radial-gradient(45% 38% at 96% 6%, rgba(10,132,255,0.13), transparent 60%), radial-gradient(80% 55% at 50% 108%, rgba(48,209,88,0.07), transparent 60%)",
        "hero-glow":
          "radial-gradient(circle at 80% 0%, rgba(48,209,88,0.20), transparent 60%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.4s ease both",
      },
    },
  },
  plugins: [],
};

export default config;
