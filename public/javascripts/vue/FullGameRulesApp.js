import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import FullGameRules from './components/FullGameRules.js';

export function initFullGameRulesApp(elementId = '#gamerules') {
  const app = createApp({
    components: {
      FullGameRules
    },
    template: '<FullGameRules />'
  });
  app.mount(elementId);
  return app;
}
