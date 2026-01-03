import { supabase } from '@/api/supabase'
import { getAccessToken } from '@/auth/token'

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
  const token = await getAccessToken()
  console.log('[me] token present?', !!token, token?.slice(0, 20))

  if (!token) return { loggedIn: false }

  const res = await fetch('/api/auth/me', {
    method: 'GET',
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
  })

  const text = await res.text()
  console.log('[me] status', res.status, 'body=', text)
  if (!res.ok) return { loggedIn: false }
  return JSON.parse(text)
}



  async function loginEmail(email: string, password: string): Promise<void> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)

    // IMPORTANT: make sure we really got a session
    if (!data.session?.access_token) {
      throw new Error("Login succeeded but no session/token returned (email not confirmed or session not persisted).")
    }
  }

  async function signupEmail(email: string, password: string): Promise<SignupResult> {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(error.message)

    console.log('[signup] data:', {
      user: data.user,
      session: data.session,
      emailConfirmedAt: data.user?.email_confirmed_at,
    })

    const needsEmailConfirmation = !data.session?.access_token
    console.log('[signup] needsEmailConfirmation =', needsEmailConfirmation)

    return { needsEmailConfirmation }
  }


  async function loginGitHub(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/web/#/auth/callback`,
      },
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

    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {})
  }

  return { me, loginEmail, signupEmail, loginGitHub, logout, updateNickname }
}
