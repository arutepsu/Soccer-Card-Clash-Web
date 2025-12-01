// frontend/src/api/serverPushClient.ts

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
  requestId: string | null;
  payload: unknown;
}

export type PushMessageHandler = (msg: any) => void;

export interface PushClient {
  isConnected(): boolean;
  onMessage(handler: PushMessageHandler): void;
  offMessage(handler: PushMessageHandler): void;
  close(): void;

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
}

/**
 * WebSocket-based push client.
 *
 * - Sends command envelopes to the server
 * - Receives raw messages (e.g. envelopes or states) and forwards to handlers
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

    // raw ws message - state / envelope
    ws.onmessage = (ev) => {
      let msg: any;
      try {
        msg = JSON.parse(ev.data);
      } catch (err) {
        console.error('[WS] invalid JSON:', err, ev.data);
        return;
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

  function sendEnvelope(
    type: GameCommandType,
    payload: unknown = {},
    requestId: string | null = null,
  ): void {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('[WS] not connected, cannot send:', type);
      return;
    }

    const env: GameEnvelope = {
      kind: 'command',
      type,
      gameId: 'ignored',
      requestId,
      payload,
    };

    try {
      ws.send(JSON.stringify(env));
    } catch (err) {
      console.error('[WS] failed to send envelope:', err, env);
    }
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

  function getState(): void {
    sendEnvelope('GetState', {}, 'state-req');
  }

  function regularAttack(target: string, index: number | string | null = null): void {
    const idx = index == null ? null : Number(index);
    sendEnvelope('RegularAttack', { target, index: idx });
  }

  function doubleAttack(index: number | string): void {
    const idx = Number(index);
    sendEnvelope('DoubleAttack', { index: idx });
  }

  function boost(target: string, index: number | string | null = null): void {
    const idx = index == null ? null : Number(index);
    sendEnvelope('Boost', { target, index: idx });
  }

  function swap(index: number | string): void {
    const idx = Number(index);
    sendEnvelope('RegularSwap', { index: idx });
  }

  function reverseSwap(): void {
    sendEnvelope('ReverseSwap', {});
  }

  function undo(): void {
    sendEnvelope('Undo', {});
  }

  function redo(): void {
    sendEnvelope('Redo', {});
  }

  function executeAI(aiAction: any): void {
    sendEnvelope('ExecuteAI', aiAction);
  }

  function createGame(p1: string, p2: string): void {
    sendEnvelope('CreateGame', { p1, p2 });
  }

  function createGameWithAI(humanPlayer: string, aiName: string): void {
    sendEnvelope('CreateGameWithAI', { humanPlayer, aiName });
  }

  function load(fileName: string): void {
    sendEnvelope('LoadGame', { fileName });
  }

  function save(): void {
    sendEnvelope('SaveGame', {});
  }

  function quit(): void {
    sendEnvelope('QuitGame', {});
  }

  connect();

  return {
    isConnected,
    onMessage,
    offMessage,
    close,
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
