// frontend/src/composables/useGameCommands.ts
import { computed, ref } from 'vue';
import { useAppServices } from '@/app/appServices';
import { useGameContext } from './useGameContext';
import type { GameApi } from '../api/gameApi';
import type { WebGameState } from '../types/WebGameState';

export function useGameCommands(overrideApi?: GameApi) {
  const gameContext = useGameContext();
  const busy = ref(false);

  const services = useAppServices();

  const api = computed<GameApi>(() => {
    if (overrideApi) return overrideApi;
    const m = services.gameContext.mode.value ?? 'local';
    return services.game.forMode(m);
  });

  async function runCommand(
    fn: (api: GameApi) => Promise<WebGameState | null>,
    errMsg: string,
  ): Promise<WebGameState> {
    busy.value = true;
    try {
      const next = await fn(api.value);
      if (!next) throw new Error(errMsg);
      gameContext.setState(next);
      return next;
    } finally {
      busy.value = false;
    }
  }

  function getState() {
    return runCommand((a) => a.getState(), 'GetState returned null WebGameState');
  }
  function startLocalMultiplayer(attackerName: string, defenderName: string) {
    return runCommand(
      () => services.game.local.createLocalMultiplayer(attackerName, defenderName),
      'CreateGame returned null WebGameState',
    );
  }

  function singleAttackDefender(index: number) {
    return runCommand(
      (a) => a.singleAttackDefender(index),
      'RegularAttack(defender) returned null WebGameState',
    );
  }

  function singleAttackGoalkeeper() {
    return runCommand(
      (a) => a.singleAttackGoalkeeper(),
      'RegularAttack(goalkeeper) returned null WebGameState',
    );
  }

  function doubleAttack(index: number) {
    return runCommand((a) => a.doubleAttack(index), 'DoubleAttack returned null WebGameState');
  }

  function boost(payload: any) {
    return runCommand((a) => a.boost(payload), 'Boost returned null WebGameState');
  }

  function swap(index: number) {
    return runCommand((a) => a.swap(index), 'Swap returned null WebGameState');
  }

  function reverseSwap() {
    return runCommand((a) => a.reverseSwap(), 'ReverseSwap returned null WebGameState');
  }

  function undo() {
    return runCommand((a) => a.undo(), 'Undo returned null WebGameState');
  }

  function redo() {
    return runCommand((a) => a.redo(), 'Redo returned null WebGameState');
  }

  function executeAI(action: any) {
    return runCommand((a) => a.executeAI(action), 'ExecuteAI returned null WebGameState');
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
