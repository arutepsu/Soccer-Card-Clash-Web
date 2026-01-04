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

import { ensureBackendSession } from '@/api/bootstrapApi';
import { bootstrapAuth, watchSupabaseAuth } from '@/auth/bootstrapAuth';
import { authState } from '@/auth/authState';

import { createCardImageRegistry } from './utils/cardImageRegistry';
import { createPlayerAvatarRegistry } from './utils/playerAvatarRegistry';
import { warmCache } from './pwa/warmCaches';

const cardRegistry = createCardImageRegistry();
const avatarRegistry = createPlayerAvatarRegistry();

async function bootstrap() {
  if (!navigator.onLine) {
    console.log('[bootstrap] offline -> skip backend/auth bootstrap');
    return;
  }

  try { await ensureBackendSession(); } catch (e) { console.warn('[bootstrap] backend failed', e); }
  try { await bootstrapAuth(); } catch (e) { console.warn('[bootstrap] auth failed', e); }

  watchSupabaseAuth();
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

  const goOnlineLanding = () => {
    if (authState.loggedIn) router.replace({ name: 'MainMenu' });
    else router.replace({ name: 'Login' });
  };

  window.addEventListener('offline', goPractice);
  window.addEventListener('online', goOnlineLanding);

  if (!navigator.onLine) goPractice();

  registerServiceWorker({
    onUpdateReady: () => console.log('[PWA] Update available'),
    onRegistered: async () => {
      if (!navigator.onLine) return;

      const urls = [
        ...cardRegistry.getAllUrls(),
        ...avatarRegistry.getAllUrls(),
      ];

      await warmCache(urls);
    },
  });
});
