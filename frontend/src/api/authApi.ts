import { supabase } from '@/api/supabase'
import { getAccessToken } from '@/auth/token'

export interface AuthMeResponse {
  loggedIn: boolean
  userId?: string
  email?: string | null
  nickname?: string | null
}

export interface AuthApi {
  me(): Promise<AuthMeResponse>
  loginEmail(email: string, password: string): Promise<void>
  loginGitHub(): Promise<void>
  logout(): Promise<void>
  updateNickname(nickname: string): Promise<{ ok: boolean; nickname: string }>
}

export function createAuthApi(): AuthApi {
  async function me(): Promise<AuthMeResponse> {
    const token = await getAccessToken()
    if (!token) return { loggedIn: false }

    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      return { loggedIn: false }
    }
    return res.json()
  }

  async function loginEmail(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  async function loginGitHub(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/web/` },
    })
    if (error) throw new Error(error.message)
  }

  async function updateNickname(nickname: string) {
    const token = await getAccessToken()
    if (!token) throw new Error('Not logged in')

    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nickname }),
    })

    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.error ?? `Update nickname failed: ${res.status}`)
    return body
  }

  async function logout(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
      
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  }

  return { me, loginEmail, loginGitHub, logout, updateNickname }
}
