// auth/authState.ts
import { reactive } from 'vue';

export const authState = reactive({
  checked: false,
  loggedIn: false,
  userId: null as string | null,
  nickname: null as string | null,
  email: null as string | null,

  setLoggedIn(payload: { userId?: string; nickname?: string | null; email?: string | null }) {
    this.checked = true
    this.loggedIn = true
    this.userId = payload.userId ?? null
    this.nickname = payload.nickname ?? null
    this.email = payload.email ?? null
  },

  setLoggedOut() {
    this.checked = true
    this.loggedIn = false
    this.userId = null
    this.nickname = null
    this.email = null
  },
})
