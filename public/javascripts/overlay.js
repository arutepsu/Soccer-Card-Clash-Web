// javascripts/components/overlay.js
export function createOverlay({
  host,                   // required: the <div id="overlay" ...> element
  autoHideDefault = false,
  sizeMultAuto = 0.7,
  sizeMultManual = 1.0,
  autoHideMs = 3000,
} = {}) {
  if (!host) throw new Error("createOverlay: 'host' element is required.");

  const frame           = host.querySelector('.overlay-frame');
  const scrollContainer = host.querySelector('.overlay-scroll');
  const closeBtn        = host.querySelector('[data-close-overlay]');

  let lastActive = null;
  let autoTimer  = null;
  let onHideCb   = null;

  function setSizeMultiplier(isAuto) {
    if (!frame) return;
    frame.style.setProperty('--size-mult', String(isAuto ? sizeMultAuto : sizeMultManual));
  }

  function open({ autoHide = autoHideDefault, onHide } = {}) {
    onHideCb = typeof onHide === 'function' ? onHide : null;

    lastActive = document.activeElement;
    setSizeMultiplier(autoHide);

    host.classList.remove('hidden', 'is-closing');
    host.inert = false;
    host.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => host.classList.add('visible'));
    document.body.classList.add('no-scroll');

    if (scrollContainer) {
      const prev = scrollContainer.style.scrollBehavior;
      scrollContainer.style.scrollBehavior = 'auto';
      scrollContainer.scrollTop = 0;

      const titleEl = host.querySelector('.dialog-title');
      (titleEl ?? scrollContainer).focus?.({ preventScroll: true });

      requestAnimationFrame(() => {
        scrollContainer.style.scrollBehavior = prev || 'smooth';
      });
    }

    clearTimeout(autoTimer);
    if (autoHide) autoTimer = setTimeout(close, autoHideMs);
  }

  function close() {
    clearTimeout(autoTimer);

    if (host.contains(document.activeElement)) {
      document.activeElement.blur();
    }

    host.classList.add('is-closing');
    host.classList.remove('visible');

    const onEnd = () => {
      host.classList.add('hidden');
      host.inert = true;
      host.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('no-scroll');

      if (lastActive && document.contains(lastActive)) lastActive.focus();
      host.removeEventListener('transitionend', onEnd);
      try { onHideCb && onHideCb(); } finally { onHideCb = null; }
    };
    host.addEventListener('transitionend', onEnd);
  }

  // backdrop click (your backdrop is the host itself)
  host.addEventListener('mousedown', (e) => {
    if (e.target === host) close();
  });

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && host.classList.contains('visible')) {
      e.preventDefault();
      close();
    }
  });

  // focus trap
  host.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !host.classList.contains('visible')) return;
    const focusables = Array.from(host.querySelectorAll(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    ));
    if (!focusables.length) return;
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });

  // close button
  closeBtn?.addEventListener('click', close);

  function show(node, { autoHide = autoHideDefault, onHide } = {}) {
    if (!(node instanceof Node)) throw new Error('overlay.show expects a DOM Node');
    scrollContainer?.replaceChildren(node);
    open({ autoHide, onHide });
  }

  function hide() { close(); }

  // initial hidden state (matches your Twirl)
  host.inert = true;
  host.setAttribute('aria-hidden', 'true');
  host.classList.add('hidden');

  return { show, hide };
}
