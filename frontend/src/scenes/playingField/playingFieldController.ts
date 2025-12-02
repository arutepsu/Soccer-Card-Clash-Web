import type { WebGameState, PlayerLike } from '../../types/WebGameState';
import type { GameStateLike } from './playingFieldTypes';
import type { PlayersFieldBar } from '../../components/playersFieldBar'; 
import type { PlayersHandBar } from '../../components/playersHandBar'; 
import { SceneView } from './sceneMapping';

export interface PlayingFieldApiLike {
  singleAttackDefender?(index: number): Promise<WebGameState>;
  singleAttackGoalkeeper?(): Promise<WebGameState>;
  doubleAttack?(index: number): Promise<WebGameState>;
  swap?(index: number): Promise<WebGameState>;
  reverseSwap?(): Promise<WebGameState>;
  undo?(): Promise<WebGameState>;
  redo?(): Promise<WebGameState>;
  boost?(
    payload:
      | { target: 'goalkeeper' }
      | { target: 'defender'; index: number },
  ): Promise<WebGameState>;
}

export interface PushClientLike {
  isConnected?(): boolean;

  regularAttack?(
    target: 'defender' | 'goalkeeper',
    index: number | null,
  ): void;
  doubleAttack?(index: number): void;
  swap?(index: number): void;
  reverseSwap?(): void;
  undo?(): void;
  redo?(): void;
  boost?(target: 'goalkeeper' | 'defender', index?: number): void;
}

export type FieldRenderer = unknown;
export type HandRenderer = unknown;

export type MapWebToScene = (
  web: WebGameState | null | undefined,
) => SceneView | (WebGameState & { players?: SceneView['players'] }) | null;

export interface AfterServerApplyMeta {
  action: string;
  defenderIndex?: number | null;
  target?: 'goalkeeper' | 'defender';
  [key: string]: unknown;
}

export type AfterServerApplyFn = (
  web: WebGameState | null,
  meta: AfterServerApplyMeta,
) => void;


export interface CreatePlayingFieldControllerDeps {
  api?: PlayingFieldApiLike;
  push?: PushClientLike;

  fieldRenderer: FieldRenderer;
  handRenderer: HandRenderer;

  createPlayersFieldBar: (
    player: PlayerLike,
    getGameState: () => GameStateLike,
    renderer: FieldRenderer,
  ) => PlayersFieldBar;

  createPlayersHandBar: (
    player: PlayerLike,
    getGameState: () => GameStateLike,
    renderer: HandRenderer,
  ) => PlayersHandBar;

  elField: HTMLElement;
  elHand: HTMLElement;

  mapWebToScene?: MapWebToScene;
  afterServerApply?: AfterServerApplyFn;
}

