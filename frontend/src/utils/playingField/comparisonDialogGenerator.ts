// src/scenes/playingField/comparisonDialogGenerator.ts

import {
  UIActionScheduler,
  delayed,
} from '../../ui/uiActionScheduler';

import type {
  ComparisonDialogGenerator,
  PlayerInfo,
  ComparisonCard,
} from './comparisonDialogHandler';

import type { PlayerAvatarRegistry } from '../playerAvatarRegistry';
import type { CardImageRegistry } from '../cardImageRegistry';

let avatarRegistry: PlayerAvatarRegistry | null = null;
let cardRegistry: CardImageRegistry | null = null;

export interface ComparisonDialogConfig {
  avatarRegistry?: PlayerAvatarRegistry | null;
  cardRegistry?: CardImageRegistry | null;
}

export function configure(opts: ComparisonDialogConfig = {}): void {
  avatarRegistry = opts.avatarRegistry ?? avatarRegistry;
  cardRegistry = opts.cardRegistry ?? cardRegistry;
}

function px(n: number): string {
  return `${n}px`;
}

function fadeInNode(node: HTMLElement, durationMs = 500): void {
  node.style.opacity = '0';
  node.style.transition = `opacity ${durationMs}ms`;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      node.style.opacity = '1';
    });
  });
}

function slideInNode(
  node: HTMLElement,
  fromX = -200,
  durationMs = 700,
): void {
  node.style.transform = `translateX(${px(fromX)})`;
  node.style.transition = `transform ${durationMs}ms cubic-bezier(0.16, 1, 0.3, 1)`; // EaseOut-ish

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      node.style.transform = 'translateX(0)';
    });
  });
}

interface TextOpts {
  fontSize: number;
  weight?: string;
  color?: string;
  fontFamily?: string;
  opacity?: number;
}

function createText(
  text: string,
  {
    fontSize,
    weight = 'bold',
    color = 'white',
    fontFamily = 'Rajdhani, sans-serif',
    opacity = 0,
  }: TextOpts,
): HTMLDivElement {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.fontSize = px(fontSize);
  el.style.fontWeight = weight;
  el.style.color = color;
  el.style.fontFamily = fontFamily;
  el.style.opacity = String(opacity);
  return el;
}

function showResultText(el: HTMLElement, durationMs = 500): void {
  el.style.transition = `opacity ${durationMs}ms`;
  requestAnimationFrame(() => {
    el.style.opacity = '1';
  });
}

function showWinnerText(el: HTMLElement, durationMs = 500): void {
  el.style.transition = `opacity ${durationMs}ms`;
  requestAnimationFrame(() => {
    el.style.opacity = '1';
  });
}

function toPlayerName(p: unknown): string {
  if (typeof p === 'string') return p;
  if (p && typeof p === 'object' && 'name' in p) {
    const anyP = p as { name?: string | null };
    return anyP.name ?? 'Player';
  }
  return 'Player';
}

function getAvatarView(player: PlayerInfo, scale = 1): HTMLElement {
  if (!avatarRegistry) {
    const ph = document.createElement('div');
    ph.textContent = toPlayerName(player);
    ph.style.padding = '6px 10px';
    ph.style.borderRadius = '999px';
    ph.style.background = 'rgba(255,255,255,0.15)';
    return ph;
  }

  try {
    if (typeof (avatarRegistry as any).getAvatarImg === 'function') {
      return (avatarRegistry as any).getAvatarImg(player, { scale }) as HTMLElement;
    }

    if (typeof avatarRegistry.getAvatarUrl === 'function') {
      const img = document.createElement('img');
      img.src = avatarRegistry.getAvatarUrl(player);
      img.alt = toPlayerName(player);
      img.draggable = false;
      img.className = 'cmp-avatar neon-avatar';

      const baseSize = 500; // px
      img.style.width = `${baseSize * scale}px`;
      img.style.height = `${baseSize * scale}px`;
      img.style.objectFit = 'cover';
      img.style.borderRadius = '999px';
      return img;
    }
  } catch (e) {
    console.warn('[CDG] failed to resolve avatar', player, e);
  }

  const ph = document.createElement('div');
  ph.textContent = toPlayerName(player);
  ph.style.padding = '6px 10px';
  ph.style.borderRadius = '999px';
  ph.style.background = 'rgba(255,255,255,0.15)';
  return ph;
}

function getCardUrlFromFileName(fileName?: string | null): string {
  if (!fileName) return '/assets/images/cards/unknown.png';

  if ((cardRegistry as any)?.getImageUrl) {
    return (cardRegistry as any).getImageUrl(`${fileName}.png`);
  }
  if ((cardRegistry as any)?.getImageForCard) {
    return (cardRegistry as any).getImageForCard(fileName);
  }
  return `/assets/images/cards/${fileName}.png`;
}

