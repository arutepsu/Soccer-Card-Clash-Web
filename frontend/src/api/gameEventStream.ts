// frontend/src/api/gameEventStream.ts

export interface StreamHandle {
  type: 'sse' | 'comet' | 'none';
  close(): void;
}

export interface StreamClient {
  open(onState: (state: any) => void): StreamHandle;
}

type StateLike = any;

function unwrapToState(msg: any): StateLike {
  if (!msg) return msg;
  if (msg.state) return msg.state;
  if (msg.payload && msg.payload.state) return msg.payload.state;
  return msg;
}

function getEventId(msg: any): number | null {
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
 *  1) SSE (/sseEvents) if EventSource is supported
 *  2) Comet long-poll (/cometEvents?lastEventId=...) as a last resort
 *
 * All transports call `onState(WebGameState)` with normalized state objects.
 *
 * NOTE: WebSocket is *not* used here. WS is reserved for commands only.
 */
export function createGameEventStream(): StreamClient {
  function startSseStream(
    onState: (state: StateLike) => void,
  ): StreamHandle | null {
    if (typeof window === 'undefined' || !window.EventSource) {
      console.warn('[STREAM][SSE] EventSource not available in this environment');
      return null;
    }

    const url = '/sseEvents';
    console.log('[STREAM][SSE] connecting to', url);

    const es = new EventSource(url, { withCredentials: true });

    es.onmessage = (e: MessageEvent<string>) => {
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

  function startCometStream(onState: (state: StateLike) => void): StreamHandle {
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
            Accept: 'application/json',
          },
        });

        if (!res.ok) {
          console.warn('[STREAM][COMET] response not OK:', res.status);
          return;
        }

        const text = await res.text();
        if (!text) return;

        const lines = text
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);

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

    void loop();

    return {
      type: 'comet',
      close() {
        aborted = true;
      },
    };
  }

  function open(onState: (state: StateLike) => void): StreamHandle {
    // 1) SSE
    const sseStream = startSseStream(onState);
    if (sseStream) {
      console.log('[STREAM] using SSE /sseEvents');
      return sseStream;
    }

    // 2) Fallback to Comet
    const cometStream = startCometStream(onState);
    if (cometStream) {
      console.log('[STREAM] using Comet /cometEvents');
      return cometStream;
    }

    console.warn(
      '[STREAM] no streaming transport available; returning dummy handle',
    );
    return {
      type: 'none',
      close() {},
    };
  }

  return { open };
}
