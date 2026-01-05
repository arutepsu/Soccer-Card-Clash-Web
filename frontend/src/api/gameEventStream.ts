// frontend/src/api/gameEventStream.ts
import type { WebGameState } from '@/types/WebGameState'
import { getAccessToken } from '@/auth/token'
import { resolveHttpUrl } from '@/api/url'

export interface StreamHandle {
  type: 'sse' | 'comet' | 'ws' | 'none'
  close(): void
}

export interface StreamClient {
  open(onState: (state: WebGameState, meta?: any | null) => void, sid?: string | null): StreamHandle
}

export interface CreateGameEventStreamOptions {

  getAccessToken?: () => Promise<string | null>

  getPlayerToken?: (sid: string) => string | null

  cometPollMs?: number

  sseStartupTimeoutMs?: number
}

function playerTokenStorageKey(sid: string) {
  return `scc:playerToken:${sid}`
}

function defaultGetPlayerToken(sid: string): string | null {
  const s = (sid ?? '').trim()
  if (!s) return null
  try {
    const raw = localStorage.getItem(playerTokenStorageKey(s))
    const t = (raw ?? '').trim()
    return t ? t : null
  } catch {
    return null
  }
}

function withParam(url: string, key: string, value: string | null): string {
  const v = (value ?? '').trim()
  if (!v) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}${encodeURIComponent(key)}=${encodeURIComponent(v)}`
}

async function withAuthParams(
  url: string,
  sid: string,
  getToken: () => Promise<string | null>,
  getPlayerToken: (sid: string) => string | null,
): Promise<string> {
  const pt = getPlayerToken(sid)
  let out = withParam(url, 'playerToken', pt)

  const token = await getToken().catch(() => null)
  out = withParam(out, 'token', token)
  return out
}

function unwrapToMeta(msg: any): any | null {
  if (!msg) return null
  if (msg.kind === 'event' && msg.type === 'SessionEnded') {
    return {
      action: 'SessionEnded',
      leftPlayerName: msg.payload?.leftPlayerName ?? msg.leftPlayerName ?? null,
      reason: msg.payload?.reason ?? msg.reason ?? null,
    }
  }

  if (msg.meta) return msg.meta
  if (msg.kind === 'event' && msg.type === 'StateUpdated' && msg.meta) return msg.meta
  if (msg.payload?.meta) return msg.payload.meta
  return null
}

function unwrapToState(msg: any): WebGameState | null {
  if (!msg) return null
  if (msg.state) return msg.state as WebGameState

  if (msg.kind === 'event' && msg.type === 'StateUpdated' && msg.payload) {
    return msg.payload as WebGameState
  }
  if (msg.payload?.state) return msg.payload.state as WebGameState

  return null
}

function getEventId(msg: any): number | null {
  if (!msg) return null
  if (typeof msg.eventId === 'number') return msg.eventId
  if (typeof msg.payload?.eventId === 'number') return msg.payload.eventId
  return null
}

function storageKeyForSid(sid: string) {
  return `game:lastEventId:${sid}`
}

function readLastEventId(sid: string): number {
  const s = (sid ?? '').trim()
  if (!s) return 0
  try {
    const raw = localStorage.getItem(storageKeyForSid(s))
    const n = raw ? Number(raw) : 0
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

function writeLastEventId(sid: string, id: number) {
  const s = (sid ?? '').trim()
  if (!s) return
  if (!Number.isFinite(id) || id <= 0) return
  try {
    localStorage.setItem(storageKeyForSid(s), String(id))
  } catch {}
}

export function createGameEventStream(opts: CreateGameEventStreamOptions = {}): StreamClient {
  const getToken = opts.getAccessToken ?? getAccessToken
  const getPlayerToken = opts.getPlayerToken ?? defaultGetPlayerToken

  const cometPollMs = Number.isFinite(opts.cometPollMs) ? (opts.cometPollMs as number) : 1000
  const sseStartupTimeoutMs = Number.isFinite(opts.sseStartupTimeoutMs)
    ? (opts.sseStartupTimeoutMs as number)
    : 3000

  function startCometStream(onMsg: (msg: any) => void, sid?: string | null): StreamHandle {
    let aborted = false
    const s = (sid ?? '').trim()

    let lastEventId = readLastEventId(s)
    let consecutiveErrors = 0

    async function pollOnce() {
      if (aborted) return
      if (!s) return

      const q = new URLSearchParams()
      q.set('sid', s)
      q.set('lastEventId', String(lastEventId))

      let url = resolveHttpUrl(`/api/stream/comet?${q.toString()}`)
      url = await withAuthParams(url, s, getToken, getPlayerToken)

      try {
        const res = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        })

        if (!res.ok) {
          console.warn('[STREAM][COMET] response not OK:', res.status)
          consecutiveErrors += 1
          if (res.status === 401 || res.status === 403 || res.status === 404 || consecutiveErrors >= 5) aborted = true
          return
        }

        consecutiveErrors = 0

        const text = await res.text()
        if (!text) return

        const lines = text
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)

        for (const line of lines) {
          try {
            const msg = JSON.parse(line)
            onMsg(msg)

            const eid = getEventId(msg)
            if (typeof eid === 'number' && eid > lastEventId) {
              lastEventId = eid
              writeLastEventId(s, lastEventId)
            }
          } catch (err) {
            console.warn('[STREAM][COMET] invalid JSON line:', err, line)
          }
        }
      } catch (err) {
        console.warn('[STREAM][COMET] poll failed:', err)
        consecutiveErrors += 1
        if (consecutiveErrors >= 5) aborted = true
      }
    }

    ;(async function loop() {
      while (!aborted) {
        await pollOnce()
        if (!aborted) await new Promise((r) => setTimeout(r, cometPollMs))
      }
    })()

    return {
      type: 'comet',
      close() {
        aborted = true
        writeLastEventId(s, lastEventId)
      },
    }
  }

  async function startSseStream(
    onMsg: (msg: any) => void,
    onFallback: () => void,
    sid?: string | null,
  ): Promise<StreamHandle | null> {
    if (typeof window === 'undefined' || !window.EventSource) {
      console.warn('[STREAM][SSE] EventSource not available')
      return null
    }

    const s = (sid ?? '').trim()
    if (!s) return null

    const base = resolveHttpUrl('/api/stream/sse')
    const rawUrl = `${base}?sid=${encodeURIComponent(s)}`
    const url = await withAuthParams(rawUrl, s, getToken, getPlayerToken)
    const es = new EventSource(url, { withCredentials: true })

    let closed = false
    let gotAnyMessage = false
    let opened = false

    const startupTimeout = window.setTimeout(() => {
      if (closed) return
      if (gotAnyMessage) return
      console.warn('[STREAM][SSE] no messages after startup timeout -> fallback to Comet')
      closed = true
      try {
        es.close()
      } catch {}
      onFallback()
    }, sseStartupTimeoutMs)

    es.onopen = () => {
      opened = true
    }

    es.onmessage = (e: MessageEvent<string>) => {
      gotAnyMessage = true
      try {
        const msg = JSON.parse(e.data)

        const eid = Number((e as any).lastEventId || 0)
        if (Number.isFinite(eid) && eid > 0) {
          onMsg({ eventId: eid, ...msg })
        } else {
          onMsg(msg)
        }
      } catch (err) {
        console.warn('[STREAM][SSE] invalid JSON:', err, e.data)
      }
    }

    es.onerror = (e) => {
      console.warn('[STREAM][SSE] error:', e, 'readyState=', es.readyState)

      if (closed) return
      if (!gotAnyMessage && (!opened || es.readyState !== EventSource.OPEN)) {
        window.clearTimeout(startupTimeout)
        closed = true
        try {
          es.close()
        } catch {}
        onFallback()
      }
    }

    return {
      type: 'sse',
      close() {
        closed = true
        window.clearTimeout(startupTimeout)
        try {
          es.close()
        } catch {}
      },
    }
  }

  function open(onState: (state: WebGameState, meta?: any | null) => void, sid?: string | null): StreamHandle {
    const s = (sid ?? '').trim()
    if (!s) {
      console.warn('[STREAM] open() called without sid -> stream disabled')
      return { type: 'none', close() {} }
    }

    let active: StreamHandle | null = null
    let lastAppliedEventId = readLastEventId(s)
    let lastState: WebGameState | null = null

    const applyMsg = (msg: any) => {
      const eid = getEventId(msg)
      if (typeof eid === 'number') {
        if (eid <= lastAppliedEventId) return
        lastAppliedEventId = eid
        writeLastEventId(s, lastAppliedEventId)
      }

      const meta = unwrapToMeta(msg)
      const state = unwrapToState(msg)

      if (state) {
        lastState = state
        onState(state, meta)
        return
      }

      if (meta && lastState) {
        onState(lastState, meta)
      }
    }

    const startComet = () => {
      if (active?.type === 'comet') return
      if (active) {
        try {
          active.close()
        } catch {}
        active = null
      }
      active = startCometStream(applyMsg, s)
    }

    startComet()

    void (async () => {
      const sse = await startSseStream(applyMsg, startComet, s)
      if (!sse) return

      if (active?.type === 'comet') {
        try {
          active.close()
        } catch {}
      }
      active = sse
    })()

    return {
      get type() {
        return active?.type ?? 'none'
      },
      close() {
        writeLastEventId(s, lastAppliedEventId)
        try {
          active?.close()
        } catch {}
      },
    } as StreamHandle
  }

  return { open }
}

export function savePlayerTokenForSession(sid: string, playerToken: string) {
  const s = (sid ?? '').trim()
  const t = (playerToken ?? '').trim()
  if (!s || !t) return
  try {
    localStorage.setItem(`scc:playerToken:${s}`, t)
  } catch {}
}
