import js from "@eslint/js";
import vue from "eslint-plugin-vue";

export default [
  { ignores: ["dist/**", "node_modules/**"] },
  js.configs.recommended,
  ...vue.configs["flat/essential"],
  {
    files: ["**/*.js", "**/*.vue"],
    rules: {
      // Slots nativos do Web Component, não a sintaxe antiga de slots Vue.
      "vue/no-deprecated-slot-attribute": ["error", { ignoreParents: ["model-viewer"] }],
    },
    languageOptions: {
      globals: Object.fromEntries([
        "window", "document", "navigator", "fetch", "Image", "URLSearchParams",
        "setTimeout", "clearTimeout", "HTMLDialogElement", "HTMLMediaElement", "Event",
      ].map((name) => [name, "readonly"])),
    },
  },
];
