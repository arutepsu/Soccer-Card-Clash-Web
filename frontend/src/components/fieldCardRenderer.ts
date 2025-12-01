import type {
  CurrentAttacker,
  GetGameState,
  FieldRenderer,
} from './attackerFieldBar';
import {
  createCardAnimations,
  type CardAnimations,
} from '../utils/cardAnimations';

const anim: CardAnimations = createCardAnimations();

export interface FieldCardRendererAssets {
  defeatedImg?: string;
  cardBaseUrl?: string;
}

export interface FieldCardData {
  fileName?: string;
  isBoosted?: boolean;
  [key: string]: unknown;
}

export interface FieldSlot {
  id?: string;
  card?: FieldCardData | null;
  [key: string]: unknown;
}

type SlotLike = FieldSlot | FieldCardData | null | undefined;

function isFieldSlot(v: SlotLike): v is FieldSlot {
  return !!v && typeof v === 'object' && 'card' in v;
}

export function createDefaultFieldCardRenderer(
  assets: FieldCardRendererAssets = {},
): FieldRenderer {
  const defeatedImg =
    assets.defeatedImg || '/assets/images/cards/defeated.png';
  const cardBaseUrl = assets.cardBaseUrl || '/assets/images/cards/';

  function fileNameToUrl(fileName?: string | null): string | null {
    return fileName ? `${cardBaseUrl}${fileName}.png` : null;
  }

  function defendersOf(gs: any, pid: string): FieldSlot[] {
    if (!gs?.cards) return [];
    return pid === 'att'
      ? gs.cards.attackerField || []
      : gs.cards.defenderField || [];
  }

  function gkOf(gs: any, pid: string): FieldSlot | null {
    if (!gs?.cards) return null;
    return pid === 'att'
      ? gs.cards.attackerGoalkeeper || null
      : gs.cards.defenderGoalkeeper || null;
  }

  function paintCardEl(el: HTMLElement, cardLike: SlotLike): void {
    const data: FieldCardData | undefined = isFieldSlot(cardLike)
      ? (cardLike.card ?? undefined)
      : (cardLike as FieldCardData | undefined);

    const url = fileNameToUrl(data?.fileName);
    if (url) {
      el.style.backgroundImage = `url("${url}")`;
      el.classList.remove('is-defeated');
    } else {
      el.style.backgroundImage = `url("${defeatedImg}")`;
      el.classList.add('is-defeated');
      anim.applyDefeatedEffect(el);
    }

    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';

    if (data?.isBoosted) {
      anim.applyBoostEffect(el);
    } else {
      anim.removeBoostEffect(el);
    }
  }

  function createDefenderRow(
    player: CurrentAttacker,
    getGameState: GetGameState,
  ): HTMLElement {
    const gs = getGameState?.();
    const slots = defendersOf(gs, player.id);

    const padded: FieldSlot[] = [...slots];
    while (padded.length < 3) {
      padded.push({ id: `pad-${padded.length}`, card: null });
    }

    const row = document.createElement('div');
    row.className = 'defender-row';
    row.setAttribute('role', 'group');

    padded.forEach((slot, index) => {
      const el = document.createElement('div');
      el.className = 'field-card game-card';
      el.dataset.index = String(index);
      paintCardEl(el, slot);
      row.appendChild(el);
    });

    return row;
  }

  function createGoalkeeperRow(
    player: CurrentAttacker,
    getGameState: GetGameState,
  ): HTMLElement {
    const gs = getGameState?.();
    const gk = gkOf(gs, player.id);

    const row = document.createElement('div');
    row.className = 'goalkeeper-row';
    row.setAttribute('role', 'group');

    const el = document.createElement('div');
    el.className = 'field-card game-card goalkeeper';
    el.dataset.index = 'g';

    paintCardEl(el, gk);
    row.appendChild(el);
    return row;
  }

  return { createDefenderRow, createGoalkeeperRow };
}
