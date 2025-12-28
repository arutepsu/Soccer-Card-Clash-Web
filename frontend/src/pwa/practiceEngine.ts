import type { PracticeEngine } from '@/api/practiceGameApi';
import type { WebGameState } from '@/types/WebGameState';

type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades';
type Rank =
  | '2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'
  | 'jack'|'queen'|'king'|'ace';

type Card = {
  id: string;
  rank: Rank;
  suit: Suit;
  value: number;
  boosted: boolean;
};

type Runtime = {
  roles: { attacker: string; defender: string };
  scores: { attacker: number; defender: number };
  hands: { attacker: Card[]; defender: Card[] };
  defenderField: Array<Card | null>;
  defenderGK: Card | null;
};

const DEFENDER_SLOTS = 3;
const START_HAND = 12;

function rankToValue(r: Rank): number {
  if (r === 'jack') return 11;
  if (r === 'queen') return 12;
  if (r === 'king') return 13;
  if (r === 'ace') return 14;
  return Number(r);
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = arr.slice();
  const rand = mulberry32(seed >>> 0);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeDeck(seed = Date.now() >>> 0): Card[] {
  const suits: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades'];
  const ranks: Rank[] = ['2','3','4','5','6','7','8','9','10','jack','queen','king','ace'];
  const cards: Card[] = [];
  let i = 0;

  for (const suit of suits) {
    for (const rank of ranks) {
      cards.push({
        id: `p_${suit}_${rank}_${i++}`,
        suit,
        rank,
        value: rankToValue(rank),
        boosted: false,
      });
    }
  }

  return shuffle(cards, seed);
}

function toFileName(rank: string, suit: string): string {
  return `${rank.toLowerCase()}_of_${suit.toLowerCase()}`;
}

function toCardView(c: Card) {
  return {
    id: c.id,
    rank: c.rank,
    suit: c.suit,
    value: c.value,
    boosted: c.boosted,
    fileName: toFileName(c.rank, c.suit),
  };
}

function toSlot(idPrefix: string, c: Card | null, i: number) {
  return { id: `${idPrefix}-${i}`, card: c ? toCardView(c) : null };
}

function toWeb(rt: Runtime): WebGameState {
  return {
    roles: { attacker: rt.roles.attacker, defender: rt.roles.defender },
    scores: { attacker: rt.scores.attacker, defender: rt.scores.defender },
    cards: {
      attackerHand: rt.hands.attacker.map(toCardView),
      defenderHand: rt.hands.defender.map(toCardView),

      attackerField: Array.from({ length: DEFENDER_SLOTS }, (_, i) => toSlot('att', null, i)),
      defenderField: rt.defenderField.map((c, i) => toSlot('def', c, i)),

      attackerGoalkeeper: null,
      defenderGoalkeeper: rt.defenderGK ? toCardView(rt.defenderGK) : null,
    },
    allowed: {
      attacker: { swapRemaining: 0, boostRemaining: 0, doubleAttackRemaining: 0 },
      defender: { swapRemaining: 0, boostRemaining: 0, doubleAttackRemaining: 0 },
    },
    you: null,
  };
}

function refillDefender(rt: Runtime) {
  for (let i = 0; i < rt.defenderField.length; i++) {
    if (!rt.defenderField[i] && rt.hands.defender.length > 0) {
      rt.defenderField[i] = rt.hands.defender.shift()!;
    }
  }
  if (!rt.defenderGK && rt.hands.defender.length > 0) {
    rt.defenderGK = rt.hands.defender.shift()!;
  }
}

function swapRolesAndResetBoard(rt: Runtime) {
  const oldA = rt.roles.attacker;
  rt.roles.attacker = rt.roles.defender;
  rt.roles.defender = oldA;

  const sa = rt.scores.attacker;
  rt.scores.attacker = rt.scores.defender;
  rt.scores.defender = sa;

  const ha = rt.hands.attacker;
  rt.hands.attacker = rt.hands.defender;
  rt.hands.defender = ha;

  rt.defenderField = Array.from({ length: DEFENDER_SLOTS }, () => null);
  rt.defenderGK = null;
  refillDefender(rt);
}

function doAttackVsCard(rt: Runtime, targetCard: Card, removeTarget: () => void) {
  const atk = rt.hands.attacker.shift();
  if (!atk) return;

  const attackerWins = atk.value > targetCard.value;

  if (attackerWins) {
    rt.scores.attacker += 1;
    rt.hands.attacker.push(atk, targetCard);
    removeTarget();
  } else {
    rt.scores.defender += 1;
    rt.hands.defender.push(atk, targetCard);
  }

  refillDefender(rt);
  swapRolesAndResetBoard(rt);
}

function createRuntime(p1: string, p2: string): Runtime {
  const deck = makeDeck();
  const aHand = deck.slice(0, START_HAND);
  const dHand = deck.slice(START_HAND, START_HAND * 2);

  const rt: Runtime = {
    roles: { attacker: p1, defender: p2 },
    scores: { attacker: 0, defender: 0 },
    hands: { attacker: aHand, defender: dHand },
    defenderField: Array.from({ length: DEFENDER_SLOTS }, () => null),
    defenderGK: null,
  };

  refillDefender(rt);
  return rt;
}

let runtime: Runtime | null = null;

export const practiceEngine: PracticeEngine = {
  createGame(p1: string, p2: string): WebGameState {
    runtime = createRuntime(p1, p2);
    return toWeb(runtime);
  },

  dispatch(_state: WebGameState, cmd: any): WebGameState {
    if (!runtime) throw new Error('[PracticeEngine] no runtime. Call createGame first.');

    const type = String(cmd?.type ?? '').trim();

    if (type === 'RegularAttack') {
      const target = String(cmd?.target ?? '').trim();

      if (target === 'defender') {
        const idx = Number(cmd?.index);
        if (!Number.isInteger(idx) || idx < 0 || idx >= DEFENDER_SLOTS) {
          throw new Error(`[PracticeEngine] invalid defender index: ${cmd?.index}`);
        }

        const card = runtime.defenderField[idx];
        if (!card) return toWeb(runtime);

        doAttackVsCard(runtime, card, () => {
          runtime!.defenderField[idx] = null;
        });

        return toWeb(runtime);
      }

      if (target === 'goalkeeper') {
        const gk = runtime.defenderGK;
        if (!gk) return toWeb(runtime);

        doAttackVsCard(runtime, gk, () => {
          runtime!.defenderGK = null;
        });

        return toWeb(runtime);
      }

      throw new Error(`[PracticeEngine] RegularAttack unknown target: ${target}`);
    }

    if (type === 'CreateGame') {
      const p1 = String(cmd?.p1 ?? '').trim();
      const p2 = String(cmd?.p2 ?? '').trim();
      if (!p1 || !p2) throw new Error('[PracticeEngine] CreateGame requires p1,p2');
      runtime = createRuntime(p1, p2);
      return toWeb(runtime);
    }

    if (
      type === 'Boost' ||
      type === 'DoubleAttack' ||
      type === 'RegularSwap' ||
      type === 'ReverseSwap' ||
      type === 'Undo' ||
      type === 'Redo' ||
      type === 'ExecuteAI'
    ) {
      throw new Error(`[PracticeEngine] ${type} not supported in Practice Mode`);
    }

    throw new Error(`[PracticeEngine] unknown command type: ${type}`);
  },
};
