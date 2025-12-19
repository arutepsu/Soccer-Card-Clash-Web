<template>
  <teleport to="body">
    <div v-if="active" class="cinema">
      <div class="cinema__card">
        <div class="cinema__title">{{ message }}</div>
        <div v-if="subMessage" class="cinema__sub">{{ subMessage }}</div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
defineProps<{
  active: boolean;
  message: string;
  subMessage?: string;
}>();
</script>

<style scoped>
/* .cinema {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;


  background: rgba(0, 0, 0, 0.55);
} */

.cinema__card {
  padding: 18px 22px;
  border-radius: 14px;
  background: rgba(20, 20, 20, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.cinema__title {
  font-size: 18px;
  font-weight: 700;
  color: white;
}

.cinema__sub {
  margin-top: 6px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.75);
}
</style>
