<template>
  <div class="details-header">
    <slot />
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.details-header {
  text-align: center;
  color: #f3ca04;
  margin-bottom: 1.5rem;
  font-weight: bold;
  font-size: 1.4rem;
  text-shadow: 0 0 10px rgba(243, 202, 4, 0.8);
}
</style>
