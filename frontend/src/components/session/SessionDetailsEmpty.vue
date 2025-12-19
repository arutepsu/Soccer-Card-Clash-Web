<template>
  <div class="details-empty">
    <DetailsHeader>— Session Details —</DetailsHeader>
    Select a session to view details
  </div>
</template>

<script setup lang="ts">
import DetailsHeader from './DetailsHeader.vue';
</script>

<style scoped>
.details-empty {
  text-align: center;
  color: #7700ff;
  padding: 4rem 0;
  font-style: italic;
  font-size: 1.2rem;
  text-shadow: 0 0 10px rgba(119, 0, 255, 0.5);
}
</style>
