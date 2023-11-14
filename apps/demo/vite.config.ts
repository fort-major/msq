import { defineConfig } from "vite";
import { resolve } from "path";
import solid from "vite-plugin-solid";
import viteCompression from "vite-plugin-compression";

export default defineConfig({
  plugins: [solid(), viteCompression()],
  resolve: {
    alias: {
      "#assets": resolve(__dirname, "assets"),
    },
  },
});
