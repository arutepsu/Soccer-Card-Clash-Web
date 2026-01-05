// frontend/src/api/url.ts
function isAbsolute(url: string): boolean {
  return /^https?:\/\//i.test(url) || /^wss?:\/\//i.test(url)
}

function cleanBase(base: string): string {
  return base.replace(/\/+$/, '')
}

/**
 * For REST/SSE/Comet:
 * - If url is absolute => keep
 * - If url starts with /api => prefix API_BASE_URL when set
 * - Else keep (static assets, etc.)
 */
export function resolveHttpUrl(url: string): string {
  if (isAbsolute(url)) return url
  if (!url.startsWith('/api/')) return url

  const base = (process.env.API_BASE_URL || '').trim()
  if (!base) return url

  return `${cleanBase(base)}${url}`
}

/**
 * Build WS base from API_BASE_URL if present, else from current location.
 * Returns like "ws://host" or "wss://host" (no path).
 */
export function resolveWsOrigin(): string {
  const base = (process.env.API_BASE_URL || '').trim()

  if (base) {
    // base like https://xxx or http://xxx
    const wsBase = base.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:')
    // ensure it's only origin (strip any path)
    try {
      const u = new URL(wsBase)
      return `${u.protocol}//${u.host}`
    } catch {
      // fallback: best effort
      return wsBase.replace(/\/+$/, '')
    }
  }

  // no base => dev/local: same origin
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${location.host}`
}
