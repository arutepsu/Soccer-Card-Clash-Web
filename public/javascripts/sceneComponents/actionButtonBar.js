// actionButtonBar.js
export function createActionButtonBar({ overlay } = {}) {
  let $root = null;
  let onAction = () => {};
  let onHover = null; // callback for hover events

  function mount(el) {
    $root = $(el);

    $root.html(`
      <button type="button" class="gbtn" data-action="attack-regular">Attack</button>
      <button type="button" class="gbtn" data-action="attack-double">Double Attack</button>
      <button type="button" class="gbtn" data-action="info">Info</button>
    `);

    // remove old handlers (if remounted)
    $root.off('click.actionBar');
    $root.off('mouseenter.actionBar');

    // click handler
    $root.on('click.actionBar', '[data-action]', function (e) {
      e.preventDefault();
      const action = $(this).data('action');

      if (action === 'info') {
        openInfoDialog('GAME_INFO');
        return;
      }

      if (typeof onAction === 'function') {
        onAction(action);
      }
    });

    // hover handler (for sounds, etc.)
    $root.on('mouseenter.actionBar', '[data-action]', function () {
      if (!onHover) return;
      const $btn = $(this);
      if ($btn.prop('disabled')) return;

      const action = $btn.data('action');
      onHover({ type: 'hover', action });
    });
  }

  function setEnabled(map) {
    if (!$root) return;
    Object.entries(map).forEach(([action, enabled]) => {
      const $btn = $root.find(`[data-action="${action}"]`);
      $btn.prop('disabled', !enabled);
    });
  }

  function onClick(fn) {
    if (typeof fn === 'function') {
      onAction = fn;
    }
  }

  function onHoverEvent(fn) {
    if (typeof fn === 'function') {
      onHover = fn;
    }
  }

  // uses the shared overlay instance
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
      overlay.hide?.();
    });

    overlay.show(node, { autoHide: false });
  }

  return {
    mount,
    setEnabled,
    onClick,
    onHoverEvent,
  };
}
