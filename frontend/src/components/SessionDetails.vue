<template>
  <div class="session-details-panel">
    <div v-if="sessionDetails" class="details-content">
      <div class="details-header">— Session Details —</div>

      <div class="detail-row">
        <span class="detail-label">Selected:</span>
        <span class="detail-value">{{ sessionDetails.name }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Host:</span>
        <span class="detail-value">{{ sessionDetails.host }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Mode:</span>
        <span class="detail-value">{{ sessionDetails.mode }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Players:</span>
        <span class="detail-value">
          {{ sessionDetails.host }}, (waiting slot)
        </span>
      </div>

      <button
        class="btn-join-session"
        @click="$emit('join')"
        @mouseenter="$emit('hover')"
      >
        [ Join Session ]
      </button>
    </div>

    <div v-else class="details-empty">
      <div class="details-header">— Session Details —</div>
      Select a session to view details
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
  sessionDetails: Session | null;
}>();

defineEmits<{
  (e: 'join'): void;
  (e: 'hover'): void;
}>();
</script>

<style scoped>
.session-details-panel {
  padding: 2rem 1.5rem;
  min-height: 280px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 0 0 12px 12px;
}

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

.btn-join-session:hover {
  background: rgba(57, 255, 20, 0.3);
  box-shadow: 0 0 30px rgba(57, 255, 20, 0.6);
  transform: translateY(-3px) scale(1.05);
}

.details-empty {
  text-align: center;
  color: #7700ff;
  padding: 4rem 0;
  font-style: italic;
  font-size: 1.2rem;
  text-shadow: 0 0 10px rgba(119, 0, 255, 0.5);
}
</style>
