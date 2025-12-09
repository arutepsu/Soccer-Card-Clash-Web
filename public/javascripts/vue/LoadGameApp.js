import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import LoadGameScene from './components/LoadGameScene.js';

export function initLoadGameApp(elementId = '#app') {
  const app = createApp({
    components: {
      LoadGameScene
    },
    template: '<LoadGameScene />'
  });

  app.mount(elementId);
  return app;
}
