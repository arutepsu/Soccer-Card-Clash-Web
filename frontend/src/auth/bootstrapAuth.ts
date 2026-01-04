// src/auth/bootstrapAuth.ts
import { supabase } from '@/api/supabase'
import { authState } from '@/auth/authState'
import { createAuthApi } from '@/api/authApi'
import { AuthRequiredError } from '@/api/apiClient'

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function validateBackendMeWithRetry(auth = createAuthApi(), tries = 3): Promise<void> {
  for (let i = 0; i < tries; i++) {
    try {
      const me = await auth.me()
      if (me.loggedIn) {
        authState.setLoggedIn(me)
      } else {
        authState.setLoggedOut()
      }
      return
    } catch (e) {
      if (e instanceof AuthRequiredError) {
        authState.setLoggedOut()
        return
      }

      if (i < tries - 1) await sleep(300 * (i + 1))
    }
  }

  authState.checked = true
}

export async function bootstrapAuth(): Promise<void> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  if (!token) {
    authState.setLoggedOut()
    return
  }

  await validateBackendMeWithRetry(createAuthApi(), 3)
}
export function watchSupabaseAuth(): void {
  const auth = createAuthApi()

  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.access_token) {
      authState.setLoggedOut()
      return
    }

    try {
      const me = await auth.me()
      if (me.loggedIn) authState.setLoggedIn(me)
      else authState.setLoggedOut()
    } catch (e) {
      if (e instanceof AuthRequiredError) {
        authState.setLoggedOut()
        return
      }

      authState.checked = true
      setTimeout(async () => {
        try {
          const me = await auth.me()
          if (me.loggedIn) authState.setLoggedIn(me)
        } catch {}
      }, 1000)
    }
  })
}
