import type { WebGameState } from '../types/WebGameState';

export interface StreamHandle {
  type: 'sse' | 'comet' | 'ws' | 'none';
  close(): void;
}

export interface StreamClient {
  open(onState: (state: WebGameState, meta?: any | null) => void, sid?: string | null): StreamHandle;
}

function unwrapToMeta(msg: any): any | null {
  if (!msg) return null;

  if (msg.meta) return msg.meta;

  if (msg.kind === 'event' && msg.type === 'StateUpdated' && msg.meta) return msg.meta;

  if (msg.payload?.meta) return msg.payload.meta;

  return null;
}

function unwrapToState(msg: any): WebGameState | null {
  if (!msg) return null;
  if (msg.state) return msg.state as WebGameState;

  if (msg.kind === 'event' && msg.type === 'StateUpdated' && msg.payload) {
    return msg.payload as WebGameState;
  }

  if (msg.payload && msg.payload.state) return msg.payload.state as WebGameState;
  return null;
}

function getEventId(msg: any): number | null {
  if (!msg) return null;
  if (typeof msg.eventId === 'number') return msg.eventId;
  if (typeof msg.payload?.eventId === 'number') return msg.payload.eventId;
  return null;
}

function storageKeyForSid(sid: string) {
  return `game:lastEventId:${sid}`;
}

function readLastEventId(sid: string): number {
  const s = (sid ?? '').trim();
  if (!s) return 0;
  try {
    const raw = localStorage.getItem(storageKeyForSid(s));
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeLastEventId(sid: string, id: number) {
  const s = (sid ?? '').trim();
  if (!s) return;
  if (!Number.isFinite(id) || id <= 0) return;
  try {
    localStorage.setItem(storageKeyForSid(s), String(id));
  } catch {}
}

export function createGameEventStream(): StreamClient {
  function startCometStream(
    onMsg: (msg: any) => void,
    sid?: string | null
  ): StreamHandle {
    let aborted = false;
    const s = (sid ?? '').trim();

    let lastEventId = readLastEventId(s);
    let consecutiveErrors = 0;

    async function pollOnce() {
      if (aborted) return;

      const q = new URLSearchParams();
      if (s) q.set('sid', s);
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

        const lines = text
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);

        for (const line of lines) {
          try {
            const msg = JSON.parse(line);
            onMsg(msg);

            const eid = getEventId(msg);
            if (typeof eid === 'number' && eid > lastEventId) {
              lastEventId = eid;
              writeLastEventId(s, lastEventId);
            }
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

    return {
      type: 'comet',
      close() {
        aborted = true;
        writeLastEventId(s, lastEventId);
      },
    };
  }

  function startSseStream(
    onMsg: (msg: any) => void,
    onFallback: () => void,
    sid?: string | null
  ): StreamHandle | null {
    if (typeof window === 'undefined' || !window.EventSource) {
      console.warn('[STREAM][SSE] EventSource not available');
      return null;
    }

    const s = (sid ?? '').trim();
    const base = '/api/stream/sse';
    const url = s ? `${base}?sid=${encodeURIComponent(s)}` : base;

    console.log('[STREAM][SSE] connecting to', url);

    const es = new EventSource(url, { withCredentials: true });

    let closed = false;
    let gotAnyMessage = false;
    let opened = false;

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

        const eid = Number((e as any).lastEventId || 0);
        if (Number.isFinite(eid) && eid > 0) {
          onMsg({ eventId: eid, ...msg });
        } else {
          onMsg(msg);
        }
      } catch (err) {
        console.warn('[STREAM][SSE] invalid JSON:', err, e.data);
      }
    };

    es.onerror = (e) => {
      console.warn('[STREAM][SSE] error:', e, 'readyState=', es.readyState);

      if (closed) return;

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

  function open(
    onState: (state: WebGameState, meta?: any | null) => void,
    sid?: string | null
  ): StreamHandle {
    const s = (sid ?? '').trim();
    if (!s) {
      console.warn('[STREAM] open() called without sid -> stream disabled');
      return { type: 'none', close() {} };
    }

    let active: StreamHandle | null = null;

    let lastAppliedEventId = readLastEventId(s);

    const applyMsg = (msg: any) => {
      const state = unwrapToState(msg);
      if (!state) return;

      const eid = getEventId(msg);
      if (typeof eid === 'number') {
        if (eid <= lastAppliedEventId) return;
        lastAppliedEventId = eid;
        writeLastEventId(s, lastAppliedEventId);
      }

      const meta = unwrapToMeta(msg);
      onState(state, meta);
    };

    const startComet = () => {
      if (active?.type === 'comet') return;

      if (active) {
        try { active.close(); } catch {}
        active = null;
      }

      active = startCometStream(applyMsg, s);
      console.log('[STREAM] using Comet /api/stream/comet sid=', s);
    };

    const sse = startSseStream(applyMsg, startComet, s);
    if (sse) {
      active = sse;
      console.log('[STREAM] using SSE /api/stream/sse sid=', s);
      return {
        type: 'sse',
        close() {
          writeLastEventId(s, lastAppliedEventId);
          try { sse.close(); } catch {}
        },
      };
    }

    startComet();

    return {
      type: active!.type,
      close() {
        writeLastEventId(s, lastAppliedEventId);
        try { active?.close(); } catch {}
      },
    };
  }

  return { open };
}
