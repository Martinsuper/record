import { createSSRApp } from "vue";
import { createPinia } from "pinia";
// @ts-ignore
import uView from "uview-plus";
import App from "./App.vue";

export function createApp() {
  const app = createSSRApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.use(uView);

  return {
    app,
    pinia,
  };
}