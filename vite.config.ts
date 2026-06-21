import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Local dev proxy so `/api/tmdb/*` works without the Cloudflare Pages Function.
    // In production the Pages Function in /functions handles this route instead.
    proxy: {
      "/api/tmdb": {
        target: "https://api.themoviedb.org/3",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tmdb/, ""),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            const key = process.env.TMDB_API_KEY;
            if (key) {
              const url = new URL(proxyReq.path, "https://api.themoviedb.org");
              url.searchParams.set("api_key", key);
              proxyReq.path = url.pathname + url.search;
            }
          });
        },
      },
    },
  },
});
