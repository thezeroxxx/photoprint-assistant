import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root,
  plugins: [react()],
  build: { outDir: "../dist/client", emptyOutDir: true },
  server: {
    port: 5173,
    host: true,
    proxy: { "/api": "http://localhost:3000" },
    // The demo sample transcript lives outside client/ (samples/).
    fs: { allow: [".."] },
  },
});
