import type { WebGameState } from '../types/WebGameState';
import { resolveWsOrigin } from '@/api/url'

export type GameCommandType =
  | 'GetState'
  | 'RegularAttack'
  | 'DoubleAttack'
  | 'Boost'
  | 'RegularSwap'
  | 'ReverseSwap'
  | 'Undo'
  | 'Redo'
  | 'ExecuteAI'
  | 'CreateGame'
  | 'CreateGameWithAI'
  | 'LoadGame'
  | 'SaveGame'
  | 'QuitGame';

export interface GameEnvelope {
  kind: 'command';
  type: GameCommandType;
  gameId: string;
  playerId?: string;
  requestId?: string;
  version?: number;
  payload: unknown;
}

export type PushMessageHandler = (msg: any) => void;

export interface PushClient {
  isConnected(): boolean;
  onMessage(handler: PushMessageHandler): void;
  offMessage(handler: PushMessageHandler): void;
  close(): void;

  sendCommand(type: GameCommandType, payload?: unknown): Promise<WebGameState | null>;
  setGameId(id: string | null): void;
  reconnect(): void;

  getState(): void;
  regularAttack(target: 'defender' | 'goalkeeper', index?: number | null): void;
  doubleAttack(target: 'defender' | 'goalkeeper', index?: number | null): void;
  boost(target: 'defender' | 'goalkeeper', index?: number | null): void;
  swap(index: number | string): void;
  reverseSwap(): void;
  undo(): void;
  redo(): void;
  executeAI(aiAction: any): void;
  createGame(p1: string, p2: string): void;
  createGameWithAI(humanPlayer: string, aiName: string): void;
  load(fileName: string): void;
  save(): void;
  quit(): void;
}

  export interface CreateServerPushClientOptions {
    baseUrl?: string
    path?: string
    reconnectDelayMs?: number
    getPlayerId?: () => string | null
    getAccessToken?: () => Promise<string | null>

    getPlayerToken?: (sid: string | null) => Promise<string | null> | string | null
  }


/**
 * WebSocket-based push client.
 *
 * Auth: uses Supabase access token in the WS query string (?token=...)
 * Game room: selected via setGameId() and included in each command envelope.
 */
