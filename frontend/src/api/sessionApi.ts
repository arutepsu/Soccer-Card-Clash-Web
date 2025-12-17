import type {
  SessionDto,
  CreateSessionRequestDto,
  JoinSessionRequestDto,
  SessionCreatedResponseDto,
  SessionJoinedResponseDto,
} from '@/types/SessionDtos';

export interface SessionApi {
  listSessions(): Promise<SessionDto[]>;
  getSession(sessionId: string): Promise<SessionDto>;

  createSession(req: CreateSessionRequestDto): Promise<SessionCreatedResponseDto>;
  joinSession(
    sessionId: string,
    req: JoinSessionRequestDto,
  ): Promise<SessionJoinedResponseDto>;

  leaveSession(sessionId: string): Promise<void>;
}

interface CreateSessionApiOptions {
  getJSON: <T = unknown>(url: string) => Promise<T>;
  postJSON: <T = unknown>(url: string, payload?: unknown) => Promise<T | null>;
}

export function createSessionApi(opts: CreateSessionApiOptions): SessionApi {
  const { getJSON, postJSON } = opts;

  return {
    listSessions: () => getJSON<SessionDto[]>('/api/sessions'),

    getSession: (id: string) =>
      getJSON<SessionDto>(`/api/sessions/${encodeURIComponent(id)}`),

    createSession: async (req: CreateSessionRequestDto) => {
      const created = await postJSON<SessionCreatedResponseDto>('/api/sessions', req);
      if (!created) throw new Error('createSession returned null');
      return created;
    },

    joinSession: async (sessionId: string, req: JoinSessionRequestDto) => {
      const res = await postJSON<SessionJoinedResponseDto>(
        `/api/sessions/${encodeURIComponent(sessionId)}/join`,
        req,
      );
      if (!res) throw new Error('joinSession returned null');
      return res;
    },

    leaveSession: async (sessionId: string) => {
      await postJSON(`/api/sessions/${encodeURIComponent(sessionId)}/leave`, {});
    },
  };
}
