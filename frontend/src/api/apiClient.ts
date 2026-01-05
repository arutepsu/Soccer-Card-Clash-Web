import { getAccessToken } from '@/auth/token'
import { authState } from '@/auth/authState'

export class AuthRequiredError extends Error {
  constructor(message = 'Authentication required') {
    super(message)
    this.name = 'AuthRequiredError'
  }
}

export class OfflineError extends Error {
  constructor(message = 'Offline') {
    super(message)
    this.name = 'OfflineError'
  }
}

function isAuthStatus(status: number) {
  return status === 401
}

function assertOnline(url: string) {
  if (!navigator.onLine) {
    throw new OfflineError(`Offline: ${url}`)
  }
}

function isOfflineFetchError(e: any): boolean {
  const msg = String(e?.message ?? e ?? '')
  return (
    !navigator.onLine ||
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('ERR_INTERNET_DISCONNECTED')
  )
}

import { resolveHttpUrl } from '@/api/url'
export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {

  const resolvedUrl = resolveHttpUrl(url)

  if (!navigator.onLine) {
    throw new OfflineError(`Offline: ${resolvedUrl}`)
  }

  let token: string | null = null
  try {
    token = await getAccessToken()
  } catch (e) {
    token = null
  }

  const headers = new Headers(init.headers ?? {})
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(resolvedUrl, {
    ...init,
    headers,
    credentials: 'include',
    // Optional but recommended for auth endpoints:
    cache: 'no-store',
  })

  if (res.status === 401) {
    const body = await res.text().catch(() => '')
    console.warn('[apiFetch] auth failed', resolvedUrl, res.status, body)
    if (token) authState.setLoggedOut()
    throw new AuthRequiredError(`Auth required for ${resolvedUrl}`)
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
