// frontend/src/main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './app/router';
import {
  createAppServices,
  AppServicesKey,
} from './app/appServices';
import { setupGlobalRouterObserver } from './app/globalRouterObserver';

const app = createApp(App);

const services = createAppServices();
app.provide(AppServicesKey, services);

app.use(router);

setupGlobalRouterObserver(router);

app.mount('#app');
