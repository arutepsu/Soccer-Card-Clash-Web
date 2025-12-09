// frontend/src/api/gameApi.ts
import type { WebGameState } from '../types/WebGameState';
import type { StreamClient, StreamHandle } from './gameEventStream';
import type { PushClient, GameCommandType } from './serverPushClient';

export interface GameApi {
  postJSON<T = unknown>(url: string, payload?: unknown): Promise<T | null>;
  getJSON<T = unknown>(url: string): Promise<T>;

  openStream(onState: (state: WebGameState) => void): StreamHandle;

  fetchGameState(): Promise<WebGameState>;

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

interface CreateGameApiOptions {
  streamClient?: StreamClient | null;
  pushClient?: PushClient | null;
}

export function createGameApi(options: CreateGameApiOptions = {}): GameApi {
  const { streamClient, pushClient } = options;

  const csrf =
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ||
    (document.querySelector<HTMLInputElement>('input[name="csrfToken"]')?.value ??
      null);

  const commonHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(csrf ? { 'Csrf-Token': csrf } : { 'Csrf-Token': 'nocheck' }),
  };

  async function postJSON<T = unknown>(
    url: string,
    payload: unknown = {},
  ): Promise<T | null> {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
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
      credentials: 'same-origin',
      headers: commonHeaders,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${url} failed: ${res.status} — ${text}`);
    }

    return res.json() as Promise<T>;
  }

  function canUseWs(): boolean {
    return !!(pushClient && pushClient.isConnected());
  }

  /**
   * Send a command:
   * - Prefer WebSocket (sendCommand with GameCommandType)
   * - Fallback to REST endpoint returning WebGameState
   */
async function commandWithWsFallback(
  type: GameCommandType,
  restUrl: string,
  payload?: unknown,
): Promise<WebGameState | null> {
  console.log('[GameApi] commandWithWsFallback type:', type, 'restUrl:', restUrl, 'payload:', payload);

  if (pushClient && canUseWs()) {
    console.log('[GameApi] using WebSocket for command:', type);
    try {
      const result = await pushClient.sendCommand(type, payload);
      console.log('[GameApi] WS sendCommand result:', result);

      if (result) {
        return result;
      }

      console.warn(
        '[GameApi] WS returned null for',
        type,
        '– falling back to REST',
      );
    } catch (err) {
      console.warn(
        '[GameApi] WS sendCommand threw, falling back to REST:',
        err,
      );
      // fall through to REST
    }
  } else {
    console.log('[GameApi] WS not connected, using REST for', type);
  }

  const restResult = await postJSON<WebGameState>(restUrl, payload);
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

  /**
   * Restart: currently always via REST.
   * Backend returns WebGameState directly.
   */
  function restart(
    attackerName?: string | null,
    defenderName?: string | null,
  ): Promise<WebGameState | null> {
    const body: Record<string, unknown> = {};
    if (attackerName) body.attackerName = attackerName;
    if (defenderName) body.defenderName = defenderName;

    // NEW endpoint in GameApiController, no wrapper, just WebGameState
    return postJSON<WebGameState>('/api/game/restart', body);
  }

    function createLocalMultiplayer(
      attackerName: string,
      defenderName: string,
    ): Promise<WebGameState | null> {
      return postJSON<WebGameState>('/api/game/local-multiplayer', {
        attackerName,
        defenderName,
      });
    }


  function singleAttackDefender(
    index: number | string,
  ): Promise<WebGameState | null> {
    const idx = Number(index);
    if (!Number.isInteger(idx)) {
      return Promise.reject(
        new Error(`singleAttackDefender: invalid index ${index}`),
      );
    }

    return commandWithWsFallback(
      'RegularAttack', // GameCommandType
      '/api/attack/single',
      { target: 'defender', index: idx },
    );
  }

  function singleAttackGoalkeeper(): Promise<WebGameState | null> {
    return commandWithWsFallback(
      'RegularAttack', // GameCommandType
      '/api/attack/single',
      { target: 'goalkeeper' },
    );
  }

  function doubleAttack(index: number | string): Promise<WebGameState | null> {
    const idx = Number(index);
    if (!Number.isInteger(idx)) {
      return Promise.reject(
        new Error(`doubleAttack: invalid index ${index}`),
      );
    }

    return commandWithWsFallback(
      'DoubleAttack', // GameCommandType
      '/api/attack/double',
      { index: idx },
    );
  }

  function boost(payload: any): Promise<WebGameState | null> {
    if (!payload || typeof payload !== 'object') {
      return Promise.reject(new Error('boost: missing payload'));
    }

    if (payload.target === 'defender') {
      const idx = Number(payload.index);
      if (!Number.isInteger(idx)) {
        return Promise.reject(
          new Error(`boost: invalid defender index ${payload.index}`),
        );
      }
    }

    return commandWithWsFallback(
      'Boost', // GameCommandType
      '/api/boost',
      payload,
    );
  }

  function swap(index: number | string): Promise<WebGameState | null> {
    const idx = Number(index);
    if (!Number.isInteger(idx)) {
      return Promise.reject(new Error(`swap: invalid index ${index}`));
    }

    return commandWithWsFallback(
      'RegularSwap', // GameCommandType
      '/api/swap',
      { index: idx },
    );
  }

  function reverseSwap(): Promise<WebGameState | null> {
    return commandWithWsFallback(
      'ReverseSwap', // GameCommandType
      '/api/swap/reverse',
      {},
    );
  }

  function undo(): Promise<WebGameState | null> {
    return commandWithWsFallback(
      'Undo', // GameCommandType
      '/api/undo',
      {},
    );
  }

  function redo(): Promise<WebGameState | null> {
    return commandWithWsFallback(
      'Redo', // GameCommandType
      '/api/redo',
      {},
    );
  }

  function executeAI(action: any): Promise<WebGameState | null> {
    return commandWithWsFallback(
      'ExecuteAI', // GameCommandType
      '/api/ai/execute',
      action,
    );
  }

  return {
    postJSON,
    getJSON,
    openStream,
    fetchGameState,
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
