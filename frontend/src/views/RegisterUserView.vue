<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GameButton from '../components/button/GameButton.vue'
import GlitchInput from '@/components/input-field/GlitchInput.vue'
import InputContainer from '@/components/input-field/InputContainer.vue'
import loginBg from '@/assets/images/frames/background9.jpg'
import overlayFrame from '@/assets/images/frames/overlay.png'
import { useAppServices } from '@/app/appServices'

const route = useRoute()
const router = useRouter()
const { auth } = useAppServices()

const email = ref('')
const password = ref('')
const busy = ref(false)

function showError(message: string): void {
  alert(message)
}

onMounted(() => {
  const qEmail = String(route.query.email ?? '').trim()
  if (qEmail) email.value = qEmail
})

async function doRegister() {
  const em = email.value.trim()
  const pw = password.value

  if (!em || !pw) return showError('Please enter EMAIL and PASSWORD.')
  if (pw.length < 6) return showError('Password must be at least 6 characters.')

  busy.value = true
  try {
    const result = await auth.signupEmail(em, pw)

    // Always go back to login after registration
    await router.push({
      name: 'Login',
      query: { registered: result.needsEmailConfirmation ? 'confirm' : 'ok' },
    })
  } catch (err: any) {
    showError(err?.message ?? 'Registration failed')
  } finally {
    busy.value = false
  }
}

async function goToLogin() {
  await router.push({ name: 'Login' })
}

type RegisterAction = 'register' | 'back'

function onCommand(payload: { action: RegisterAction }) {
  if (payload.action === 'register') doRegister()
  if (payload.action === 'back') goToLogin()
}

const loginBgStyle = {
  backgroundImage: `url(${loginBg})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
}

const overlayFrameStyle = {
  '--frame-img': `url(${overlayFrame})`,
}
</script>

<template>
  <div id="app-root" class="login-bg" :style="loginBgStyle">
    <div class="overlay visible">
      <div class="overlay-frame login-overlay-frame" :style="overlayFrameStyle">
        <div class="overlay-scroll">
          <form class="container login-form" @submit.prevent="doRegister">
            <InputContainer>
              <div class="input-type">
                <GlitchInput
                  id="reg-email"
                  v-model="email"
                  label="EMAIL"
                  autocomplete="email"
                  type="text"
                  @enter="doRegister"
                />
                <GlitchInput
                  id="reg-password"
                  v-model="password"
                  label="PASSWORD"
                  autocomplete="new-password"
                  type="password"
                  @enter="doRegister"
                />
              </div>
            </InputContainer>

            <GameButton
              action="register"
              :busy="busy"
              class="gbtn"
              @command="onCommand"
            >
              {{ busy ? 'Creating...' : 'Create account' }}
            </GameButton>

            <GameButton
              action="back"
              :busy="false"
              class="gbtn"
              @command="onCommand"
            >
              Back to login
            </GameButton>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
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

.login-bg .input-type {
  display: flex;
  flex-direction: column;
  gap: 1.5em;
  align-items: center;
}
</style>
