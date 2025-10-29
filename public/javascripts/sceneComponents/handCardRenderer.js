// handCardRenderer.js
export function createHandCardRendererBase() {
  function calcHandSpacingDynamic(rowEl, handSize) {
    const first = rowEl.querySelector('.hand-card');
    if (!first) return -40;
    const w = parseFloat(getComputedStyle(first).width) || 140;
    const ratio =
      handSize >= 10 ? 0.55 :
      handSize >= 6  ? 0.45 :
                       0.25;
    return -Math.round(w * ratio);
  }

  function applyOverlapSpacing(rowEl, handSize) {
    const overlap = calcHandSpacingDynamic(rowEl, handSize);
    const cards = [...rowEl.querySelectorAll('.hand-card')];
    cards.forEach((el, i) => {
      el.style.marginLeft = i === 0 ? '0px' : `${overlap}px`;
      el.style.zIndex = String(i + 1);
    });
  }
  return { applyOverlapSpacing };
}

export function createDefaultHandCardRenderer(assets = {}) {
  const base = createHandCardRendererBase();

  const cardBaseUrl = assets.cardBaseUrl || '/assets/images/cards/';
  const backImg     = assets.backImg     || `${cardBaseUrl}flippedCard.png`;

  function fileNameToUrl(fileName) {
    return fileName ? `${cardBaseUrl}${fileName}.png` : null;
  }

  function resolveImage(card, isLast) {
    if (isLast && (card?.imgFront || card?.img)) return card.imgFront || card.img;
    if (!isLast && (card?.imgBack || card?.img)) return card.imgBack || backImg;
    const front = fileNameToUrl(card?.fileName);
    return isLast ? (front ?? backImg) : backImg;
  }


  function handsOf(gs, pid) {
    return (
      gs?.cards?.hands?.[pid] ??
      gs?.gameCards?.hands?.[pid] ??
      []
    );
  }

  function createHandCardRow(player, getGameState) {
    const gs = getGameState?.();
    const list = handsOf(gs, player.id);
    const row = document.createElement('div');
    row.className = 'hand-row-inner';
    row.setAttribute('role', 'group');

    list.forEach((card, index) => {
      const isLast = index === list.length - 1;

      const el = document.createElement('div');
      el.className = 'hand-card game-card';
      el.dataset.index = String(index);
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-pressed', 'false');

      const url = resolveImage(card, isLast);
      if (url) el.style.backgroundImage = `url("${url}")`;

      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.backgroundRepeat = 'no-repeat';

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'translateY(-2px) scale(1.05)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translateY(0) scale(1.0)';
      });

      row.appendChild(el);
    });

    base.applyOverlapSpacing(row, list.length);
    return row;
  }

  return { ...base, createHandCardRow };
}

