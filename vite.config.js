import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [tailwindcss(), react()],
    server: {
      proxy: {
        "/ws": {
          target: env.VITE_WS_TARGET,
          ws: true,
          changeOrigin: true,
        },
        "/query": {
          target: env.VITE_CORE_TARGET,
          changeOrigin: true,
        },
        "/get-session": {
          target: env.VITE_CORE_TARGET,
          changeOrigin: true,
        },
        "/get-history": {
          target: env.VITE_CORE_TARGET,
          changeOrigin: true,
        },
        "/sign-in": {
          target: env.VITE_AUTH_TARGET",
          changeOrigin: true,
        },
        "/sign-up": {
          target: env.VITE_AUTH_TARGET",
          changeOrigin: true,
        },
        "/all": {
          target: env.VITE_MEM0_TARGET,
          changeOrigin: true,
        },
      },
    },
  };
});