// /assets/javascripts/navButtonBar.js
export function createNavButtonBar({ navigate, api, overlay, soundManager } = {}) {
  let root;
  let onEvent = () => {};

  function go(path) {
    if (typeof navigate === 'function') navigate(path);
    else window.location.href = path;
  }

  async function doRestart() {
    const btns = root?.querySelectorAll('[data-pause-action]');
    btns?.forEach(b => b.setAttribute('disabled', 'true'));
    try {
      if (api?.restart) {
        await api.restart();
      } else {
        await fetch('/api/game/restart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      }
      go('/playing-field');
    } catch (e) {
      console.error('Restart failed', e);
      alert('Restart failed. Please try again.');
    } finally {
      btns?.forEach(b => b.removeAttribute('disabled'));
    }
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
      
      if (soundManager && !btn.disabled) {
        soundManager.play('click', { volume: 0.6 });
      }
      
      const a = btn.dataset.action;

      if (a === 'pause') {
        openPauseDialog();
        return;
      }

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
    
    root.addEventListener('mouseenter', (e) => {
      const btn = e.target.closest('[data-action]');
      if (btn && soundManager && !btn.disabled) {
        soundManager.play('hover', { volume: 0.3 });
      }
    }, true);
  }

  function openPauseDialog() {
    if (!overlay || !overlay.show) return;

    const previouslyFocused = document.activeElement;

    const node = document.createElement('div');
    node.className = 'overlay-textflow';
    node.setAttribute('role', 'dialog');
    node.setAttribute('aria-label', 'Paused');
    node.innerHTML = `
      <h2 class="dialog-title" style="text-align:center;">Paused</h2>
      <div class="overlay-actions"
           style="display:flex; flex-direction:column; gap:12px; align-items:center; justify-content:center;">
        <button class="gbtn" data-pause-action="resume">Resume</button>
        <button class="gbtn" data-pause-action="undo">Undo</button>
        <button class="gbtn" data-pause-action="redo">Redo</button>
        <button class="gbtn" data-pause-action="restart">Restart</button>
        <button class="gbtn" data-pause-action="mainmenu">Main Menu</button>
      </div>
    `;

    const finishAndClose = (action) => {
      onEvent({ type: 'PauseDialogAction', action });
      cleanup();
      overlay.hide();

      if (previouslyFocused && document.contains(previouslyFocused)) {
        try { previouslyFocused.focus(); } catch {}
      }
    };

    const onClick = (e) => {
      const el = e.target.closest('[data-pause-action]');
      if (!el) return;
      
      if (soundManager && !el.disabled) {
        soundManager.play('click', { volume: 0.6 });
      }
      
      const act = el.dataset.pauseAction;

      if (act === 'resume') {
        finishAndClose('resume');
        return;
      }

      if (act === 'undo') {
        finishAndClose('undo');
        return;
      }

      if (act === 'redo') {
        finishAndClose('redo');
        return;
      }

      if (act === 'restart') {
        // we want the scene to know about restart, but also actually restart
        onEvent({ type: 'PauseDialogAction', action: 'restart' });
        cleanup();
        overlay.hide();
        doRestart();
        return;
      }

      if (act === 'mainmenu') {
        onEvent({ type: 'PauseDialogAction', action: 'mainmenu' });
        cleanup();
        overlay.hide();
        go('/main-menu');
        return;
      }
    };

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        finishAndClose('resume');
      }
    };

    function cleanup() {
      scroll?.removeEventListener('click', onClick);
      scroll?.removeEventListener('mouseenter', onHover, true);
      document.removeEventListener('keydown', onKey);
    }
    
    const onHover = (e) => {
      const el = e.target.closest('[data-pause-action]');
      if (el && soundManager && !el.disabled) {
        soundManager.play('hover', { volume: 0.3 });
      }
    };

    scroll?.addEventListener('click', onClick);
    scroll?.addEventListener('mouseenter', onHover, true);
    document.addEventListener('keydown', onKey);

    overlay.show(node, { autoHide: false });

    const firstBtn = node.querySelector('[data-pause-action]');
    if (firstBtn) firstBtn.focus();
  }

  function onSceneEvent(fn) { onEvent = fn || onEvent; }

  return { mount, onSceneEvent };
}
