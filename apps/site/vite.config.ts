import { defineConfig } from "vite";
import { resolve } from "path";
import solid from "vite-plugin-solid";
import eslint from "vite-plugin-eslint";

export default defineConfig({
  plugins: [solid(), eslint()],
  server: {
    port: 8000,
  },
  resolve: {
    alias: {
      "#assets": resolve(__dirname, "assets"),
    },
  },
});
