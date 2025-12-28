import { createApp } from 'vue';
import App from './App.vue';
import { router } from './app/router';

import './assets/styles/buttons.css';
import './assets/styles/dialogs.css';
import './assets/styles/cards.css';
import './assets/styles/theme.css';

import { createAppServices, AppServicesKey } from './app/appServices';
import vuetify from './plugins/vuetify';
import { registerServiceWorker } from './pwa/registerSW';

async function bootstrap() {
  try {
    await fetch('/api/bootstrap', { method: 'GET', credentials: 'include' });
  } catch (e) {
    console.warn('[bootstrap] failed (continuing)', e);
  }
}


bootstrap().then(() => {
  const app = createApp(App);

  app.use(vuetify);

  const services = createAppServices();
  app.provide(AppServicesKey, services);

  app.use(router);
  app.mount('#app');

  const goPractice = () => {
    router.replace({ name: 'PlayingField', query: { mode: 'local', kind: 'practice' } });
  };

  window.addEventListener('offline', goPractice);

  if (!navigator.onLine) goPractice();

  registerServiceWorker({
    onUpdateReady: () => console.log('[PWA] Update available'),
  });
});
