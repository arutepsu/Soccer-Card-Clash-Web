<!-- frontend/src/components/layout/InputContainer.vue -->
<script setup lang="ts">
</script>

<template>
  <div class="input-container">
    <div class="input-content">
      <div class="input-dist">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-container {
  transform: scale(1.0);
  margin-block: 1rem;
  margin-inline: 1rem;
  filter: drop-shadow(46px 36px 24px #6445ff)
    drop-shadow(-55px -40px 25px #9e30a9);
  animation: blinkShadowsFilter 8s ease-in infinite;
}

.input-content {
  width: 450px;
  min-height: 250px;
  display: grid;
  align-content: center;
  justify-items: center;
  padding-inline: 2.2rem;
  padding-block: 2rem;
  position: relative;
}

.input-content::before {
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  filter: blur(45px);
  clip-path: polygon(
    26% 0,
    66% 0,
    92% 0,
    100% 8%,
    100% 89%,
    91% 100%,
    7% 100%,
    0 92%,
    0 0
  );
  background: rgba(100, 68, 254, 0.55);
  transition: all 1s ease-in-out;
}

.input-content::after {
  content: "";
  position: absolute;
  width: 98%;
  height: 98%;
  box-shadow: inset 0px 0px 20px 20px #212121;
  background: repeating-linear-gradient(
      to bottom,
      transparent 0%,
      rgba(64, 144, 181, 0.6) 1px,
      rgba(2, 3, 11)3px,
      hsl(295, 60%, 12%) 5px,
      rgba(135, 63, 223) 4px,
      transparent 0.5%
    ),
    repeating-linear-gradient(
      to left,
      hsl(295, 60%, 12%) 100%,
      hsla(295, 60%, 12%, 0.99) 100%
    );
  -webkit-clip-path: polygon(
    26% 0,
    31% 5%,
    61% 5%,
    66% 0,
    92% 0,
    100% 8%,
    100% 89%,
    91% 100%,
    7% 100%,
    0 92%,
    0 0
  );
  clip-path: polygon(
    26% 0,
    31% 5%,
    61% 5%,
    66% 0,
    92% 0,
    100% 8%,
    100% 89%,
    91% 100%,
    7% 100%,
    0 92%,
    0 0
  );
  animation: backglitch 50ms linear infinite;
}

.input-dist {
  z-index: 80;
  display: grid;
  align-items: center;
  text-align: center;
  width: 100%;
  padding-inline: 1em;
  padding-block: 1.2em;
  grid-template-columns: 1fr;
}

@keyframes backglitch {}
@keyframes rotate {}
@keyframes blinkShadowsFilter {}
</style>
