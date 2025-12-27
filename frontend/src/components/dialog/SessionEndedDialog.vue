<script setup lang="ts">
import GameButton from '../button/GameButton.vue';

const props = defineProps<{
  leftPlayerName?: string;
  onAction: (action: 'mainmenu') => void;
}>();

function onCommand(payload: { action: 'mainmenu' }) {
  props.onAction(payload.action);
}
</script>

<template>
  <div
    class="overlay-actions"
    style="display:flex;flex-direction:column;gap:14px;align-items:center;"
  >
    <div
      style="
        text-align:center;
        font-size:14px;
        line-height:1.4;
        color:rgba(255,255,255,0.85);
      "
    >
      <strong>{{ leftPlayerName || 'The other player' }}</strong>
      left the game.
      <br />
      The session has ended.
    </div>

    <GameButton
      action="mainmenu"
      label="Go to Main Menu"
      @command="onCommand"
    />
  </div>
</template>
