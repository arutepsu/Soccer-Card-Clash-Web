export interface CardAnimations {
  applyHoverEffect(el: HTMLElement): void;
  removeHoverEffect(el: HTMLElement): void;
  applyBoostEffect(el: HTMLElement): void;
  removeBoostEffect(el: HTMLElement): void;
  applyDefeatedEffect(el: HTMLElement): void;
  highlightLastHandCard(
    playerId: string,
    gameState: any,
    root?: HTMLElement | null,
  ): HTMLElement | null;
}

export interface CardAnimationsOptions {
  boostImg?: string;
}

export function createCardAnimations(
  { boostImg = '/assets/images/cards/effects/boost.png' }: CardAnimationsOptions = {},
): CardAnimations {
  const running = new WeakMap<HTMLElement, { pulse?: Animation }>();
  const BOOST_CLASS = 'has-boost';

  function ensureBadge(el: HTMLElement): HTMLImageElement {
    let badge = el.querySelector<HTMLImageElement>(':scope > img.boost-badge');
    if (!badge) {
      badge = document.createElement('img');
      badge.className = 'boost-badge';
      badge.alt = 'Boosted';
      badge.src = boostImg;
      el.appendChild(badge);
    }
    if (getComputedStyle(el).position === 'static') {
      el.style.position = 'relative';
    }
    return badge;
  }

  function removeBadge(el: HTMLElement): void {
    const badge = el.querySelector<HTMLImageElement>(
      ':scope > img.boost-badge',
    );
    if (badge) badge.remove();
  }

  function applyHoverEffect(el: HTMLElement): void {
    el.style.transition = 'transform 200ms ease';
    el.style.transform = 'scale(1.08)';
  }

  function removeHoverEffect(el: HTMLElement): void {
    el.style.transition = 'transform 200ms ease';
    el.style.transform = 'scale(1.0)';
  }

  function applyBoostEffect(el: HTMLElement): void {
    el.classList.add(BOOST_CLASS);
    ensureBadge(el);

    const pulseAnim = el.animate(
      [
        { transform: 'scale(1.0)' },
        { transform: 'scale(1.05)' },
        { transform: 'scale(1.0)' },
      ],
      {
        duration: 1000,
        iterations: Infinity,
        direction: 'alternate',
        easing: 'ease-in-out',
      },
    );

    const map = running.get(el) ?? {};
    map.pulse = pulseAnim;
    running.set(el, map);

    el.style.boxShadow =
      '0 0 18px rgba(255,215,0,0.35), 0 0 36px rgba(255,215,0,0.18)';
    if (getComputedStyle(el).position === 'static') {
      el.style.position = 'relative';
    }
  }

  function removeBoostEffect(el: HTMLElement): void {
    const map = running.get(el);
    map?.pulse?.cancel?.();
    if (map) {
      delete map.pulse;
      running.set(el, map);
    }

    el.classList.remove(BOOST_CLASS);
    el.style.boxShadow = '';
    removeBadge(el);
  }

  function applyDefeatedEffect(el: HTMLElement): void {
    const map = running.get(el);
    map?.pulse?.cancel?.();
    if (map) {
      delete map.pulse;
      running.set(el, map);
    }

    try {
      el.animate(
        [
          {
            transform: 'scale(1) rotate(0deg)',
            filter: 'none',
            boxShadow: 'var(--shadow)',
          },
          {
            transform: 'scale(0.92) rotate(-3deg)',
            filter: 'brightness(1.1) saturate(1.2)',
            boxShadow: '0 0 18px rgba(255,0,0,0.45)',
          },
          {
            transform: 'scale(1.06) rotate(2deg)',
            filter: 'brightness(1.2) saturate(1.3)',
            boxShadow: '0 0 22px rgba(255,0,0,0.55)',
          },
          {
            transform: 'scale(1) rotate(0deg)',
            filter: 'grayscale(0.95) contrast(0.9) brightness(0.9)',
            boxShadow: 'var(--shadow)',
          },
        ],
        {
          duration: 520,
          easing: 'cubic-bezier(.2,.9,.2,1)',
          iterations: 1,
          fill: 'forwards',
        },
      );
    } catch {
    }
  }

  function highlightLastHandCard(
    playerId: string,
    gameState: any,
    root?: HTMLElement | null,
  ): HTMLElement | null {
    const hand = gameState?.gameCards?.hands?.[playerId] ?? [];
    if (!hand.length) return null;

    const lastEl = root?.querySelector<HTMLElement>(
      '.hand-row-inner .hand-card:last-child',
    );
    if (lastEl) {
      try {
        lastEl.animate(
          [
            { filter: 'brightness(1)' },
            { filter: 'brightness(1.3)' },
            { filter: 'brightness(1)' },
          ],
          { duration: 700, iterations: 1, easing: 'ease-in-out' },
        );
      } catch {
      }
    }
    return lastEl || null;
  }

  return {
    applyHoverEffect,
    removeHoverEffect,
    applyBoostEffect,
    removeBoostEffect,
    applyDefeatedEffect,
    highlightLastHandCard,
  };
}
