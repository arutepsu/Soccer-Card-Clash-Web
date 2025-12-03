// api/gameApi.ts
import type { WebGameState } from '../types/WebGameState';
import type { StreamClient, StreamHandle } from './gameEventStream';
import type { PushClient } from './serverPushClient';

export interface GameApi {
  postJSON<T = unknown>(url: string, payload?: unknown): Promise<T | null>;
  getJSON<T = unknown>(url: string): Promise<T>;

  openStream(onState: (state: WebGameState) => void): StreamHandle;

  fetchGameState(): Promise<WebGameState>;
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
    return !!(pushClient && pushClient.isConnected?.());
  }

  async function commandWithWsFallback(
    cmd: string,
    restUrl: string,
    payload?: unknown,
  ): Promise<WebGameState | null> {
    // 1) Try WS command if connected
    if (pushClient && typeof (pushClient as any).sendCommand === 'function' && canUseWs()) {
      try {
        const maybe = (pushClient as any).sendCommand(cmd, payload);
        if (maybe && typeof (maybe as any).then === 'function') {
          // sendCommand returns a Promise<WebGameState | null>
          return (maybe as Promise<WebGameState | null>);
        }
        // fire-and-forget: state will come via SSE/Comet
        return null;
      } catch (err) {
        console.warn('[GameApi] WS sendCommand failed, falling back to REST:', err);
        // and just continue to REST fallback below
      }
    }

    // 2) Fallback to REST
    return postJSON<WebGameState>(restUrl, payload);
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

  function restart(
    attackerName?: string | null,
    defenderName?: string | null,
  ): Promise<WebGameState | null> {
    const body: Record<string, unknown> = {};
    if (attackerName) body.attackerName = attackerName;
    if (defenderName) body.defenderName = defenderName;

    return commandWithWsFallback('restart', '/api/restart', body);
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
      'singleAttackDefender',
      '/api/attack/single',
      { target: 'defender', index: idx },
    );
  }

  function singleAttackGoalkeeper(): Promise<WebGameState | null> {
    return commandWithWsFallback(
      'singleAttackGoalkeeper',
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
      'doubleAttack',
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

    return commandWithWsFallback('boost', '/api/boost', payload);
  }

  function swap(index: number | string): Promise<WebGameState | null> {
    const idx = Number(index);
    if (!Number.isInteger(idx)) {
      return Promise.reject(
        new Error(`swap: invalid index ${index}`),
      );
    }
    return commandWithWsFallback('swap', '/api/swap', { index: idx });
  }

  function reverseSwap(): Promise<WebGameState | null> {
    return commandWithWsFallback('reverseSwap', '/api/swap/reverse', {});
  }

  function undo(): Promise<WebGameState | null> {
    return commandWithWsFallback('undo', '/api/undo', {});
  }

  function redo(): Promise<WebGameState | null> {
    return commandWithWsFallback('redo', '/api/redo', {});
  }

  function executeAI(action: any): Promise<WebGameState | null> {
    return commandWithWsFallback('executeAI', '/api/ai/execute', action);
  }

  return {
    postJSON,
    getJSON,
    openStream,
    fetchGameState,
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
