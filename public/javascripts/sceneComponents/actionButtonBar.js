// actionButtonBarWeb.js
export function createActionButtonBar() {
  let root, onAction = () => {};

  function mount(el) {
    root = el;
    root.innerHTML = `
      <button class="gbtn" data-action="attack-regular">Attack</button>
      <button class="gbtn" data-action="attack-double">Double Attack</button>
      <button class="gbtn" data-action="info">Info</button>
    `;
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]'); if (!btn) return;
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

  function onClick(fn) { onAction = fn || onAction; }

  function openInfoDialog(key = 'GAME_INFO') {
    const overlay = document.getElementById('overlay');
    if (!overlay?.__openOverlay) return;
    const html = `
      <h2 class="dialog-title">Game Instructions</h2>
      <p class="dialog-message">(${key}) — put localized content here.</p>
      <div class="overlay-actions"><button class="gbtn" data-close-overlay>Close</button></div>
    `;
    overlay.querySelector('.overlay-scroll').innerHTML = html;
    overlay.__openOverlay({ autoHide: false });
  }

  return { mount, setEnabled, onClick };
}
