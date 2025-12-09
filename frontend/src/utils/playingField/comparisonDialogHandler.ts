import type {
  CardView,
  RolesView,
  WebGameState,
} from '../../types/WebGameState';
import type { PlayerLike } from '../../types/Player';
import { UIActionScheduler, delayed } from '../../ui/uiActionScheduler';
import type { ComparisonControllerLike } from '../../types/Comparison';
import { showComparisonOverlay, type ComparisonVariant } from './comparisonOverlayBridge';
export type PlayerInfo = PlayerLike;

export interface Roles {
  attacker: PlayerInfo;
  defender: PlayerInfo;
}

export type ComparisonCard = CardView;

export interface ComparisonDialogGenerator {
  showSingleComparison(
    attacker: PlayerInfo,
    defender: PlayerInfo,
    attackingCard: ComparisonCard,
    defendingCard: ComparisonCard,
    attackSuccess: boolean,
  ): HTMLElement;

  showTieComparison(
    attacker: PlayerInfo,
    defender: PlayerInfo,
    attackingCard: ComparisonCard,
    defendingCard: ComparisonCard,
    extraAttackerCard: ComparisonCard,
    extraDefenderCard: ComparisonCard,
  ): HTMLElement;

  showDoubleComparison(
    attacker: PlayerInfo,
    defender: PlayerInfo,
    attackingCard1: ComparisonCard,
    attackingCard2: ComparisonCard,
    defendingCard: ComparisonCard,
    attackSuccess: boolean,
  ): HTMLElement;

  showDoubleTieComparison(
    attacker: PlayerInfo,
    defender: PlayerInfo,
    attackingCard1: ComparisonCard,
    attackingCard2: ComparisonCard,
    defendingCard: ComparisonCard,
    extraAttackerCard: ComparisonCard,
    extraDefenderCard: ComparisonCard,
  ): HTMLElement;
}

export interface GameContextLike {
  state?: { roles?: RolesView };
  roles?: RolesView;
}

export interface ContextHolderLike {
  get?(): GameContextLike | WebGameState;
  state?: WebGameState;
  roles?: RolesView;
  [key: string]: unknown;
}

export type AttackActionEventType = 'RegularAttack' | 'DoubleAttack';

export interface AttackActionEvent {
  type: AttackActionEventType;
  [key: string]: unknown;
}

export type ComparisonEventType =
  | 'ComparedCardsEvent'
  | 'DoubleComparedCardsEvent'
  | 'AttackResultEvent'
  | 'TieComparisonEvent'
  | 'DoubleTieComparisonEvent';

export interface ComparisonEvent {
  type: ComparisonEventType;
  attackingCard?: ComparisonCard;
  defendingCard?: ComparisonCard;
  attackingCard1?: ComparisonCard;
  attackingCard2?: ComparisonCard;
  extraAttackerCard?: ComparisonCard;
  extraDefenderCard?: ComparisonCard;
  attackSuccess?: boolean;
  [key: string]: unknown;
}

export interface ComparisonDialogHandlerDeps {
  controller?: ComparisonControllerLike;
  contextHolder?: ContextHolderLike;
  onAutoClose?: () => void | Promise<void>;
}

export interface ComparisonDialogHandler {
  createOverlayAction: (
    actionEvent: AttackActionEvent | null | undefined,
  ) => ReturnType<typeof delayed> | null;

  handleComparisonEvent: (e: ComparisonEvent | null | undefined) => void;
  resetLastCards: () => void;

  runOverlayFor: (
    actionEvent: AttackActionEvent | null | undefined,
  ) => { cancel: () => void };

  debug: {
    readonly lastAttackingCard: ComparisonCard | undefined;
    readonly lastDefendingCard: ComparisonCard | undefined;
    readonly lastAttackSuccess: boolean | undefined;
    readonly lastExtraAttackerCard: ComparisonCard | undefined;
    readonly lastExtraDefenderCard: ComparisonCard | undefined;
  };
}

