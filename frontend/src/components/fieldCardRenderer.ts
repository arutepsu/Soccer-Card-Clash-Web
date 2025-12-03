import type { PlayerLike, WebGameState } from '../types/WebGameState';
import type {
  FieldCardRenderer,
  GetGameState,
} from './attackerFieldBar';
import {
  createCardAnimations,
  type CardAnimations,
} from '../utils/cardAnimations';

export interface FieldCardRendererAssets {
  defeatedImg?: string;
  cardBaseUrl?: string;
  boostImg?: string;
}

export interface FieldCardData {
  fileName?: string;
  isBoosted?: boolean;
  // can contain more raw card data (kind, type, cardType, boosted, etc.)
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
): FieldCardRenderer {
  const defeatedImg =
    assets.defeatedImg || '/assets/images/cards/defeated.png';
  const cardBaseUrl = assets.cardBaseUrl || '/assets/images/cards/';

  const anim: CardAnimations = assets.boostImg
    ? createCardAnimations({ boostImg: assets.boostImg })
    : createCardAnimations();

  function fileNameToUrl(fileName?: string | null): string | null {
    return fileName ? `${cardBaseUrl}${fileName}.png` : null;
  }

  function defendersOf(gs: WebGameState | null, pid: string): FieldSlot[] {
    if (!gs?.cards) return [];

    const cardsAny = gs.cards as WebGameState['cards'] & {
      attackerField?: FieldSlot[];
      defenderField?: FieldSlot[];
    };

    return pid === 'att'
      ? cardsAny.attackerField ?? []
      : cardsAny.defenderField ?? [];
  }

  function gkOf(gs: WebGameState | null, pid: string): FieldSlot | null {
    if (!gs?.cards) return null;

    const cardsAny = gs.cards as WebGameState['cards'] & {
      attackerGoalkeeper?: FieldCardData | null;
      defenderGoalkeeper?: FieldCardData | null;
    };

    return pid === 'att'
      ? cardsAny.attackerGoalkeeper ?? null
      : cardsAny.defenderGoalkeeper ?? null;
  }

  function isBoostedCard(data?: FieldCardData | null): boolean {
    if (!data) return false;
    const anyData = data as any;

    return (
      !!data.isBoosted ||
      !!anyData.boosted ||
      anyData.kind === 'BoostedCard' ||
      anyData.type === 'BoostedCard' ||
      anyData.cardType === 'BoostedCard'
    );
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

    // 🔥 central boost detection & animation
    if (isBoostedCard(data)) {
      anim.applyBoostEffect(el);
    } else {
      anim.removeBoostEffect(el);
    }
  }

  function createDefenderRow(
    player: PlayerLike,
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
    player: PlayerLike,
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
