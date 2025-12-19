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

    <button
      class="btn-join-session"
      :disabled="session.status !== 'Waiting'"
      @click="$emit('join')"
      @mouseenter="$emit('hover')"
    >
      [ Join Session ]
    </button>

    <button
      v-if="currentSessionId"
      class="btn-leave-session"
      @click="$emit('leave')"
      @mouseenter="$emit('hover')"
    >
      [ Leave ]
    </button>
  </div>
</template>

<script setup lang="ts">
import DetailsHeader from './DetailsHeader.vue';
import type { SessionDto } from '@/types/SessionDtos';

defineProps<{
  session: SessionDto;
  currentSessionId: string | null;
}>();

defineEmits<{
  (e: 'join'): void;
  (e: 'leave'): void;
  (e: 'hover'): void;
}>();
</script>

<style scoped>
/* Header (local to this component) */
.details-header {
  text-align: center;
  color: #f3ca04;
  margin-bottom: 1.5rem;
  font-weight: bold;
  font-size: 1.4rem;
  text-shadow: 0 0 10px rgba(243, 202, 4, 0.8);
}

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
  color: #39FF14;
  font-weight: bold;
  min-width: 100px;
  text-shadow: 0 0 6px #39FF14;
}

.detail-value {
  color: #f3ca04;
  font-weight: 500;
  text-shadow: 0 0 6px rgba(243, 202, 4, 0.6);
}

/* Join button */
.btn-join-session {
  margin-top: 2rem;
  background: rgba(57, 255, 20, 0.1);
  border: 3px solid #39FF14;
  color: #39FF14;
  font-family: "Rajdhani", Arial, sans-serif;
  padding: 1rem 2rem;
  cursor: pointer;
  font-size: 1.3rem;
  font-weight: bold;
  transition: all 0.3s;
  align-self: center;
  border-radius: 10px;
  text-shadow: 0 0 10px #39FF14;
  box-shadow: 0 0 20px rgba(57, 255, 20, 0.3);
}

.btn-join-session:hover:enabled {
  background: rgba(57, 255, 20, 0.3);
  box-shadow: 0 0 30px rgba(57, 255, 20, 0.6);
  transform: translateY(-3px) scale(1.05);
}

.btn-join-session:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

/* Leave button (same look as old cancel style) */
.btn-leave-session {
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
  min-width: 120px;
  align-self: center;
  text-shadow: 0 0 6px #ff0055;
}

.btn-leave-session:hover {
  background: rgba(255, 0, 85, 0.2);
  box-shadow: 0 0 20px rgba(255, 0, 85, 0.6);
  transform: translateY(-2px);
}
</style>
