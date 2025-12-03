import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import MainMenuScene from './components/MainMenuScene.js';

export function initMainMenuApp(elementId = '#app') {
  const app = createApp({
    components: {
      MainMenuScene
    },
    template: '<MainMenuScene />'
  });
  app.mount(elementId);
  return app;
}
