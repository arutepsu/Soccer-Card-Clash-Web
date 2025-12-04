// frontend/src/api/serverPushClient.ts
import type { WebGameState } from '../types/WebGameState';

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
  playerId: string;
  requestId: string | null;
  payload: unknown;
}

export type PushMessageHandler = (msg: any) => void;

export interface PushClient {
  isConnected(): boolean;
  onMessage(handler: PushMessageHandler): void;
  offMessage(handler: PushMessageHandler): void;
  close(): void;

  /** command with WS + response, used by GameApi */
  sendCommand(
    type: GameCommandType,
    payload?: unknown,
  ): Promise<WebGameState | null>;

  // Legacy helpers – convenience wrappers around sendCommand
  getState(): void;
  regularAttack(target: string, index?: number | null): void;
  doubleAttack(index: number | string): void;
  boost(target: string, index?: number | null): void;
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
 * - Sends command envelopes to the server
 * - Receives raw messages (e.g. envelopes or states) and forwards to handlers
 * - Supports request/response via requestId, returning WebGameState from commands
 */
export function createServerPushClient(
  opts: CreateServerPushClientOptions = {},
): PushClient {
  const { path = '/ws/game', reconnectDelayMs = 1000 } = opts;

  let ws: WebSocket | null = null;
  let connected = false;
  let reconnectTimer: number | null = null;
  let intentionallyClosed = false;

  const handlers = new Set<PushMessageHandler>();

  let reqCounter = 0;
  const pending = new Map<
    string,
    {
      resolve: (state: WebGameState | null) => void;
      reject: (err: unknown) => void;
    }
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
            // ✅ Normal success: resolve with WebGameState
            entry.resolve(msg.payload as WebGameState);
          } else if (msg.kind === 'error') {
            // 🔁 Domain / command error, NOT a transport failure:
            //    resolve(null) instead of rejecting, so GameApi
            //    can decide what to do (e.g., show error, no REST fallback).
            console.warn('[WS] command error payload:', msg.payload);
            entry.resolve(null);
          } else {
            // other message types: no specific state
            entry.resolve(null);
          }
        }
      } catch (err) {
        console.warn('[WS] error handling response for requestId:', err);
      }

      // Notify generic listeners (e.g. for debug or events)
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

  function sendCommand(
    type: GameCommandType,
    payload: unknown = {},
  ): Promise<WebGameState | null> {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('[WS] not connected, cannot send command:', type);
      // this is a real "no WS" case; GameApi will fall back to REST
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
        // treat as "no WS result"
        resolve(null);
      }
    });
  }

  // Convenience wrappers that just fire-and-forget
  function getState(): void {
    void sendCommand('GetState', {});
  }

  function regularAttack(target: string, index: number | string | null = null): void {
    const idx = index == null ? null : Number(index);
    void sendCommand('RegularAttack', { target, index: idx });
  }

  function doubleAttack(index: number | string): void {
    const idx = Number(index);
    void sendCommand('DoubleAttack', { index: idx });
  }

  function boost(target: string, index: number | string | null = null): void {
    const idx = index == null ? null : Number(index);
    void sendCommand('Boost', { target, index: idx });
  }

  function swap(index: number | string): void {
    const idx = Number(index);
    void sendCommand('RegularSwap', { index: idx });
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
