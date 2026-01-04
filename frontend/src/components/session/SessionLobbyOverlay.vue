<template>
  <div class="lobby">
    <div v-if="loading" class="lobby-loading">Loading lobby…</div>

    <template v-else>
      <div class="lobby-row">
        <span class="lbl">Session:</span>
        <span class="val">{{ session?.name ?? sessionId }}</span>
      </div>

      <div class="lobby-row">
        <span class="lbl">Host:</span>
        <span class="val">{{ session?.hostName ?? '—' }}</span>
      </div>

      <div class="lobby-row">
        <span class="lbl">Players:</span>
        <span class="val">{{ session?.playerCount ?? 0 }}/2</span>
      </div>

      <div class="lobby-row">
        <span class="lbl">Status:</span>
        <span class="val" :class="{ full: isFull }">
          {{ session?.status ?? '—' }}
        </span>
      </div>

      <div class="invite">
        <div class="invite-code">
          <span class="lbl">Invite:</span>
          <code class="code">{{ sessionId }}</code>
        </div>

        <GameButton
          action="copy-invite"
          label="Copy"
          @command="copyInvite"
          @hover="forwardHover"
        />
      </div>

      <div v-if="!isFull" class="hint">Waiting for second player to join…</div>
      <div v-else-if="!isHost" class="hint">Waiting for host to start the game…</div>

      <div class="actions">
        <GameButton
          v-if="showStart"
          action="start-game"
          label="Start Game"
          :canExecute="canStart"
          :disabled="!canStart"
          tooltip="Waiting for second player…"
          @command="startGame"
          @hover="forwardHover"
        />

        <GameButton
          action="leave-lobby"
          label="Leave"
          @command="leave"
          @hover="forwardHover"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue'
import GameButton from '@/components/button/GameButton.vue'
import { useAppServices, setCurrentPlayerId } from '@/app/appServices'
import { useOverlayStore } from '@/stores/overlayStore'
import type { SessionDto } from '@/types/SessionDtos'
import { useGameContext } from '@/composables/useGameContext'
import { useGameCommands } from '@/composables/useGameCommands'
import { authState } from '@/auth/authState'
import { apiPostJSON } from '@/api/apiClient'

const props = defineProps<{
  sessionId: string
  onHover?: () => void
  onLeftLobby?: () => void
  onGameStarted?: () => void
}>()

const services = useAppServices()
const overlay = useOverlayStore()
const gameContext = useGameContext()
const gameCmds = useGameCommands()

const loading = ref(true)
const session = ref<SessionDto | null>(null)

const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase()
const myDisplay = computed(() => {
  return (
    authState.nickname?.trim() ||
    authState.email?.trim()?.split('@')[0] ||
    authState.userId?.slice(0, 8) ||
    ''
  )
})

const isHost = computed(() => norm(session.value?.hostName) === norm(myDisplay.value))

const isFull = computed(() => {
  const pc = Number(session.value?.playerCount ?? 0)
  const st = session.value?.status
  return pc >= 2 || st === 'Full' || st === 'Ready'
})

const showStart = computed(() => isHost.value)
const canStart = computed(
  () => isHost.value && (session.value?.status === 'Ready' || session.value?.status === 'Full'),
)

let timer: number | null = null
const starting = ref(false)
const navigatingToGame = ref(false)

function stopPolling() {
  if (timer) {
    window.clearInterval(timer)
    timer = null
  }
}

function forwardHover(payload: { action: string; hovering: boolean }) {
  if (payload.hovering) props.onHover?.()
}

function goToGame() {
  props.onGameStarted?.()
  overlay.hide()
}

async function startOnlineGameAndGo() {
  navigatingToGame.value = true
  stopPolling()

  services.gameContext.setMode('online')
  services.gameContext.setSessionId(props.sessionId)
  await services.gameContext.startOnline(props.sessionId)

  goToGame()
}

async function enterGameIfStarted(next: SessionDto | null) {
  if (!next) return
  if (next.status !== 'Started') return
  await startOnlineGameAndGo()
}

async function startGame() {
  if (starting.value || navigatingToGame.value) return
  starting.value = true

  try {
    stopPolling()
    await apiPostJSON(`/api/sessions/${encodeURIComponent(props.sessionId)}/start`, {})
    await startOnlineGameAndGo()
  } catch (e) {
    console.error(e)
    alert(String(e))
    navigatingToGame.value = false
    if (!timer) timer = window.setInterval(refresh, 2000)
  } finally {
    starting.value = false
  }
}

async function leave() {

  stopPolling()

  try {
    const res = await services.sessions.leaveSession(props.sessionId)
  } catch (e) {
    alert(String(e))
    if (!timer) timer = window.setInterval(refresh, 2000)
    return
  }
  setCurrentPlayerId('frontend')
  services.gameContext.clear()

  props.onLeftLobby?.()
  overlay.hide()
}

async function refresh() {
  if (navigatingToGame.value) return

  if (!authState.checked) {
    loading.value = true
    return
  }

  if (!authState.loggedIn) {
    loading.value = true
    return
  }

  try {
    const next = await services.sessions.getSession(props.sessionId)
    session.value = next
    await enterGameIfStarted(next)
  } catch (e) {
    console.warn('[Lobby] refresh failed (retrying):', e)
  } finally {
    loading.value = false
  }
}

async function copyInvite() {
  props.onHover?.()
  try {
    const url = `${window.location.origin}/#/playing-field?mode=online&sid=${encodeURIComponent(
      props.sessionId,
    )}`
    await navigator.clipboard.writeText(url)
  } catch {}
}

onMounted(async () => {
  await refresh()
  timer = window.setInterval(refresh, 2000)
})

onBeforeUnmount(() => {
  stopPolling()
})

</script>


<style scoped>

.lobby {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 0.25rem 0;
}

.lobby-loading {
  text-align: center;
  color: #7700ff;
  font-style: italic;
  text-shadow: 0 0 10px rgba(119, 0, 255, 0.5);
}

.lobby-row {
  display: flex;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(119, 0, 255, 0.1);
  border-radius: 8px;
  border-left: 3px solid #7700ff;
  align-items: center;
}

.lbl {
  color: #39ff14;
  font-weight: bold;
  min-width: 110px;
  text-shadow: 0 0 6px #39ff14;
}

.val {
  color: #f3ca04;
  font-weight: 500;
  text-shadow: 0 0 6px rgba(243, 202, 4, 0.6);
}

.val.full {
  color: #ff0055;
  text-shadow: 0 0 6px #ff0055;
}

.invite {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 8px;
  border: 1px solid rgba(119, 0, 255, 0.35);
}

.invite-code {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.code {
  color: #f3ca04;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(119, 0, 255, 0.6);
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
}

.hint {
  text-align: center;
  color: #39ff14;
  text-shadow: 0 0 6px #39ff14;
  opacity: 0.9;
  margin-top: 0.25rem;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 0.75rem;
}
</style>
