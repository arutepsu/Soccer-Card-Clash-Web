// /assets/javascripts/cardAnimationsWeb.js
export function createCardAnimations() {
  const running = new WeakMap(); // el -> {hover?, pulse?}

  function applyHoverEffect(el, selectedIndex, index) {
    // Scala used ScaleTransition 200ms
    el.style.transition = 'transform 200ms ease';
    // only lift if not another selection or this is hovered
    el.style.transform = 'scale(1.08)';
  }

  function removeHoverEffect(el, selectedIndex, index) {
    el.style.transition = 'transform 200ms ease';
    el.style.transform = 'scale(1.0)';
  }

  function applyBoostEffect(el) {
    // Scala pulsateTransition (indefinite). Use WAAPI.
    const anim = el.animate(
      [
        { transform: 'scale(1.0)' },
        { transform: 'scale(1.05)' },
        { transform: 'scale(1.0)' },
      ],
      { duration: 1000, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }
    );
    const map = running.get(el) ?? {};
    map.pulse = anim;
    running.set(el, map);
    // add a soft glow
    el.style.boxShadow = '0 0 18px rgba(255,215,0,0.35), 0 0 36px rgba(255,215,0,0.18)';
  }

  function removeBoostEffect(el) {
    const map = running.get(el);
    map?.pulse?.cancel?.();
    el.style.boxShadow = '';
  }

  // returns the DOM element it highlighted (or null)
  function highlightLastHandCard(playerId, gameState, root) {
    const hand = gameState?.gameCards?.hands?.[playerId] ?? [];
    if (!hand.length) return null;
    // last card is face-up in your renderers—add a quick glow
    const lastEl = root?.querySelector?.('.hand-row-inner .hand-card:last-child');
    if (lastEl) {
      lastEl.animate(
        [{ filter: 'brightness(1)' }, { filter: 'brightness(1.3)' }, { filter: 'brightness(1)' }],
        { duration: 700, iterations: 1, easing: 'ease-in-out' }
      );
    }
    return lastEl || null;
  }

  return {
    applyHoverEffect,
    removeHoverEffect,
    applyBoostEffect,
    removeBoostEffect,
    highlightLastHandCard,
  };
}
