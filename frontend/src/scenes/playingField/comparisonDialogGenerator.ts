import type {
  CardView,
  PlayerLike,
  RolesView,
  WebGameState,
} from '../../types/WebGameState';

import { UIActionScheduler, delayed } from '../../ui/uiActionScheduler';

export interface OverlayLike {
  show?(
    content: HTMLElement,
    opts?: {
      autoHide?: boolean;
      sizeMult?: number;
      onHide?: () => void;
    },
  ): void;
  hide?(): void;
}

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
  state?: WebGameState;
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
  controller?: unknown;
  contextHolder?: ContextHolderLike;
  overlay?: OverlayLike;
  onAutoClose?: () => void;
  generator?: ComparisonDialogGenerator;
}

export interface ComparisonDialogHandler {
  createOverlayAction: (
    actionEvent: AttackActionEvent | null | undefined,
  ) => ReturnType<typeof delayed> | null;
  handleComparisonEvent: (e: ComparisonEvent | null | undefined) => void;
  resetLastCards: () => void;
  runOverlayFor: (actionEvent: AttackActionEvent | null | undefined) => {
    cancel: () => void;
  };
  debug: {
    readonly lastAttackingCard: ComparisonCard | undefined;
    readonly lastDefendingCard: ComparisonCard | undefined;
    readonly lastAttackSuccess: boolean | undefined;
    readonly lastExtraAttackerCard: ComparisonCard | undefined;
    readonly lastExtraDefenderCard: ComparisonCard | undefined;
  };
}

export function createComparisonDialogHandler({
  controller,
  contextHolder,
  overlay,
  onAutoClose,
  generator,
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
    const root = (contextHolder?.get?.() ?? contextHolder) as
      | GameContextLike
      | WebGameState
      | undefined;

    const fromState =
      (root as GameContextLike)?.state ??
      (root as WebGameState | undefined);

    const rolesView: RolesView | undefined =
      fromState?.roles ?? (root as GameContextLike)?.roles;

    const players = fromState?.players;

    const attacker: PlayerInfo =
      players?.attacker ?? {
        id: 'att',
        name: rolesView?.attacker ?? 'Attacker',
        playerType: 'Human',
      };

    const defender: PlayerInfo =
      players?.defender ?? {
        id: 'def',
        name: rolesView?.defender ?? 'Defender',
        playerType: 'Human',
      };

    return { attacker, defender };
  }

  function safeShow(
    node: HTMLElement,
    opts: { autoHide?: boolean; sizeMult?: number } = {},
  ): void {
    if (!overlay || !overlay.show) {
      console.warn('[overlay] missing overlay instance for comparison dialog');
      return;
    }

    const { autoHide = false, sizeMult } = opts;

    overlay.show(node, {
      autoHide,
      sizeMult,
    });
  }

  function safeHide(): void {
    if (!overlay || !overlay.hide) return;
    overlay.hide();
  }

  function showThenAutoClose(
    node: HTMLElement,
    opts: { sizeMult?: number } = {},
  ): void {
    const { sizeMult } = opts;

    safeShow(node, { autoHide: false, sizeMult });

    setTimeout(() => {
      safeHide();
      onAutoClose?.();
    }, autoCloseMs);
  }

  function createOverlayAction(actionEvent: AttackActionEvent | null | undefined) {
    const { attacker, defender } = roles();

    const gen = generator;
    if (!gen) {
      console.warn('[CMP] comparisonDialogHandler: no generator provided');
      return null;
    }

    switch (actionEvent?.type) {
      case 'RegularAttack': {
        if (!lastAttackingCard || !lastDefendingCard) return null;

        const hasTieExtras = !!(
          lastExtraAttackerCard && lastExtraDefenderCard
        );

        return delayed(0, () => {
          const node = hasTieExtras
            ? gen.showTieComparison(
                attacker,
                defender,
                lastAttackingCard,
                lastDefendingCard,
                lastExtraAttackerCard as ComparisonCard,
                lastExtraDefenderCard as ComparisonCard,
              )
            : gen.showSingleComparison(
                attacker,
                defender,
                lastAttackingCard,
                lastDefendingCard,
                lastAttackSuccess ?? false,
              );

          showThenAutoClose(node, { sizeMult: 1.7 });
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

        const hasTieExtras = !!(
          lastExtraAttackerCard && lastExtraDefenderCard
        );

        return delayed(0, () => {
          const node = hasTieExtras
            ? gen.showDoubleTieComparison(
                attacker,
                defender,
                lastAttackingCard1,
                lastAttackingCard2,
                lastDefendingCard,
                lastExtraAttackerCard as ComparisonCard,
                lastExtraDefenderCard as ComparisonCard,
              )
            : gen.showDoubleComparison(
                attacker,
                defender,
                lastAttackingCard1,
                lastAttackingCard2,
                lastDefendingCard,
                lastAttackSuccess ?? false,
              );

          showThenAutoClose(node, { sizeMult: 1.7 });
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
  ) {
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
