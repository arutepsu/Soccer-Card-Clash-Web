// /assets/javascripts/api/serverPushClient.js
export function createServerPushClient() {
  let ws = null;
  let handlers = new Set();
  let connected = false;

  function connect() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${proto}://${location.host}/ws/game`;

    console.log('[WS] connecting to', wsUrl);
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      connected = true;
      console.log('[WS] connected');
    };

    ws.onclose = () => {
      connected = false;
      console.log('[WS] closed, reconnecting...');
      setTimeout(connect, 1000);
    };

    ws.onerror = (e) => {
      console.warn('[WS] error:', e);
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        handlers.forEach((h) => h(msg));
      } catch (err) {
        console.error('[WS] invalid JSON:', err, ev.data);
      }
    };
  }

  connect();

  function sendEnvelope(type, payload = {}, requestId = null) {
    if (!connected || !ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('[WS] not connected, cannot send:', type);
      return;
    }

    const env = {
      kind: 'command',
      type,
      gameId: 'ignored',
      requestId,
      payload,
    };

    ws.send(JSON.stringify(env));
  }

  return {
    isConnected() {
      return connected;
    },

    onMessage(handler) {
      handlers.add(handler);
    },
    offMessage(handler) {
      handlers.delete(handler);
    },

    // high-level API
    getState() {
      sendEnvelope('GetState', {}, 'state-req');
    },
    regularAttack(target, index = null) {
      sendEnvelope('RegularAttack', { target, index });
    },
    doubleAttack(index) {
      sendEnvelope('DoubleAttack', { index });
    },
    boost(target, index = null) {
      sendEnvelope('Boost', { target, index });
    },
    swap(index) {
      sendEnvelope('RegularSwap', { index });
    },
    reverseSwap() {
      sendEnvelope('ReverseSwap', {});
    },
    undo() {
      sendEnvelope('Undo', {});
    },
    redo() {
      sendEnvelope('Redo', {});
    },
    executeAI(aiAction) {
      sendEnvelope('ExecuteAI', aiAction);
    },
    createGame(p1, p2) {
      sendEnvelope('CreateGame', { p1, p2 });
    },
    createGameWithAI(humanPlayer, aiName) {
      sendEnvelope('CreateGameWithAI', { humanPlayer, aiName });
    },
    load(fileName) {
      sendEnvelope('LoadGame', { fileName });
    },
    save() {
      sendEnvelope('SaveGame', {});
    },
    quit() {
      sendEnvelope('QuitGame', {});
    }
  };
}
