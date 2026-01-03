// frontend/src/api/apiClient.ts
import { getAccessToken } from '@/auth/token'
import { authState } from '@/auth/authState'

export class AuthRequiredError extends Error {
  constructor(message = 'Authentication required') {
    super(message)
    this.name = 'AuthRequiredError'
  }
}

function isAuthStatus(status: number) {
  return status === 401 || status === 403
}

async function buildHeaders(base: HeadersInit = {}): Promise<HeadersInit> {
  const token = await getAccessToken()
  return {
    ...base,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function handleAuthFailure() {
  // This is the single place where we mark the app logged out on 401/403.
  // (You can also trigger a router redirect in main.ts using a watcher.)
  authState.setLoggedOut()
}

export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken()

  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  })

  if (isAuthStatus(res.status)) {
    // only hard-logout if we *thought* we were logged in
    if (token) authState.setLoggedOut()
    throw new AuthRequiredError(`Auth required for ${url}`)
  }

  return res
}


export async function apiGetJSON<T>(url: string, headers?: HeadersInit): Promise<T> {
  const res = await apiFetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(headers ?? {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${url} failed: ${res.status} — ${text}`)
  }

  return res.json() as Promise<T>
}

export async function apiPostJSON<T>(
  url: string,
  payload: unknown = {},
  headers?: HeadersInit,
): Promise<T | null> {
  const res = await apiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(headers ?? {}),
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${url} failed: ${res.status} — ${text}`)
  }

  const txt = await res.text().catch(() => '')
  if (!txt) return null

  try {
    return JSON.parse(txt) as T
  } catch {
    return txt as unknown as T
  }
}
