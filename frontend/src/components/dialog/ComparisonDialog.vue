<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import type { PlayerInfo, ComparisonCard } from '@/utils/playingField/comparisonDialogHandler';
import type { PlayerAvatarRegistry } from '@/utils/playerAvatarRegistry';
import PlayerAvatar from '../player/PlayerAvatar.vue';
import HandCard from '../card/HandCard.vue';
import FieldCard from '../card/FieldCard.vue';

type Variant = 'single' | 'double' | 'tie' | 'doubleTie';

const showMain = ref(false);
let mainTimeout: number | undefined;

const props = defineProps<{
  visible: boolean;
  variant: Variant;

  attacker: PlayerInfo;
  defender: PlayerInfo;

  attackingCard: ComparisonCard | null;
  defendingCard: ComparisonCard | null;

  attackingCard2?: ComparisonCard | null;

  extraAttackerCard?: ComparisonCard | null;
  extraDefenderCard?: ComparisonCard | null;

  attackSuccess?: boolean;
  avatarRegistry: PlayerAvatarRegistry;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const attackerName = computed(
  () => (props.attacker as any)?.name ?? 'Attacker',
);
const defenderName = computed(
  () => (props.defender as any)?.name ?? 'Defender',
);

const winnerSide = computed<'attacker' | 'defender'>(() => {
  return props.attackSuccess ? 'attacker' : 'defender';
});

const resultMessage = computed(() => {
  if (props.variant === 'tie' || props.variant === 'doubleTie') {
    return props.attackSuccess
      ? 'Attack successful after tie-break!'
      : 'Attack failed after tie-break!';
  }
  return props.attackSuccess ? 'Attack Successful!' : 'Attack Failed!';
});

const winnerMessage = computed(() => {
  const winnerName =
    winnerSide.value === 'attacker'
      ? attackerName.value
      : defenderName.value;
  return `🏆 Winner: ${winnerName}`;
});

function cardFrameClasses(side: 'attacker' | 'defender') {
  return {
    'cmp-card-frame': true,
    'cmp-card-frame--winner': winnerSide.value === side,
    'cmp-card-frame--loser': winnerSide.value !== side,
  };
}

const showWinner = ref(false);
let winnerTimeout: number | undefined;

function scheduleWinnerReveal() {
  showWinner.value = false;
  if (winnerTimeout !== undefined) {
    clearTimeout(winnerTimeout);
    winnerTimeout = undefined;
  }

  if (!props.visible) return;

  winnerTimeout = window.setTimeout(() => {
    showWinner.value = true;
  }, 1500);
}

watch(
  () => props.visible,
  (vis) => {
    if (vis) {
      showMain.value = false;
      showWinner.value = false;

      mainTimeout = window.setTimeout(() => {
      showMain.value = true;
      }, 500);

      scheduleWinnerReveal();

    } else {
      showMain.value = false;
      showWinner.value = false;

      if (mainTimeout !== undefined) clearTimeout(mainTimeout);
      if (winnerTimeout !== undefined) clearTimeout(winnerTimeout);
    }
  },
  { immediate: true },
);


onBeforeUnmount(() => {
  if (mainTimeout !== undefined) clearTimeout(mainTimeout);
  if (winnerTimeout !== undefined) clearTimeout(winnerTimeout);
});

</script>
<template>
  <transition name="cmp-fade">
    <div v-if="visible" class="cmp-dialog-shell">
      <div class="cmp-dialog-content">

        <transition name="cmp-main-fade">
          <div class="cmp-dialog-layout">
            <div
              class="cmp-player-col cmp-player-col--left cmp-slide-left"
              :class="{ 'cmp-slide--show': showMain }"
            >
              <PlayerAvatar
                :player="attacker"
                :avatar-registry="avatarRegistry"
                class="cmp-avatar cmp-avatar--left"
              />
              <div class="cmp-player-name">
                {{ attackerName }}
              </div>
            </div>

            <div class="cmp-cards-col">
              <div class="cmp-card-row">
                <div
                  class="cmp-card-group cmp-card-group--left cmp-slide-left"
                  :class="{ 'cmp-slide--show': showMain }"
                >
                  <div
                    v-if="attackingCard"
                    :class="cardFrameClasses('attacker')"
                  >
                    <HandCard
                      :card="attackingCard as any"
                      :index="0"
                      :overlap="0"
                      :clickable="false"
                      class="cmp-card cmp-card--attacker"
                    />
                  </div>

                  <div
                  
                    v-if="attackingCard2 && (variant === 'double' || variant === 'doubleTie')"
                    :class="['cmp-card-frame', 'cmp-card-frame--atk2']"
                  >
                    <HandCard
                      :card="attackingCard2 as any"
                      :index="1"
                      :overlap="0"
                      :clickable="false"
                      class="cmp-card cmp-card--attacker"
                    />
                  </div>
                </div>

                <div
                  class="cmp-card-group cmp-card-group--right cmp-slide-right"
                  :class="{ 'cmp-slide--show': showMain }"
                >
                  <div
                    v-if="defendingCard"
                    :class="cardFrameClasses('defender')"
                  >
                    <FieldCard
                      :card="defendingCard as any"
                      :index="0"
                      :overlap="0"
                      :clickable="false"
                      class="cmp-card cmp-card--defender"
                    />
                  </div>
                </div>
              </div>

              <div
                v-if="extraAttackerCard || extraDefenderCard"
                class="cmp-card-row cmp-card-row--tie"
              >
                <div
                  class="cmp-card-group cmp-card-group--left cmp-slide-left"
                  :class="{ 'cmp-slide--show': showMain }"
                >
                  <div
                    v-if="extraAttackerCard"
                    class="cmp-card-frame cmp-card-frame--extra"
                  >
                    <HandCard
                      :card="extraAttackerCard as any"
                      :index="2"
                      :overlap="0"
                      :clickable="false"
                      class="cmp-card cmp-card--attacker"
                    />
                  </div>
                </div>

                <div
                  class="cmp-card-group cmp-card-group--right cmp-slide-right"
                  :class="{ 'cmp-slide--show': showMain }"
                >
                  <div
                    v-if="extraDefenderCard"
                    class="cmp-card-frame cmp-card-frame--extra"
                  >
                    <FieldCard
                      :card="extraDefenderCard as any"
                      :index="1"
                      :overlap="0"
                      :clickable="false"
                      class="cmp-card cmp-card--defender"
                    />
                  </div>
                </div>
              </div>

              <div class="cmp-result-box">
                <transition name="cmp-winner-fade">
                  <div v-if="showWinner">
                    <div class="cmp-winner-text">
                      {{ winnerMessage }}
                    </div>
                    <div class="cmp-result-text">
                      {{ resultMessage }}
                    </div>
                  </div>
                </transition>
              </div>
            </div>

            <div
              class="cmp-player-col cmp-player-col--right cmp-slide-right"
              :class="{ 'cmp-slide--show': showMain }"
            >
              <PlayerAvatar
                :player="defender"
                :avatar-registry="avatarRegistry"
                class="cmp-avatar cmp-avatar--right"
              />
              <div class="cmp-player-name">
                {{ defenderName }}
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </transition>
</template>

<style scoped>

.cmp-dialog-shell {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 8px 16px;
  box-sizing: border-box;
}

.cmp-dialog-layout {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
}

/* Players */
.cmp-player-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.cmp-player-name {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.8);
}