export function createComparisonDialogHandler({
  contextHolder,
  onAutoClose,
}: ComparisonDialogHandlerDeps): ComparisonDialogHandler {
  let lastAttackingCard: ComparisonCard | undefined;
  let lastAttackingCard1: ComparisonCard | undefined;
  let lastAttackingCard2: ComparisonCard | undefined;
  let lastDefendingCard: ComparisonCard | undefined;
  let lastExtraAttackerCard: ComparisonCard | undefined;
  let lastExtraDefenderCard: ComparisonCard | undefined;
  let lastAttackSuccess: boolean | undefined;

  const scheduler = new UIActionScheduler();
  const autoCloseMs = 3000;

  function roles(): Roles {
    const root =
      (contextHolder?.get?.() ?? contextHolder) as
        | GameContextLike
        | WebGameState
        | undefined;

    const st = root as GameContextLike | undefined;
    const attackerName =
      st?.state?.roles?.attacker ?? st?.roles?.attacker ?? 'Attacker';
    const defenderName =
      st?.state?.roles?.defender ?? st?.roles?.defender ?? 'Defender';

    const attacker: PlayerInfo = {
      id: 'att',
      name: attackerName,
      playerType: 'Human',
    };

    const defender: PlayerInfo = {
      id: 'def',
      name: defenderName,
      playerType: 'Human',
    };

    return { attacker, defender };
  }

  function createOverlayAction(
  actionEvent: AttackActionEvent | null | undefined,
  ): ReturnType<typeof delayed> | null {
    const { attacker, defender } = roles();

    switch (actionEvent?.type) {
      case 'RegularAttack': {
        if (!lastAttackingCard || !lastDefendingCard) return null;

        const hasTieExtras =
          !!lastExtraAttackerCard && !!lastExtraDefenderCard;

        const attackingCard = lastAttackingCard;
        const defendingCard = lastDefendingCard;
        const extraAttackerCard = lastExtraAttackerCard;
        const extraDefenderCard = lastExtraDefenderCard;
        const attackSuccess = lastAttackSuccess ?? false;

        const variant: ComparisonVariant = hasTieExtras ? 'tie' : 'single';

        return delayed(0, () => {
          showComparisonOverlay({
            variant,
            attacker,
            defender,
            attackingCard,
            defendingCard,
            extraAttackerCard,
            extraDefenderCard,
            attackSuccess,
            autoCloseMs,
            onAutoClose,
          });
        });
      }

      case 'DoubleAttack': {
        if (
          !lastAttackingCard1 ||
          !lastAttackingCard2 ||
          !lastDefendingCard
        ) {
          return null;
        }

        const hasTieExtras =
          !!lastExtraAttackerCard && !!lastExtraDefenderCard;

        const attackingCard1 = lastAttackingCard1;
        const attackingCard2 = lastAttackingCard2;
        const defendingCard = lastDefendingCard;
        const extraAttackerCard = lastExtraAttackerCard;
        const extraDefenderCard = lastExtraDefenderCard;
        const attackSuccess = lastAttackSuccess ?? false;

        const variant: ComparisonVariant = hasTieExtras ? 'doubleTie' : 'double';

        return delayed(0, () => {
          showComparisonOverlay({
            variant,
            attacker,
            defender,
            attackingCard: attackingCard1,
            attackingCard2,
            defendingCard,
            extraAttackerCard,
            extraDefenderCard,
            attackSuccess,
            autoCloseMs,
            onAutoClose,
          });
        });
      }

      default:
        return null;
    }
  }


  function handleComparisonEvent(
    e: ComparisonEvent | null | undefined,
  ): void {
    switch (e?.type) {
      case 'ComparedCardsEvent':
        if (e.attackingCard && e.defendingCard) {
          lastAttackingCard = e.attackingCard;
          lastDefendingCard = e.defendingCard;
        }
        break;

      case 'DoubleComparedCardsEvent':
        if (e.attackingCard1 && e.attackingCard2 && e.defendingCard) {
          lastAttackingCard1 = e.attackingCard1;
          lastAttackingCard2 = e.attackingCard2;
          lastDefendingCard = e.defendingCard;
        }
        break;

      case 'AttackResultEvent':
        if (typeof e.attackSuccess === 'boolean') {
          lastAttackSuccess = e.attackSuccess;
        }
        break;

      case 'TieComparisonEvent':
        if (
          e.attackingCard &&
          e.defendingCard &&
          e.extraAttackerCard &&
          e.extraDefenderCard
        ) {
          lastAttackingCard = e.attackingCard;
          lastDefendingCard = e.defendingCard;
          lastExtraAttackerCard = e.extraAttackerCard;
          lastExtraDefenderCard = e.extraDefenderCard;
        }
        break;

      case 'DoubleTieComparisonEvent':
        if (
          e.attackingCard1 &&
          e.attackingCard2 &&
          e.defendingCard &&
          e.extraAttackerCard &&
          e.extraDefenderCard
        ) {
          lastAttackingCard1 = e.attackingCard1;
          lastAttackingCard2 = e.attackingCard2;
          lastDefendingCard = e.defendingCard;
          lastExtraAttackerCard = e.extraAttackerCard;
          lastExtraDefenderCard = e.extraDefenderCard;
        }
        break;

      default:
        break;
    }
  }

  function resetLastCards(): void {
    lastAttackingCard =
      lastAttackingCard1 =
      lastAttackingCard2 =
      lastDefendingCard =
      lastExtraAttackerCard =
      lastExtraDefenderCard =
        undefined;
    lastAttackSuccess = undefined;
  }

  function runOverlayFor(
    actionEvent: AttackActionEvent | null | undefined,
  ): { cancel: () => void } {
    const action = createOverlayAction(actionEvent);
    return action ? scheduler.runSequence(action) : { cancel() {} };
  }

  return {
    createOverlayAction,
    handleComparisonEvent,
    resetLastCards,
    runOverlayFor,
    debug: {
      get lastAttackingCard() {
        return lastAttackingCard;
      },
      get lastDefendingCard() {
        return lastDefendingCard;
      },
      get lastAttackSuccess() {
        return lastAttackSuccess;
      },
      get lastExtraAttackerCard() {
        return lastExtraAttackerCard;
      },
      get lastExtraDefenderCard() {
        return lastExtraDefenderCard;
      },
    },
  };
}