export function createServerPushClient(
  opts: CreateServerPushClientOptions = {},
): PushClient {
  const { path = '/api/ws', reconnectDelayMs = 1000 } = opts;

  let ws: WebSocket | null = null;
  let connected = false;
  let reconnectTimer: number | null = null;
  let intentionallyClosed = false;

  let currentGameId: string | null = null;

  const handlers = new Set<PushMessageHandler>();

  let reqCounter = 0;
  const pending = new Map<
    string,
    { resolve: (state: WebGameState | null) => void; reject: (err: unknown) => void }
  >();

async function buildWsUrl(token?: string | null): Promise<string> {
  const origin = opts.baseUrl
    ? opts.baseUrl.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:').replace(/\/+$/, '')
    : resolveWsOrigin();

  const base = `${origin}${path}`;
  const q = new URLSearchParams();

  const t = (token ?? '').trim();
  if (t) q.set('token', t);

  const sid = (currentGameId ?? '').trim();
  if (sid) q.set('sid', sid);

  const maybePt = opts.getPlayerToken?.(currentGameId) ?? null;
  const pt = typeof maybePt === 'string' ? maybePt : await maybePt;
  const ptTrim = (pt ?? '').trim();
  if (ptTrim) q.set('playerToken', ptTrim);

  const qs = q.toString();
  return qs ? `${base}?${qs}` : base;
}

  function scheduleReconnect(): void {
    if (intentionallyClosed) return;
    if (reconnectTimer != null) return;
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      if (currentGameId) void connect();
    }, reconnectDelayMs);
  }
  let connectSeq = 0;

  async function connect(): Promise<void> {
    const mySeq = ++connectSeq;

    const token = await opts.getAccessToken?.().catch(() => null);
    if (mySeq !== connectSeq) return;

    if (!token) { scheduleReconnect(); return; }

    const url = await buildWsUrl(token);
    if (mySeq !== connectSeq) return;
    
    let nextWs: WebSocket;
    try {
      nextWs = new WebSocket(url);
    } catch (err) {
      console.warn('[WS] failed to construct WebSocket:', err);
      scheduleReconnect();
      return;
    }

    if (ws) { try { ws.close(); } catch {} }
    ws = nextWs;

    ws.onopen = () => { if (mySeq === connectSeq) connected = true; };

    ws.onclose = (ev) => {
      if (ws === nextWs) ws = null;
      connected = false;
      console.warn('[WS] close', { code: ev.code, reason: ev.reason, wasClean: ev.wasClean });
      if (!intentionallyClosed) scheduleReconnect();
    };

    ws.onerror = (e) => {
      console.warn('[WS] error:', e);
    };

    ws.onmessage = (ev) => {
      let msg: any;
      try {
        msg = JSON.parse(ev.data);
      } catch (err) {
        console.error('[WS] invalid JSON:', err, ev.data);
        return;
      }

      try {
        const requestId = msg?.requestId as string | undefined;
        if (requestId && pending.has(requestId)) {
          const entry = pending.get(requestId)!;
          pending.delete(requestId);

          if (msg.kind === 'event' && msg.type === 'StateUpdated') {
            entry.resolve(msg.payload as WebGameState);
          } else if (msg.kind === 'error') {
            const errMsg = (msg.payload?.message as string | undefined) ?? '';

            const isTokenAuthError =
              /invalid token|jwt|signature|expired|token missing|missing bearer/i.test(errMsg);

            const isNotInSession =
              /not in session/i.test(errMsg);

            if (isTokenAuthError) {
              console.warn('[WS] token/jwt auth error', msg);
              entry.resolve(null);
              return;
            }

            if (msg.kind === 'error') {
              const e = new Error(errMsg || 'WS command failed');
              (e as any).code = msg.type;
              (e as any).meta = msg.meta;
              (e as any).gameId = msg.gameId;
              entry.reject(e);
              return;
            }

            entry.resolve(null);

          } else {
            entry.resolve(null);
          }
        }
      } catch (err) {
        console.warn('[WS] error handling response for requestId:', err);
      }

      handlers.forEach((h) => {
        try { h(msg); } catch (err) { console.error('[WS] handler threw:', err); }
      });
    };
  }

  function isConnected(): boolean {
    return !!(connected && ws && ws.readyState === WebSocket.OPEN);
  }

  function onMessage(handler: PushMessageHandler): void {
    if (typeof handler !== 'function') return;
    handlers.add(handler);
  }

  function offMessage(handler: PushMessageHandler): void {
    handlers.delete(handler);
  }

  function close(): void {
    intentionallyClosed = true;
    if (reconnectTimer != null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws) {
      try { ws.close(); } catch {}
      ws = null;
    }
    connected = false;
  }

  function reconnect(): void {
    intentionallyClosed = false;

    if (reconnectTimer != null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (ws) {
      try { ws.close(); } catch {}
      ws = null;
    }

    connected = false;
    if (currentGameId) void connect();
  }

  function setGameId(id: string | null): void {
    const next = id?.trim() || null
    if (next === currentGameId) return
    currentGameId = next
    reconnect()
  }

  function sendCommand(type: GameCommandType, payload: unknown = {}): Promise<WebGameState | null> {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('[WS] not connected, cannot send command:', type);
      return Promise.resolve(null);
    }

    const gid = currentGameId ?? 'ignored';
    if (gid === 'ignored') {
      console.warn('[WS] sendCommand without gameId (no active room yet):', type);
    }

    const requestId = `req-${Date.now()}-${++reqCounter}`;

    const env: GameEnvelope = {
      kind: 'command',
      type,
      gameId: gid,
      requestId,
      version: 1,
      payload,
    };

    const pid = opts.getPlayerId?.();
    if (pid && pid.trim()) env.playerId = pid.trim();

    return new Promise<WebGameState | null>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        if (pending.has(requestId)) {
          pending.delete(requestId);
          console.warn('[WS] command timed out:', type, requestId);
          resolve(null);
        }
      }, 10000);

      pending.set(requestId, {
        resolve: (state) => { clearTimeout(timeout); resolve(state); },
        reject: (err) => { clearTimeout(timeout); reject(err); },
      });

      try {
        ws!.send(JSON.stringify(env));
      } catch (err) {
        console.error('[WS] failed to send envelope:', err, env);
        clearTimeout(timeout);
        pending.delete(requestId);
        resolve(null);
      }
    });
  }

  function getState(): void { void sendCommand('GetState', {}); }

  function regularAttack(target: 'defender' | 'goalkeeper', index: number | null = null): void {
    void sendCommand('RegularAttack', { target, index: target === 'defender' ? index : null });
  }

  function doubleAttack(target: 'defender' | 'goalkeeper', index: number | null = null): void {
    void sendCommand('DoubleAttack', { target, index: target === 'defender' ? (index ?? 0) : 0 });
  }

  function boost(target: 'defender' | 'goalkeeper', index: number | null = null): void {
    void sendCommand('Boost', { target, index: target === 'defender' ? index : null });
  }

  function swap(index: number | string): void {
    void sendCommand('RegularSwap', { index: Number(index) });
  }

  function reverseSwap(): void { void sendCommand('ReverseSwap', {}); }
  function undo(): void { void sendCommand('Undo', {}); }
  function redo(): void { void sendCommand('Redo', {}); }
  function executeAI(aiAction: any): void { void sendCommand('ExecuteAI', aiAction); }
  function createGame(p1: string, p2: string): void { void sendCommand('CreateGame', { p1, p2 }); }
  function createGameWithAI(humanPlayer: string, aiName: string): void {
    void sendCommand('CreateGameWithAI', { humanPlayer, aiName });
  }
  function load(fileName: string): void { void sendCommand('LoadGame', { fileName }); }
  function save(): void { void sendCommand('SaveGame', {}); }
  function quit(): void { void sendCommand('QuitGame', {}); }

  if (currentGameId) void connect();

  return {
    isConnected,
    onMessage,
    offMessage,
    close,
    sendCommand,
    setGameId,
    reconnect,
    getState,
    regularAttack,
    doubleAttack,
    boost,
    swap,
    reverseSwap,
    undo,
    redo,
    executeAI,
    createGame,
    createGameWithAI,
    load,
    save,
    quit,
  };
}
