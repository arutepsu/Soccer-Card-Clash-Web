function unwrapToState(msg) {
  if (!msg) return msg;
  if (msg.state) return msg.state;
  if (msg.payload && msg.payload.state) return msg.payload.state;
  return msg;
}

function getEventId(msg) {
  if (!msg) return null;
  if (msg.payload && typeof msg.payload.eventId === 'number') {
    return msg.payload.eventId;
  }
  if (typeof msg.eventId === 'number') {
    return msg.eventId;
  }
  return null;
}

/**
 * Creates a unified event stream for game updates.
 *
 * It chooses the best available transport:
 *  1) WebSocket push (if `push` is provided)
 *  2) SSE (/sseEvents) if EventSource is supported
 *  3) Comet long-poll (/cometEvents?lastEventId=...) as a last resort
 *
 * All transports call `onState(WebGameState)` with normalized state objects.
 */
export function createGameEventStream({ push } = {}) {

  function startWebSocketStream(onState) {
    if (!push || typeof push.onMessage !== 'function') return null;

    const handler = (msg) => {
      const state = unwrapToState(msg); // extract state
      if (state && onState) onState(state);
    };

    push.onMessage(handler);

    try {
      push.getState?.();
    } catch (e) {
      console.warn('[STREAM][WS] getState call failed:', e);
    }

    return {
      type: 'ws',
      close() {
        try {
          push.offMessage(handler);
        } catch (e) {
          console.warn('[STREAM][WS] offMessage failed:', e);
        }
      },
    };
  }

  function startSseStream(onState) {
    if (typeof window === 'undefined' || !window.EventSource) {
      console.warn('[STREAM][SSE] EventSource not available in this environment');
      return null;
    }

    const url = '/sseEvents';
    console.log('[STREAM][SSE] connecting to', url);

    const es = new EventSource(url, { withCredentials: true });

    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        const state = unwrapToState(msg);
        if (state && onState) onState(state);
      } catch (err) {
        console.warn('[STREAM][SSE] invalid JSON:', err, e.data);
      }
    };

    es.onerror = (e) => {
      console.warn('[STREAM][SSE] error:', e);
    };

    return {
      type: 'sse',
      close() {
        es.close();
      },
    };
  }

  function startCometStream(onState) {
    let aborted = false;
    let lastEventId = 0;

    console.log('[STREAM][COMET] starting long-poll loop');

    async function pollOnce() {
      const url = `/cometEvents?lastEventId=${encodeURIComponent(lastEventId)}`;
      try {
        const res = await fetch(url, {
          method: 'GET',
          credentials: 'same-origin',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!res.ok) {
          console.warn('[STREAM][COMET] response not OK:', res.status);
          return;
        }

        const text = await res.text();
        if (!text) return;

        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

        for (const line of lines) {
          try {
            const msg = JSON.parse(line);
            const state = unwrapToState(msg);
            if (state && onState) onState(state);

            const eid = getEventId(msg);
            if (typeof eid === 'number' && eid > lastEventId) {
              lastEventId = eid;
            }
          } catch (err) {
            console.warn('[STREAM][COMET] invalid JSON line:', err, line);
          }
        }
      } catch (err) {
        console.warn('[STREAM][COMET] poll failed:', err);
      }
    }

    async function loop() {
      while (!aborted) {
        await pollOnce();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    loop();

    return {
      type: 'comet',
      close() {
        aborted = true;
      },
    };
  }

  /**
   * Public: open the best available stream and return a handle:
   *
   *   const stream = eventStream.open((state) => { ... });
   *   // later:
   *   stream.close();
   */
  function open(onState) {
    // 1) WebSocket
    if (push && typeof push.onMessage === 'function') {
      console.log('[STREAM] using WebSocket via push client');
      const wsStream = startWebSocketStream(onState);
      if (wsStream) return wsStream;
    }

    // 2) Fallback to SSE
    const sseStream = startSseStream(onState);
    if (sseStream) {
      console.log('[STREAM] using SSE /sseEvents');
      return sseStream;
    }

    // 3) Fallback to Comet
    const cometStream = startCometStream(onState);
    if (cometStream) {
      console.log('[STREAM] using Comet /cometEvents');
      return cometStream;
    }

    console.warn('[STREAM] no streaming transport available; returning dummy handle');
    return {
      type: 'none',
      close() {},
    };
  }

  return { open };
}
