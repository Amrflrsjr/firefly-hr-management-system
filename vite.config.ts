import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "https://localhost:7205", // Your local ASP.NET Core API port
        changeOrigin: true,
        secure: false, // Disables self-signed SSL verification for local testing
      },
    },
  },
});
