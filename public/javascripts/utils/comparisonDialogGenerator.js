import { UIActionScheduler, delayed } from './uiActionScheduler.js';

let avatarRegistry = null;
let cardRegistry   = null;

/** Call once to inject registries/paths */
export function configure(opts = {}) {
  avatarRegistry = opts.avatarRegistry ?? avatarRegistry;
  cardRegistry   = opts.cardRegistry   ?? cardRegistry;
}

/** helpers */
function px(n) { return `${n}px`; }

function fadeInNode(node, durationMs = 500) {
  node.style.opacity = '0';
  node.style.transition = `opacity ${durationMs}ms`;
  // rAF twice to ensure style application before transition
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { node.style.opacity = '1'; });
  });
}

function slideInNode(node, fromX = -200, durationMs = 700) {
  node.style.transform = `translateX(${px(fromX)})`;
  node.style.transition = `transform ${durationMs}ms cubic-bezier(0.16, 1, 0.3, 1)`; // EaseOut-ish
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { node.style.transform = 'translateX(0)'; });
  });
}

function createText(text, { fontSize, weight = 'bold', color = 'white', fontFamily = 'Rajdhani, sans-serif', opacity = 0 }) {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.fontSize = px(fontSize);
  el.style.fontWeight = weight;
  el.style.color = color;
  el.style.fontFamily = fontFamily;
  el.style.opacity = String(opacity);
  return el;
}

function showResultText(el, durationMs = 500) {
  el.style.transition = `opacity ${durationMs}ms`;
  requestAnimationFrame(() => { el.style.opacity = '1'; });
}

function showWinnerText(el, durationMs = 500) {
  el.style.transition = `opacity ${durationMs}ms`;
  requestAnimationFrame(() => { el.style.opacity = '1'; });
}

function toPlayerName(p) {
  return typeof p === 'string' ? p : (p?.name ?? 'Player');
}

function getAvatarView(player, scale = 1) {
  if (!avatarRegistry) {
    const ph = document.createElement('div');
    ph.textContent = toPlayerName(player);
    ph.style.padding = '6px 10px';
    ph.style.borderRadius = '999px';
    ph.style.background = 'rgba(255,255,255,0.15)';
    return ph;
  }

  try {
    if (typeof avatarRegistry.getAvatarImg === 'function') {
      return avatarRegistry.getAvatarImg(player, { scale });
    }

    // Fallback: build <img> using getAvatarUrl
    if (typeof avatarRegistry.getAvatarUrl === 'function') {
      const img = document.createElement('img');
      img.src = avatarRegistry.getAvatarUrl(player);
      img.alt = toPlayerName(player);
      img.draggable = false;
      img.className = 'cmp-avatar neon-avatar';

      const baseSize = 500; // px
      img.style.width  = `${baseSize * scale}px`;
      img.style.height = `${baseSize * scale}px`;
      img.style.objectFit = 'cover';
      img.style.borderRadius = '999px';
      return img;
    }
  } catch (e) {
    console.warn('[CDG] failed to resolve avatar', player, e);
  }

  // Final fallback: text pill
  const ph = document.createElement('div');
  ph.textContent = toPlayerName(player);
  ph.style.padding = '6px 10px';
  ph.style.borderRadius = '999px';
  ph.style.background = 'rgba(255,255,255,0.15)';
  return ph;
}


function getCardUrlFromFileName(fileName) {
  if (cardRegistry?.getImageUrl) return cardRegistry.getImageUrl(`${fileName}.png`);
  if (cardRegistry?.getImageForCard) return cardRegistry.getImageForCard(fileName);
  return `/assets/images/cards/${fileName}.png`;
}

function createCardImageView(card, scale = 0.7) {
  const url = getCardUrlFromFileName(card?.fileName);
  const img = document.createElement('img');
  // Scala used 325x275 * scale with preserve ratio; we keep width and auto height
  img.src = url || '';
  img.alt = card?.fileName || 'card';
  img.style.width = px(325 * scale);
  img.style.height = px(275 * scale);
  img.style.objectFit = 'contain';
  img.style.imageRendering = 'auto';
  img.draggable = false;
  return img;
}

