// /assets/javascripts/navButtonBar.js
export function createNavButtonBar({ navigate } = {}) {
  let root;
  let onEvent = () => {};

  // small helper: prefer injected navigate(), else hard redirect
  function go(path) {
    if (typeof navigate === 'function') navigate(path);
    else window.location.href = path;
  }

  function mount(el) {
    root = el;
    root.innerHTML = `
      <button class="gbtn" data-action="pause">Pause</button>
      <button class="gbtn" data-action="show-defenders">Show Defenders</button>
      <button class="gbtn" data-action="make-swap">Make Swap</button>
    `;

    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const a = btn.dataset.action;

      if (a === 'pause') {
        openPauseDialog();
        return;
      }

      if (a === 'show-defenders') {
        // emit legacy event (optional)
        onEvent({ type: 'SceneSwitchEvent' });
        // clean routing
        go('/attacker-defenders');
        return;
      }

      if (a === 'make-swap') {
        onEvent({ type: 'SceneSwitchEvent'});
        // adjust this path to your real swap/hand scene route
        go('/attacker-hand');
        return;
      }
    });
  }

  function openPauseDialog() {
    const overlay = document.getElementById('overlay');
    if (!overlay?.__openOverlay) return;

    const html = `
      <h2 class="dialog-title">Paused</h2>
      <div class="overlay-actions" style="gap:10px; display:flex; justify-content:center;">
        <button class="gbtn" data-close-overlay>Resume</button>
        <button class="gbtn" data-pause-action="restart">Restart</button>
        <button class="gbtn" data-pause-action="exit">Exit</button>
      </div>
    `;
    overlay.querySelector('.overlay-scroll').innerHTML = html;
    overlay.__openOverlay({ autoHide: false });

    overlay.querySelector('.overlay-scroll').addEventListener('click', (e) => {
      const el = e.target.closest('[data-pause-action]');
      if (!el) return;
      const act = el.dataset.pauseAction;
      onEvent({ type: 'PauseDialogAction', action: act });
      overlay.__closeOverlay?.();
    }, { once: true });
  }

  function onSceneEvent(fn) { onEvent = fn || onEvent; }

  return { mount, onSceneEvent };
}
