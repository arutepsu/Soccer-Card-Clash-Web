export interface OverlayShowOptions {
  autoHide?: boolean;
  onHide?: () => void;
  sizeMult?: number;
}

export interface OverlayOptions {
  host: HTMLElement;
  autoHideDefault?: boolean;
  sizeMultAuto?: number;
  sizeMultManual?: number;
  autoHideMs?: number;
}

export interface Overlay {
  show(node: HTMLElement, opts?: OverlayShowOptions): void;
  hide(): void;
}

export function createOverlay({
  host,
  autoHideDefault = false,
  sizeMultAuto = 0.7,
  sizeMultManual = 1.0,
  autoHideMs = 3000,
}: OverlayOptions): Overlay {
  if (!host) throw new Error("createOverlay: 'host' element is required.");

  const frame = host.querySelector<HTMLElement>('.overlay-frame');
  const scrollContainer = host.querySelector<HTMLElement>('.overlay-scroll');
  const closeBtn = host.querySelector<HTMLElement>('[data-close-overlay]');

  let lastActive: Element | null = null;
  let autoTimer: number | null = null;
  let onHideCb: (() => void) | null = null;

  function setSizeMultiplier(isAuto: boolean, customMult?: number): void {
    if (!frame) return;
    const mult =
      typeof customMult === 'number' && !Number.isNaN(customMult)
        ? customMult
        : isAuto
        ? sizeMultAuto
        : sizeMultManual;

    frame.style.setProperty('--size-mult', String(mult));
  }

  function open({
    autoHide = autoHideDefault,
    onHide,
    sizeMult,
  }: OverlayShowOptions = {}): void {
    onHideCb = typeof onHide === 'function' ? onHide : null;

    lastActive = document.activeElement;
    setSizeMultiplier(autoHide, sizeMult);

    host.classList.remove('hidden', 'is-closing');
    (host as any).inert = false;
    host.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => host.classList.add('visible'));
    document.body.classList.add('no-scroll');

    if (scrollContainer) {
      const prev = scrollContainer.style.scrollBehavior;
      scrollContainer.style.scrollBehavior = 'auto';
      scrollContainer.scrollTop = 0;

      const titleEl = host.querySelector<HTMLElement>('.dialog-title');
      (titleEl ?? scrollContainer).focus?.({ preventScroll: true } as any);

      requestAnimationFrame(() => {
        scrollContainer.style.scrollBehavior = prev || 'smooth';
      });
    }

    if (autoTimer != null) {
      clearTimeout(autoTimer);
      autoTimer = null;
    }
    if (autoHide) {
      autoTimer = window.setTimeout(() => close(), autoHideMs);
    }
  }

  function close(): void {
    if (autoTimer != null) {
      clearTimeout(autoTimer);
      autoTimer = null;
    }

    if (host.contains(document.activeElement)) {
      (document.activeElement as HTMLElement | null)?.blur();
    }

    host.classList.add('is-closing');
    host.classList.remove('visible');

    const onEnd = () => {
      host.classList.add('hidden');
      (host as any).inert = true;
      host.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('no-scroll');

      if (lastActive && document.contains(lastActive)) {
        (lastActive as HTMLElement).focus();
      }
      host.removeEventListener('transitionend', onEnd);

      try {
        onHideCb && onHideCb();
      } finally {
        onHideCb = null;
      }
    };

    host.addEventListener('transitionend', onEnd);
  }

  host.addEventListener('mousedown', (e) => {
    if (e.target === host) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && host.classList.contains('visible')) {
      e.preventDefault();
      close();
    }
  });

  host.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !host.classList.contains('visible')) return;

    const focusables = Array.from(
      host.querySelectorAll<HTMLElement>(
        'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  closeBtn?.addEventListener('click', () => close());

  function show(
    node: HTMLElement,
    { autoHide = autoHideDefault, onHide, sizeMult }: OverlayShowOptions = {},
  ): void {
    if (!(node instanceof HTMLElement)) {
      throw new Error('overlay.show expects an HTMLElement');
    }
    scrollContainer?.replaceChildren(node);
    open({ autoHide, onHide, sizeMult });
  }

  function hide(): void {
    close();
  }

  (host as any).inert = true;
  host.setAttribute('aria-hidden', 'true');
  host.classList.add('hidden');

  return { show, hide };
}
