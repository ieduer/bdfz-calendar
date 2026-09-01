import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  publicDir: process.env.BDFZ_CALENDAR_PUBLIC_DIR || "public",
  build: {
    sourcemap: true,
    outDir: process.env.BDFZ_CALENDAR_OUT_DIR || "dist"
  }
});
