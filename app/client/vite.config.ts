import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL(".", import.meta.url));

// The dev server listens on localhost only. Set LAN=1 to open it to devices on the
// same network (e.g. a phone for the demo) — only do this on a trusted network.
const lan = process.env.LAN === "1";

export default defineConfig({
  root,
  plugins: [react()],
  build: { outDir: "../dist/client", emptyOutDir: true },
  server: {
    port: 5173,
    host: lan ? true : "localhost",
    proxy: { "/api": "http://127.0.0.1:3000" },
    // Only the folders the client actually needs (not data/ or the project root).
    fs: {
      allow: [root, resolve(root, "../samples"), resolve(root, "../shared"), resolve(root, "../node_modules")],
    },
  },
});
