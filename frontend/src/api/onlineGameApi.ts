// frontend/src/api/onlineGameApi.ts
import type { WebGameState } from '../types/WebGameState';
import type { StreamClient, StreamHandle } from './gameEventStream';
import type { PushClient, GameCommandType } from './serverPushClient';
import type { GameApi } from './GameApi';

interface CreateOnlineGameApiOptions {
  streamClient?: StreamClient | null;
  pushClient?: PushClient | null;
  getPlayerId?: () => string | null;
}

type FlatCommandBody = Record<string, unknown> & { type: string; playerId?: string | null };

function withSid(url: string, sid?: string | null): string {
  const s = (sid ?? '').trim();
  if (!s) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}sid=${encodeURIComponent(s)}`;
}

export function createOnlineGameApi(options: CreateOnlineGameApiOptions = {}): GameApi {
  const { streamClient, pushClient } = options;
  const getPlayerId = options.getPlayerId ?? (() => null);

  const csrf =
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ||
    (document.querySelector<HTMLInputElement>('input[name="csrfToken"]')?.value ?? null);

  const commonHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(csrf ? { 'Csrf-Token': csrf } : {}),
  };

  async function postJSON<T = unknown>(url: string, payload: unknown = {}): Promise<T | null> {
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
    return !!(pushClient && pushClient.isConnected());
  }

  async function commandWithWsFallback(
    type: GameCommandType,
    fields: Record<string, unknown> = {},
    sid?: string | null
  ): Promise<WebGameState | null> {
    const body: FlatCommandBody = { type, ...fields };

    const pid = getPlayerId();
    if (pid) body.playerId = pid;

    if (pushClient && canUseWs()) {
      try {
        await pushClient.sendCommand(type, fields);
        return null;
      } catch (err) {
        console.warn('[OnlineGameApi] WS failed, fallback to REST:', err);
      }
    }

    await postJSON<WebGameState>(withSid('/api/command', sid), body);
    return null;
  }

  function openStream(
    onState: (state: WebGameState, meta?: any | null) => void,
    sid?: string | null
  ): StreamHandle {
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
        if (msg?.kind !== 'event') return;

        if (msg.type === 'StateUpdated' && msg.payload) {
          onState(msg.payload as WebGameState, msg.meta ?? null);
          return;
        }

        if (msg.type === 'SessionEnded') {
          const st =
            (msg.payload?.state as WebGameState | undefined) ??
            (msg.payload as WebGameState | undefined) ??
            null;

          onState(st as any, {
            action: 'SessionEnded',
            leftPlayerName: msg.payload?.leftPlayerName ?? msg.leftPlayerName ?? null,
            reason: msg.payload?.reason ?? msg.reason ?? null,
          });
          return;
        }
      };
      pushClient.onMessage(handler);
      type = type !== 'none' ? `${type}+ws` : 'ws';
      closers.push(() => pushClient.offMessage(handler));
    }

    return {
      type,
      close() {
        closers.forEach((c) => { try { c(); } catch {} });
      },
    };
  }

  async function fetchGameState(sid?: string | null): Promise<WebGameState> {
    return getJSON<WebGameState>(withSid('/api/state', sid));
  }

  function getState(sid?: string | null): Promise<WebGameState | null> {
    return getJSON<WebGameState>(withSid('/api/state', sid)).catch(() => null);
  }

  function createLocalMultiplayer(attackerName: string, defenderName: string) {
    return commandWithWsFallback('CreateGame', { p1: attackerName, p2: defenderName }, null);
  }

  function restart(attackerName?: string | null, defenderName?: string | null) {
    const p1 = attackerName?.trim();
    const p2 = defenderName?.trim();
    if (!p1 || !p2) {
      return Promise.reject(new Error('restart: provide both attackerName and defenderName'));
    }
    return commandWithWsFallback('CreateGame', { p1, p2 }, null);
  }

  function normalizeSid(sid?: string | null): string | null {
    const s = (sid ?? '').trim();
    return s ? s : null;
  }

  function singleAttackDefender(index: number | string, sid?: string | null) {
    const idx = Number(index);
    if (!Number.isInteger(idx)) return Promise.reject(new Error(`singleAttackDefender: invalid index ${index}`));
    return commandWithWsFallback('RegularAttack', { target: 'defender', index: idx }, normalizeSid(sid));
  }

  function singleAttackGoalkeeper(sid?: string | null) {
    return commandWithWsFallback('RegularAttack', { target: 'goalkeeper' }, normalizeSid(sid));
  }

  function doubleAttack(index: number | string, sid?: string | null) {
    const idx = Number(index);
    if (!Number.isInteger(idx)) return Promise.reject(new Error(`doubleAttack: invalid index ${index}`));
    return commandWithWsFallback('DoubleAttack', { target: 'defender', index: idx }, normalizeSid(sid));
  }

  function boost(payload: any, sid?: string | null) {
    if (!payload || typeof payload !== 'object') return Promise.reject(new Error('boost: missing payload'));
    if (payload.target === 'defender') {
      const idx = Number(payload.index);
      if (!Number.isInteger(idx)) return Promise.reject(new Error(`boost: invalid defender index ${payload.index}`));
    }
    return commandWithWsFallback('Boost', payload, normalizeSid(sid));
  }

  function swap(index: number | string, sid?: string | null) {
    const idx = Number(index);
    if (!Number.isInteger(idx)) return Promise.reject(new Error(`swap: invalid index ${index}`));
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
