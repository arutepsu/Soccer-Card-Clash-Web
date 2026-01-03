// src/auth/bootstrapAuth.ts
import { supabase } from '@/api/supabase'
import { authState } from '@/auth/authState'
import { createAuthApi } from '@/api/authApi'

export async function bootstrapAuth(): Promise<void> {
  // 1) Let supabase restore persisted session (localStorage)
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  if (!token) {
    authState.setLoggedOut()
    return
  }

  // 2) Validate with backend + fetch user info
  try {
    const auth = createAuthApi()
    const me = await auth.me()
    if (me.loggedIn) authState.setLoggedIn(me)
    else authState.setLoggedOut()
  } catch {
    authState.setLoggedOut()
  }
}
