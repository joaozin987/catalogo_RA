import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue({ template: { compilerOptions: {
    isCustomElement: (tag) => tag === "model-viewer" || tag.startsWith("a-"),
  } } })],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:8000",
      "/static": "http://127.0.0.1:8000",
    },
  },
  test: { environment: "jsdom", restoreMocks: true, setupFiles: ["./tests/setup.js"] },
});
