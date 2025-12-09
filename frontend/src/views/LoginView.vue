<!-- frontend/src/views/LoginView.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import GameButton from '../components/button/GameButton.vue';
import loginBg from '@/assets/images/frames/background9.jpg';
import overlayFrame from '@/assets/images/frames/overlay.png';

const router = useRouter();

const username = ref('');
const password = ref('');
const busy = ref(false);

function showError(message: string): void {
  alert(message);
}

async function onSubmit(e?: Event) {
  if (e) e.preventDefault();

  const u = username.value.trim();
  const p = password.value;

  if (!u || !p) {
    showError('Please enter USER and PASSWORD.');
    return;
  }

  busy.value = true;

  console.log('[LoginView] Fake login success for', u);

  await router.push({ name: 'MainMenu' });

  busy.value = false;
}

type LoginAction = 'login';

function onCommand(payload: { action: LoginAction }) {
  if (payload.action === 'login') {
    onSubmit();
  }
}
const loginBgStyle = {
  backgroundImage: `url(${loginBg})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
};

const overlayFrameStyle = {
  '--frame-img': `url(${overlayFrame})`,
};
</script>

<template>
  <div id="app-root" class="login-bg" :style="loginBgStyle">
    <div class="overlay visible">
      <div class="overlay-frame login-overlay-frame" :style="overlayFrameStyle">
        <div class="overlay-scroll">
          <form
            class="container login-form"
            @submit.prevent="onSubmit"
          >
            <div class="input-container">
              <div class="input-content">
                <div class="input-dist">
                  <div class="input-type">
                    <input
                      class="input-is"
                      type="text"
                      name="username"
                      placeholder="User"
                      required
                      autocomplete="username"
                      v-model="username"
                      :disabled="busy"
                    />
                    <input
                      class="input-is"
                      type="password"
                      name="password"
                      placeholder="Password"
                      required
                      autocomplete="current-password"
                      v-model="password"
                      :disabled="busy"
                    />
                  </div>
                </div>
              </div>
            </div>

            <GameButton
              action="login"
              :busy="busy"
              class="gbtn"
              @command="onCommand"
            >
              {{ busy ? 'Logging in...' : 'Log in' }}
            </GameButton>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  
.login-bg {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}


.login-bg .container {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  font-style: italic;
  font-weight: bold;
  display: flex;
  margin: auto;
  aspect-ratio: 16/9;
  align-items: center;
  justify-items: center;
  justify-content: center;
  flex-wrap: nowrap;
  flex-direction: column;
  gap: 1em;
}

.login-bg .input-container {
  filter: drop-shadow(46px 36px 24px #4090b5)
    drop-shadow(-55px -40px 25px #9e30a9);
  animation: blinkShadowsFilter 8s ease-in infinite;
}

.login-bg .input-content {
  display: grid;
  align-content: center;
  justify-items: center;
  align-items: center;
  text-align: center;
  padding-inline: 1em;
}

.login-bg .input-content::before {
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  filter: blur(40px);
  -webkit-clip-path: polygon(
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
  background: rgba(122, 251, 255, 0.5568627451);
  transition: all 1s ease-in-out;
}

.login-bg .input-content::after {
  content: "";
  position: absolute;
  width: 98%;
  height: 98%;
  box-shadow: inset 0px 0px 20px 20px #212121;
  background: repeating-linear-gradient(
      to bottom,
      transparent 0%,
      rgba(64, 144, 181, 0.6) 1px,
      rgb(0, 0, 0) 3px,
      hsl(295, 60%, 12%) 5px,
      #153544 4px,
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

.login-bg .input-dist {
  z-index: 80;
  display: grid;
  align-items: center;
  text-align: center;
  width: 100%;
  padding-inline: 1em;
  padding-block: 1.2em;
  grid-template-columns: 1fr;
}

.login-bg .input-type {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  gap: 1em;
  font-size: 1.1rem;
  background-color: transparent;
  width: 100%;
  border: none;
}

.login-bg .input-is {
  color: #fff;
  font-size: 0.9rem;
  background-color: transparent;
  width: 100%;
  box-sizing: border-box;
  padding-inline: 0.5em;
  padding-block: 0.7em;
  border: none;
  transition: all 1s ease-in-out;
  border-bottom: 1px solid hsl(221, 26%, 43%);
}

.login-bg .input-is:hover {
  transition: all 1s ease-in-out;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(102, 224, 255, 0.2) 27%,
    rgba(102, 224, 255, 0.2) 63%,
    transparent 100%
  );
}

.login-bg .input-content:focus-within::before {
  transition: all 1s ease-in-out;
  background: hsla(0, 0%, 100%, 0.814);
}

.login-bg .input-is:focus {
  outline: none;
  border-bottom: 1px solid hsl(192, 100%, 100%);
  color: hsl(192, 100%, 88%);
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(102, 224, 255, 0.2) 27%,
    rgba(102, 224, 255, 0.2) 63%,
    transparent 100%
  );
}

.login-bg .input-is::placeholder {
  color: hsla(192, 100%, 88%, 0.806);
}

.login-bg .submit-button {
  width: 50%;
  border: none;
  color: hsla(192, 100%, 88%, 0.806);
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(102, 224, 255, 0.2) 27%,
    rgba(102, 224, 255, 0.2) 63%,
    transparent 100%
  );
  clip-path: polygon(0 0, 85% 0%, 100% 0, 100% 15%, 100% 90%, 91% 100%, 0 100%);
  padding: 0.5em;
  animation: blinkShadowsFilter 0.5s ease-in infinite;
  transition: all 500ms;
}

.login-bg .submit-button:hover {
  color: hsl(0, 0%, 100%);
  cursor: pointer;
  font-size: medium;
  font-weight: bold;
}

@keyframes backglitch {}
@keyframes rotate {}
@keyframes blinkShadowsFilter {}

</style>