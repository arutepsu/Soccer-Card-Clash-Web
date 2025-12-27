<template>
  <div class="sessions-panel">
    <div class="sessions-header">
      <span>Sessions</span>

      <GameButton
        action="open-create-session"
        label="Create"
        @command="$emit('openCreate')"
        @hover="forwardHover"
      />
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
import GameButton from '@/components/button/GameButton.vue';

defineProps<{
  sessions: SessionDto[];
  selectedSessionId: string | null;
}>();

const emit = defineEmits<{
  (e: 'select', sessionId: string): void;
  (e: 'openCreate'): void;
  (e: 'hover'): void;
  (e: 'joinFromRow', sessionId: string): void;
}>();

function forwardHover(payload: { action: string; hovering: boolean }) {
  if (payload.hovering) emit('hover');
}
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
  color: #39ff14;
  font-size: 1.2rem;
  text-shadow: 0 0 6px #39ff14;
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
  background: #39ff14;
  box-shadow: 0 0 10px rgba(57, 255, 20, 0.6);
}

@media (max-width: 768px) {
  .sessions-header {
    font-size: 1rem;
    padding: 0.75rem 1rem;
  }
}
</style>
