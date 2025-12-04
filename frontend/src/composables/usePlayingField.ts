// frontend/src/composables/usePlayingField.ts
import { computed } from 'vue';
import { useGameContext } from './useGameContext';
import type { WebGameState } from '../types/WebGameState';
import { createCardImageRegistry } from '../utils/cardImageRegistry';
import {
  buildSceneViewFromWeb,
  type SceneView,
} from '../scenes/playingField/sceneMapping';

export function usePlayingField() {
  const gameContext = useGameContext();

  const busy = computed(() => gameContext.loading.value);

  const cardRegistry = createCardImageRegistry();

  const sceneView = computed<SceneView | null>(() => {
    const web = gameContext.state.value as WebGameState | null;
    if (!web) return null;
    return buildSceneViewFromWeb(web, cardRegistry);
  });

  // Called from PlayingFieldView's onMounted
  async function init(): Promise<void> {
    await gameContext.init();
  }

  // index is required here because the view ensures it
  async function attackDefender(index: number): Promise<void> {
    await gameContext.singleAttackDefender(index);
  }

  async function attackGoalkeeper(): Promise<void> {
    await gameContext.singleAttackGoalkeeper();
  }

  async function doubleAttack(index: number): Promise<void> {
    await gameContext.doubleAttack(index);
  }

  async function undo(): Promise<void> {
    await gameContext.undo();
  }

  async function redo(): Promise<void> {
    await gameContext.redo();
  }

  return {
    gameContext,
    sceneView,
    busy,

    init,
    attackDefender,
    attackGoalkeeper,
    doubleAttack,
    undo,
    redo,
  };
}
