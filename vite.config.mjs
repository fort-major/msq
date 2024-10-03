import { defineConfig } from "vite";

export default defineConfig({
  root: "apps/landing", // Adjust according to your structure
  server: {
    port: 3000,
    open: true, // Automatically open the app in the default browser
  },
  build: {
    outDir: "../../dist", // Adjust according to your structure
  },
});
