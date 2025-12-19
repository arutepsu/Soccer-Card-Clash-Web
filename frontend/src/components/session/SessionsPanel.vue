<template>
  <div class="sessions-panel">
    <div class="sessions-header">
      <span>Sessions</span>
      <button class="btn-create" @click="$emit('openCreate')" @mouseenter="$emit('hover')">
        [ Create ]
      </button>
    </div>

    <div class="sessions-list">
      <SessionListItem
        v-for="s in sessions"
        :key="s.id"
        :session="s"
        :selected="selectedSessionId === s.id"
        @select="$emit('select', s.id)"
        @hover="$emit('hover')"
        @join="$emit('joinFromRow', s.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SessionDto } from '@/types/SessionDtos';
import SessionListItem from './SessionListItem.vue';

defineProps<{
  sessions: SessionDto[];
  selectedSessionId: string | null;
}>();

defineEmits<{
  (e: 'select', sessionId: string): void;
  (e: 'openCreate'): void;
  (e: 'hover'): void;
  (e: 'joinFromRow', sessionId: string): void;
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
