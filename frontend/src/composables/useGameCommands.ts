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
    errMsg: string,
  ): Promise<WebGameState> {
    busy.value = true;
    try {
      const next = await fn();
      if (!next) throw new Error(errMsg);
      gameContext.setState(next);
      return next;
    } finally {
      busy.value = false;
    }
  }

  function getState() {
    return runCommand(() => api.getState(), 'GetState returned null WebGameState');
  }

  function startLocalMultiplayer(attackerName: string, defenderName: string) {
    return runCommand(
      () => api.createLocalMultiplayer(attackerName, defenderName),
      'CreateGame returned null WebGameState',
    );
  }

  function singleAttackDefender(index: number) {
    return runCommand(
      () => api.singleAttackDefender(index),
      'RegularAttack(defender) returned null WebGameState',
    );
  }

  function singleAttackGoalkeeper() {
    return runCommand(
      () => api.singleAttackGoalkeeper(),
      'RegularAttack(goalkeeper) returned null WebGameState',
    );
  }

  function doubleAttack(index: number) {
    return runCommand(
      () => api.doubleAttack(index),
      'DoubleAttack returned null WebGameState',
    );
  }

  function boost(payload: any) {
    return runCommand(() => api.boost(payload), 'Boost returned null WebGameState');
  }

  function swap(index: number) {
    return runCommand(() => api.swap(index), 'Swap returned null WebGameState');
  }

  function reverseSwap() {
    return runCommand(() => api.reverseSwap(), 'ReverseSwap returned null WebGameState');
  }

  function undo() {
    return runCommand(() => api.undo(), 'Undo returned null WebGameState');
  }

  function redo() {
    return runCommand(() => api.redo(), 'Redo returned null WebGameState');
  }

  function executeAI(action: any) {
    return runCommand(() => api.executeAI(action), 'ExecuteAI returned null WebGameState');
  }

  return {
    busy,
    getState,
    startLocalMultiplayer,
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
