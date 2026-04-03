import { createSSRApp } from "vue";
import { createPinia } from "pinia";
// @ts-ignore
import uView from "uview-plus";
import App from "./App.vue";
import { initSyncManager } from '@/utils/syncManager'

export function createApp() {
  const app = createSSRApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.use(uView);

  // 初始化同步管理器
  initSyncManager();

  return {
    app,
    pinia,
  };
}