function createCardFrame(imageEl, { highlightGreen = false, highlightRed = false, slideFrom = 100 } = {}) {
  const frame = document.createElement('div');
  frame.className = 'cmp-card-frame';
  frame.style.position = 'relative';
  frame.style.display = 'inline-block';

  const border = document.createElement('div');
  border.style.position = 'absolute';
  border.style.left = '0';
  border.style.top = '0';
  border.style.right = '0';
  border.style.bottom = '0';
  border.style.border = '3px solid transparent';
  border.style.borderRadius = '8px';
  border.style.pointerEvents = 'none';

  frame.append(imageEl, border);

  slideInNode(frame, highlightGreen ? -Math.abs(slideFrom) : Math.abs(slideFrom), 700);

  // after 1s, apply border color like Scala PauseTransition
  setTimeout(() => {
    if (highlightGreen) border.style.borderColor = 'limegreen';
    else if (highlightRed) border.style.borderColor = 'red';
  }, 1000);

  return frame;
}

function hbox(gap = 10, children = []) {
  const box = document.createElement('div');
  box.style.display = 'flex';
  box.style.flexDirection = 'row';
  box.style.alignItems = 'center';
  box.style.justifyContent = 'center';
  box.style.gap = px(gap);
  children.forEach(ch => ch && box.append(ch));
  return box;
}

function vbox(gap = 10, children = []) {
  const box = document.createElement('div');
  box.style.display = 'flex';
  box.style.flexDirection = 'column';
  box.style.alignItems = 'center';
  box.style.justifyContent = 'center';
  box.style.gap = px(gap);
  children.forEach(ch => ch && box.append(ch));
  return box;
}

/**
 * Core renderer (Scala: showComparisonUI). Returns a DOM Node.
 */
