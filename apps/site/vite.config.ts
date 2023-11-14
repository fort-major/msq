import { defineConfig } from "vite";
import { resolve } from "path";
import solid from "vite-plugin-solid";
import viteCompression from "vite-plugin-compression";

export default defineConfig({
  plugins: [solid(), viteCompression()],
  server: {
    port: 8000,
  },
  resolve: {
    alias: {
      "#assets": resolve(__dirname, "assets"),
    },
  },
  build: {
    rollupOptions: {
      external: [
        // don't forget to change versions of these deps in index.html as well, if you're bumping them
        "@dfinity/candid",
        "@dfinity/agent",
        "@dfinity/principal",
        "@dfinity/identity",
        "@dfinity/ledger-icrc",
        "zod",
        "cbor-x",
        "@metamask/detect-provider",
        "js-big-decimal",
        "chart.js",
        "tweetnacl",
      ],
    },
  },
});
