// /assets/javascripts/navButtonBar.js
export function createNavButtonBar({ navigate } = {}) {
  let root;
  let onEvent = () => {};

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

      if (a === 'pause') { openPauseDialog(); return; }

      if (a === 'show-defenders') {
        onEvent({ type: 'SceneSwitchEvent' });
        go('/attacker-defenders');
        return;
      }

      if (a === 'make-swap') {
        onEvent({ type: 'SceneSwitchEvent' });
        go('/attacker-hand');
        return;
      }
    });
  }

  function showOverlay(overlay, html, opts = { autoHide: false }) {
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.remove('hidden');

    if (overlay.__showOverlay) {
      overlay.__showOverlay(html, opts);
      return true;
    }

    const scroll = overlay.querySelector('.overlay-scroll');
    if (scroll) scroll.innerHTML = html;

    if (overlay.__openOverlay) {
      overlay.__openOverlay(opts);
    }

    return true;
  }

  function closeOverlay(overlay, { restoreTo } = {}) {
    if (restoreTo && restoreTo.focus) {
      try { restoreTo.focus(); } catch {}
    } else {
      if (document.activeElement && document.activeElement !== document.body) {
        try { document.activeElement.blur(); } catch {}
      }
    }

    overlay.__closeOverlay?.();
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function openPauseDialog() {
    const overlay = document.getElementById('overlay');
    if (!overlay) return;

    const previouslyFocused = document.activeElement;

    const html = `
      <div class="overlay-textflow" role="dialog" aria-label="Paused">
        <h2 class="dialog-title" style="text-align:center;">Paused</h2>
        <div class="overlay-actions" style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center;">
          <button class="gbtn" data-pause-action="resume">Resume</button>
          <button class="gbtn" data-pause-action="undo">Undo</button>
          <button class="gbtn" data-pause-action="redo">Redo</button>
          <button class="gbtn" data-pause-action="restart">Restart</button>
          <button class="gbtn" data-pause-action="mainmenu">Main Menu</button>
        </div>
      </div>
    `;

    showOverlay(overlay, html, { autoHide: false });

    const firstBtn = overlay.querySelector('[data-pause-action]');
    if (firstBtn) firstBtn.focus();

    const scroll = overlay.querySelector('.overlay-scroll');

    const finishAndClose = (action) => {
      onEvent({ type: 'PauseDialogAction', action });
      cleanup();
      closeOverlay(overlay, { restoreTo: previouslyFocused });
    };

    const onClick = (e) => {
      const el = e.target.closest('[data-pause-action]');
      if (!el) return;
      const act = el.dataset.pauseAction;

      if (act === 'mainmenu') {
        onEvent({ type: 'PauseDialogAction', action: 'mainmenu' });
        cleanup();
        closeOverlay(overlay, { restoreTo: previouslyFocused });
        go('/main-menu');
        return;
      }
      finishAndClose(act);
    };

    const onKey = (e) => {
      if (e.key === 'Escape') finishAndClose('resume');
    };

    function cleanup() {
      scroll?.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    }

    scroll?.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
  }

  function onSceneEvent(fn) { onEvent = fn || onEvent; }

  return { mount, onSceneEvent };
}
