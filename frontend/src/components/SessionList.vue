<template>
  <div class="sessions-panel">
    <div class="sessions-header">
      <span>Sessions</span>
      <button
        class="btn-create"
        @click="$emit('create')"
        @mouseenter="$emit('hover')"
      >
        [ Create ]
      </button>
    </div>

    <div class="sessions-list">
      <div
        v-for="session in sessions"
        :key="session.id"
        class="session-item"
        :class="{
          selected: selectedSessionId === session.id,
          full: session.status === 'Full'
        }"
        @click="$emit('select', session.id)"
        @mouseenter="$emit('hover')"
      >
        <span class="session-indicator">▸</span>
        <span class="session-name">{{ session.name }}</span>
        <span class="session-players">{{ session.players }}</span>
        <span class="session-status">{{ session.status }}</span>

        <button
          v-if="session.status === 'Waiting'"
          class="btn-join"
          @click.stop="$emit('select', session.id); $emit('join')"
          @mouseenter="$emit('hover')"
        >
          [ Join ]
        </button>
        <button
          v-else
          class="btn-full"
          disabled
        >
          [ Full ]
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Session {
  id: number;
  name: string;
  players: string;
  status: 'Waiting' | 'Full';
  host: string;
  mode: string;
}

defineProps<{
  sessions: Session[];
  selectedSessionId: number | null;
}>();

defineEmits<{
  (e: 'select', id: number): void;
  (e: 'create'): void;
  (e: 'join'): void;
  (e: 'hover'): void;
}>();
</script>

<style scoped>
.sessions-panel {
  border-bottom: 2px solid #7700ff;
}

.sessions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: rgba(119, 0, 255, 0.05);
  font-weight: bold;
  color: #39FF14;
  font-size: 1.2rem;
  text-shadow: 0 0 6px #39FF14;
}

.btn-create {
  background: transparent;
  border: 2px solid #39FF14;
  color: #39FF14;
  font-family: "Rajdhani", Arial, sans-serif;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0.5rem 1.5rem;
  transition: all 0.3s;
  border-radius: 8px;
  font-weight: bold;
  text-shadow: 0 0 6px #39FF14;
}

.btn-create:hover {
  background: rgba(57, 255, 20, 0.2);
  box-shadow: 0 0 15px rgba(57, 255, 20, 0.6);
  transform: translateY(-2px);
}

.sessions-list {
  max-height: 300px;
  overflow-y: auto;
}

.session-item {
  display: grid;
  grid-template-columns: auto 1fr auto auto auto;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(119, 0, 255, 0.3);
  cursor: pointer;
  transition: all 0.3s;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
}

.session-item:hover {
  background: rgba(119, 0, 255, 0.15);
  transform: translateX(5px);
}

.session-item.selected {
  background: rgba(119, 0, 255, 0.3);
  border-left: 5px solid #39FF14;
  box-shadow: inset 0 0 20px rgba(57, 255, 20, 0.2);
}

.session-item.full {
  opacity: 0.6;
}

.session-indicator {
  color: #39FF14;
  font-size: 1.2rem;
  text-shadow: 0 0 6px #39FF14;
}

.session-name {
  color: #39FF14;
  font-weight: bold;
  font-size: 1.1rem;
  text-shadow: 0 0 6px #39FF14;
}

.session-item.full .session-name {
  color: #ff0055;
  text-shadow: 0 0 6px #ff0055;
}

.session-players {
  color: #f3ca04;
  font-weight: bold;
  text-shadow: 0 0 6px rgba(243, 202, 4, 0.6);
}

.session-item.full .session-players {
  color: #ff0055;
  text-shadow: 0 0 6px #ff0055;
}

.session-status {
  color: #39FF14;
  min-width: 80px;
  font-weight: bold;
  text-shadow: 0 0 6px #39FF14;
}

.session-item.full .session-status {
  color: #ff0055;
  text-shadow: 0 0 6px #ff0055;
}

.btn-join,
.btn-full {
  background: transparent;
  border: 2px solid #39FF14;
  color: #39FF14;
  font-family: "Rajdhani", Arial, sans-serif;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.4rem 1rem;
  transition: all 0.3s;
  min-width: 90px;
  border-radius: 6px;
  font-weight: bold;
  text-shadow: 0 0 6px #39FF14;
}

.btn-join:hover {
  background: rgba(57, 255, 20, 0.2);
  box-shadow: 0 0 15px rgba(57, 255, 20, 0.6);
  transform: scale(1.05);
}

.btn-full {
  border-color: #ff0055;
  color: #ff0055;
  cursor: not-allowed;
  opacity: 0.5;
  text-shadow: none;
}

.sessions-list::-webkit-scrollbar {
  width: 10px;
}

.sessions-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 5px;
}

.sessions-list::-webkit-scrollbar-thumb {
  background: #7700ff;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(119, 0, 255, 0.6);
}

.sessions-list::-webkit-scrollbar-thumb:hover {
  background: #39FF14;
  box-shadow: 0 0 10px rgba(57, 255, 20, 0.6);
}

@media (max-width: 768px) {
  .session-item {
    grid-template-columns: auto 1fr;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
  }
  
  .session-players,
  .session-status {
    grid-column: 2;
    font-size: 0.9rem;
  }
  
  .btn-join,
  .btn-full {
    grid-column: 2;
    margin-top: 0.5rem;
  }
  
  .sessions-header {
    font-size: 1rem;
    padding: 0.75rem 1rem;
  }
  
  .btn-create {
    font-size: 0.9rem;
    padding: 0.4rem 1rem;
  }
}
</style>
