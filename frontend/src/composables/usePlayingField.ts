// frontend/src/composables/usePlayingField.ts
import { useGameContext } from './useGameContext';
import { useGameCommands } from './useGameCommands';
import type { WebGameState } from '../types/WebGameState';
import { createCardImageRegistry } from '../utils/cardImageRegistry';
import { buildSceneViewFromWeb, type SceneView } from '../utils/playingField/sceneMapping';

export function usePlayingField() {
  const gameContext = useGameContext();

  const {
    singleAttackDefender,
    singleAttackGoalkeeper,
    doubleAttack,
    undo,
    redo,
    busy,
  } = useGameCommands();

  const cardRegistry = createCardImageRegistry();

  async function init(): Promise<void> {
    await cardRegistry.preloadAll().catch(() => {});
  }

  function toSceneView(web: WebGameState | null | undefined): SceneView | null {
    if (!web) return null;
    return buildSceneViewFromWeb(web, cardRegistry);
  }

  async function attackDefender(index: number): Promise<WebGameState | null> {
    return singleAttackDefender(index);
  }

  async function attackGoalkeeper(): Promise<WebGameState | null> {
    return singleAttackGoalkeeper();
  }

  async function doDoubleAttack(index: number): Promise<WebGameState | null> {
    return doubleAttack(index);
  }

  async function doUndo(): Promise<WebGameState | null> {
    return undo();
  }

  async function doRedo(): Promise<WebGameState | null> {
    return redo();
  }

  return {
    gameContext,
    busy,
    init,

    toSceneView,

    attackDefender,
    attackGoalkeeper,
    doubleAttack: doDoubleAttack,
    undo: doUndo,
    redo: doRedo,
  };
}
