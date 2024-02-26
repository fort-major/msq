import { defineConfig } from "vite";
import { resolve } from "path";
import solid from "vite-plugin-solid";
import viteCompression from "vite-plugin-compression";

export default defineConfig({
  plugins: [solid(), viteCompression()],
  server: {
    port: 8000,
    cors: true,
  },
  resolve: {
    alias: {
      "#assets": resolve(__dirname, "assets"),
    },
  },
});
