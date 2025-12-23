// frontend/src/composables/usePlayingField.ts
import { computed } from 'vue';
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

  const sceneView = computed<SceneView | null>(() => {
    const web = gameContext.state.value as WebGameState | null;
    if (!web) return null;
    return buildSceneViewFromWeb(web, cardRegistry);
  });

  async function init(): Promise<void> {
    await cardRegistry.preloadAll().catch(() => {});
  }

  async function attackDefender(index: number): Promise<WebGameState> {
    console.log('[usePlayingField] attackDefender called with index:', index);
    const st = await singleAttackDefender(index);
    console.log('[usePlayingField] attackDefender finished');
    return st;
  }

  async function attackGoalkeeper(): Promise<WebGameState> {
    return singleAttackGoalkeeper();
  }

  async function doDoubleAttack(index: number): Promise<WebGameState> {
    return doubleAttack(index);
  }

  async function doUndo(): Promise<WebGameState> {
    return undo();
  }

  async function doRedo(): Promise<WebGameState> {
    return redo();
  }

  return {
    gameContext,
    sceneView,
    busy,

    init,
    attackDefender,
    attackGoalkeeper,
    doubleAttack: doDoubleAttack,
    undo: doUndo,
    redo: doRedo,
  };
}
