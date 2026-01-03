<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/api/supabase'
import { useAppServices } from '@/app/appServices'
import { authState } from '@/auth/authState'

const router = useRouter()
const { auth } = useAppServices()

function readTokensFromDoubleHash(): { access_token: string; refresh_token: string } | null {
  // "#/auth/callback#access_token=...&refresh_token=..."
  const full = window.location.hash
  const idx = full.indexOf('#access_token=')
  if (idx === -1) return null

  const params = new URLSearchParams(full.slice(idx + 1))
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  if (!access_token || !refresh_token) return null

  return { access_token, refresh_token }
}

onMounted(async () => {
  try {
    // 1) Create session from the second hash (needed with hash routing)
    const tokens = readTokensFromDoubleHash()
    if (tokens) {
      const { error } = await supabase.auth.setSession(tokens)
      if (error) throw error

      // optional but smart: remove tokens from URL
      window.location.hash = '#/auth/callback'
    }

    // 2) Now session should exist
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) {
      authState.setLoggedOut()
      await router.replace({ name: 'Login' })
      return
    }

    // 3) Ask backend who we are
    const me = await auth.me()
    if (!me.loggedIn) {
      authState.setLoggedOut()
      await router.replace({ name: 'Login' })
      return
    }

    authState.setLoggedIn({
      userId: me.userId,
      nickname: me.nickname ?? null,
      email: me.email ?? null,
    })

    if (!me.nickname) {
      await router.replace({ name: 'ChooseNickname' })
    } else {
      await router.replace({ name: 'MainMenu' })
    }
  } catch (e) {
    console.error('[AuthCallback] failed', e)
    authState.setLoggedOut()
    await router.replace({ name: 'Login' })
  }
})
</script>

<template>
  <div class="scene">
    <p>Signing you in…</p>
  </div>
</template>
