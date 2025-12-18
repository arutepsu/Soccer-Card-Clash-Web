// frontend/src/main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './app/router';

import './assets/styles/buttons.css';
import './assets/styles/dialogs.css';
import './assets/styles/cards.css';
import './assets/styles/theme.css';
import {
  createAppServices,
  AppServicesKey,
} from './app/appServices';
import vuetify from './plugins/vuetify';

const app = createApp(App);

app.use(vuetify);

const services = createAppServices();

app.provide(AppServicesKey, services);

app.use(router);

app.mount('#app');

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registriert:', registration);
      })
      .catch(error => {
        console.error('Service Worker Registrierung fehlgeschlagen:', error);
      });
  });
}
