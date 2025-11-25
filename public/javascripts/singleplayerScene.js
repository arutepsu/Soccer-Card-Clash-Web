import { createSoundManager } from './utils/soundManager.js';

export async function build({ api, push, overlay, createGameAlert }) {
  // Sound Manager 
  const soundManager = createSoundManager({ basePath: '/assets/sounds/' });
  soundManager.preload('hover', 'hover.wav');
  soundManager.preload('click', 'attack.wav');
  
  const root = document.querySelector('.scene--singleplayer');
  if (!root) return { destroy() {}, refresh: async () => {} };

  const form     = root.querySelector('form');
  const input    = root.querySelector('#p1name');
  const btnStart = root.querySelector('#btn-sp-start');

  const aiSelect = root.querySelector('[name="aiPlayer"]');

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
    } else {
      alert(msg);
    }
  }

  const getHumanName = () => (input?.value || '').trim();

  const getAiName = () => {
    if (!aiSelect) return 'AI';

    if (aiSelect instanceof HTMLSelectElement) {
      const v = aiSelect.value.trim();
      return v || 'AI';
    }

    const checked = root.querySelector('input[name="aiPlayer"]:checked');
    if (checked && checked.value) {
      return checked.value.trim() || 'AI';
    }

    return 'AI';
  };

  const setBusy = (busy) => {
    const flag = !!busy;
    if (btnStart) {
      btnStart.disabled = flag;
      btnStart.classList.toggle('is-busy', flag);
    }
    if (input) input.disabled = flag;

    root.querySelectorAll('[name="aiPlayer"]').forEach(el => {
      el.disabled = flag;
    });
  };

  async function onSubmit(e) {
    const name = getHumanName();

    if (!name) {
      e.preventDefault();
      showAlert('Please enter your name first.');
      input?.focus();
      return;
    }

    try { sessionStorage.setItem('humanPlayerName', name); } catch {}

    const aiName = getAiName();

    if (push && typeof push.createGameWithAI === 'function') {
      e.preventDefault();
      setBusy(true);

      try {
        push.createGameWithAI(name, aiName);
      } catch (err) {
        console.error('CreateGameWithAI failed:', err);
        showAlert('Could not start game, please try again.');
        setBusy(false);
      }

      return;
    }

  }

  form?.addEventListener('submit', onSubmit);

  return {
    destroy() {
      form?.removeEventListener('submit', onSubmit);
    },
    refresh: async () => {},
  };
}
