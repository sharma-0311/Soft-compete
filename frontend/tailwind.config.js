/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Barlow", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["'Barlow Condensed'", "ui-sans-serif", "sans-serif"],
      },
      colors: {
        background: "oklch(var(--background-ch) / <alpha-value>)",
        foreground: "oklch(var(--foreground-ch) / <alpha-value>)",
        card: {
          DEFAULT: "oklch(var(--card-ch) / <alpha-value>)",
          foreground: "oklch(var(--card-foreground-ch) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "oklch(var(--popover-ch) / <alpha-value>)",
          foreground: "oklch(var(--popover-foreground-ch) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "oklch(var(--primary-ch) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground-ch) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary-ch) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground-ch) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "oklch(var(--muted-ch) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground-ch) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent-ch) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground-ch) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive-ch) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground-ch) / <alpha-value>)",
        },
        border: "oklch(var(--border-ch) / <alpha-value>)",
        input: "oklch(var(--input-ch) / <alpha-value>)",
        ring: "oklch(var(--ring-ch) / <alpha-value>)",
        success: "oklch(var(--success-ch) / <alpha-value>)",
        warning: "oklch(var(--warning-ch) / <alpha-value>)",
        male: "oklch(var(--male-ch) / <alpha-value>)",
        female: "oklch(var(--female-ch) / <alpha-value>)",
        "div-subjr": "oklch(var(--div-subjr-ch) / <alpha-value>)",
        "div-cadet": "oklch(var(--div-cadet-ch) / <alpha-value>)",
        "div-junior": "oklch(var(--div-junior-ch) / <alpha-value>)",
        "div-senior": "oklch(var(--div-senior-ch) / <alpha-value>)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        hero: "var(--gradient-hero)",
      },
    },
  },
  plugins: [],
};