export function createPlayingFieldController({
  api,
  push,
  fieldRenderer,
  handRenderer,
  createPlayersFieldBar,
  createPlayersHandBar,
  elField,
  elHand,
  mapWebToScene,
  afterServerApply,
}: CreatePlayingFieldControllerDeps) {
  let gameState: GameStateLike = null;
  const getGS = () => gameState;

  let defenderFieldBar: PlayersFieldBar | null = null;
  let attackerHandBar: PlayersHandBar | null = null;
  let busy = false;

  function mapState(
    webOrMapped: WebGameState | SceneView | null | undefined,
  ): GameStateLike {
    return mapWebToScene ? mapWebToScene(webOrMapped as WebGameState) : (webOrMapped as any);
  }

  function applyWeb(web: WebGameState | null) {
    const mapped = mapState(web);
    gameState = mapped;
    refreshUI();
    return mapped;
  }

  function mountIfNeeded(
    st: SceneView | (WebGameState & { players?: SceneView['players'] }) | null,
  ) {
    if (!st) return;

    if (!defenderFieldBar && st?.players?.defender) {
      defenderFieldBar = createPlayersFieldBar(
        st.players.defender,
        getGS,
        fieldRenderer,
      );
      defenderFieldBar.mount(elField);
    }
    if (!attackerHandBar && st?.players?.attacker) {
      attackerHandBar = createPlayersHandBar(
        st.players.attacker,
        getGS,
        handRenderer,
      );
      attackerHandBar.mount(elHand);
    }
  }

  function refreshUI() {
    if (defenderFieldBar) defenderFieldBar.updateBar(gameState);
    if (attackerHandBar) attackerHandBar.updateBar(gameState);
  }

  function buildSceneShim(
    web: WebGameState | SceneView | null,
  ): SceneView {
    const roles = (web as WebGameState)?.roles;
    const attacker = {
      id: 'att',
      name: roles?.attacker,
      playerType: 'Human',
    };
    const defender = {
      id: 'def',
      name: roles?.defender,
      playerType: 'Human',
    };
    return { players: { attacker, defender } } as SceneView;
  }

  async function onSingleAttackDefender() {
    if (busy || !defenderFieldBar) return;

    const idx = defenderFieldBar.selectedDefenderIndex?.();
    if (idx == null) return;

    try {
      busy = true;

      if (push && typeof push.regularAttack === 'function' && push.isConnected?.()) {
        push.regularAttack('defender', idx);

        afterServerApply?.(null, {
          action: 'RegularAttack',
          defenderIndex: idx,
        });
        return;
      }

      if (!api || typeof api.singleAttackDefender !== 'function') {
        console.warn(
          '[PlayingFieldCtrl] No push or api.singleAttackDefender available',
        );
        return;
      }

      const web = await api.singleAttackDefender(idx);

      afterServerApply?.(web, {
        action: 'RegularAttack',
        defenderIndex: idx,
      });
    } finally {
      defenderFieldBar.resetSelectedDefender?.();
      busy = false;
    }
  }

  async function onSingleAttackGoalkeeper() {
    if (busy) return;
    try {
      busy = true;

      if (push && typeof push.regularAttack === 'function' && push.isConnected?.()) {
        push.regularAttack('goalkeeper', null);

        afterServerApply?.(null, {
          action: 'RegularAttack',
          defenderIndex: null,
          target: 'goalkeeper',
        });
        return;
      }

      if (!api || typeof api.singleAttackGoalkeeper !== 'function') {
        console.warn(
          '[PlayingFieldCtrl] No push or api.singleAttackGoalkeeper available',
        );
        return;
      }

      const web = await api.singleAttackGoalkeeper();

      afterServerApply?.(web, {
        action: 'RegularAttack',
        defenderIndex: null,
        target: 'goalkeeper',
      });
    } finally {
      busy = false;
    }
  }

  async function onDoubleAttack() {
    if (busy || !defenderFieldBar) return;

    const idx = defenderFieldBar.selectedDefenderIndex?.();
    if (idx == null) return;

    try {
      busy = true;

      if (push && typeof push.doubleAttack === 'function' && push.isConnected?.()) {
        push.doubleAttack(idx);

        afterServerApply?.(null, {
          action: 'DoubleAttack',
          defenderIndex: idx,
        });
        return;
      }

      if (!api || typeof api.doubleAttack !== 'function') {
        console.warn('[PlayingFieldCtrl] No push or api.doubleAttack available');
        return;
      }

      const web = await api.doubleAttack(idx);

      afterServerApply?.(web, {
        action: 'DoubleAttack',
        defenderIndex: idx,
      });
    } finally {
      defenderFieldBar.resetSelectedDefender?.();
      busy = false;
    }
  }

  async function onSwapSelected() {
    if (busy || !attackerHandBar) return;
    const idx = attackerHandBar.selectedCardIndex?.();
    if (idx == null) return;
    try {
      busy = true;

      if (push && typeof push.swap === 'function' && push.isConnected?.()) {
        push.swap(idx);
        afterServerApply?.(null, { action: 'RegularSwap' });
        return;
      }

      if (!api || typeof api.swap !== 'function') {
        console.warn('[PlayingFieldCtrl] No push or api.swap available');
        return;
      }

      const web = await api.swap(idx);
      afterServerApply?.(web, { action: 'RegularSwap' });
    } finally {
      attackerHandBar.resetSelectedHand?.();
      busy = false;
    }
  }

  async function onReverseSwap() {
    if (busy) return;
    try {
      busy = true;

      if (push && typeof push.reverseSwap === 'function' && push.isConnected?.()) {
        push.reverseSwap();
        afterServerApply?.(null, { action: 'ReverseSwap' });
        return;
      }

      if (!api || typeof api.reverseSwap !== 'function') {
        console.warn('[PlayingFieldCtrl] No push or api.reverseSwap available');
        return;
      }

      const web = await api.reverseSwap();
      afterServerApply?.(web, { action: 'ReverseSwap' });
    } finally {
      busy = false;
    }
  }

  async function onUndo() {
    if (busy) return;
    try {
      busy = true;

      if (push && typeof push.undo === 'function' && push.isConnected?.()) {
        push.undo();
        afterServerApply?.(null, { action: 'Undo' });
        return;
      }

      if (!api || typeof api.undo !== 'function') {
        console.warn('[PlayingFieldCtrl] No push or api.undo available');
        return;
      }

      const web = await api.undo();
      afterServerApply?.(web, { action: 'Undo' });
    } finally {
      busy = false;
    }
  }

  async function onRedo() {
    if (busy) return;
    try {
      busy = true;

      if (push && typeof push.redo === 'function' && push.isConnected?.()) {
        push.redo();
        afterServerApply?.(null, { action: 'Redo' });
        return;
      }

      if (!api || typeof api.redo !== 'function') {
        console.warn('[PlayingFieldCtrl] No push or api.redo available');
        return;
      }

      const web = await api.redo();
      afterServerApply?.(web, { action: 'Redo' });
    } finally {
      busy = false;
    }
  }

  async function onBoostSelected() {
    if (busy || !defenderFieldBar) return;

    const sel = defenderFieldBar.selectedTarget?.();
    try {
      busy = true;

      const isGK = sel && sel.kind === 'goalkeeper';

      if (push && typeof push.boost === 'function' && push.isConnected?.()) {
        if (isGK) {
          push.boost('goalkeeper');
          afterServerApply?.(null, { action: 'BoostGoalkeeper' });
        } else {
          const idx =
            sel?.kind === 'defender'
              ? sel.index
              : defenderFieldBar.selectedDefenderIndex?.();
          if (idx == null) return;
          push.boost('defender', idx);
          afterServerApply?.(null, { action: 'BoostDefender' });
        }
        return;
      }

      if (!api || typeof api.boost !== 'function') {
        console.warn('[PlayingFieldCtrl] No push or api.boost available');
        return;
      }

      if (isGK) {
        const web = await api.boost({ target: 'goalkeeper' });
        afterServerApply?.(web, { action: 'BoostGoalkeeper' });
      } else {
        const idx =
          sel?.kind === 'defender'
            ? sel.index
            : defenderFieldBar.selectedDefenderIndex?.();
        if (idx == null) return;
        const web = await api.boost({ target: 'defender', index: idx });
        afterServerApply?.(web, { action: 'BoostDefender' });
      }
    } finally {
      defenderFieldBar.resetSelectedDefender?.();
      defenderFieldBar.clearSelection?.();
      busy = false;
    }
  }

  function updateFromServerContext(webOrMapped: WebGameState | SceneView | null) {
    const mapped = mapState(webOrMapped as any);
    gameState = mapped;

    const mountState =
      (mapped as any)?.players ? mapped : buildSceneShim(mapped as any);
    mountIfNeeded(mountState as any);
    refreshUI();
  }

  return {
    updateFromServerContext,

    onSingleAttackDefender,
    onSingleAttackGoalkeeper,
    onDoubleAttack,

    onSwapSelected,
    onReverseSwap,

    onUndo,
    onRedo,

    onBoostSelected,
  };
}
