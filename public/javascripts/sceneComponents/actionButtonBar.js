export function createActionButtonBar() {
  let root, onAction = () => {};

  function mount(el) {
    root = el;
    root.innerHTML = `
      <button type="button" class="gbtn" data-action="attack-regular">Attack</button>
      <button type="button" class="gbtn" data-action="attack-double">Double Attack</button>
      <button type="button" class="gbtn" data-action="info">Info</button>
    `;
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      e.preventDefault();
      const action = btn.dataset.action;
      if (action === 'info') { openInfoDialog('GAME_INFO'); return; }
      onAction(action);
    });
  }

  function setEnabled(map) {
    if (!root) return;
    Object.entries(map).forEach(([action, enabled]) => {
      const btn = root.querySelector(`[data-action="${action}"]`);
      if (btn) btn.disabled = !enabled;
    });
  }

  function onClick(fn) { onAction = fn || onAction; }

  function openInfoDialog(key = 'GAME_INFO') {
    const overlay = document.getElementById('overlay');
    if (!overlay) return;

    const html = `
      <div class="overlay-textflow">
        <div class="dialog-title">Game Instructions</div>
        <div class="dialog-message">
          (${key}) — put localized content here.
        </div>
        <div class="overlay-actions">
          <button class="gbtn" data-close-overlay>Close</button>
        </div>
      </div>
    `;

    // Prefer the proper API
    if (overlay.__showOverlay) {
      overlay.__showOverlay(html, { autoHide: false });
      return;
    }

    // Fallback (in case the bridge isn’t there yet)
    const scroll = overlay.querySelector('.overlay-scroll');
    if (scroll) scroll.innerHTML = html;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
  }

  return { mount, setEnabled, onClick };
}
