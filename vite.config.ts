import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni()
    // Bundle 分析器：运行 npm run build:h5 后会在项目根目录生成 stats.html
    // 如需启用，取消下方注释并确保在构建模式下运行
    // visualizer({
    //   filename: 'stats.html',
    //   gzipSize: true,
    //   brotliSize: true,
    //   open: false
    // })
  ],
  // uview-plus 需要配置 transpileDependencies
  build: {
    transpile: ['uview-plus']
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        silenceDeprecations: ['import', 'legacy-js-api']
      }
    }
  }
});