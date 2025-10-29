//assets/javascripts/gameCardWeb.js

export function createGameCardView({
  registry,
  flipped = true,
  isLastCard = false,
  isSelectable = false,
  card = null,
  scaleFactor = 0.45
} = {}) {
  const el = document.createElement('div');
  el.className = 'game-card';

  const w = 525 * scaleFactor;
  const h = 325 * scaleFactor;
  el.style.width = `${w}px`;
  el.style.height = `${h}px`;
  el.style.borderRadius = '12px';
  el.style.overflow = 'hidden';
  el.style.boxShadow = '5px 5px 10px rgba(0,0,0,0.7)';

  function fileNameForState() {
    if (flipped && !isLastCard) return 'defeated.png';
    return card?.fileName ?? 'king_of_clubs2.png';
  }

  function setBackgroundByFile(fileName) {
    const src = registry.getImageUrl(fileName);
    el.style.backgroundImage = `url("${src}")`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
  }

  setBackgroundByFile(fileNameForState());

  function flip() {
    flipped = !flipped;
    setBackgroundByFile(fileNameForState());
    return api;
  }

  const api = {
    el,
    flip,
    setSelected(sel) {
      el.dataset.selected = sel ? '1' : '0';
      el.style.outline = sel ? '3px solid gold' : 'none';
      el.style.boxShadow = sel
        ? '0 0 18px rgba(255,215,0,0.6), 5px 5px 10px rgba(0,0,0,0.7)'
        : '5px 5px 10px rgba(0,0,0,0.7)';
    },
    setBoosted(boosted) {
      if (boosted) {
        el.style.boxShadow = '0 0 18px rgba(255,215,0,0.35), 0 0 36px rgba(255,215,0,0.18), 5px 5px 10px rgba(0,0,0,0.7)';
      } else {
        el.style.boxShadow = '5px 5px 10px rgba(0,0,0,0.7)';
      }
    },
  };

  return api;
}
