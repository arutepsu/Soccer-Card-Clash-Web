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

import { ensureBackendSession } from '@/api/bootstrapApi'
import { bootstrapAuth, watchSupabaseAuth } from '@/auth/bootstrapAuth'

async function bootstrap() {
  try { await ensureBackendSession() } catch (e) { console.warn('[bootstrap] backend failed', e) }
  try { await bootstrapAuth() } catch (e) { console.warn('[bootstrap] auth failed', e) }

  watchSupabaseAuth()
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
