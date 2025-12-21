// frontend/src/api/gameApi.ts
import type { WebGameState } from '../types/WebGameState';
import type { StreamClient, StreamHandle } from './gameEventStream';
import type { PushClient, GameCommandType } from './serverPushClient';

export interface GameApi {
  postJSON<T = unknown>(url: string, payload?: unknown): Promise<T | null>;
  getJSON<T = unknown>(url: string): Promise<T>;

  openStream(onState: (state: WebGameState) => void): StreamHandle;

  fetchGameState(): Promise<WebGameState>;

  getState(): Promise<WebGameState | null>;

  createLocalMultiplayer(
    attackerName: string,
    defenderName: string,
  ): Promise<WebGameState | null>;

  restart(
    attackerName?: string | null,
    defenderName?: string | null,
  ): Promise<WebGameState | null>;

  singleAttackDefender(index: number | string): Promise<WebGameState | null>;
  singleAttackGoalkeeper(): Promise<WebGameState | null>;
  doubleAttack(index: number | string): Promise<WebGameState | null>;
  boost(payload: any): Promise<WebGameState | null>;
  swap(index: number | string): Promise<WebGameState | null>;
  reverseSwap(): Promise<WebGameState | null>;
  undo(): Promise<WebGameState | null>;
  redo(): Promise<WebGameState | null>;
  executeAI(action: any): Promise<WebGameState | null>;
}

type GameMode = 'local' | 'online';

interface CreateGameApiOptions {
  streamClient?: StreamClient | null;
  pushClient?: PushClient | null;
  mode?: GameMode;
  getPlayerId?: () => string | null;
}

type FlatCommandBody = Record<string, unknown> & { type: string; playerId?: string | null };

export function createGameApi(options: CreateGameApiOptions = {}): GameApi {
  const { streamClient, pushClient } = options;
  const mode: GameMode = options.mode ?? 'online';
  const getPlayerId = options.getPlayerId ?? (() => null);
  const csrf =
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ||
    (document.querySelector<HTMLInputElement>('input[name="csrfToken"]')?.value ??
      null);

  const commonHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(csrf ? { 'Csrf-Token': csrf } : {}),
  };

  async function postJSON<T = unknown>(
    url: string,
    payload: unknown = {},
  ): Promise<T | null> {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: commonHeaders,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${url} failed: ${res.status} — ${text}`);
    }

    const txt = await res.text().catch(() => '');
    if (!txt) return null;

    try {
      return JSON.parse(txt) as T;
    } catch {
      return txt as unknown as T;
    }
  }

  async function getJSON<T = unknown>(url: string): Promise<T> {
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: commonHeaders,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${url} failed: ${res.status} — ${text}`);
    }

    return res.json() as Promise<T>;
  }

  function canUseWs(): boolean {
    return mode === 'online' && !!(pushClient && pushClient.isConnected());
  }

  async function commandWithWsFallback(
  type: GameCommandType,
  fields: Record<string, unknown> = {},
  ): Promise<WebGameState | null> {
    const body: FlatCommandBody = { type, mode, ...fields };

    console.log('[GameApi] mode:', mode, 'command type:', type, 'body:', body);

    if (mode === 'local') {
      body.playerId = getPlayerId();
      const restResult = await postJSON<WebGameState>('/api/command', body);
      console.log('[GameApi] REST result for', type, ':', restResult);
      console.log('[GameApi] LOCAL POST /api/command body=', body);
      return restResult;
    }

    if (pushClient && canUseWs()) {
      console.log('[GameApi] using WebSocket for command:', type);
      try {
        const result = await pushClient.sendCommand(type, body);
        console.log('[GameApi] WS result:', result);

        if (result) return result;

        console.warn('[GameApi] WS returned null, falling back to REST:', type);
      } catch (err) {
        console.warn('[GameApi] WS sendCommand threw, falling back to REST:', err);
      }
    } else {
      console.log('[GameApi] WS not connected, using REST for', type);
    }

    const restResult = await postJSON<WebGameState>('/api/command', body);
    console.log('[GameApi] REST result for', type, ':', restResult);
    return restResult;
  }

  function openStream(onState: (state: WebGameState) => void): StreamHandle {
    if (streamClient && typeof streamClient.open === 'function') {
      return streamClient.open(onState);
    }

    console.warn('[GameApi] streamClient is not provided, streaming disabled');
    return {
      type: 'none',
      close() {},
    };
  }
  
  function fetchGameState(): Promise<WebGameState> {
    return getJSON<WebGameState>('/api/state');
  }

  function getState(): Promise<WebGameState | null> {
    return commandWithWsFallback('GetState', {});
  }


  function createLocalMultiplayer(
    attackerName: string,
    defenderName: string,
  ): Promise<WebGameState | null> {
    return commandWithWsFallback('CreateGame', {
      p1: attackerName,
      p2: defenderName,
    });
  }

  function restart(
    attackerName?: string | null,
    defenderName?: string | null,
  ): Promise<WebGameState | null> {
    const p1 = attackerName?.trim();
    const p2 = defenderName?.trim();
    if (!p1 || !p2) {
      return Promise.reject(
        new Error('restart: backend has no Restart command; provide both attackerName and defenderName'),
      );
    }
    return commandWithWsFallback('CreateGame', { p1, p2 });
  }

  function singleAttackDefender(index: number | string): Promise<WebGameState | null> {
    const idx = Number(index);
    if (!Number.isInteger(idx)) {
      return Promise.reject(new Error(`singleAttackDefender: invalid index ${index}`));
    }

    return commandWithWsFallback('RegularAttack', {
      target: 'defender',
      index: idx,
    });
  }

  function singleAttackGoalkeeper(): Promise<WebGameState | null> {
    return commandWithWsFallback('RegularAttack', {
      target: 'goalkeeper',
    });
  }

  function doubleAttack(index: number | string): Promise<WebGameState | null> {
    const idx = Number(index);
    if (!Number.isInteger(idx)) {
      return Promise.reject(new Error(`doubleAttack: invalid index ${index}`));
    }

    return commandWithWsFallback('DoubleAttack', {
      target: 'defender',
      index: idx,
    });
  }

  function boost(payload: any): Promise<WebGameState | null> {
    if (!payload || typeof payload !== 'object') {
      return Promise.reject(new Error('boost: missing payload'));
    }

    if (payload.target === 'defender') {
      const idx = Number(payload.index);
      if (!Number.isInteger(idx)) {
        return Promise.reject(new Error(`boost: invalid defender index ${payload.index}`));
      }
    }

    return commandWithWsFallback('Boost', payload);
  }

  function swap(index: number | string): Promise<WebGameState | null> {
    const idx = Number(index);
    if (!Number.isInteger(idx)) {
      return Promise.reject(new Error(`swap: invalid index ${index}`));
    }

    return commandWithWsFallback('RegularSwap', { index: idx });
  }

  function reverseSwap(): Promise<WebGameState | null> {
    return commandWithWsFallback('ReverseSwap', {});
  }

  function undo(): Promise<WebGameState | null> {
    return commandWithWsFallback('Undo', {});
  }

  function redo(): Promise<WebGameState | null> {
    return commandWithWsFallback('Redo', {});
  }

  function executeAI(action: any): Promise<WebGameState | null> {
    return commandWithWsFallback('ExecuteAI', action);
  }

  return {
    postJSON,
    getJSON,
    openStream,
    fetchGameState,
    getState,
    restart,
    createLocalMultiplayer,
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
