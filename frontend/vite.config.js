import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "",
        changeOrigin: true,
      },
      // ✅ чтобы /uploads/... грузилось с backend
      "/uploads": {
        target: "",
        changeOrigin: true,
      },
    },
  },
});