function createCardImageView(card: ComparisonCard | null | undefined, scale = 0.7): HTMLImageElement {
  const url = getCardUrlFromFileName(card?.fileName);
  const img = document.createElement('img');
  img.src = url || '';
  img.alt = card?.fileName || 'card';
  img.style.width = px(325 * scale);
  img.style.height = px(275 * scale);
  img.style.objectFit = 'contain';
  img.style.imageRendering = 'auto';
  img.draggable = false;
  return img;
}

interface CardFrameOpts {
  highlightGreen?: boolean;
  highlightRed?: boolean;
  slideFrom?: number;
}

function createCardFrame(
  imageEl: HTMLElement,
  {
    highlightGreen = false,
    highlightRed = false,
    slideFrom = -100,
  }: CardFrameOpts = {},
): HTMLDivElement {
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

  slideInNode(frame, slideFrom, 700);

  setTimeout(() => {
    if (highlightGreen) border.style.borderColor = 'limegreen';
    else if (highlightRed) border.style.borderColor = 'red';
  }, 1000);

  return frame;
}

function hbox(gap = 10, children: (HTMLElement | null | undefined)[] = []): HTMLDivElement {
  const box = document.createElement('div');
  box.style.display = 'flex';
  box.style.flexDirection = 'row';
  box.style.alignItems = 'center';
  box.style.justifyContent = 'center';
  box.style.gap = px(gap);
  children.forEach(ch => ch && box.append(ch));
  return box;
}

function vbox(gap = 10, children: (HTMLElement | null | undefined)[] = []): HTMLDivElement {
  const box = document.createElement('div');
  box.style.display = 'flex';
  box.style.flexDirection = 'column';
  box.style.alignItems = 'center';
  box.style.justifyContent = 'center';
  box.style.gap = px(gap);
  children.forEach(ch => ch && box.append(ch));
  return box;
}

interface ComparisonUIParams {
  attacker: PlayerInfo;
  defender: PlayerInfo;
  attackingCard1: ComparisonCard | null;
  attackingCard2: ComparisonCard | null;
  defendingCard: ComparisonCard | null;
  attackSuccess: boolean;
  extraAttackerCard: ComparisonCard | null;
  extraDefenderCard: ComparisonCard | null;
  sceneWidth?: number;
}

function showComparisonUI({
  attacker,
  defender,
  attackingCard1,
  attackingCard2,
  defendingCard,
  attackSuccess,
  extraAttackerCard,
  extraDefenderCard,
  sceneWidth,
}: ComparisonUIParams): HTMLElement {
  const baseWidth = 1200.0;
  const width =
    sceneWidth ??
    (typeof window !== 'undefined' ? window.innerWidth : baseWidth);
  const scaleFactor = Math.max(0.7, Math.min(1.5, width / baseWidth));

  const resultMessage = attackSuccess
    ? 'Attack Successful!'
    : 'Attack Failed!';

  const resultText = createText(resultMessage, {
    fontSize: 16 * scaleFactor,
    weight: 'bold',
    color: 'white',
  });

  const leftAvatar = getAvatarView(attacker, 0.7 * scaleFactor);
  const rightAvatar = getAvatarView(defender, 0.7 * scaleFactor);

  const attackerWins = !!attackSuccess;
  const leftWins = attackerWins;
  const rightWins = !attackerWins;

  const leftHighlightGreen = leftWins;
  const leftHighlightRed = !leftWins;
  const rightHighlightGreen = rightWins;
  const rightHighlightRed = !rightWins;

  const atkFrame1 = attackingCard1
    ? createCardFrame(createCardImageView(attackingCard1, 0.7), {
        highlightGreen: leftHighlightGreen,
        highlightRed: leftHighlightRed,
        slideFrom: -100,
      })
    : null;

  const atkFrame2 = attackingCard2
    ? createCardFrame(createCardImageView(attackingCard2, 0.7), {
        highlightGreen: leftHighlightGreen,
        highlightRed: leftHighlightRed,
        slideFrom: -100,
      })
    : null;

  const extraAtkFrame = extraAttackerCard
    ? createCardFrame(createCardImageView(extraAttackerCard, 0.7), {
        highlightGreen: leftHighlightGreen,
        highlightRed: leftHighlightRed,
        slideFrom: -100,
      })
    : null;

  const defFrame = defendingCard
    ? createCardFrame(createCardImageView(defendingCard, 0.7), {
        highlightGreen: rightHighlightGreen,
        highlightRed: rightHighlightRed,
        slideFrom: 100,
      })
    : null;

  const extraDefFrame = extraDefenderCard
    ? createCardFrame(createCardImageView(extraDefenderCard, 0.7), {
        highlightGreen: rightHighlightGreen,
        highlightRed: rightHighlightRed,
        slideFrom: 100,
      })
    : null;

  const winnerPlayer = attackerWins ? attacker : defender;
  const winnerTextContent = `🏆 Winner: ${toPlayerName(winnerPlayer)}`;

  const winnerText = createText(winnerTextContent, {
    fontSize: 30 * scaleFactor,
    weight: 'bold',
    color: 'limegreen',
  });

  const leftCards = [atkFrame1, atkFrame2, extraAtkFrame].filter(
    Boolean,
  ) as HTMLElement[];
  const rightCards = [defFrame, extraDefFrame].filter(
    Boolean,
  ) as HTMLElement[];

  const leftSpacing = leftCards.length >= 2 ? 5 : 10;
  const rightSpacing = rightCards.length >= 2 ? 5 : 10;

  const leftCardsBox = hbox(leftSpacing, leftCards);
  const rightCardsBox = hbox(rightSpacing, rightCards);

  const cardImagesHBox = hbox(20, [leftCardsBox, rightCardsBox]);
  const cardImagesBox = vbox(10, [cardImagesHBox]);

  if (extraAtkFrame || extraDefFrame) {
    const tiebreaker = hbox(10, [
      extraAtkFrame,
      extraDefFrame,
    ].filter(Boolean) as HTMLElement[]);
    cardImagesBox.append(tiebreaker);
  }

  const cardImagesBoxPadded = vbox(20, [cardImagesBox]);
  cardImagesBoxPadded.style.padding = '0 80px';

  const playerInfoBox = hbox(10, [
    vbox(5, [leftAvatar]),
    cardImagesBoxPadded,
    vbox(5, [rightAvatar]),
  ]);

  const root = vbox(10, [playerInfoBox, winnerText, resultText]);
  root.style.padding = '15px';
  root.style.borderRadius = '10px';
  root.style.backgroundColor = 'transparent';
  root.style.backgroundSize = '100% 100%';
  root.style.backgroundRepeat = 'no-repeat';
  root.style.backgroundPosition = 'center';

  const scheduler = new UIActionScheduler();
  scheduler.runSequence(
    delayed(0, () => fadeInNode(root, 700)),
    delayed(1500, () => showWinnerText(winnerText, 500)),
    delayed(1500, () => showResultText(resultText, 500)),
  );

  fadeInNode(root, 700);

  return root;
}

