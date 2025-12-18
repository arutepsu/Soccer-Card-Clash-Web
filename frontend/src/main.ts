// frontend/src/main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './app/router';

import './assets/styles/buttons.css';
import './assets/styles/dialogs.css';
import './assets/styles/cards.css';
import './assets/styles/theme.css';
import { createAppServices, AppServicesKey } from './app/appServices';
import vuetify from './plugins/vuetify';

const app = createApp(App);

app.use(vuetify);

const services = createAppServices();
app.provide(AppServicesKey, services);

app.use(router);

app.mount('#app');

// ✅ PWA: register Service Worker (served by frontend at /sw.js)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('/sw.js');
      // optional: console.log('SW registered');
    } catch (err) {
      console.warn('Service worker registration failed:', err);
    }
  });
}