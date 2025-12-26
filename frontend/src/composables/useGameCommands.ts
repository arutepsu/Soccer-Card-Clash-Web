// frontend/src/composables/useGameCommands.ts
import { computed, ref } from 'vue';
import { useAppServices } from '@/app/appServices';
import { useGameContext } from './useGameContext';
import type { GameApi } from '../api/gameApi';
import type { WebGameState } from '../types/WebGameState';
type GameMode = 'local' | 'online';

export function useGameCommands(overrideApi?: GameApi) {
  const gameContext = useGameContext();
  const busy = ref(false);
  const services = useAppServices();

  const sid = computed(() => services.gameContext.sessionId.value);

  function requireMode(): GameMode {
    const m = services.gameContext.mode.value as GameMode | null;
    if (!m) throw new Error('[useGameCommands] game mode not set (pin mode before issuing commands)');
    return m;
  }

  function requireSid(): string {
    const s = (sid.value ?? '').trim();
    if (!s) throw new Error('[useGameCommands] online command without sid (pin sessionId before issuing commands)');
    return s;
  }

  const api = computed<GameApi>(() => {
    if (overrideApi) return overrideApi;
    const mode = requireMode();
    return services.game.forMode(mode);
  });

  async function runCommand(
    fn: (api: GameApi) => Promise<WebGameState | null>,
    errMsg: string,
  ): Promise<WebGameState | null> {
    busy.value = true;
    try {
      const mode = requireMode();
      const next = await fn(api.value);

      if (mode === 'local') {
        if (!next) throw new Error(errMsg);
        gameContext.setState(next);
        return next;
      }

      // online: may be null (stream authoritative), but if we got state apply it
      if (next) gameContext.setState(next);
      return next;
    } finally {
      busy.value = false;
    }
  }

  function getState(sessionId?: string | null) {
    const mode = requireMode();
    const s = mode === 'online' ? (sessionId ?? requireSid()) : (sessionId ?? null);
    return runCommand((a) => a.getState(s), 'GetState returned null WebGameState');
  }

  function startLocalMultiplayer(attackerName: string, defenderName: string) {
    services.gameContext.setMode('local');
    return runCommand(
      (a) => a.createLocalMultiplayer(attackerName, defenderName),
      'CreateGame returned null WebGameState',
    );
  }

  function singleAttackDefender(index: number) {
    const mode = requireMode();
    const s = mode === 'online' ? requireSid() : null;
    return runCommand((a) => a.singleAttackDefender(index, s), 'RegularAttack(defender) returned null WebGameState');
  }

  function singleAttackGoalkeeper() {
    const mode = requireMode();
    const s = mode === 'online' ? requireSid() : null;
    return runCommand((a) => a.singleAttackGoalkeeper(s), 'RegularAttack(goalkeeper) returned null WebGameState');
  }

  function doubleAttack(index: number) {
    const mode = requireMode();
    const s = mode === 'online' ? requireSid() : null;
    return runCommand((a) => a.doubleAttack(index, s), 'DoubleAttack returned null WebGameState');
  }

  function boost(payload: any) {
    const mode = requireMode();
    const s = mode === 'online' ? requireSid() : null;
    return runCommand((a) => a.boost(payload, s), 'Boost returned null WebGameState');
  }

  function swap(index: number) {
    const mode = requireMode();
    const s = mode === 'online' ? requireSid() : null;
    return runCommand((a) => a.swap(index, s), 'Swap returned null WebGameState');
  }

  function reverseSwap() {
    const mode = requireMode();
    const s = mode === 'online' ? requireSid() : null;
    return runCommand((a) => a.reverseSwap(s), 'ReverseSwap returned null WebGameState');
  }

  function undo() {
    const mode = requireMode();
    const s = mode === 'online' ? requireSid() : null;
    return runCommand((a) => a.undo(s), 'Undo returned null WebGameState');
  }

  function redo() {
    const mode = requireMode();
    const s = mode === 'online' ? requireSid() : null;
    return runCommand((a) => a.redo(s), 'Redo returned null WebGameState');
  }

  function executeAI(action: any) {
    const mode = requireMode();
    const s = mode === 'online' ? requireSid() : null;
    return runCommand((a) => a.executeAI(action, s), 'ExecuteAI returned null WebGameState');
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
