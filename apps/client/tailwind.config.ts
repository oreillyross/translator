import type { Config } from "tailwindcss";

/**
 * Dahlia "Midnight Moon" palette — CLAUDE.md §5. Exposed as `dm-*` theme
 * tokens so components never hardcode a hex value.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "dm-ink": "#12060F",
        "dm-shadow": "#2A0E2E",
        "dm-plum": "#4B1651",
        "dm-magenta": "#C21E7A",
        "dm-fuchsia": "#E0479E",
        "dm-blush": "#F7C6DD",
        "dm-cream": "#FBF4EA",
        "dm-gold": "#F2B705",
        "dm-leaf": "#2E7D5B",
      },
    },
  },
  plugins: [],
} satisfies Config;
