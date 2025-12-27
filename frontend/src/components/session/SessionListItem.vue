<template>
  <div
    class="session-item"
    :class="{ selected, full: session.status === 'Full' }"
    @click="$emit('select')"
    @mouseenter="$emit('hover')"
  >
    <span class="session-indicator">▸</span>
    <span class="session-name">{{ session.name }}</span>
    <span class="session-players">{{ session.playerCount }}/2</span>
    <span class="session-status">{{ session.status }}</span>

    <div class="session-action" @click.stop>
      <GameButton
        v-if="!isFull"
        action="join-session"
        label="Join"
        @command="$emit('join')"
        @hover="forwardHover"
      />
      <GameButton
        v-else
        action="full-session"
        label="Full"
        :disabled="true"
        :canExecute="false"
        @hover="forwardHover"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import GameButton from '@/components/button/GameButton.vue';
import type { SessionDto } from '@/types/SessionDtos';

const props = defineProps<{
  session: SessionDto;
  selected: boolean;
}>();

const emit = defineEmits<{
  (e: 'select'): void;
  (e: 'join'): void;
  (e: 'hover'): void;
}>();

const isFull = computed(() => {
  const pc = Number(props.session.playerCount ?? 0);
  const st = String(props.session.status ?? '');
  return pc >= 2 || st === 'Full';
});

function forwardHover(payload: { action: string; hovering: boolean }) {
  if (payload.hovering) emit('hover');
}
</script>

<style scoped>
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
  border-left: 5px solid #39ff14;
  box-shadow: inset 0 0 20px rgba(57, 255, 20, 0.2);
}

.session-item.full {
  opacity: 0.6;
}

.session-indicator {
  color: #39ff14;
  font-size: 1.2rem;
  text-shadow: 0 0 6px #39ff14;
}

.session-name {
  color: #39ff14;
  font-weight: bold;
  font-size: 1.1rem;
  text-shadow: 0 0 6px #39ff14;
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
  color: #39ff14;
  min-width: 80px;
  font-weight: bold;
  text-shadow: 0 0 6px #39ff14;
}

.session-item.full .session-status {
  color: #ff0055;
  text-shadow: 0 0 6px #ff0055;
}

.session-action {
  justify-self: end;
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

  .session-action {
    grid-column: 2;
    justify-self: start;
    margin-top: 0.5rem;
  }
}
</style>
