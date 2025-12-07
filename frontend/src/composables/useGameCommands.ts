// frontend/src/composables/useGameCommands.ts
import { ref } from 'vue';
import { useAppServices } from '../app/appServices';
import { useGameContext } from './useGameContext';
import type { WebGameState } from '../types/WebGameState';

export function useGameCommands() {
  const { api } = useAppServices();
  const gameContext = useGameContext();
  const busy = ref(false);

  async function runCommand(
    fn: () => Promise<WebGameState | null>,
  ): Promise<WebGameState | null> {
    busy.value = true;
    try {
      const next = await fn();
      if (next) {
        gameContext.setState(next);
      }
      return next;
    } finally {
      busy.value = false;
    }
  }

  function createLocalMultiplayer(attackerName: string, defenderName: string) {
    return runCommand(() =>
      api.createLocalMultiplayer(attackerName, defenderName),
    );
  }

  function restart(
    attackerName?: string | null,
    defenderName?: string | null,
  ) {
    return runCommand(() =>
      api.restart(attackerName ?? null, defenderName ?? null),
    );
  }

  function singleAttackDefender(index: number) {
    return runCommand(() => api.singleAttackDefender(index));
  }

  function singleAttackGoalkeeper() {
    return runCommand(() => api.singleAttackGoalkeeper());
  }

  function doubleAttack(index: number) {
    return runCommand(() => api.doubleAttack(index));
  }

  function boost(payload: any) {
    return runCommand(() => api.boost(payload));
  }

  function swap(index: number) {
    return runCommand(() => api.swap(index));
  }

  function reverseSwap() {
    return runCommand(() => api.reverseSwap());
  }

  function undo() {
    return runCommand(() => api.undo());
  }

  function redo() {
    return runCommand(() => api.redo());
  }

  function executeAI(action: any) {
    return runCommand(() => api.executeAI(action));
  }

  return {
    busy,
    createLocalMultiplayer,
    restart,
    singleAttackDefender,
    singleAttackGoalkeeper,
    doubleAttack,
    boost,
    swap,
    reverseSwap,
    undo,
    redo,
    executeAI,
  };
}
