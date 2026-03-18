import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const apiUrl = env.VITE_API_URL ?? "http://localhost:3001";
    return {
        plugins: [react(), tsconfigPaths()],
        server: {
            proxy: {
                "/engine": apiUrl,
            },
        },
    };
});
