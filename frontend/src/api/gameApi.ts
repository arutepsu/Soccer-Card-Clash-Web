// frontend/src/api/gameApi.ts
import type { WebGameState } from '../types/WebGameState';
import type { StreamClient, StreamHandle } from './gameEventStream';
import type { PushClient, GameCommandType } from './serverPushClient';

export interface GameApi {
  postJSON<T = unknown>(url: string, payload?: unknown): Promise<T | null>;
  getJSON<T = unknown>(url: string): Promise<T>;

  openStream(onState: (state: WebGameState, meta?: any | null) => void, sid?: string | null): StreamHandle;
  fetchGameState(sid?: string | null): Promise<WebGameState>;
  getState(sid?: string | null): Promise<WebGameState | null>;

  createLocalMultiplayer(attackerName: string, defenderName: string): Promise<WebGameState | null>;

  restart(attackerName?: string | null, defenderName?: string | null): Promise<WebGameState | null>;

  singleAttackDefender(index: number | string, sid?: string | null): Promise<WebGameState | null>;
  singleAttackGoalkeeper(sid?: string | null): Promise<WebGameState | null>;
  doubleAttack(index: number | string, sid?: string | null): Promise<WebGameState | null>;
  boost(payload: any, sid?: string | null): Promise<WebGameState | null>;
  swap(index: number | string, sid?: string | null): Promise<WebGameState | null>;
  reverseSwap(sid?: string | null): Promise<WebGameState | null>;
  undo(sid?: string | null): Promise<WebGameState | null>;
  redo(sid?: string | null): Promise<WebGameState | null>;
  executeAI(action: any, sid?: string | null): Promise<WebGameState | null>;
}

type GameMode = 'local' | 'online';

interface CreateGameApiOptions {
  streamClient?: StreamClient | null;
  pushClient?: PushClient | null;
  mode?: GameMode;
  getPlayerId?: () => string | null;
}

type FlatCommandBody = Record<string, unknown> & { type: string; playerId?: string | null };

function withSid(url: string, sid?: string | null): string {
  const s = (sid ?? '').trim();
  if (!s) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}sid=${encodeURIComponent(s)}`;
}

export function createGameApi(options: CreateGameApiOptions = {}): GameApi {
  const { streamClient, pushClient } = options;
  const mode: GameMode = options.mode ?? 'online';
  const getPlayerId = options.getPlayerId ?? (() => null);
  
  function commandUrl(sid?: string | null): string {
    return mode === 'online' ? withSid('/api/command', sid) : '/api/command';
  }
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
    sid?: string | null,
  ): Promise<WebGameState | null> {
    const body: FlatCommandBody = { type, mode, ...fields };

    console.log('[GameApi] mode:', mode, 'command type:', type, 'sid:', sid, 'body:', body);

    if (mode === 'local') {
      const pid = getPlayerId();
      if (pid) body.playerId = pid;
      return postJSON<WebGameState>('/api/command', body);
    }

    if (pushClient && canUseWs()) {
      try {
      await pushClient.sendCommand(type, fields);
      return null;
      } catch (err) {
        console.warn('[GameApi] WS failed, fallback to REST:', err);
      }
    }

    await postJSON<WebGameState>(commandUrl(sid), body);
    return null;
  }

  function openStream(
    onState: (state: WebGameState, meta?: any | null) => void,
    sid?: string | null
  ): StreamHandle {
    if (mode !== 'online') return { type: 'none', close() {} };

    const closers: Array<() => void> = [];
    let type: any = 'none';

    if (streamClient && typeof streamClient.open === 'function') {
      const h = streamClient.open(onState, sid);
      type = h.type;
      closers.push(() => {
        try { h.close(); } catch {}
      });
    }

    if (pushClient && canUseWs()) {
      const handler = (msg: any) => {
        if (msg?.kind === 'event' && msg?.type === 'StateUpdated' && msg?.payload) {
          onState(msg.payload as WebGameState, msg.meta ?? null);
        }
      };
      pushClient.onMessage(handler);
      type = type !== 'none' ? `${type}+ws` : 'ws';
      closers.push(() => pushClient.offMessage(handler));
    }

    return {
      type,
      close() {
        closers.forEach((c) => {
          try { c(); } catch {}
        });
      },
    };
  }

  async function fetchGameState(sid?: string | null): Promise<WebGameState> {
    if (mode === 'online') {
      return getJSON<WebGameState>(withSid('/api/state', sid));
    }
    const snap = await getState();
    if (!snap) throw new Error('fetchGameState(local): GetState returned null');
    return snap;
  }

  function getState(sid?: string | null): Promise<WebGameState | null> {
    if (mode === 'online') {
      return getJSON<WebGameState>(withSid('/api/state', sid)).catch(() => null);
    }
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

  function normalizeSid(sid?: string | null): string | null {
    const s = (sid ?? '').trim();
    return s ? s : null;
  }

  function singleAttackDefender(index: number | string, sid?: string | null) {
    const idx = Number(index);
    if (!Number.isInteger(idx)) {
      return Promise.reject(new Error(`singleAttackDefender: invalid index ${index}`));
    }
    return commandWithWsFallback('RegularAttack', { target: 'defender', index: idx }, normalizeSid(sid));
  }

  function singleAttackGoalkeeper(sid?: string | null) {
    return commandWithWsFallback('RegularAttack', { target: 'goalkeeper' }, normalizeSid(sid));
  }

  function doubleAttack(index: number | string, sid?: string | null) {
    const idx = Number(index);
    if (!Number.isInteger(idx)) {
      return Promise.reject(new Error(`doubleAttack: invalid index ${index}`));
    }
    return commandWithWsFallback('DoubleAttack', { target: 'defender', index: idx }, normalizeSid(sid));
  }

  function boost(payload: any, sid?: string | null) {
    if (!payload || typeof payload !== 'object') {
      return Promise.reject(new Error('boost: missing payload'));
    }
    if (payload.target === 'defender') {
      const idx = Number(payload.index);
      if (!Number.isInteger(idx)) {
        return Promise.reject(new Error(`boost: invalid defender index ${payload.index}`));
      }
    }
    return commandWithWsFallback('Boost', payload, normalizeSid(sid));
  }

  function swap(index: number | string, sid?: string | null) {
    const idx = Number(index);
    if (!Number.isInteger(idx)) {
      return Promise.reject(new Error(`swap: invalid index ${index}`));
    }
    return commandWithWsFallback('RegularSwap', { index: idx }, normalizeSid(sid));
  }

  function reverseSwap(sid?: string | null) {
    return commandWithWsFallback('ReverseSwap', {}, normalizeSid(sid));
  }

  function undo(sid?: string | null) {
    return commandWithWsFallback('Undo', {}, normalizeSid(sid));
  }

  function redo(sid?: string | null) {
    return commandWithWsFallback('Redo', {}, normalizeSid(sid));
  }

  function executeAI(action: any, sid?: string | null) {
    return commandWithWsFallback('ExecuteAI', action, normalizeSid(sid));
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
