import type { WebGameState, CardView } from '../../types/WebGameState';
import { extractComparisonEvents } from './comparisonEvents';
import type {
  ComparisonDialogHandler,
  ComparisonEvent,
  PlayerInfo,
  ComparisonCard,
} from './comparisonDialogHandler';
import type { UIActionScheduler } from '../../ui/uiActionScheduler';
import type { GameApi } from '../../api/GameApi';

type CardLikeForTie =
  | Pick<CardView, 'fileName'>
  | { fileName?: string | null }
  | null
  | undefined;

function valueFromFileName(card: CardLikeForTie): number | null {
  const fn = card?.fileName ?? null;
  if (!fn) return null;

  const valueStr = fn.split('_of_')[0];

  const faces: Record<string, number> = {
    jack: 11,
    queen: 12,
    king: 13,
    ace: 14,
  };

  const n = parseInt(valueStr, 10);
  if (!Number.isNaN(n)) return n;
  return faces[valueStr] ?? null;
}

function isSingleTie(atkCard: CardLikeForTie, defCard: CardLikeForTie): boolean {
  const av = valueFromFileName(atkCard);
  const dv = valueFromFileName(defCard);
  return av != null && dv != null && av === dv;
}

function isDoubleTie(
  atk1: CardLikeForTie,
  atk2: CardLikeForTie,
  def: CardLikeForTie,
): boolean {
  const v1 = valueFromFileName(atk1);
  const v2 = valueFromFileName(atk2);
  const vd = valueFromFileName(def);
  if (v1 == null || v2 == null || vd == null) return false;
  return v1 + v2 === vd;
}

export interface ActionNameMap {
  RegularAttack: string;
  DoubleAttack: string;
  Undo: string;
  Redo: string;
  BoostDefender: string;
  BoostGoalkeeper: string;
  RegularSwap: string;
  ReverseSwap: string;
  [key: string]: string;
}

export interface RolesGetter {
  (): { attacker: string; defender: string };
}

export interface SoundManagerLike {
  play(name: string, opts?: { volume?: number; [key: string]: unknown }): void;
}

export interface OrchestratorDeps {
  api: GameApi;
  getSid: () => string | null;
  scheduler: UIActionScheduler;
  comparisonHandler: ComparisonDialogHandler;
  ActionNames: ActionNameMap;
  getRoles: RolesGetter;
  applyUiFromWeb: (web: WebGameState | null | undefined) => void;
  updateFromServerContext: (web: WebGameState | null | undefined) => void;
  soundManager: SoundManagerLike;
}

interface ActionMeta {
  action?: string;
  defenderIndex?: number;
  [key: string]: unknown;
}

interface DerivedCards {
  atkCard: CardView | null;
  defCard: CardView | null;
  extraAtkCardTie: CardView | null;
  extraDefCardTie: CardView | null;
  atkCard1Double: CardView | null;
  atkCard2Double: CardView | null;
  defCard1Double: CardView | null;
  defCard2Double: CardView | null;
}

interface CurrentComparison {
  atkCard: ComparisonCard;
  defCard: ComparisonCard;
  success?: boolean;
}

