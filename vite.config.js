import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    proxy: {
      "/ws": {
        target: process.env.VITE_WS_TARGET,
        ws: true,
        changeOrigin: true,
      },
      "/query": {
        target: process.env.VITE_CORE_TARGET,
        changeOrigin: true,
      },
      "/get-session": {
        target: process.env.VITE_CORE_TARGET,
        changeOrigin: true,
      },
      "/get-history": {
        target: process.env.VITE_CORE_TARGET,
        changeOrigin: true,
      },
      "/sign-in": {
        target: process.env.VITE_AUTH_TARGET,
        changeOrigin: true,
      },
      "/sign-up": {
        target: process.env.VITE_AUTH_TARGET,
        changeOrigin: true,
      },
      "/all": {
        target: process.env.VITE_MEM0_TARGET,
        changeOrigin: true,
      },
    },
  },
});
