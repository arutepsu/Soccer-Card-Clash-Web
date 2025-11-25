// /assets/javascripts/multiplayerScene.js
import { createSoundManager } from './utils/soundManager.js';
import { setPlayers } from './utils/playerSidesRegistry.js'; 

export async function build({ api, push, overlay, createGameAlert }) {
  // Sound Manager
  const soundManager = createSoundManager({ basePath: '/assets/sounds/' });
  soundManager.preload('hover', 'hover.wav');
  soundManager.preload('click', 'attack.wav');
  
  const root    = document.querySelector('.scene--create-multiplayer');
  const form    = root?.querySelector('form');
  const p1      = root?.querySelector('input[name="player1"]');
  const p2      = root?.querySelector('input[name="player2"]');
  const btnOk   = root?.querySelector('button[type="submit"]');
  const btnBack = root?.querySelector('a.gbtn.gbtn--secondary');

  const buttons = [btnOk, btnBack].filter(Boolean);
  buttons.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      if (!btn.disabled) soundManager.play('hover', { volume: 0.3 });
    });
    btn.addEventListener('click', () => {
      if (!btn.disabled) soundManager.play('click', { volume: 0.6 });
    });
  });

  const trim   = (el) => (el?.value ?? '').trim();
  const setBusy = (busy) => {
    btnOk?.classList.toggle('is-busy', !!busy);
    if (!btnOk) return;
    btnOk.disabled = !!busy;
    if (p1) p1.disabled = !!busy;
    if (p2) p2.disabled = !!busy;
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
    e.preventDefault();

    if (!validate()) {
      return false;
    }

    setBusy(true);

    const v1 = trim(p1);
    const v2 = trim(p2);

    try {
      if (push && typeof push.createGame === 'function') {
        // 🔥 new server-push based game creation
        push.createGame(v1, v2);
      } else if (api?.restart) {
        // fallback to old REST endpoint if push is not available
        await api.restart(v1, v2);
      }
    } catch (err) {
      console.error('create game failed:', err);
      showAlert('Could not create game, please try again.');
      setBusy(false);
      return false;
    }

    // navigation / scene switch will be driven by push events or elsewhere
    return false;
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      // we let the form submit handler do the work
    }
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
