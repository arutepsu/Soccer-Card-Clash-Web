<script setup lang="ts">
import AppOverlay from './components/AppOverlay.vue';
</script>

<template>
  <div class="app-root">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <AppOverlay />
  </div>
</template>

<style scoped>
.app-root {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 250ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
