// frontend/src/api/sessionApi.ts
import type { WebGameState } from '@/types/WebGameState'
import type {
  SessionDto,
  CreateSessionRequestDto,
  JoinSessionRequestDto,
  SessionCreatedResponseDto,
  SessionJoinedResponseDto,
} from '@/types/SessionDtos'

export interface SessionApi {
  listSessions(): Promise<SessionDto[]>
  getSession(sessionId: string): Promise<SessionDto>

  createSession(req: CreateSessionRequestDto): Promise<SessionCreatedResponseDto>
  joinSession(sessionId: string, req: JoinSessionRequestDto): Promise<SessionJoinedResponseDto>

  leaveSession(sessionId: string): Promise<void>
  startSession(sessionId: string): Promise<WebGameState>

  getPlayerToken(sessionId: string): string | null
  clearPlayerToken(sessionId: string): void
}

interface CreateSessionApiOptions {
  getJSON: <T = unknown>(url: string) => Promise<T>
  postJSON: <T = unknown>(url: string, payload?: unknown) => Promise<T | null>
}

function keyForSid(sessionId: string): string {
  return `scc:playerToken:${sessionId}`
}

function safeTrim(x: unknown): string {
  return typeof x === 'string' ? x.trim() : ''
}

function writePlayerToken(sessionId: string, token: string) {
  const sid = safeTrim(sessionId)
  const t = safeTrim(token)
  if (!sid || !t) return
  try {
    localStorage.setItem(keyForSid(sid), t)
  } catch {}
}

function readPlayerToken(sessionId: string): string | null {
  const sid = safeTrim(sessionId)
  if (!sid) return null
  try {
    const t = localStorage.getItem(keyForSid(sid))
    return safeTrim(t) || null
  } catch {
    return null
  }
}

function clearPlayerToken(sessionId: string) {
  const sid = safeTrim(sessionId)
  if (!sid) return
  try {
    localStorage.removeItem(keyForSid(sid))
  } catch {}
}

export function createSessionApi(opts: CreateSessionApiOptions): SessionApi {
  const { getJSON, postJSON } = opts

  return {
    listSessions: () => getJSON<SessionDto[]>('/api/sessions'),

    getSession: (id: string) =>
      getJSON<SessionDto>(`/api/sessions/${encodeURIComponent(id)}`),

    createSession: async (req: CreateSessionRequestDto) => {
      const created = await postJSON<SessionCreatedResponseDto>('/api/sessions', req)
      if (!created) throw new Error('createSession returned null')

      writePlayerToken(created.sessionId, created.hostToken)

      return created
    },

    joinSession: async (sessionId: string, req: JoinSessionRequestDto) => {
      const res = await postJSON<SessionJoinedResponseDto>(
        `/api/sessions/${encodeURIComponent(sessionId)}/join`,
        req,
      )
      if (!res) throw new Error('joinSession returned null')

      writePlayerToken(res.sessionId ?? sessionId, res.playerToken)

      return res
    },

    leaveSession: async (sessionId: string) => {
      await postJSON(`/api/sessions/${encodeURIComponent(sessionId)}/leave`, {})

      clearPlayerToken(sessionId)
    },

    startSession: async (sessionId: string) => {
      const web = await postJSON<WebGameState>(
        `/api/sessions/${encodeURIComponent(sessionId)}/start`,
        {},
      )
      if (!web) throw new Error('startSession returned null')
      return web
    },

    getPlayerToken: (sessionId: string) => readPlayerToken(sessionId),
    clearPlayerToken: (sessionId: string) => clearPlayerToken(sessionId),
  }
}
