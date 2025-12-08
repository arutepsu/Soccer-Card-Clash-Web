<script setup lang="ts">
import FieldCard from '../card/FieldCard.vue';
import type { SlotLike } from '../../types/FieldCards';

const props = withDefaults(
  defineProps<{
    defenders: SlotLike[];
    goalkeeper: SlotLike | null;

    selectedDefenderIndex: number | null;
    goalkeeperSelected: boolean;

    defendersClickable?: boolean;
    goalkeeperClickable?: boolean;

    defendersAriaLabel?: string;
    goalkeeperAriaLabel?: string;
  }>(),
  {
    defenders: () => [],
    goalkeeper: null,
    selectedDefenderIndex: null,
    goalkeeperSelected: false,
    defendersClickable: true,
    goalkeeperClickable: true,
    defendersAriaLabel: 'Defenders',
    goalkeeperAriaLabel: 'Goalkeeper',
  },
);

const emit = defineEmits<{
  (e: 'select:defender', index: number): void;
  (e: 'select:goalkeeper'): void;
}>();

function isDefenderSelected(index: number): boolean {
  return props.selectedDefenderIndex === index;
}

function isGoalkeeperSelected(): boolean {
  return props.goalkeeperSelected;
}
</script>

<template>
  <div class="fieldcard-rows">
    <div
      class="defender-row"
      role="group"
      :aria-label="props.defendersAriaLabel"
    >
      <FieldCard
        v-for="(slot, index) in defenders"
        :key="(slot as any)?.id ?? index"
        :card="slot"
        :index="index"
        role="defender"
        :clickable="defendersClickable"
        :selected="isDefenderSelected(index)"
        @select="emit('select:defender', index)"
      />
    </div>

    <div
      class="goalkeeper-row"
      role="group"
      :aria-label="props.goalkeeperAriaLabel"
    >
      <FieldCard
        :card="goalkeeper"
        index="gk"
        role="goalkeeper"
        :clickable="goalkeeperClickable"
        :selected="isGoalkeeperSelected()"
        @select="emit('select:goalkeeper')"
      />
    </div>
  </div>
</template>

<style scoped>
.card-bar-frame {
  background: var(--frame-bg, rgba(0,0,0,.10));
  padding: 5px;
  border: 2px solid var(--frame-border, #fff);
  border-radius: 6px;
}

.defender-row,
.goalkeeper-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.defender-row { padding: 5px; }
.goalkeeper-row { padding: 10px; }


.player-label {
  font-family: "Rajdhani", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  font-size: 26px;
  color: var(--text-color);
  text-align: center;
  text-shadow:
    0 1px 0 rgba(0,0,0,0.30),
    0 0 8px var(--neon);
  margin: 4px 0 8px;
}

@media (max-width: 1024px) {
  .defender-row,
  .goalkeeper-row {
    gap: 8px;
  }

  .player-label {
    font-size: 22px;
  }
}

@media (max-width: 768px) {
  .card-bar-frame {
    padding: 4px;
  }

  .defender-row,
  .goalkeeper-row {
    gap: 6px;
    flex-wrap: wrap;
  }

  .defender-row { padding: 4px; }
  .goalkeeper-row { padding: 8px; }

  .player-label {
    font-size: 20px;
    margin: 3px 0 6px;
  }
}

@media (max-width: 480px) {
  .card-bar-frame {
    padding: 3px;
    border-width: 1px;
  }

  .defender-row,
  .goalkeeper-row {
    gap: 4px;
  }

  .defender-row { padding: 3px; }
  .goalkeeper-row { padding: 6px; }

  .player-label {
    font-size: 18px;
    margin: 2px 0 4px;
  }
}

@media (max-height: 600px) and (orientation: landscape) {
  .card-bar-frame {
    padding: 3px;
    border-width: 1px;
  }

  .defender-row,
  .goalkeeper-row {
    gap: 4px;
  }

  .defender-row { padding: 2px; }
  .goalkeeper-row { padding: 4px; }

  .player-label {
    font-size: 16px;
    margin: 2px 0 3px;
  }
}

@media (max-height: 400px) and (orientation: landscape) {
  .player-label { font-size: 14px; }
}
</style>