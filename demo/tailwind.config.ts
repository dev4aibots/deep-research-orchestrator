import type { Config } from "tailwindcss";

/** Tailwind reads its palette entirely from the Meta token table in globals.css.
 *  Components must use var(--meta-*) tokens — never raw hex/px. */
const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1200px" } },
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--meta-brand-primary)",
          fb: "var(--meta-brand-fb)",
          deep: "var(--meta-brand-deep)",
        },
        surface: "var(--meta-app-bg)",
        card: "var(--meta-card)",
        "card-flat": "var(--meta-card-flat)",
        wash: "var(--meta-wash)",
        ink: {
          DEFAULT: "var(--meta-text-primary)",
          secondary: "var(--meta-text-secondary)",
          disabled: "var(--meta-text-disabled)",
          header: "var(--meta-text-header)",
        },
        divider: "var(--meta-divider)",
        positive: "var(--meta-positive)",
        "positive-bg": "var(--meta-positive-bg)",
        negative: "var(--meta-negative)",
        alert: "var(--meta-alert-red)",
        warning: "var(--meta-warning-amber)",
        link: "var(--meta-blue-link)",
        border: "var(--meta-divider)",
        input: "var(--meta-input-border)",
        background: "var(--meta-app-bg)",
        foreground: "var(--meta-text-primary)",
        primary: {
          DEFAULT: "var(--meta-button-primary-bg)",
          foreground: "var(--meta-text-inverse)",
        },
        secondary: {
          DEFAULT: "var(--meta-button-secondary-bg)",
          foreground: "var(--meta-button-secondary-text)",
        },
        muted: {
          DEFAULT: "var(--meta-card-flat)",
          foreground: "var(--meta-text-secondary)",
        },
        accent: {
          DEFAULT: "var(--meta-button-deemph-bg)",
          foreground: "var(--meta-brand-deep)",
        },
        destructive: {
          DEFAULT: "var(--meta-alert-red)",
          foreground: "var(--meta-text-inverse)",
        },
        popover: {
          DEFAULT: "var(--meta-card)",
          foreground: "var(--meta-text-primary)",
        },
      },
      borderRadius: {
        lg: "var(--meta-radius-lg)",
        md: "var(--meta-radius-button-md)",
        sm: "var(--meta-radius-button)",
        xl: "var(--meta-radius-lg)",
      },
      fontFamily: {
        sans: ["var(--meta-font-ui)"],
        mono: ["var(--meta-font-mono)"],
      },
      boxShadow: {
        card: "var(--meta-shadow-card)",
        elevated: "var(--meta-shadow-elevated)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
