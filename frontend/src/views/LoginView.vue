<!-- frontend/src/views/LoginView.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

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
</script>

<template>
  <div id="app-root" class="login-bg">
    <div class="overlay visible">
      <div class="overlay-frame login-overlay-frame">
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

            <button
              class="gbtn"
              type="submit"
              :disabled="busy"
            >
              {{ busy ? 'Logging in...' : 'Log in' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
