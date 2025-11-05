// /assets/javascripts/app.js
import { WebSceneManager } from './scenes/WebSceneManager.js';

document.addEventListener('DOMContentLoaded', async () => {
  const mgr = new WebSceneManager();
  await mgr.init();
});
