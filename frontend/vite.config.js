import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/super8": "http://localhost:3000",
      "/usuarios": "http://localhost:3000",
      "/ranking": "http://localhost:3000",
    },
  },
});
