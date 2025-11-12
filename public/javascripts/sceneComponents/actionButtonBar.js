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
    if (typeof fn === 'function') {
      onAction = fn;
    }
  }

  function onHoverEvent(fn) {
    if (typeof fn === 'function') {
      onHover = fn;
    }
  }

  function openInfoDialog(key = 'GAME_INFO') {
    const $overlay = $('#overlay');
    if (!$overlay.length) return;

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

    // Wenn das Overlay ein eigenes API hat
    const overlayEl = $overlay.get(0);
    if (overlayEl && typeof overlayEl.__showOverlay === 'function') {
      overlayEl.__showOverlay(html, { autoHide: false });
      return;
    }

    // Fallback: direkter jQuery-Zugriff
    const $scroll = $overlay.find('.overlay-scroll');
    if ($scroll.length) $scroll.html(html);

    $overlay.removeClass('hidden').attr('aria-hidden', 'false');
  }

  return { mount, setEnabled, onClick, onHoverEvent };
}
