// @ts-check
import { defineConfig } from "astro/config";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        "/api/cnrtl": {
          target: "https://www.cnrtl.fr",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/cnrtl/, ""),
        },
      },
    },
  },
});
