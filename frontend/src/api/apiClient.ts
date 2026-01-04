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
  return status === 401
}

export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {

  let token: string | null = null
  try {
    token = await getAccessToken()
  } catch (e) {
    console.error('[apiFetch] getAccessToken threw', e)
    token = null
  }

  const headers = new Headers(init.headers ?? {})
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(url, { ...init, headers, credentials: 'include' })

  if (isAuthStatus(res.status)) {
    const body = await res.text().catch(() => '')
    console.warn('[apiFetch] auth failed', url, res.status, body)

    if (token) authState.setLoggedOut()

    throw new AuthRequiredError(`Auth required for ${url}`)
  }


    return res
  }


export async function apiGetJSON<T>(url: string, headers?: HeadersInit): Promise<T> {
  const h = new Headers(headers ?? {})
  h.set('Accept', 'application/json')

  const res = await apiFetch(url, { method: 'GET', headers: h })

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
  const h = new Headers(headers ?? {})
  h.set('Accept', 'application/json')
  h.set('Content-Type', 'application/json')

  const res = await apiFetch(url, {
    method: 'POST',
    headers: h,
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
