import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        pos: {
          header: "hsl(var(--pos-header))",
          "header-foreground": "hsl(var(--pos-header-foreground))",
          sidebar: "hsl(var(--pos-sidebar))",
          "sidebar-foreground": "hsl(var(--pos-sidebar-foreground))",
          "sidebar-active": "hsl(var(--pos-sidebar-active))",
          "sidebar-active-foreground": "hsl(var(--pos-sidebar-active-foreground))",
          "badge-red": "hsl(var(--pos-badge-red))",
          "badge-blue": "hsl(var(--pos-badge-blue))",
          "badge-green": "hsl(var(--pos-badge-green))",
          "badge-yellow": "hsl(var(--pos-badge-yellow))",
        },
        register: {
          bg: "hsl(var(--register-bg))",
          border: "hsl(var(--register-border))",
          "btn-green": "hsl(var(--register-btn-green))",
          "btn-salmon": "hsl(var(--register-btn-salmon))",
          "btn-red": "hsl(var(--register-btn-red))",
          "btn-olive": "hsl(var(--register-btn-olive))",
          "btn-yellow": "hsl(var(--register-btn-yellow))",
          "btn-gold": "hsl(var(--register-btn-gold))",
          "btn-pink": "hsl(var(--register-btn-pink))",
          "btn-lightblue": "hsl(var(--register-btn-lightblue))",
          "btn-blue": "hsl(var(--register-btn-blue))",
          "btn-teal": "hsl(var(--register-btn-teal))",
          "btn-purple": "hsl(var(--register-btn-purple))",
          "btn-darkred": "hsl(var(--register-btn-darkred))",
          "btn-dark": "hsl(var(--register-btn-dark))",
          "btn-gray": "hsl(var(--register-btn-gray))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
