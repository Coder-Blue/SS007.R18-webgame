import { defineConfig } from "nitro";

// Nitro scans no directories by default. The project root owns routes/ so the
// Open Graph handler lives at /og.png beside the TanStack Start application.
export default defineConfig({
  serverDir: ".",
});
