import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" makes all asset paths relative, so the build works whether it's
// served from the domain root or a GitHub Pages project subpath (/<repo>/).
export default defineConfig({
  base: "./",
  plugins: [react()],
});
