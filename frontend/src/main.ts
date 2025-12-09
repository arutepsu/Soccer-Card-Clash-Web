// frontend/src/main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './app/router';

import './assets/styles/buttons.css';
import './assets/styles/dialogs.css';
import './assets/styles/cards.css';
import './assets/styles/theme.css';
import './assets/styles/playersBar.css'; //refr later
import {
  createAppServices,
  AppServicesKey,
} from './app/appServices';

const app = createApp(App);

const services = createAppServices();

app.provide(AppServicesKey, services);

app.use(router);

app.mount('#app');
