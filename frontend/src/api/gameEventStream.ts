import type { WebGameState } from '../types/WebGameState';

export interface StreamHandle {
  type: 'sse' | 'comet' | 'none';
  close(): void;
}

export interface StreamClient {
  open(onState: (state: WebGameState) => void): StreamHandle;
}

function unwrapToState(msg: any): WebGameState | null {
  if (!msg) return null;
  if (msg.state) return msg.state as WebGameState;
  if (msg.payload && msg.payload.state) return msg.payload.state as WebGameState;
  return null;
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

// frontend/src/api/gameEventStream.ts (or wherever createGameEventStream is)
export function createGameEventStream(): StreamClient {
  function startSseStream(
    onState: (state: WebGameState) => void,
    onFatalError: () => void,
  ): StreamHandle | null {
    if (typeof window === 'undefined' || !window.EventSource) {
      console.warn('[STREAM][SSE] EventSource not available');
      return null;
    }

    // ✅ FIX: match backend route
    const url = '/api/stream/sse';
    console.log('[STREAM][SSE] connecting to', url);

    // ✅ Keep this (needed for sid cookie)
    const es = new EventSource(url, { withCredentials: true });

    let closed = false;
    let gotAnyMessage = false;

    es.onmessage = (e: MessageEvent<string>) => {
      gotAnyMessage = true;
      try {
        const msg = JSON.parse(e.data);
        const state = unwrapToState(msg);
        if (state) onState(state);
      } catch (err) {
        console.warn('[STREAM][SSE] invalid JSON:', err, e.data);
      }
    };

    es.onerror = (e) => {
      console.warn('[STREAM][SSE] error:', e);
      if (es.readyState === EventSource.CLOSED && !closed) {
        closed = true;
        es.close();
        if (!gotAnyMessage) onFatalError();
      }
    };

    return {
      type: 'sse',
      close() {
        closed = true;
        es.close();
      },
    };
  }

  function startCometStream(onState: (state: WebGameState) => void): StreamHandle {
    let aborted = false;
    let lastEventId = 0;
    let consecutiveErrors = 0;

    console.log('[STREAM][COMET] starting long-poll loop');

    async function pollOnce() {
      if (aborted) return;

      const url = `/api/stream/comet?lastEventId=${encodeURIComponent(lastEventId)}`;

      try {
        const res = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });

        if (!res.ok) {
          console.warn('[STREAM][COMET] response not OK:', res.status);
          consecutiveErrors += 1;
          if (res.status === 404 || consecutiveErrors >= 5) aborted = true;
          return;
        }

        consecutiveErrors = 0;

        const text = await res.text();
        if (!text) return;

        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

        for (const line of lines) {
          try {
            const msg = JSON.parse(line);
            const state = unwrapToState(msg);
            if (state) onState(state);

            const eid = getEventId(msg);
            if (typeof eid === 'number' && eid > lastEventId) lastEventId = eid;
          } catch (err) {
            console.warn('[STREAM][COMET] invalid JSON line:', err, line);
          }
        }
      } catch (err) {
        console.warn('[STREAM][COMET] poll failed:', err);
        consecutiveErrors += 1;
        if (consecutiveErrors >= 5) aborted = true;
      }
    }

    (async function loop() {
      while (!aborted) {
        await pollOnce();
        if (!aborted) await new Promise((r) => setTimeout(r, 1000));
      }
    })();

    return { type: 'comet', close() { aborted = true; } };
  }

  function open(onState: (state: WebGameState) => void): StreamHandle {
    const startComet = () => {
      const h = startCometStream(onState);
      console.log('[STREAM] using Comet /api/stream/comet');
      return h;
    };

    const sse = startSseStream(onState, () => { /* fallback */ });
    if (sse) {
      console.log('[STREAM] using SSE /api/stream/sse');
      return sse;
    }
    return startComet();
  }

  return { open };
}
