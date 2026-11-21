import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/solid-start/plugin/vite";
import solid from "@solidjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { iconifySubset } from "./build/iconify-subset.ts";

export default defineConfig({
  server: {
    port: 3000,
    host: true,
  },
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    exclude: ["@ui-sdk/core"],
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "three-core", test: /three[\\/]build[\\/]three\.core\.js/ },
            { name: "three", test: /node_modules[\\/]three[\\/]/ },
            { name: "gsap", test: /node_modules[\\/]gsap[\\/]/ },
          ],
        },
      },
    },
  },
  plugins: [
    iconifySubset(),
    tailwindcss(),
    tanstackStart({ spa: { enabled: true } }),
    solid({ ssr: true }),
    nitro(),
  ],
});