/**
 * Public API matching ComparisonDialogGenerator
 * (no sceneWidth parameter here; we infer width inside).
 */

export function showSingleComparison(
  attacker: PlayerInfo,
  defender: PlayerInfo,
  attackingCard: ComparisonCard,
  defendingCard: ComparisonCard,
  attackSuccess: boolean,
): HTMLElement {
  return showComparisonUI({
    attacker,
    defender,
    attackingCard1: attackingCard,
    attackingCard2: null,
    defendingCard,
    attackSuccess,
    extraAttackerCard: null,
    extraDefenderCard: null,
  });
}

export function showDoubleComparison(
  attacker: PlayerInfo,
  defender: PlayerInfo,
  attackingCard1: ComparisonCard,
  attackingCard2: ComparisonCard,
  defendingCard: ComparisonCard,
  attackSuccess: boolean,
): HTMLElement {
  return showComparisonUI({
    attacker,
    defender,
    attackingCard1,
    attackingCard2,
    defendingCard,
    attackSuccess,
    extraAttackerCard: null,
    extraDefenderCard: null,
  });
}

export function showTieComparison(
  attacker: PlayerInfo,
  defender: PlayerInfo,
  attackingCard: ComparisonCard,
  defendingCard: ComparisonCard,
  extraAttackerCard: ComparisonCard,
  extraDefenderCard: ComparisonCard,
): HTMLElement {
  return showComparisonUI({
    attacker,
    defender,
    attackingCard1: attackingCard,
    attackingCard2: null,
    defendingCard,
    attackSuccess: false,
    extraAttackerCard,
    extraDefenderCard,
  });
}

export function showDoubleTieComparison(
  attacker: PlayerInfo,
  defender: PlayerInfo,
  attackingCard1: ComparisonCard,
  attackingCard2: ComparisonCard,
  defendingCard: ComparisonCard,
  extraAttackerCard: ComparisonCard,
  extraDefenderCard: ComparisonCard,
): HTMLElement {
  return showComparisonUI({
    attacker,
    defender,
    attackingCard1,
    attackingCard2,
    defendingCard,
    attackSuccess: false,
    extraAttackerCard,
    extraDefenderCard,
  });
}

// Optional convenience object, if you want an explicit generator object
export const generator: ComparisonDialogGenerator = {
  showSingleComparison,
  showTieComparison,
  showDoubleComparison,
  showDoubleTieComparison,
};
