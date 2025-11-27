import { createSoundManager } from './utils/soundManager.js';
import { setPlayers } from './utils/playerSidesRegistry.js';

export async function build({ api, push, overlay, createGameAlert }) {
  const soundManager = createSoundManager({ basePath: '/assets/sounds/' });
  soundManager.preload('hover', 'hover.wav');
  soundManager.preload('click', 'attack.wav');

  const root    = document.querySelector('.scene--create-multiplayer');
  if (!root) return { destroy() {}, refresh: async () => {} };

  const form    = root.querySelector('form');
  const p1      = root.querySelector('input[name="player1"]');
  const p2      = root.querySelector('input[name="player2"]');
  const btnOk   = root.querySelector('button[type="submit"]');
  const btnBack = root.querySelector('a.gbtn.gbtn--secondary');

  const buttons = [btnOk, btnBack].filter(Boolean);
  buttons.forEach((btn) => {
    btn.addEventListener('mouseenter', () => {
      if (!btn.disabled) soundManager.play('hover', { volume: 0.3 });
    });
    btn.addEventListener('click', () => {
      if (!btn.disabled) soundManager.play('click', { volume: 0.6 });
    });
  });

  const trim = (el) => (el?.value ?? '').trim();

  const setBusy = (busy) => {
    const flag = !!busy;
    if (btnOk) {
      btnOk.disabled = flag;
      btnOk.classList.toggle('is-busy', flag);
    }
    if (p1) p1.disabled = flag;
    if (p2) p2.disabled = flag;
  };

  function showAlert(msg) {
    if (overlay && createGameAlert) {
      const el = createGameAlert({ message: msg });
      overlay.show(el, { onHide: () => el.cleanup?.() });
    } else {
      alert(msg);
    }
  }

  function validate() {
    const v1 = trim(p1);
    const v2 = trim(p2);

    setPlayers(v1, v2);

    if (!v1 || !v2) {
      showAlert('Please enter both player names.');
      return false;
    }
    if (v1.length > 40 || v2.length > 40) {
      showAlert('Names should be 40 characters or fewer.');
      return false;
    }
    return true;
  }

  async function onSubmit(e) {
    if (!validate()) {
      e.preventDefault();
      return false;
    }

    const v1 = trim(p1);
    const v2 = trim(p2);

    if (push && typeof push.createGame === 'function') {
      e.preventDefault();
      setBusy(true);

      try {
        push.createGame(v1, v2);
        window.location.href = '/playing-field';
      } catch (err) {
        console.error('[Multiplayer] createGame via push failed:', err);
        showAlert('Could not create game, please try again.');
        setBusy(false);
      }

      return false;
    }

    return true;
  }

  function onKeyDown(e) {
  }

  form?.addEventListener('submit', onSubmit);
  p1?.addEventListener('keydown', onKeyDown);
  p2?.addEventListener('keydown', onKeyDown);

  return {
    destroy() {
      form?.removeEventListener('submit', onSubmit);
      p1?.removeEventListener('keydown', onKeyDown);
      p2?.removeEventListener('keydown', onKeyDown);
      setBusy(false);
    },
    refresh: async () => {},
  };
}
