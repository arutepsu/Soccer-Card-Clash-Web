import type { WebGameState, CardView } from '../../types/WebGameState';
import { extractComparisonEvents } from './comparisonEvents';
import type {
  ComparisonDialogHandler,
  ComparisonEvent,
} from './comparisonDialogHandler';
import type { UIActionScheduler } from '../../ui/uiActionScheduler';

type CardLikeForTie = Pick<CardView, 'fileName'> | { fileName?: string | null } | null | undefined;

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

function isDoubleTie(atk1: CardLikeForTie, atk2: CardLikeForTie, def: CardLikeForTie): boolean {
  const v1 = valueFromFileName(atk1);
  const v2 = valueFromFileName(atk2);
  const vd = valueFromFileName(def);
  if (v1 == null || v2 == null || vd == null) return false;
  return v1 + v2 === vd;
}

export interface GameApiLike {
  fetchGameState?(): Promise<WebGameState | null>;
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

export interface FallbackComparisonGenerator {
  showSingleComparison(
    attacker: { id: string; name?: string; playerType?: string },
    defender: { id: string; name?: string; playerType?: string },
    attackingCard: CardView,
    defendingCard: CardView,
    attackSuccess: boolean,
    width?: number,
  ): HTMLElement;
}

export interface SoundManagerLike {
  play(name: string, opts?: { volume?: number; [key: string]: unknown }): void;
}

export interface OrchestratorDeps {
  api: GameApiLike;
  push?: unknown;
  overlay?: {
    show?(
      content: HTMLElement,
      opts?: { autoHide?: boolean; sizeMult?: number; onHide?: () => void },
    ): void;
    hide?(): void;
    getPane?(): HTMLElement | null;
  };
  scheduler: UIActionScheduler;
  comparisonHandler: ComparisonDialogHandler;
  ActionNames: ActionNameMap;
  getRoles: RolesGetter;
  applyUiFromWeb: (web: WebGameState | null | undefined) => void;
  updateFromServerContext: (web: WebGameState | null | undefined) => void;
  generator: FallbackComparisonGenerator;
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
  atkCard: CardView;
  defCard: CardView;
  success?: boolean;
}

export function createComparisonOrchestrator({
  api,
  push,
  overlay,
  scheduler,
  comparisonHandler,
  ActionNames,
  getRoles,
  applyUiFromWeb,
  updateFromServerContext,
  generator,
  soundManager,
}: OrchestratorDeps) {
  let pendingActionType: string | null = null;
  let isOverlayActive = false;
  let latestStreamWeb: WebGameState | null = null;

  let lastStableWeb: WebGameState | null = null;
  let preActionWeb: WebGameState | null = null;

  let currentComparison: CurrentComparison | null = null;

  function setPendingAction(type: string) {
    pendingActionType = type;
    preActionWeb = lastStableWeb;
    currentComparison = null;
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

    const last = <T>(arr: T[]): T | null => (arr.length > 0 ? arr[arr.length - 1] : null);
    const secondLast = <T>(arr: T[]): T | null => (arr.length > 1 ? arr[arr.length - 2] : null);

    const attLast = last(attHand);
    const attPrev = secondLast(attHand);

    const dSlotIndex = Number.isInteger(meta?.defenderIndex) ? (meta!.defenderIndex as number) : -1;
    const dSlot = dSlotIndex >= 0 ? defField[dSlotIndex] : null;
    const defFieldCard = (dSlot && (dSlot as any).card) || dSlot || null;

    const defHandLast = last(defHand);
    const defHandPrev = secondLast(defHand);

    function toCard(raw: any): CardView | null {
      if (!raw) return null;
      if (typeof raw.fileName === 'string') {
        return raw as CardView;
      }
      if (raw.card && typeof raw.card.fileName === 'string') {
        return raw.card as CardView;
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

    console.log(
      '[CMP] runOverlay pending=',
      pendingActionType,
      'hasAction=',
      !!overlayAction,
    );

    const delay =
      pendingActionType === ActionNames.RegularAttack ||
      pendingActionType === ActionNames.DoubleAttack
        ? 0
        : pendingActionType === ActionNames.Undo ||
          pendingActionType === ActionNames.Redo ||
          pendingActionType === ActionNames.BoostDefender ||
          pendingActionType === ActionNames.BoostGoalkeeper ||
          pendingActionType === ActionNames.RegularSwap ||
          pendingActionType === ActionNames.ReverseSwap
        ? 100
        : 0;

    const seq: { delay: number; block: () => void | Promise<void> }[] = [];

    if (overlayAction) {
      seq.push({
        delay: 0,
        block: () => {
          console.log('[CMP] executing overlayAction block → overlay.show()');
          overlayAction.block();
        },
      });
    } else if (
      pendingActionType === ActionNames.RegularAttack &&
      currentComparison?.atkCard &&
      currentComparison?.defCard
    ) {
      console.log(
        '[CMP] fallback using currentComparison from hand-end + defenderIndex',
      );

      seq.push({
        delay: 0,
        block: () => {
          const roles = getRoles();
          const attacker = {
            id: 'att',
            name: roles.attacker,
            playerType: 'Human',
          };
          const defender = {
            id: 'def',
            name: roles.defender,
            playerType: 'Human',
          };

          const hostEl = document.getElementById('overlay') as any;
          const width =
            overlay?.getPane?.()?.clientWidth ||
            hostEl?.clientWidth ||
            1200;

          const { atkCard, defCard, success } = currentComparison;

          const node = generator.showSingleComparison(
            attacker,
            defender,
            atkCard,
            defCard,
            success ?? false,
            width,
          );

          if (hostEl?.__showOverlay) {
            hostEl.__showOverlay(node, { autoHide: false });
          } else {
            overlay?.show?.(node, { autoHide: false });
          }

          setTimeout(() => {
            if (hostEl?.__hideOverlay) hostEl.__hideOverlay();
            else overlay?.hide?.();
          }, 3000);
        },
      });
    } else {
      const hostEl = document.getElementById('overlay') as any;
      const div = document.createElement('div');
      div.className = 'overlay-textflow';
      div.innerHTML = `
        <div class="dialog-title">Comparison (debug)</div>
        <div class="dialog-message">
          no comparison cards available for ${pendingActionType}
        </div>
        <div class="overlay-actions"><button class="gbtn" data-close-overlay>Close</button></div>`;
      hostEl?.__showOverlay?.(div, { autoHide: false });
      console.warn('[CMP] overlayAction null; no currentComparison');
    }

    seq.push({
      delay: 3000 + delay + 150,
      block: async () => {
        try {
          soundManager.play('attack', { volume: 0.7 });
          const fresh =
            latestStreamWeb || (await api.fetchGameState?.()) || null;
          latestStreamWeb = null;
          applyUiFromWeb(fresh);
          updateFromServerContext(fresh);
        } catch (e) {
          console.warn('delayed refresh failed', e);
        } finally {
          comparisonHandler.resetLastCards();
          currentComparison = null;
          pendingActionType = null;
          isOverlayActive = false;
        }
      },
    });

    scheduler.runSequence(...seq);
  }

  function afterServerApply(serverWeb: WebGameState | null | undefined, meta?: ActionMeta) {
    currentComparison = null;

    const cmp: ComparisonEvent[] = extractComparisonEvents(serverWeb as any);
    console.log(
      '[CMP] afterServerApply action=',
      meta?.action,
      'defIdx=',
      meta?.defenderIndex,
      'extracted=',
      cmp.map(e => e.type),
    );

    if (cmp.length) {
      cmp.forEach(ev => comparisonHandler.handleComparisonEvent(ev));

      if (!cmp.some(e => e.type === 'AttackResultEvent')) {
        comparisonHandler.handleComparisonEvent({
          type: 'AttackResultEvent',
          attackSuccess: false,
        });
        console.log(
          '[CMP] synthesized AttackResultEvent=false (no server result)',
        );
      }

      const cmpEvt = cmp.find(e => e.type === 'ComparedCardsEvent');
      if (cmpEvt?.attackingCard && cmpEvt?.defendingCard) {
        currentComparison = {
          atkCard: cmpEvt.attackingCard,
          defCard: cmpEvt.defendingCard,
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

      console.log(
        '[CMP] synth from PRE-ACTION state (end-of-queue):',
        {
          atkCard,
          defCard,
          extraAtkCardTie,
          extraDefCardTie,
        },
      );

      if (atkCard && defCard) {
        const tie = isSingleTie(atkCard, defCard);

        currentComparison = { atkCard, defCard, success: !tie };

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
          console.log(
            '[CMP] synthesized TieComparisonEvent (client-side)',
          );
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


      console.log(
        '[CMP] synth DOUBLE from PRE-ACTION state (last 2 cards):',
        {
          atkCard1Double,
          atkCard2Double,
          defCard,
          extraAtkCardTie,
          extraDefCardTie,
        },
      );

      if (atkCard1Double && atkCard2Double && defCard) {
        const tie = isDoubleTie(atkCard1Double, atkCard2Double, defCard);

        currentComparison = {
          atkCard: atkCard2Double,
          defCard,
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
          console.log(
            '[CMP] synthesized DoubleTieComparisonEvent (client-side)',
          );
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
      for (const ev of events) {
        comparisonHandler.handleComparisonEvent(ev);
      }
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
  };
}
