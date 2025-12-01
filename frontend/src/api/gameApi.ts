import type { WebGameState } from '../types/WebGameState';
import type { StreamClient, StreamHandle } from './gameEventStream';

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
}

export function createGameApi(options: CreateGameApiOptions = {}): GameApi {
  const { streamClient } = options;

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
    return postJSON<WebGameState>('/api/restart', body);
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
    return postJSON<WebGameState>('/api/attack/single', {
      target: 'defender',
      index: idx,
    });
  }

  function singleAttackGoalkeeper(): Promise<WebGameState | null> {
    return postJSON<WebGameState>('/api/attack/single', {
      target: 'goalkeeper',
    });
  }

  function doubleAttack(index: number | string): Promise<WebGameState | null> {
    const idx = Number(index);
    if (!Number.isInteger(idx)) {
      return Promise.reject(
        new Error(`doubleAttack: invalid index ${index}`),
      );
    }
    return postJSON<WebGameState>('/api/attack/double', { index: idx });
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

    return postJSON<WebGameState>('/api/boost', payload);
  }

  function swap(index: number | string): Promise<WebGameState | null> {
    const idx = Number(index);
    if (!Number.isInteger(idx)) {
      return Promise.reject(
        new Error(`swap: invalid index ${index}`),
      );
    }
    return postJSON<WebGameState>('/api/swap', { index: idx });
  }

  function reverseSwap(): Promise<WebGameState | null> {
    return postJSON<WebGameState>('/api/swap/reverse', {});
  }

  function undo(): Promise<WebGameState | null> {
    return postJSON<WebGameState>('/api/undo', {});
  }

  function redo(): Promise<WebGameState | null> {
    return postJSON<WebGameState>('/api/redo', {});
  }

  function executeAI(action: any): Promise<WebGameState | null> {
    return postJSON<WebGameState>('/api/ai/execute', action);
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
