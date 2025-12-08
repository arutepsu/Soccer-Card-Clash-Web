// frontend/src/main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './app/router';

import './assets/styles/buttons.css';
import './assets/styles/dialogs.css';
import {
  createAppServices,
  AppServicesKey,
} from './app/appServices';

const app = createApp(App);

const services = createAppServices();

app.provide(AppServicesKey, services);

app.use(router);

app.mount('#app');
