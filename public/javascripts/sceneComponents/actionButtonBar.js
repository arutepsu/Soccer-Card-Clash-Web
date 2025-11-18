// actionButtonBar.js
export function createActionButtonBar({ overlay } = {}) {
  let root, onAction = () => {};
export function createActionButtonBar() {
  let $root = null;
  let onAction = () => {};
  let onHover = null; // Callback für Hover-Events

  function mount(el) {
    $root = $(el);
    $root.html(`
      <button type="button" class="gbtn" data-action="attack-regular">Attack</button>
      <button type="button" class="gbtn" data-action="attack-double">Double Attack</button>
      <button type="button" class="gbtn" data-action="info">Info</button>
    `;

    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      e.preventDefault();
      const action = btn.dataset.action;
    `);

    $root.on('click', '[data-action]', function (e) {
      e.preventDefault();
      const action = $(this).data('action');

      if (action === 'info') {
        openInfoDialog('GAME_INFO');
        return;
      }

      onAction(action);
    });

    // Hover-Event für Sound-Effekte
    $root.on('mouseenter', '[data-action]', function (e) {
      if (onHover && !$(this).prop('disabled')) {
        const action = $(this).data('action');
        onHover({ type: 'hover', action });
      }
    });
  }

  function setEnabled(map) {
    if (!$root) return;
    $.each(map, (action, enabled) => {
      const $btn = $root.find(`[data-action="${action}"]`);
      $btn.prop('disabled', !enabled);
    });
  }

  function onClick(fn) {
    onAction = fn || onAction;
    if (typeof fn === 'function') {
      onAction = fn;
    }
  }

  function onHoverEvent(fn) {
    if (typeof fn === 'function') {
      onHover = fn;
    }
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

  return { mount, setEnabled, onClick, onHoverEvent };
}
