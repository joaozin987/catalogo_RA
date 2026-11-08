import { createApp } from "vue";
import App from "./App.vue";

async function start() {
  switch (window.location.pathname) {
    case "/camera": await import("../../static/camera.css"); break;
    case "/ar": await import("../../static/ar.css"); break;
    case "/laboratorio-3d": break;
    default: await import("../../static/style.css");
  }
  createApp(App).mount("#app");
}
start();
