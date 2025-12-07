// frontend/src/composables/usePlayingField.ts
import { computed } from 'vue';
import { useGameContext } from './useGameContext';
import { useGameCommands } from './useGameCommands';
import type { WebGameState } from '../types/WebGameState';
import { createCardImageRegistry } from '../utils/cardImageRegistry';
import {
  buildSceneViewFromWeb,
  type SceneView,
} from '../scenes/playingField/sceneMapping';

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
    await gameContext.init();
  }

  async function attackDefender(index: number): Promise<void> {
    console.log('[usePlayingField] attackDefender called with index:', index);
    await singleAttackDefender(index);
    console.log('[usePlayingField] attackDefender finished');
  }

  async function attackGoalkeeper(): Promise<void> {
    await singleAttackGoalkeeper();
  }

  async function doDoubleAttack(index: number): Promise<void> {
    await doubleAttack(index);
  }

  async function doUndo(): Promise<void> {
    await undo();
  }

  async function doRedo(): Promise<void> {
    await redo();
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
