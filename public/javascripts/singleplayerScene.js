import { createSoundManager } from './utils/soundManager.js';

export async function build({ overlay, createGameAlert }) {
  const soundManager = createSoundManager({ basePath: '/assets/sounds/' });
  soundManager.preload('hover', 'hover.wav');
  soundManager.preload('click', 'attack.wav');

  const root = document.querySelector('.scene--singleplayer');
  if (!root) return { destroy() {}, refresh: async () => {} };

  const input    = root.querySelector('#p1name');
  const btnStart = root.querySelector('.btn-start');
  const btnBack  = root.querySelector('.btn-back');

  [btnStart, btnBack].forEach((btn) => {
    if (!btn) return;
    btn.addEventListener('mouseenter', () => {
      if (!btn.disabled) soundManager.play('hover', { volume: 0.6 });
    });
    btn.addEventListener('click', () => {
      if (!btn.disabled) soundManager.play('click', { volume: 0.6 });
    });
  });

  function showAlert(msg) {
    if (overlay && createGameAlert) {
      const el = createGameAlert({ message: msg });
      overlay.show(el, { onHide: () => el.cleanup?.() });
    } else {
      alert(msg);
    }
  }

  const getHumanName = () => (input?.value || '').trim();

  function onStartClick(e) {
    const name = getHumanName();
    if (!name) {
      e.preventDefault();
      showAlert('Please enter your name first.');
      input?.focus();
      return;
    }

    try {
      sessionStorage.setItem('humanPlayerName', name);
    } catch (err) {
      console.warn('[Singleplayer] failed to store name in sessionStorage:', err);
    }

  }

  btnStart?.addEventListener('click', onStartClick);

  return {
    destroy() {
      btnStart?.removeEventListener('click', onStartClick);
    },
    refresh: async () => {},
  };
}
