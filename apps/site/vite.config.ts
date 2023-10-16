import { defineConfig } from "vite";
import { resolve } from "path";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()],
  server: {
    port: 8000,
  },
  resolve: {
    alias: {
      "#assets": resolve(__dirname, "assets"),
    },
  },
});
