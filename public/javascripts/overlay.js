(() => {
  function initOverlay(overlaySelector, openSelector, {
    autoHideDefault = false,
    sizeMultAuto = 0.7,
    sizeMultManual = 1.0,
    autoHideMs = 3000
  } = {}) {
    const overlay = document.querySelector(overlaySelector);
    if (!overlay) return;

    const frame = overlay.querySelector('.overlay-frame');
    const openBtn = document.querySelector(openSelector);
    const closeBtn = overlay.querySelector('[data-close-overlay]');
    const scrollContainer = overlay.querySelector('.overlay-scroll');

    let lastActive = null;
    let autoTimer = null;

    const getFocusable = () =>
      overlay.querySelectorAll(
        'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );

    function setSizeMultiplier(isAuto) {
      if (!frame) return;
      const mult = isAuto ? sizeMultAuto : sizeMultManual;
      frame.style.setProperty('--size-mult', String(mult));
    }

    const open = (opts = {}) => {
    const isAuto = opts.autoHide ?? autoHideDefault;

    lastActive = document.activeElement;

    setSizeMultiplier(isAuto);

    overlay.classList.remove('hidden', 'is-closing');
    overlay.inert = false;
    overlay.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => overlay.classList.add('visible'));
    document.body.classList.add('no-scroll');

    // --- FIX: reset scroll and focus top safely ---
    if (scrollContainer) {
        // temporarily disable smooth scroll
        const prev = scrollContainer.style.scrollBehavior;
        scrollContainer.style.scrollBehavior = 'auto';
        scrollContainer.scrollTop = 0;

        // focus the title (top element) without scrolling
        const titleEl = overlay.querySelector('.dialog-title');
        if (titleEl && typeof titleEl.focus === 'function') {
        titleEl.focus({ preventScroll: true });
        } else {
        scrollContainer.focus({ preventScroll: true });
        }

        // restore smooth scroll for user interactions
        requestAnimationFrame(() => {
        scrollContainer.style.scrollBehavior = prev || 'smooth';
        });
    }
    // ----------------------------------------------

    clearTimeout(autoTimer);
    if (isAuto) {
        autoTimer = setTimeout(close, autoHideMs);
    }
    };


    const close = () => {
      clearTimeout(autoTimer);

      if (overlay.contains(document.activeElement)) {
        document.activeElement.blur();
      }

      overlay.classList.add('is-closing');
      overlay.classList.remove('visible');

      const onEnd = () => {
        overlay.classList.add('hidden');
        overlay.inert = true;
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('no-scroll');

        if (lastActive && document.contains(lastActive)) {
          lastActive.focus();
        }
        overlay.removeEventListener('transitionend', onEnd);
      };
      overlay.addEventListener('transitionend', onEnd);
    };

    overlay.addEventListener('mousedown', (e) => {
      if (e.target === overlay) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('visible')) {
        e.preventDefault();
        close();
      }
    });

    overlay.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !overlay.classList.contains('visible')) return;
      const focusables = Array.from(getFocusable());
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });

    openBtn?.addEventListener('click', () => open({ autoHide: autoHideDefault }));
    closeBtn?.addEventListener('click', close);

    overlay.inert = true;
    overlay.setAttribute('aria-hidden', 'true');

    overlay.__openOverlay = open;
    overlay.__closeOverlay = close;
  }

  document.addEventListener('DOMContentLoaded', () => {
    initOverlay('#overlay', '[data-open-overlay]', {
      autoHideDefault: false,
      sizeMultAuto: 0.7,
      sizeMultManual: 1.0,
      autoHideMs: 3000
    });
  });

  window.SCCOverlay = { initOverlay };
})();
