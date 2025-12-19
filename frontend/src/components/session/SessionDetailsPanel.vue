<template>
  <div class="session-details-panel">
    <CreateSessionForm
      v-if="showCreateForm"
      :modelValue="newSessionName"
      @update:modelValue="$emit('update:newSessionName', $event)"
      @create="$emit('create')"
      @cancel="$emit('cancelCreate')"
      @hover="$emit('hover')"
    />

    <SessionDetails
      v-else-if="sessionDetails"
      :session="sessionDetails"
      :currentSessionId="currentSessionId"
      @join="$emit('join')"
      @leave="$emit('leave')"
      @hover="$emit('hover')"
    />

    <SessionDetailsEmpty v-else />
  </div>
</template>

<script setup lang="ts">
import type { SessionDto } from '@/types/SessionDtos';
import CreateSessionForm from './CreateSessionForm.vue';
import SessionDetails from './SessionDetails.vue';
import SessionDetailsEmpty from './SessionDetailsEmpty.vue';

defineProps<{
  showCreateForm: boolean;
  sessionDetails: SessionDto | null;
  currentSessionId: string | null;
  newSessionName: string;
}>();

defineEmits<{
  (e: 'update:newSessionName', v: string): void;
  (e: 'create'): void;
  (e: 'cancelCreate'): void;
  (e: 'join'): void;
  (e: 'leave'): void;
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
</style>
