import { supabase } from '@/api/supabase'
import { getAccessToken } from '@/auth/token'
import { apiGetJSON, apiFetch } from './apiClient'

export interface AuthMeResponse {
  loggedIn: boolean
  userId?: string
  email?: string | null
  nickname?: string | null
}

export interface SignupResult {
  needsEmailConfirmation: boolean
}

export interface AuthApi {
  me(): Promise<AuthMeResponse>
  loginEmail(email: string, password: string): Promise<void>
  signupEmail(email: string, password: string): Promise<SignupResult>
  loginGitHub(): Promise<void>
  logout(): Promise<void>
  updateNickname(nickname: string): Promise<{ ok: boolean; nickname: string }>
}

export function createAuthApi(): AuthApi {
async function me(): Promise<AuthMeResponse> {
  try {
    return await apiGetJSON<AuthMeResponse>('/api/auth/me')
  } catch {
    return { loggedIn: false }
  }
}


  async function loginEmail(email: string, password: string): Promise<void> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)

    if (!data.session?.access_token) {
      throw new Error("Login succeeded but no session/token returned (email not confirmed or session not persisted).")
    }
  }

  async function signupEmail(email: string, password: string): Promise<SignupResult> {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(error.message)

    const needsEmailConfirmation = !data.session?.access_token

    return { needsEmailConfirmation }
  }


  async function loginGitHub(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/#/auth/callback`,
      },
    })
    if (error) throw new Error(error.message)
  }


async function updateNickname(nickname: string) {
  const res = await apiFetch('/api/auth/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error ?? `Update nickname failed: ${res.status}`)
  return body
}


async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)

  await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
}

  return { me, loginEmail, signupEmail, loginGitHub, logout, updateNickname }
}
