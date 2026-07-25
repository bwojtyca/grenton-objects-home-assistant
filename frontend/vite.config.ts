import { defineConfig } from "vite";

// Builds the panel as a single ES module (with lit bundled in) straight into the
// integration folder, where panel.py serves it. emptyOutDir MUST stay false so
// we never wipe the Python integration files.
export default defineConfig({
  build: {
    outDir: "../custom_components/grenton_objects",
    emptyOutDir: false,
    target: "es2021",
    minify: true,
    lib: {
      entry: "src/panel.ts",
      formats: ["es"],
      fileName: () => "panel.js",
    },
    rollupOptions: {
      output: { entryFileNames: "panel.js" },
    },
  },
});
