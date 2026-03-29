import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  // uview-plus 需要配置 transpileDependencies
  build: {
    transpile: ['uview-plus']
  }
});