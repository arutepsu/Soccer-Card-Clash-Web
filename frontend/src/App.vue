<script setup lang="ts">
import AppOverlay from './components/overlay/AppOverlay.vue';
</script>

<template>
  <link rel="manifest" href="/manifest.json" />
  <div class="app-root">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <AppOverlay />
    <div style="position:fixed;bottom:10px;left:10px;z-index:99999;color:#fff;background:#222;padding:8px;border-radius:4px;">
      TEST: App.vue wird gerendert
    </div>
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
