import type { WebGameState } from '../types/WebGameState';

export interface StreamHandle {
  type: 'sse' | 'comet' | 'none';
  close(): void;
}

export interface StreamClient {
  open(onState: (state: WebGameState) => void, sid?: string | null): StreamHandle;
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

export function createGameEventStream(): StreamClient {
  function startCometStream(onState: (state: WebGameState) => void, sid?: string | null): StreamHandle{
    let aborted = false;
    let lastEventId = 0;
    let consecutiveErrors = 0;

    console.log('[STREAM][COMET] starting long-poll loop');

    async function pollOnce() {
      if (aborted) return;

    const q = new URLSearchParams();
    if (sid) q.set('sid', sid);
    q.set('lastEventId', String(lastEventId));
    const url = `/api/stream/comet?${q.toString()}`;


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

  function startSseStream(
    onState: (state: WebGameState) => void,
    onFallback: () => void,
    sid?: string | null,
  ): StreamHandle | null {
    if (typeof window === 'undefined' || !window.EventSource) {
      console.warn('[STREAM][SSE] EventSource not available');
      return null;
    }

    const base = '/api/stream/sse';
    const url = sid ? `${base}?sid=${encodeURIComponent(sid)}` : base;

    console.log('[STREAM][SSE] connecting to', url);

    const es = new EventSource(url, { withCredentials: true });

    let closed = false;
    let gotAnyMessage = false;
    let opened = false;

    // If we don't get ANY message soon, fallback (covers CORS/auth/reject cases)
    const startupTimeout = window.setTimeout(() => {
      if (closed) return;
      if (gotAnyMessage) return;
      console.warn('[STREAM][SSE] no messages after 3s -> fallback to Comet');
      closed = true;
      try { es.close(); } catch {}
      onFallback();
    }, 3000);

    es.onopen = () => {
      opened = true;
      console.log('[STREAM][SSE] open');
    };

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
      // Many browsers report SSE failures as repeated "error" while still CONNECTING (readyState=0)
      console.warn('[STREAM][SSE] error:', e, 'readyState=', es.readyState);

      if (closed) return;

      // If it errors before any message, fallback quickly
      if (!gotAnyMessage && (!opened || es.readyState !== EventSource.OPEN)) {
        window.clearTimeout(startupTimeout);
        closed = true;
        try { es.close(); } catch {}
        onFallback();
      }
    };

    return {
      type: 'sse',
      close() {
        closed = true;
        window.clearTimeout(startupTimeout);
        es.close();
      },
    };
  }

  function open(onState: (state: WebGameState) => void, sid?: string | null): StreamHandle {
    let active: StreamHandle | null = null;

  const startComet = () => {
    if (active) return;
    active = startCometStream(onState, sid);
    console.log('[STREAM] using Comet /api/stream/comet');
  };

  const sse = startSseStream(onState, startComet, sid);

    if (sse) {
      active = sse;
      console.log('[STREAM] using SSE /api/stream/sse');
      return sse;
    }

    startComet();
    return active!;
  }

  return { open };
}
