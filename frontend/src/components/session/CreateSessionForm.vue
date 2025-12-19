<template>
  <div class="create-form">
    <DetailsHeader>Create a session</DetailsHeader>

    <div class="form-content">
      <div class="form-row">
        <label class="form-label">Session Name:</label>
        <input
          type="text"
          class="form-input"
          :value="modelValue"
          @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          placeholder="Enter session name"
          @mouseenter="$emit('hover')"
        />
      </div>

      <div class="form-row">
        <label class="form-label">Max Players:</label>
        <span class="form-value">2</span>
      </div>

      <div class="form-buttons">
        <button class="btn-form-action" @click="$emit('create')" @mouseenter="$emit('hover')">
          [ Create ]
        </button>
        <button class="btn-form-cancel" @click="$emit('cancel')" @mouseenter="$emit('hover')">
          [ Cancel ]
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DetailsHeader from './DetailsHeader.vue';

defineProps<{ modelValue: string }>();

defineEmits<{
  (e: 'update:modelValue', v: string): void;
  (e: 'create'): void;
  (e: 'cancel'): void;
  (e: 'hover'): void;
}>();
</script>
<style scoped>
/* Create Session Form */
.create-form {
  display: flex;
  flex-direction: column;
}

/* Reuse same visual header style as details */
.details-header {
  text-align: center;
  color: #f3ca04;
  margin-bottom: 1.5rem;
  font-weight: bold;
  font-size: 1.4rem;
  text-shadow: 0 0 10px rgba(243, 202, 4, 0.8);
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
  color: #39FF14;
  font-weight: bold;
  min-width: 130px;
  text-shadow: 0 0 6px #39FF14;
}

.form-input {
  flex: 1;
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid #7700ff;
  color: #f3ca04;
  font-family: "Rajdhani", Arial, sans-serif;
  padding: 0.6rem 1rem;
  font-size: 1.1rem;
  border-radius: 6px;
  transition: all 0.3s;
  font-weight: 500;
}

.form-input::placeholder {
  color: rgba(243, 202, 4, 0.5);
}

.form-input:focus {
  outline: none;
  border-color: #39FF14;
  box-shadow: 0 0 15px rgba(57, 255, 20, 0.4);
  background: rgba(0, 0, 0, 0.8);
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

/* Buttons */
.btn-form-action,
.btn-form-cancel {
  background: transparent;
  border: 3px solid;
  font-family: "Rajdhani", Arial, sans-serif;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.8rem 2rem;
  transition: all 0.3s;
  border-radius: 8px;
  font-weight: bold;
  min-width: 120px;
}

.btn-form-action {
  border-color: #39FF14;
  color: #39FF14;
  text-shadow: 0 0 6px #39FF14;
}

.btn-form-action:hover {
  background: rgba(57, 255, 20, 0.2);
  box-shadow: 0 0 20px rgba(57, 255, 20, 0.6);
  transform: translateY(-2px);
}

.btn-form-cancel {
  border-color: #ff0055;
  color: #ff0055;
  text-shadow: 0 0 6px #ff0055;
}

.btn-form-cancel:hover {
  background: rgba(255, 0, 85, 0.2);
  box-shadow: 0 0 20px rgba(255, 0, 85, 0.6);
  transform: translateY(-2px);
}
</style>
