export function createServerPushClient(opts = {}) {
  const {
    path = '/ws/game',
    reconnectDelayMs = 1000,
  } = opts;

  let ws = null;
  let connected = false;
  let reconnectTimer = null;
  let intentionallyClosed = false;

  const handlers = new Set();

  function buildWsUrl() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${location.host}${path}`;
  }

  function scheduleReconnect() {
    if (intentionallyClosed) return;
    if (reconnectTimer != null) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, reconnectDelayMs);
  }

  function connect() {
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

    //raw ws message - state
    ws.onmessage = (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch (err) {
        console.error('[WS] invalid JSON:', err, ev.data);
        return;
      }
      //forward to handler - no sending events
      handlers.forEach((h) => {
        try {
          h(msg);
        } catch (err) {
          console.error('[WS] handler threw:', err);
        }
      });
    };
  }

  function sendEnvelope(type, payload = {}, requestId = null) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('[WS] not connected, cannot send:', type);
      return;
    }

    /** @type {GameEnvelope} */
    const env = {
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

  function isConnected() {
    return connected && ws && ws.readyState === WebSocket.OPEN;
  }

  function onMessage(handler) {
    if (typeof handler !== 'function') return;
    handlers.add(handler);
  }

  function offMessage(handler) {
    handlers.delete(handler);
  }

  function close() {
    intentionallyClosed = true;
    if (reconnectTimer != null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws) {
      try {
        ws.close();
      } catch {}
      ws = null;
    }
    connected = false;
  }

  function getState() {
    sendEnvelope('GetState', {}, 'state-req');
  }

  function regularAttack(target, index = null) {
    sendEnvelope('RegularAttack', { target, index });
  }

  function doubleAttack(index) {
    sendEnvelope('DoubleAttack', { index });
  }

  function boost(target, index = null) {
    sendEnvelope('Boost', { target, index });
  }

  function swap(index) {
    sendEnvelope('RegularSwap', { index });
  }

  function reverseSwap() {
    sendEnvelope('ReverseSwap', {});
  }

  function undo() {
    sendEnvelope('Undo', {});
  }

  function redo() {
    sendEnvelope('Redo', {});
  }

  function executeAI(aiAction) {
    sendEnvelope('ExecuteAI', aiAction);
  }

  function createGame(p1, p2) {
    sendEnvelope('CreateGame', { p1, p2 });
  }

  function createGameWithAI(humanPlayer, aiName) {
    sendEnvelope('CreateGameWithAI', { humanPlayer, aiName });
  }

  function load(fileName) {
    sendEnvelope('LoadGame', { fileName });
  }

  function save() {
    sendEnvelope('SaveGame', {});
  }

  function quit() {
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