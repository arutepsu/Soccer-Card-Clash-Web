// frontend/src/main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './app/router';
import {
  createAppServices,
  AppServicesKey,
} from './app/appServices';

const app = createApp(App);

// create the shared services once
const services = createAppServices();

// make them available to all components/composables via inject()
app.provide(AppServicesKey, services);

app.use(router);

app.mount('#app');
