/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      cursor: {
        right: 'url("/MoveRight.svg"), pointer',
        left: 'url("/MoveLeft.svg"), pointer',
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        heading: ["var(--font-display)", "system-ui", "sans-serif"],
        albertSans: ["var(--font-AlbertSans)"],
        staatliches: ["var(--font-staatliches)"],
      },
      spacing: {
        "hero-left": "40rem",
        "hero-right": "400px",
      },
      colors: {
        primary: "#000000",
        secondary: "#14213d",
        accent: "#fca311",
        "gray-light": "#e5e5e5",
        "gray-dark": "#333333",
        white: "#ffffff",
        "orange-primary": "#ff4e00",
        "orange-accent": "#ec9f05",
        // v0 design tokens — use CSS-variable RGB channels for opacity modifier support
        lime: {
          DEFAULT: "rgb(var(--color-lime) / <alpha-value>)",
          foreground: "rgb(var(--color-lime-foreground) / <alpha-value>)",
        },
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        coral: "rgb(var(--color-coral) / <alpha-value>)",
        // semantic surface tokens
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        ring: "hsl(var(--ring) / <alpha-value>)",
      },
      gradientColorStops: {
        // Create custom gradient colors
        "orange-primary": "#ff4e00",
        "orange-accent": "#ec9f05",
      },
      // Configure gradient variants
      gradientVariants: {
        "to-br": ["to", "bottom", "right"],
      },
      // Configure gradient directions
      gradientDirections: {
        315: "315deg",
      },
      keyframes: {
        shimmer: {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        "flap-in": {
          "0%": { transform: "translateY(-60%) rotateX(40deg)", opacity: "0", filter: "blur(2px)" },
          "100%": { transform: "translateY(0) rotateX(0deg)", opacity: "1", filter: "blur(0)" },
        },
        spark: {
          "0%": { transform: "scale(0)", opacity: "1" },
          "60%": { transform: "scale(1.4)", opacity: "1" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        text: {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "flap-in": "flap-in 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
        spark: "spark 0.6s ease-out forwards",
        cursor: "blink 1s step-end infinite",
        text: "text 5s ease infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
