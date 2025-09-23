import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'vogue': ['var(--font-vogue)', 'serif'],
        'jost': ['var(--font-jost)', 'sans-serif'],
        'sans': ['var(--font-jost)', 'sans-serif'],
        'serif': ['var(--font-vogue)', 'serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'skeleton-pulse': 'skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        'skeleton-pulse': {
          '0%, 100%': { opacity: '1', backgroundColor: 'rgb(243, 244, 246)' },
          '50%': { opacity: '0.7', backgroundColor: 'rgb(229, 231, 235)' }
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        }
      }
    },
  },
  plugins: [],
};

export default config;