// src/auth/token.ts
import { supabase } from '@/api/supabase'

let cachedToken: string | null = null
let initPromise: Promise<void> | null = null

supabase.auth.onAuthStateChange((_event, session) => {
  cachedToken = session?.access_token ?? null
})

async function initOnce(): Promise<void> {
  if (initPromise) return initPromise

  initPromise = (async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error) console.warn('[token] initial getSession error', error.message)
    cachedToken = data.session?.access_token ?? null
  })().catch((e) => {
    console.error('[token] init failed', e)
  })

  return initPromise
}

export async function getAccessToken(): Promise<string | null> {
  await initOnce()
  return cachedToken
}
