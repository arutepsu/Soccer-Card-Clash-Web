<!-- frontend/src/views/SessionScreen.vue -->
<template>
  <div
    class="scene scene--sessionscreen is-active"
    aria-hidden="false"
    :style="sessionSceneStyle"
  >
    <div class="session-container">
      <h1 class="session-header">ONLINE MULTIPLAYER</h1>

      <div class="session-content">
        <SessionsPanel
          :sessions="sessions"
          :selectedSessionId="selectedSessionId"
          @select="selectSession"
          @openCreate="openCreateForm"
          @hover="handleMouseEnter"
          @joinFromRow="joinFromRow"
        />

        <SessionDetailsPanel
          :showCreateForm="showCreateForm"
          :sessionDetails="sessionDetails"
          :currentSessionId="currentSessionId"
          :newSessionName="newSessionName"
          @update:newSessionName="(v) => (newSessionName = v)"
          @create="submitCreate"
          @cancelCreate="cancelCreate"
          @join="joinSession"
          @leave="leaveSession"
          @hover="handleMouseEnter"
        />
      </div>
    </div>

    <div class="info-label">Developed by Arutepsu</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import bgSessions from '@/assets/images/frames/background10.jpg';
import { createSoundManager, type SoundManager } from '@/utils/soundManager';
import { useAppServices, setCurrentPlayerId } from '@/app/appServices';
import type { SessionDto } from '@/types/SessionDtos';

import SessionsPanel from '@/components/session/SessionsPanel.vue';
import SessionDetailsPanel from '@/components/session/SessionDetailsPanel.vue';

import { useOverlayStore } from '@/stores/overlayStore';
import SessionLobbyOverlay from '@/components/session/SessionLobbyOverlay.vue';
const services = useAppServices();

const overlay = useOverlayStore();

function openLobby(sessionId: string, username: string) {
  overlay.show({
    title: 'LOBBY',
    message: 'Invite a friend and wait until they join.',
    content: SessionLobbyOverlay,
    componentProps: {
      sessionId,
      username,
      onHover: handleMouseEnter,
      onLeftLobby: async () => {
        currentSessionId.value = null;
        selectedSessionId.value = null;
        await refreshSessions();
      },
    },
  });
}

const soundManager: SoundManager = createSoundManager({
  basePath: '/assets/sounds/',
});

const sessions = ref<SessionDto[]>([]);
const selectedSessionId = ref<string | null>(null);
const showCreateForm = ref(false);
const newSessionName = ref('');

const currentSessionId = ref<string | null>(null);

const sessionDetails = computed<SessionDto | null>(() => {
  if (!selectedSessionId.value) return null;
  return sessions.value.find((s) => s.id === selectedSessionId.value) ?? null;
});

onMounted(async () => {
  soundManager.preload('hover', 'hover.wav');
  soundManager.preload('click', 'attack.wav');
  await refreshSessions();
});

async function refreshSessions(): Promise<void> {
  sessions.value = await services.sessions.listSessions();
}

function handleMouseEnter(): void {
  soundManager.play('hover', { volume: 0.8 });
}

function selectSession(sessionId: string): void {
  soundManager.play('click', { volume: 0.6 });
  selectedSessionId.value = sessionId;
  showCreateForm.value = false;
}

function openCreateForm(): void {
  soundManager.play('click', { volume: 0.6 });
  showCreateForm.value = true;
  selectedSessionId.value = null;
}

function cancelCreate(): void {
  soundManager.play('click', { volume: 0.6 });
  showCreateForm.value = false;
  newSessionName.value = '';
}

async function submitCreate(): Promise<void> {
  const name = newSessionName.value.trim();
  if (!name) return;

  soundManager.play('click', { volume: 0.6 });

  try {
    const res = await services.sessions.createSession({
      hostName: 'host',
      name,
    });

    setCurrentPlayerId(res.hostToken);
    currentSessionId.value = res.sessionId;

    selectedSessionId.value = res.sessionId;
    showCreateForm.value = false;
    newSessionName.value = '';

    await refreshSessions();
    services.push.setGameId?.(res.sessionId);
    services.push.reconnect();
    openLobby(res.sessionId, 'host'); // real name later

  } catch (e) {
    console.error('[SessionScreen] createSession failed:', e);
  }
}

async function joinFromRow(sessionId: string): Promise<void> {
  selectSession(sessionId);
  await joinSession();
}

async function joinSession(): Promise<void> {
  const sid = selectedSessionId.value;
  if (!sid) return;

  const s = sessionDetails.value;
  if (!s || s.status !== 'Waiting') return;

  soundManager.play('click', { volume: 0.6 });

  const res = await services.sessions.joinSession(sid, {
    playerName: 'guest',
  });

  if (res.playerToken) setCurrentPlayerId(res.playerToken);
  currentSessionId.value = res.sessionId;

  await refreshSessions();
  services.push.setGameId?.(res.sessionId);
  services.push.reconnect();
  openLobby(res.sessionId, 'guest'); // real name later

}

async function leaveSession(): Promise<void> {
  const sid = currentSessionId.value;
  if (!sid) return;

  soundManager.play('click', { volume: 0.6 });

  await services.sessions.leaveSession(sid);

  currentSessionId.value = null;
  selectedSessionId.value = null;
  setCurrentPlayerId('frontend');

  await refreshSessions();
  services.push.setGameId?.(null);
  services.push.reconnect();
}

const sessionSceneStyle = {
  backgroundImage: `url(${bgSessions})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
};
</script>

<style scoped>
.scene--sessionscreen {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  font-family: "Rajdhani", Arial, sans-serif;
  overflow-y: auto;
  overflow-x: hidden;
}

.scene--sessionscreen.is-active {
  display: block;
}

.session-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  border: 3px solid #7700ff;
  background: rgba(0, 0, 0, 0.85);
  border-radius: 15px;
  box-shadow: 0 0 30px rgba(119, 0, 255, 0.6);
}

.session-header {
  text-align: center;
  font-size: 1.8rem;
  font-weight: bold;
  color: #f3ca04;
  padding: 1.5rem;
  margin: 0;
  border-bottom: 2px solid #7700ff;
  background: rgba(119, 0, 255, 0.1);
  text-shadow: 0 0 10px rgba(243, 202, 4, 0.8), 0 2px 4px rgba(0, 0, 0, 0.6);
  border-radius: 12px 12px 0 0;
}

.session-content {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.info-label {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  font-size: clamp(14px, 3vw, 20px);
  color: #39FF14;
  text-shadow: 0 0 6px #39FF14, 0 0 12px rgba(57,255,20,0.6);
  pointer-events: none;
  line-height: 1;
  text-align: center;
  padding: 0 10px;
}

/* Responsive */
@media (max-width: 768px) {
  .session-container {
    max-width: 95%;
    margin: 1rem;
  }

  .session-header {
    font-size: 1.4rem;
    padding: 1rem;
  }
}

@media (min-width: 769px) {
  .session-container {
    max-width: 900px;
  }
}
</style>
