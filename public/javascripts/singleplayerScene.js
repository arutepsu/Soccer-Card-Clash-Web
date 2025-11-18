// /assets/javascripts/scenes/scene.singlePlayer.js
import { createSoundManager } from './utils/soundManager.js';

export async function build({ overlay, createGameAlert }) {
  // Sound Manager 
  const soundManager = createSoundManager({ basePath: '/assets/sounds/' });
  soundManager.preload('hover', 'hover.wav');
  soundManager.preload('click', 'attack.wav');
  
  const root = document.querySelector('.scene--singleplayer');
  if (!root) return { destroy() {}, refresh: async () => {} };

  const input = root.querySelector('#p1name');
  const btnStart = root.querySelector('#btn-sp-start');

  btnStart?.addEventListener('mouseenter', () => {
    if (!btnStart.disabled) soundManager.play('hover', { volume: 0.6 });
  });
  
  btnStart?.addEventListener('click', () => {
    if (!btnStart.disabled) soundManager.play('click', { volume: 0.6 });
  });

  function showAlert(msg) {
    if (overlay && createGameAlert) {
      const el = createGameAlert({ message: msg });
      overlay.show(el, { onHide: () => el.cleanup?.() });
    } else alert(msg);
  }

  function onStartClick(e) {
    const name = (input?.value || '').trim();
    if (!name) {
      e.preventDefault();
      showAlert("Please enter your name first.");
      input?.focus();
      return;
    }
    try { sessionStorage.setItem('humanPlayerName', name); } catch {}
  }

  btnStart?.addEventListener('click', onStartClick);

  return {
    destroy() { btnStart?.removeEventListener('click', onStartClick); },
    refresh: async () => {},
  };
}
