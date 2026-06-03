import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://bordervet.mx",
  vite: {
    plugins: [tailwindcss()],
  },
});
