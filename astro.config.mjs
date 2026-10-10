// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // GitHub Pages: https://fervalle200190.github.io/victor-barber/
  site: "https://fervalle200190.github.io",
  base: "/victor-barber",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
