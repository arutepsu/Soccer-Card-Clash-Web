// actionButtonBar.js
export function createActionButtonBar({ overlay } = {}) {
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

      if (action === 'info') {
        openInfoDialog('GAME_INFO');
        return;
      }

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

  function onClick(fn) {
    onAction = fn || onAction;
  }

  // 👇 uses the shared overlay instance
  function openInfoDialog(key = 'GAME_INFO') {
    if (!overlay || !overlay.show) return;

    const node = document.createElement('div');
    node.className = 'overlay-textflow';
    node.innerHTML = `
      <div class="dialog-title">Game Instructions</div>
      <div class="dialog-message">
        (${key}) — put localized content here.
      </div>
      <div class="overlay-actions">
        <button class="gbtn" data-close-overlay>Close</button>
      </div>
    `;

    node.querySelector('[data-close-overlay]')?.addEventListener('click', () => {
      overlay.hide();
    });

    overlay.show(node, { autoHide: false });
  }

  return { mount, setEnabled, onClick };
}
