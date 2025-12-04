<!-- frontend/src/components/PauseDialog.vue -->
<script setup lang="ts">
const props = defineProps<{
  onAction: (action: string) => void;
}>();

function act(name: string) {
  props.onAction(name);
}
</script>

<template>
  <div class="overlay-actions"
       style="display:flex;flex-direction:column;gap:12px;align-items:center;">
    <button class="gbtn" type="button" @click="act('resume')">Resume</button>
    <button class="gbtn" type="button" @click="act('undo')">Undo</button>
    <button class="gbtn" type="button" @click="act('redo')">Redo</button>
    <button class="gbtn" type="button" @click="act('save')">Save Game</button>
    <button class="gbtn" type="button" @click="act('restart')">Restart</button>
    <button class="gbtn" type="button" @click="act('mainmenu')">Main Menu</button>
  </div>
</template>
