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
        <span class="val" :class="{ full: session?.status === 'Full' }">
          {{ session?.status ?? '—' }}
        </span>
      </div>

      <div class="invite">
        <div class="invite-code">
          <span class="lbl">Invite:</span>
          <code class="code">{{ sessionId }}</code>
        </div>

        <button class="btn-secondary" @click="copyInvite" @mouseenter="hover">
          [ Copy ]
        </button>
      </div>

      <div v-if="!isFull" class="hint">
        Waiting for second player to join…
      </div>


      <div v-else-if="!isHost" class="hint">
        Waiting for host to start the game…
      </div>

    <div class="actions">
        <button
          v-if="isFull && isHost"
          class="btn-start"
          @click="startGame"
          @mouseenter="hover"
        >
          [ Start Game ]
        </button>

        <button class="btn-leave" @click="leave" @mouseenter="hover">
          [ Leave ]
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useAppServices, setCurrentPlayerId } from '@/app/appServices';
import { useOverlayStore } from '@/stores/overlayStore';
import type { SessionDto } from '@/types/SessionDtos';
import { useGameContext } from '@/composables/useGameContext';
import { useGameCommands } from '@/composables/useGameCommands';

const props = defineProps<{
  sessionId: string;
  username: string;
  onHover?: () => void;
  onLeftLobby?: () => void;
}>();

const services = useAppServices();
const overlay = useOverlayStore();
const game = useGameContext();
const gameCmds = useGameCommands();

const loading = ref(true);
const session = ref<SessionDto | null>(null);

const isHost = computed(() => (session.value?.hostName ?? '') === props.username);
const isFull = computed(() => session.value?.playerCount === 2);

let timer: number | null = null;

function hover() {
  props.onHover?.();
}

async function enterGameIfStarted(next: SessionDto | null) {
  if (!next) return;
  if (next.status !== 'Started') return;

  if (timer) {
    window.clearInterval(timer);
    timer = null;
  }

  const web = await gameCmds.getState();
  game.setState(web);

  overlay.hide();
}

async function startGame() {
  hover();
  const web = await services.sessions.startSession(props.sessionId);

  game.setState(web);
  overlay.hide();
}

async function refresh() {
  try {
    const next = await services.sessions.getSession(props.sessionId);
    session.value = next;

    await enterGameIfStarted(next);
  } catch {
    props.onLeftLobby?.();
    overlay.hide();
  } finally {
    loading.value = false;
  }
}

async function leave() {
  hover();
  try {
    await services.sessions.leaveSession(props.sessionId);
  } finally {
    setCurrentPlayerId('frontend');
    props.onLeftLobby?.();
    overlay.hide();
    services.push.reconnect();
  }
}

async function copyInvite() {
  hover();
  try {
    await navigator.clipboard.writeText(props.sessionId);
  } catch {}
}

onMounted(async () => {
  await refresh();
  timer = window.setInterval(refresh, 2000);
});

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
});
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
  color: #39FF14;
  font-weight: bold;
  min-width: 110px;
  text-shadow: 0 0 6px #39FF14;
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
  color: #39FF14;
  text-shadow: 0 0 6px #39FF14;
  opacity: 0.9;
  margin-top: 0.25rem;
}

.actions {
  display: flex;
  justify-content: center;
  margin-top: 0.75rem;
}

.btn-secondary {
  background: transparent;
  border: 2px solid #39FF14;
  color: #39FF14;
  font-family: "Rajdhani", Arial, sans-serif;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.45rem 1.2rem;
  border-radius: 8px;
  font-weight: bold;
  text-shadow: 0 0 6px #39FF14;
  transition: all 0.3s;
}

.btn-secondary:hover {
  background: rgba(57, 255, 20, 0.2);
  box-shadow: 0 0 15px rgba(57, 255, 20, 0.6);
  transform: translateY(-2px);
}

.btn-leave {
  background: transparent;
  border: 3px solid #ff0055;
  color: #ff0055;
  font-family: "Rajdhani", Arial, sans-serif;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.8rem 2rem;
  transition: all 0.3s;
  border-radius: 8px;
  font-weight: bold;
  min-width: 140px;
  text-shadow: 0 0 6px #ff0055;
}

.btn-leave:hover {
  background: rgba(255, 0, 85, 0.2);
  box-shadow: 0 0 20px rgba(255, 0, 85, 0.6);
  transform: translateY(-2px);
}
.btn-start {
  background: rgba(57, 255, 20, 0.1);
  border: 3px solid #39FF14;
  color: #39FF14;
  font-family: "Rajdhani", Arial, sans-serif;
  padding: 0.9rem 2rem;
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: bold;
  transition: all 0.3s;
  border-radius: 10px;
  text-shadow: 0 0 10px #39FF14;
  box-shadow: 0 0 20px rgba(57, 255, 20, 0.3);
}

.btn-start:hover {
  background: rgba(57, 255, 20, 0.3);
  box-shadow: 0 0 30px rgba(57, 255, 20, 0.6);
  transform: translateY(-2px) scale(1.03);
}

</style>
