<template>
  <div class="details-content">
    <DetailsHeader>— Session Details —</DetailsHeader>

    <div class="detail-row">
      <span class="detail-label">Selected:</span>
      <span class="detail-value">{{ session.name }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">Host:</span>
      <span class="detail-value">{{ session.hostName }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">Players:</span>
      <span class="detail-value">{{ session.playerCount }}/2</span>
    </div>

    <div class="detail-buttons" @click.stop>
      <GameButton
        action="join-session"
        label="Join Session"
        :canExecute="canJoin"
        :disabled="!canJoin"
        @command="$emit('join')"
        @hover="forwardHover"
      />

      <GameButton
        v-if="currentSessionId"
        action="leave-session"
        label="Leave"
        @command="$emit('leave')"
        @hover="forwardHover"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DetailsHeader from './DetailsHeader.vue';
import GameButton from '@/components/button/GameButton.vue';
import type { SessionDto } from '@/types/SessionDtos';

const props = defineProps<{
  session: SessionDto;
  currentSessionId: string | null;
}>();

const emit = defineEmits<{
  (e: 'join'): void;
  (e: 'leave'): void;
  (e: 'hover'): void;
}>();

const canJoin = computed(() => props.session.status === 'Waiting');

function forwardHover(payload: { action: string; hovering: boolean }) {
  if (payload.hovering) emit('hover');
}
</script>


<style scoped>
.details-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-row {
  display: flex;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(119, 0, 255, 0.1);
  border-radius: 8px;
  border-left: 3px solid #7700ff;
}

.detail-label {
  color: #39ff14;
  font-weight: bold;
  min-width: 100px;
  text-shadow: 0 0 6px #39ff14;
}

.detail-value {
  color: #f3ca04;
  font-weight: 500;
  text-shadow: 0 0 6px rgba(243, 202, 4, 0.6);
}

.detail-buttons {
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
}
</style>
