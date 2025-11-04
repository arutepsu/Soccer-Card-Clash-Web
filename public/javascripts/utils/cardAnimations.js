// /assets/javascripts/utils/cardAnimations.js
export function createCardAnimations({
  boostImg = '/assets/images/cards/effects/boost.png'
} = {}) {
  const running = new WeakMap();          // { pulse: Animation }
  const BOOST_CLASS = 'has-boost';

 function ensureBadge(el) {
   let badge = el.querySelector(':scope > img.boost-badge');
   if (!badge) {
     badge = document.createElement('img');
     badge.className = 'boost-badge';
     badge.alt = 'Boosted';
     badge.src = boostImg;
     el.appendChild(badge);
   }
   // host must allow absolute children
   if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
   return badge;
 }
 function removeBadge(el) {
   el.querySelector(':scope > img.boost-badge')?.remove?.();
 }

  function removeBadge(el) {
    const badge = el.querySelector(':scope > img.boost-badge');
    if (badge) badge.remove();
  }

  /* ---------- hover ---------- */
  function applyHoverEffect(el /*, selectedIndex, index */) {
    // Keep your original hover feel
    el.style.transition = 'transform 200ms ease';
    el.style.transform = 'scale(1.08)';
  }

  function removeHoverEffect(el /*, selectedIndex, index */) {
    el.style.transition = 'transform 200ms ease';
    el.style.transform = 'scale(1.0)';
  }

  /* ---------- boost (pulse + badge + glow) ---------- */
  function applyBoostEffect(el) {
    // 1) add class & badge (idempotent)
    el.classList.add('has-boost');
    ensureBadge(el);

    // 2) pulse (store animation so we can cancel later)
    const anim = el.animate(
      [
        { transform: 'scale(1.0)'  },
        { transform: 'scale(1.05)' },
        { transform: 'scale(1.0)'  },
      ],
      { duration: 1000, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }
    );

    const map = running.get(el) ?? {};
    map.pulse = anim;
    running.set(el, map);

    // 3) subtle glow
    el.style.boxShadow = '0 0 18px rgba(255,215,0,0.35), 0 0 36px rgba(255,215,0,0.18)';
    // make sure the element can host absolutely-positioned children
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  }

  function removeBoostEffect(el) {
    const map = running.get(el);
    map?.pulse?.cancel?.();
    if (map) { delete map.pulse; running.set(el, map); }

    el.classList.remove(BOOST_CLASS);
    el.style.boxShadow = '';
    el.classList.remove('has-boost');
    removeBadge(el);
  }

  /* ---------- optional nicety you already had ---------- */
  function highlightLastHandCard(playerId, gameState, root) {
    const hand = gameState?.gameCards?.hands?.[playerId] ?? [];
    if (!hand.length) return null;
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
