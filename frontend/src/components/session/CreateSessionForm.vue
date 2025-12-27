<template>
  <div class="create-form">
    <DetailsHeader>Create a session</DetailsHeader>

    <div class="form-content">
      <div class="form-row">
        <label class="form-label">Session Name:</label>

        <div class="form-input-wrap" @mouseenter="$emit('hover')">
          <GlitchInput
            id="session-name"
            :modelValue="modelValue"
            label="SESSION_NAME"
            autocomplete="off"
            @update:modelValue="$emit('update:modelValue', $event)"
            @enter="$emit('create')"
          />
        </div>
      </div>

      <div class="form-row">
        <label class="form-label">Max Players:</label>
        <span class="form-value">2</span>
      </div>

      <div class="form-buttons">
        <GameButton
          action="create-session"
          label="Create"
          @command="$emit('create')"
          @hover="forwardHover"
        />

        <GameButton
          action="cancel-create-session"
          label="Cancel"
          @command="$emit('cancel')"
          @hover="forwardHover"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DetailsHeader from './DetailsHeader.vue';
import GameButton from '@/components/button/GameButton.vue';
import GlitchInput from '../input-field/GlitchInput.vue';

defineProps<{ modelValue: string }>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void;
  (e: 'create'): void;
  (e: 'cancel'): void;
  (e: 'hover'): void;
}>();

function forwardHover(payload: { action: string; hovering: boolean }) {
  if (payload.hovering) emit('hover');
}
</script>

<style scoped>
.create-form {
  display: flex;
  flex-direction: column;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem 0;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(119, 0, 255, 0.1);
  border-radius: 8px;
  border-left: 3px solid #7700ff;
}

.form-label {
  color: #39ff14;
  font-weight: bold;
  min-width: 130px;
  text-shadow: 0 0 6px #39ff14;
}

.form-input-wrap {
  flex: 1;
  min-width: 0;
}

.form-value {
  color: #ff0055;
  font-weight: bold;
  font-size: 1.2rem;
  text-shadow: 0 0 6px #ff0055;
}

.form-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}
</style>