function showComparisonUI({
  attacker, defender,
  attackingCard1, attackingCard2,
  defendingCard,
  attackSuccess,
  extraAttackerCard, extraDefenderCard,
  sceneWidth = 1200
}) {
  const baseWidth = 1200.0;
  const scaleFactor = Math.max(0.7, Math.min(1.5, sceneWidth / baseWidth));

  const resultMessage = attackSuccess ? 'Attack Successful!' : 'Attack Failed!';
  const resultText = createText(resultMessage, { fontSize: 16 * scaleFactor, weight: 'bold', color: 'white' });

  // Avatars
  const leftAvatar  = getAvatarView(attacker, 0.7 * scaleFactor);
  const rightAvatar = getAvatarView(defender, 0.7 * scaleFactor);

  // Card images
  const atkImg1 = attackingCard1 ? createCardImageView(attackingCard1, 0.7 * scaleFactor) : null;
  const atkImg2 = attackingCard2 ? createCardImageView(attackingCard2, 0.7 * scaleFactor) : null;
  const defImg  = defendingCard   ? createCardImageView(defendingCard, 0.6) : null;

  const extraAtkImg = extraAttackerCard ? createCardImageView(extraAttackerCard, 0.7 * scaleFactor) : null;
  const extraDefImg = extraDefenderCard ? createCardImageView(extraDefenderCard, 0.7 * scaleFactor) : null;

  // Frames w/ highlights + slide-in
  const atkFrame1 = attackingCard1 ? createCardFrame(createCardImageView(attackingCard1, 0.7), { highlightGreen: attackSuccess, highlightRed: false, slideFrom: 100 }) : null;
  const atkFrame2 = attackingCard2 ? createCardFrame(createCardImageView(attackingCard2, 0.7), { highlightGreen: attackSuccess, highlightRed: false, slideFrom: 100 }) : null;
  const extraAtkFrame = extraAttackerCard ? createCardFrame(createCardImageView(extraAttackerCard, 0.7), { highlightGreen: attackSuccess, highlightRed: false, slideFrom: 100 }) : null;

  const defFrame  = defendingCard ? createCardFrame(createCardImageView(defendingCard, 0.7), { highlightGreen: false, highlightRed: !attackSuccess, slideFrom: -100 }) : null;
  const extraDefFrame = extraDefenderCard ? createCardFrame(createCardImageView(extraDefenderCard, 0.7), { highlightGreen: false, highlightRed: !attackSuccess, slideFrom: -100 }) : null;

  // Winner line — mirrored from Scala (note: both branches used attacker.name there)
  const isDefenderWinner = !attackSuccess;
  const winnerTextContent = isDefenderWinner
    ? `🏆 Winner: ${toPlayerName(attacker)}`
    : `🏆 Winner: ${toPlayerName(attacker)}`;
  const winnerColor = isDefenderWinner ? 'red' : 'green';
  const winnerText = createText(winnerTextContent, { fontSize: 30 * scaleFactor, weight: 'bold', color: winnerColor });

  // Layouts
  const leftCards = [atkFrame1, atkFrame2, extraAtkFrame].filter(Boolean);
  const rightCards = [defFrame, extraDefFrame].filter(Boolean);

  const leftSpacing  = leftCards.length  >= 2 ? 5 : 10;
  const rightSpacing = rightCards.length >= 2 ? 5 : 10;

  const leftCardsBox  = hbox(leftSpacing, leftCards);
  const rightCardsBox = hbox(rightSpacing, rightCards);

  const cardImagesHBox = hbox(20, [leftCardsBox, rightCardsBox]);
  const cardImagesBox  = vbox(10, [cardImagesHBox]);

  // Tie-breaker row if any
  if (extraAtkFrame || extraDefFrame) {
    const tiebreaker = hbox(10, [extraAtkFrame, extraDefFrame].filter(Boolean));
    cardImagesBox.append(tiebreaker);
  }

  const cardImagesBoxPadded = vbox(20, [cardImagesBox]);
  cardImagesBoxPadded.style.padding = '0 80px';

  const playerInfoBox = hbox(10, [
    vbox(5, [leftAvatar]),
    cardImagesBoxPadded,
    vbox(5, [rightAvatar]),
  ]);

  // Root
  const root = vbox(10, [playerInfoBox, winnerText, resultText]);
  root.style.padding = '15px';
  root.style.borderRadius = '10px';
  root.style.backgroundColor = 'transparent';
  root.style.backgroundSize = '100% 100%';
  root.style.backgroundRepeat = 'no-repeat';
  root.style.backgroundPosition = 'center';

  // Animations sequence
  const scheduler = new UIActionScheduler();
  scheduler.runSequence(
    delayed(0,   () => fadeInNode(root, 700)),
    delayed(1500, () => showWinnerText(winnerText, 500)),
    delayed(1500, () => showResultText(resultText, 500)),
  );

  // initial fade to match Scala's extra call
  fadeInNode(root, 700);

  return root;
}

/** Public API (Scala-style wrappers) */
export function showSingleComparison(attacker, defender, attackingCard, defendingCard, attackSuccess, sceneWidth) {
  return showComparisonUI({
    attacker, defender, attackingCard1: attackingCard, attackingCard2: null,
    defendingCard, attackSuccess, extraAttackerCard: null, extraDefenderCard: null,
    sceneWidth
  });
}

export function showDoubleComparison(attacker, defender, attackingCard1, attackingCard2, defendingCard, attackSuccess, sceneWidth) {
  return showComparisonUI({
    attacker, defender, attackingCard1, attackingCard2,
    defendingCard, attackSuccess, extraAttackerCard: null, extraDefenderCard: null,
    sceneWidth
  });
}

export function showTieComparison(attacker, defender, attackingCard, defendingCard, extraAttackerCard, extraDefenderCard, sceneWidth) {
  return showComparisonUI({
    attacker, defender, attackingCard1: attackingCard, attackingCard2: null,
    defendingCard, attackSuccess: false, extraAttackerCard, extraDefenderCard,
    sceneWidth
  });
}

export function showDoubleTieComparison(attacker, defender, attackingCard1, attackingCard2, defendingCard, extraAttackerCard, extraDefenderCard, sceneWidth) {
  return showComparisonUI({
    attacker, defender, attackingCard1, attackingCard2,
    defendingCard, attackSuccess: false, extraAttackerCard, extraDefenderCard,
    sceneWidth
  });
}
