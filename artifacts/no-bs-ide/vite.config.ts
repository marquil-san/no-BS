import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const port = Number(process.env.PORT) || 5173;
const apiPort = Number(process.env.API_PORT) || 3001;

export default defineConfig({
base: "/",

plugins: [
react(),
tailwindcss(),
],

resolve: {
alias: {
"@": path.resolve(__dirname, "src"),
},
dedupe: ["react", "react-dom"],
},

root: __dirname,

build: {
outDir: "dist",
emptyOutDir: true,
},

server: {
port,
host: "localhost", // 👈 local only


proxy: {
  "/ws": {
    target: `ws://localhost:${apiPort}`,
    ws: true,
    changeOrigin: true,
  },
  "/api": {
    target: `http://localhost:${apiPort}`,
    changeOrigin: true,
  },
},

},

preview: {
port,
host: "localhost", // 👈 local only
},
});
