import type { WebGameState } from '../types/WebGameState';

let wsSessionUnavailable = false;

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
  playerId: string | null;
  requestId: string | null;

  // IMPORTANT: backend decoder reads fields from env.payload
  payload: unknown;
}

export type PushMessageHandler = (msg: any) => void;

export interface PushClient {
  isConnected(): boolean;
  onMessage(handler: PushMessageHandler): void;
  offMessage(handler: PushMessageHandler): void;
  close(): void;

  sendCommand(type: GameCommandType, payload?: unknown): Promise<WebGameState | null>;

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
  path?: string;
  reconnectDelayMs?: number;
  getPlayerId?: () => string | null;
}


/**
 * WebSocket-based push client.
 *
 * - Connects to backend /api/ws
 * - Sends command envelopes to the server
 * - Supports request/response via requestId
 */
export function createServerPushClient(
  opts: CreateServerPushClientOptions = {},
): PushClient {
  // FIX 1: correct backend route
  const { path = '/api/ws', reconnectDelayMs = 1000 } = opts;

  let ws: WebSocket | null = null;
  let connected = false;
  let reconnectTimer: number | null = null;
  let intentionallyClosed = false;

  const handlers = new Set<PushMessageHandler>();

  let reqCounter = 0;
  const pending = new Map<
    string,
    { resolve: (state: WebGameState | null) => void; reject: (err: unknown) => void }
  >();

  function buildWsUrl(): string {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${location.host}${path}`;
  }

  function scheduleReconnect(): void {
    if (intentionallyClosed) return;
    if (reconnectTimer != null) return;
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, reconnectDelayMs);
  }

  function connect(): void {
    const url = buildWsUrl();
    console.log('[WS] connecting to', url);

    try {
      ws = new WebSocket(url);
    } catch (err) {
      console.warn('[WS] failed to construct WebSocket:', err);
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      connected = true;
      wsSessionUnavailable = false;
      console.log('[WS] connected');
    };

    ws.onclose = (ev) => {
      connected = false;
      console.log('[WS] closed:', ev.code, ev.reason || '');
      if (!intentionallyClosed) {
        console.log('[WS] scheduling reconnect...');
        scheduleReconnect();
      }
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
            const errMsg = msg.payload?.message as string | undefined;

            if (errMsg && errMsg.startsWith('Session not found')) {
              console.warn('[WS] session does not exist for this sid; disabling WS for this tab');
              wsSessionUnavailable = true;
            }

            console.warn('[WS] command error payload:', msg.payload);
            entry.resolve(null);
          } else {
            entry.resolve(null);
          }
        }
      } catch (err) {
        console.warn('[WS] error handling response for requestId:', err);
      }

      handlers.forEach((h) => {
        try {
          h(msg);
        } catch (err) {
          console.error('[WS] handler threw:', err);
        }
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
      try {
        ws.close();
      } catch {
        // ignore
      }
      ws = null;
    }
    connected = false;
  }

  function reconnect(): void {
    intentionallyClosed = false;
    wsSessionUnavailable = false;

    if (reconnectTimer != null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (ws) {
      try {
        ws.close();
      } catch {
      }
      ws = null;
    }

    connected = false;
    connect();
  }

  function sendCommand(type: GameCommandType, payload: unknown = {}): Promise<WebGameState | null> {
    if (wsSessionUnavailable) return Promise.resolve(null);

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('[WS] not connected, cannot send command:', type);
      return Promise.resolve(null);
    }

    const requestId = `req-${Date.now()}-${++reqCounter}`;

    const env: GameEnvelope = {
      kind: 'command',
      type,
      gameId: 'ignored',
      playerId: opts.getPlayerId?.() ?? null,
      requestId,
      payload,
    };

    return new Promise<WebGameState | null>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        if (pending.has(requestId)) {
          pending.delete(requestId);
          console.warn('[WS] command timed out:', type, requestId);
          resolve(null);
        }
      }, 10000);

      pending.set(requestId, {
        resolve: (state) => {
          clearTimeout(timeout);
          resolve(state);
        },
        reject: (err) => {
          clearTimeout(timeout);
          reject(err);
        },
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

  function getState(): void {
    void sendCommand('GetState', {});
  }

  function regularAttack(target: 'defender' | 'goalkeeper', index: number | null = null): void {
    void sendCommand('RegularAttack', {
      target,
      index: target === 'defender' ? index : null,
    });
  }

  function doubleAttack(target: 'defender' | 'goalkeeper', index: number | null = null): void {
    void sendCommand('DoubleAttack', {
      target,
      index: target === 'defender' ? index ?? 0 : 0,
    });
  }

  function boost(target: 'defender' | 'goalkeeper', index: number | null = null): void {
    void sendCommand('Boost', {
      target,
      index: target === 'defender' ? index : null,
    });
  }

  function swap(index: number | string): void {
    void sendCommand('RegularSwap', { index: Number(index) });
  }

  function reverseSwap(): void {
    void sendCommand('ReverseSwap', {});
  }

  function undo(): void {
    void sendCommand('Undo', {});
  }

  function redo(): void {
    void sendCommand('Redo', {});
  }

  function executeAI(aiAction: any): void {
    void sendCommand('ExecuteAI', aiAction);
  }

  function createGame(p1: string, p2: string): void {
    void sendCommand('CreateGame', { p1, p2 });
  }

  function createGameWithAI(humanPlayer: string, aiName: string): void {
    void sendCommand('CreateGameWithAI', { humanPlayer, aiName });
  }

  function load(fileName: string): void {
    void sendCommand('LoadGame', { fileName });
  }

  function save(): void {
    void sendCommand('SaveGame', {});
  }

  function quit(): void {
    void sendCommand('QuitGame', {});
  }

  connect();

  return {
    isConnected,
    onMessage,
    offMessage,
    close,
    sendCommand,
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
