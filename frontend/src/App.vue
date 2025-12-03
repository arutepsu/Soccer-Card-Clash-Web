<!-- frontend/src/App.vue -->
<script setup lang="ts">
// no logic needed here (yet)
// global wiring is done in main.ts (router, appServices, globalRouterObserver)
</script>

<template>
  <div class="app-root">
    <!--
      This is where all route components render.
      The <transition> replaces the old WebSceneManager.fadeIn/fadeOut.
    -->
    <transition name="fade" mode="out-in">
      <router-view />
    </transition>
  </div>
</template>

<style scoped>
.app-root {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* simple cross-fade between routed views */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 250ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
