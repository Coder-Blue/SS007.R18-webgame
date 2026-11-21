import { defineConfig } from "nitro";

// Nitro scans no directories by default. The project root owns routes/ so the
// Open Graph handler lives at /og.png beside the TanStack Start application.
export default defineConfig({
  serverDir: ".",
  routeRules: {
    "/fonts/**": {
      headers: {
        "cache-control": "public, max-age=31536000, immutable",
      },
    },
    "/favicon.ico": {
      headers: {
        "cache-control": "public, max-age=2592000",
      },
    },
    "/favicon.png": {
      headers: {
        "cache-control": "public, max-age=2592000",
      },
    },
    "/favicon.svg": {
      headers: {
        "cache-control": "public, max-age=2592000",
      },
    },
    "/robots.txt": {
      headers: {
        "cache-control": "public, max-age=86400",
      },
    },
  },
  serverAssets: [
    {
      baseName: "fonts",
      dir: "./public/fonts",
      pattern: "*.ttf",
    },
  ],
});