export function createComparisonOrchestrator({
  api,
  scheduler,
  getSid,  
  comparisonHandler,
  ActionNames,
  getRoles,
  applyUiFromWeb,
  updateFromServerContext,
  soundManager,
}: OrchestratorDeps) {
  
  let pendingMeta: ActionMeta | null = null;
  let overlayTriggeredForPending = false;

  let pendingActionType: string | null = null;
  let isOverlayActive = false;

  let latestStreamWeb: WebGameState | null = null;
  let lastStableWeb: WebGameState | null = null;
  let preActionWeb: WebGameState | null = null;

  let currentComparison: CurrentComparison | null = null;

  function setPendingAction(type: string | null, meta?: ActionMeta) {
    pendingActionType = type;

    if (!type) {
      pendingMeta = null;
      overlayTriggeredForPending = false;
      preActionWeb = lastStableWeb;
      currentComparison = null;
      return;
    }

    pendingMeta = meta ?? null;
    overlayTriggeredForPending = false;
    preActionWeb = lastStableWeb;
    currentComparison = null;
    comparisonHandler.resetLastCards();
  }

async function applyBufferedStateAfterOverlay() {
  try {
    soundManager.play('attack', { volume: 0.7 });
    const sid = getSid();
    const fresh =
      latestStreamWeb ||
      (sid ? await api.fetchGameState(sid) : null) ||
      lastStableWeb ||
      null;

    latestStreamWeb = null;
    lastStableWeb = fresh;

    applyUiFromWeb(fresh);
    updateFromServerContext(fresh);
  } catch (e) {
    console.warn('[CMP] applyBufferedStateAfterOverlay failed', e);
  } finally {
    comparisonHandler.resetLastCards();
    currentComparison = null;

    pendingActionType = null;
    pendingMeta = null;
    overlayTriggeredForPending = false;
    isOverlayActive = false;
  }
}


  function toCard(raw: any): CardView | null {
    if (!raw) return null;
    if (typeof raw.fileName === 'string') {
      return { ...(raw as CardView) };
    }
    if (raw.card && typeof raw.card.fileName === 'string') {
      return { ...(raw.card as CardView) };
    }
    if (typeof raw.id === 'string') {
      return {
        id: raw.id,
        rank: '',
        suit: '',
        value: 0,
        boosted: false,
        fileName: raw.fileName ?? raw.id,
      };
    }
    return null;
  }

function getAttackAndDefendCardsFromState(
  web: WebGameState | null | undefined,
  meta: ActionMeta | null | undefined,
): DerivedCards {
  if (!web?.cards) {
    return {
      atkCard: null,
      defCard: null,
      extraAtkCardTie: null,
      extraDefCardTie: null,
      atkCard1Double: null,
      atkCard2Double: null,
      defCard1Double: null,
      defCard2Double: null,
    };
  }

  const cards = web.cards;

  const attHand = Array.isArray(cards.attackerHand) ? cards.attackerHand : [];
  const defHand = Array.isArray(cards.defenderHand) ? cards.defenderHand : [];
  const defField = Array.isArray(cards.defenderField) ? cards.defenderField : [];

  const last = <T>(arr: T[]): T | null =>
    arr.length > 0 ? arr[arr.length - 1] : null;
  const secondLast = <T>(arr: T[]): T | null =>
    arr.length > 1 ? arr[arr.length - 2] : null;

  const attLast = last(attHand);
  const attPrev = secondLast(attHand);

  const dSlotIndex = Number.isInteger(meta?.defenderIndex)
    ? (meta!.defenderIndex as number)
    : -1;

  let defFieldCardRaw: any = null;

  if (dSlotIndex >= 0) {
    const dSlot = defField[dSlotIndex] ?? null;
    defFieldCardRaw = dSlot && (dSlot as any).card ? (dSlot as any).card : dSlot;
  } else {
    const rawGk =
      (cards as any).defenderGoalkeeper ??
      (cards as any).goalkeeper ??
      (cards as any).defenderGK ??
      null;

    defFieldCardRaw =
      rawGk && (rawGk as any).card ? (rawGk as any).card : rawGk;
  }

  const defFieldCard = defFieldCardRaw || null;

  const defHandLast = last(defHand);
  const defHandPrev = secondLast(defHand);

  const atkCard = toCard(attLast);
  const defCard = toCard(defFieldCard);

  const extraAtkCardTie = toCard(attPrev);
  const extraDefCardTie = toCard(defHandLast);

  const atkCard1Double = toCard(attPrev);
  const atkCard2Double = toCard(attLast);
  const defCard1Double = toCard(defHandPrev);
  const defCard2Double = toCard(defHandLast);

  return {
    atkCard,
    defCard,
    extraAtkCardTie,
    extraDefCardTie,
    atkCard1Double,
    atkCard2Double,
    defCard1Double,
    defCard2Double,
  };
}

  async function runOverlayForPendingAction() {
    if (!pendingActionType) return;

    isOverlayActive = true;

    const overlayAction =
      pendingActionType === ActionNames.RegularAttack ||
      pendingActionType === ActionNames.DoubleAttack
        ? comparisonHandler.createOverlayAction({
            type: pendingActionType as any,
          })
        : null;


    if (overlayAction) {
      scheduler.runSequence(overlayAction);
    } else {
      console.warn(
        '[CMP] overlayAction null; applying buffered state without comparison overlay for',
        pendingActionType,
      );
      await applyBufferedStateAfterOverlay();
    }
  }

  function afterServerApply(
    serverWeb: WebGameState | null | undefined,
    meta?: ActionMeta,
  ) {
    currentComparison = null;

    const cmp: ComparisonEvent[] = extractComparisonEvents(serverWeb as any);


    if (cmp.length) {
      cmp.forEach(ev => comparisonHandler.handleComparisonEvent(ev));

      if (!cmp.some(e => e.type === 'AttackResultEvent')) {
        comparisonHandler.handleComparisonEvent({
          type: 'AttackResultEvent',
          attackSuccess: false,
        });
      }

      const cmpEvt = cmp.find(e => e.type === 'ComparedCardsEvent');
      if (cmpEvt?.attackingCard && cmpEvt?.defendingCard) {
        currentComparison = {
          atkCard: { ...(cmpEvt.attackingCard as CardView) },
          defCard: { ...(cmpEvt.defendingCard as CardView) },
          success: undefined,
        };
      }
    } else if (
      meta?.action === 'RegularAttack' &&
      Number.isInteger(meta?.defenderIndex)
    ) {
      const source = preActionWeb || serverWeb;
      const {
        atkCard,
        defCard,
        extraAtkCardTie,
        extraDefCardTie,
      } = getAttackAndDefendCardsFromState(source, meta);

      if (atkCard && defCard) {
        const tie = isSingleTie(atkCard, defCard);

        currentComparison = {
          atkCard: { ...(atkCard as CardView) },
          defCard: { ...(defCard as CardView) },
          success: !tie,
        };

        comparisonHandler.handleComparisonEvent({
          type: 'ComparedCardsEvent',
          attackingCard: atkCard,
          defendingCard: defCard,
        });

        if (tie && extraAtkCardTie && extraDefCardTie) {
          comparisonHandler.handleComparisonEvent({
            type: 'TieComparisonEvent',
            attackingCard: atkCard,
            defendingCard: defCard,
            extraAttackerCard: extraAtkCardTie,
            extraDefenderCard: extraDefCardTie,
          });
        }

        comparisonHandler.handleComparisonEvent({
          type: 'AttackResultEvent',
          attackSuccess: !tie,
        });
      } else {
        console.warn(
          '[CMP] could not derive cards from PRE-ACTION state',
          {
            preActionWeb,
            meta,
          },
        );
      }
    } else if (
      meta?.action === 'DoubleAttack' &&
      Number.isInteger(meta?.defenderIndex)
    ) {
      const source = preActionWeb || serverWeb;
      const {
        atkCard1Double,
        atkCard2Double,
        defCard,
        extraAtkCardTie,
        extraDefCardTie,
      } = getAttackAndDefendCardsFromState(source, meta);

      if (atkCard1Double && atkCard2Double && defCard) {
        const tie = isDoubleTie(atkCard1Double, atkCard2Double, defCard);

        currentComparison = {
          atkCard: { ...(atkCard2Double as CardView) },
          defCard: { ...(defCard as CardView) },
          success: !tie,
        };

        comparisonHandler.handleComparisonEvent({
          type: 'DoubleComparedCardsEvent',
          attackingCard1: atkCard1Double,
          attackingCard2: atkCard2Double,
          defendingCard: defCard,
        });

        if (tie && extraAtkCardTie && extraDefCardTie) {
          comparisonHandler.handleComparisonEvent({
            type: 'DoubleTieComparisonEvent',
            attackingCard1: atkCard1Double,
            attackingCard2: atkCard2Double,
            defendingCard: defCard,
            extraAttackerCard: extraAtkCardTie,
            extraDefenderCard: extraDefCardTie,
          });
        }

        comparisonHandler.handleComparisonEvent({
          type: 'AttackResultEvent',
          attackSuccess: !tie,
        });
      } else {
        console.warn(
          '[CMP] could not derive DOUBLE cards from PRE-ACTION state',
          {
            preActionWeb,
            meta,
          },
        );
      }
    }

    void runOverlayForPendingAction();
  }

  function handleStreamWeb(web: WebGameState | null | undefined) {
    const events = extractComparisonEvents(web as any);

    if (pendingActionType) {
      for (const ev of events) comparisonHandler.handleComparisonEvent(ev);
    }

    if (pendingActionType || isOverlayActive) {
      latestStreamWeb = (web ?? null) as WebGameState | null;
      return;
    }

    lastStableWeb = (web ?? null) as WebGameState | null;
    applyUiFromWeb(web ?? null);
    updateFromServerContext(web ?? null);
  }

  return {
    setPendingAction,
    afterServerApply,
    handleStreamWeb,
    applyBufferedStateAfterOverlay,
  };
}