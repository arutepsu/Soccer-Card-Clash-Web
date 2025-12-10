<template>
  <div
    class="scene scene--sessionscreen is-active"
    aria-hidden="false"
    :style="sessionSceneStyle"
  >

    <div class="session-container">
      <h1 class="session-header">ONLINE MULTIPLAYER</h1>

      <div class="session-content">
        <!-- Sessions list -->
        <SessionList
          :sessions="sessions"
          :selected-session-id="selectedSessionId"
          @select="selectSession"
          @create="openCreateForm"
          @join="joinSession"
          @hover="handleMouseEnter"
        />

        <!-- Details / Create form -->
        <CreateSessionForm
          v-if="showCreateForm"
          v-model:session-name="newSessionName"
          v-model:session-mode="newSessionMode"
          :max-players="maxPlayers"
          @submit="submitCreate"
          @cancel="cancelCreate"
          @hover="handleMouseEnter"
        />

        <SessionDetails
          v-else
          :session-details="sessionDetails"
          @join="joinSession"
          @hover="handleMouseEnter"
        />
      </div>
    </div>

    <div class="info-label">Developed by Arutepsu</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { createSoundManager, type SoundManager } from '../utils/soundManager';
import bgSessions from '@/assets/images/frames/background1.jpg';
import SessionList from '../components/SessionList.vue';
import SessionDetails from '../components/SessionDetails.vue';
import CreateSessionForm from '../components/CreateSessionForm.vue';

interface Session {
  id: number;
  name: string;
  players: string;
  status: 'Waiting' | 'Full';
  host: string;
  mode: string;
}

const soundManager: SoundManager = createSoundManager({
  basePath: '/assets/sounds/',
});

const sessions = ref<Session[]>([
  { id: 1, name: "Alice's Room", players: '1/2', status: 'Waiting', host: 'Alice', mode: 'Standard' },
  { id: 2, name: "Bob's Lobby", players: '2/2', status: 'Full', host: 'Bob', mode: 'Standard' },
  { id: 3, name: 'FunTest123', players: '1/2', status: 'Waiting', host: 'FunTest123', mode: 'Standard' },
]);

const selectedSessionId = ref<number | null>(null);
const showCreateForm = ref(false);
const newSessionName = ref('');
const newSessionMode = ref<'Standard' | 'Quick' | 'Custom'>('Standard');
const maxPlayers = ref(2);

const sessionDetails = computed<Session | null>(() => {
  if (selectedSessionId.value == null) return null;
  return sessions.value.find((s) => s.id === selectedSessionId.value) ?? null;
});

onMounted(() => {
  soundManager.preload('hover', 'hover.wav');
  soundManager.preload('click', 'attack.wav');
});

function handleMouseEnter(): void {
  soundManager.play('hover', { volume: 0.8 });
}

function selectSession(sessionId: number): void {
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
  newSessionMode.value = 'Standard';
}

function submitCreate(): void {
  if (!newSessionName.value.trim()) return;

  soundManager.play('click', { volume: 0.6 });
  console.log('Creating session:', {
    name: newSessionName.value,
    mode: newSessionMode.value,
    maxPlayers: maxPlayers.value,
  });

  // TODO: later call backend API here

  showCreateForm.value = false;
  newSessionName.value = '';
}

function joinSession(): void {
  if (selectedSessionId.value == null) return;

  soundManager.play('click', { volume: 0.6 });
  console.log('Joining session:', selectedSessionId.value);

  // TODO: later navigate / call backend join endpoint
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

