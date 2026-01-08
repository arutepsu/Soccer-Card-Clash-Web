// frontend/src/utils/playingField/comparisonOrchestrator.ts
import type { WebGameState } from '../../types/WebGameState';
import type { ComparisonDialogHandler } from './comparisonDialogHandler';
import type { UIActionScheduler } from '../../ui/uiActionScheduler';
import type { GameApi } from '../../api/GameApi';

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

export function createComparisonOrchestrator({
  api,
  scheduler,
  getSid,
  comparisonHandler,
  ActionNames,
  applyUiFromWeb,
  updateFromServerContext,
  soundManager,
}: OrchestratorDeps) {
  let pendingActionType: string | null = null;
  let isOverlayActive = false;

  let latestStreamWeb: WebGameState | null = null;
  let lastStableWeb: WebGameState | null = null;

  function setPendingAction(type: string | null, _meta?: ActionMeta) {
    pendingActionType = type;

    if (!type) {
      comparisonHandler.resetLastCards();
      return;
    }
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
      pendingActionType = null;
      isOverlayActive = false;
    }
  }

  async function runOverlayForPendingAction() {
    if (!pendingActionType) return;

    isOverlayActive = true;

    const overlayAction =
      pendingActionType === ActionNames.RegularAttack ||
      pendingActionType === ActionNames.DoubleAttack
        ? comparisonHandler.createOverlayAction({ type: pendingActionType as any })
        : null;

    if (overlayAction) {
      scheduler.runSequence(overlayAction);
    } else {
      console.warn('[CMP] overlayAction null; applying buffered state', pendingActionType);
      await applyBufferedStateAfterOverlay();
    }
  }

  function afterServerApply(_serverWeb: WebGameState | null | undefined, _meta?: ActionMeta) {
    void runOverlayForPendingAction();
  }

  function handleStreamWeb(web: WebGameState | null | undefined) {
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