.cmp-avatar {
  filter: drop-shadow(0 0 12px rgba(170, 59, 187, 0.6));
}

/* Cards */
.cmp-cards-col {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
}

.cmp-card-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
}

.cmp-card-row--tie {
  margin-top: 8px;
  opacity: 0.9;
}

.cmp-card-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.cmp-card-frame {
  position: relative;
  padding: 4px;
  border-radius: 10px;
  border: 3px solid transparent;
  box-shadow: 0 0 16px rgba(0, 0, 0, 0.6);
  transition:
    border-color 220ms ease,
    box-shadow 220ms ease,
    transform 220ms ease;
}

.cmp-card-frame--winner:not(.cmp-card-frame--extra):not(.cmp-card-frame--atk2) {
  border-color: #00ff9c !important;
  box-shadow:
    0 0 20px rgba(0, 255, 156, 0.8),
    0 0 40px rgba(0, 255, 200, 0.5) !important;
  transform: translateY(-4px);
}

.cmp-card-frame--loser:not(.cmp-card-frame--extra):not(.cmp-card-frame--atk2) {
  border-color: #ff4365 !important;
  box-shadow: 0 0 10px rgba(255, 67, 101, 0.6) !important;
  filter: grayscale(0.1);
}

.cmp-card-frame--extra {
  border-color: #ffd166 !important;
  box-shadow: 0 0 18px rgba(255, 209, 102, 0.7) !important;
}

.cmp-card-frame--atk2 {
  border-color: #ff9d00 !important;
  box-shadow:
    0 0 18px rgba(255, 157, 0, 0.8),
    0 0 30px rgba(255, 190, 0, 0.5) !important;
}

.cmp-card {
  max-width: 220px;
}

.cmp-result-box {
  margin-top: 12px;
  text-align: center;
  font-family: 'Rajdhani', sans-serif;
}

.cmp-winner-text {
  font-size: 2rem;
  font-weight: 700;
  color: #00ff9c;
  text-shadow:
    0 0 10px rgba(0, 255, 156, 0.7),
    0 0 20px rgba(0, 255, 200, 0.4);
}

.cmp-result-text {
  margin-top: 4px;
  font-size: 2rem;
  color: rgba(106, 67, 253, 0.85);
}

.cmp-fade-enter-active,
.cmp-fade-leave-active {
  transition: opacity 200ms ease-out;
}

.cmp-fade-enter-from,
.cmp-fade-leave-to {
  opacity: 0;
}

@media (max-width: 900px) {
  .cmp-dialog-layout {
    grid-template-columns: 1fr;
    row-gap: 12px;
  }

  .cmp-player-col--left,
  .cmp-player-col--right {
    order: -1;
    flex-direction: row;
    justify-content: center;
    gap: 12px;
  }

  .cmp-cards-col {
    order: 0;
  }

  .cmp-card-row {
    gap: 16px;
  }

  .cmp-card {
    max-width: 180px;
  }
}

.cmp-winner-fade-enter-active,
.cmp-winner-fade-leave-active {
  transition: opacity 250ms ease-out, transform 250ms ease-out;
}

.cmp-winner-fade-enter-from,
.cmp-winner-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
.cmp-main-fade-enter-active,
.cmp-main-fade-leave-active {
  transition: opacity 300ms ease, transform 300ms ease;
}

.cmp-main-fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.cmp-main-fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.cmp-slide-left {
  opacity: 0;
  transform: translateX(-40px);
  transition: opacity 350ms ease-out, transform 350ms cubic-bezier(0.16,1,0.3,1);
}
.cmp-slide-left.cmp-slide--show {
  opacity: 1;
  transform: translateX(0);
}

.cmp-slide-right {
  opacity: 0;
  transform: translateX(40px);
  transition: opacity 350ms ease-out, transform 350ms cubic-bezier(0.16,1,0.3,1);
}
.cmp-slide-right.cmp-slide--show {
  opacity: 1;
  transform: translateX(0);
}


</style>
