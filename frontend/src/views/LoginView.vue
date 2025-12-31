<!-- frontend/src/views/LoginView.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import GameButton from '../components/button/GameButton.vue'
import GlitchInput from '@/components/input-field/GlitchInput.vue'
import loginBg from '@/assets/images/frames/background9.jpg'
import overlayFrame from '@/assets/images/frames/overlay.png'
import InputContainer from '@/components/input-field/InputContainer.vue'
import { useAppServices } from '@/app/appServices'
import { authState } from '@/auth/authState'

const router = useRouter()
const { auth } = useAppServices()

const email = ref('')
const password = ref('')
const busy = ref(false)

function showError(message: string): void {
  alert(message)
}

async function afterLoginNavigate() {
  const me = await auth.me()

  if (!me.loggedIn) {
    authState.setLoggedOut()
    showError('Login succeeded, but session not available. Please try again.')
    return
  }

  authState.setLoggedIn({
    userId: me.userId,
    nickname: me.nickname ?? null,
    email: me.email ?? null,
  })

  if (!me.nickname) {
    await router.push({ name: 'ChooseNickname' })
    return
  }

  await router.push({ name: 'MainMenu' })
}

async function onSubmit(e?: Event) {
  if (e) e.preventDefault()

  const em = email.value.trim()
  const pw = password.value

  if (!em || !pw) {
    showError('Please enter EMAIL and PASSWORD.')
    return
  }

  busy.value = true
  try {
    await auth.loginEmail(em, pw)
    await afterLoginNavigate()
  } catch (err: any) {
    showError(err?.message ?? 'Login failed')
  } finally {
    busy.value = false
  }
}

async function onGitHubLogin() {
  busy.value = true
  try {
    await auth.loginGitHub()
  } catch (err: any) {
    showError(err?.message ?? 'GitHub login failed')
    busy.value = false
  }
}

type LoginAction = 'login' | 'github'

function onCommand(payload: { action: LoginAction }) {
  if (payload.action === 'login') onSubmit()
  if (payload.action === 'github') onGitHubLogin()
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
          <form class="container login-form" @submit.prevent="onSubmit">
            <InputContainer>
              <div class="input-type">
                <GlitchInput
                  id="login-email"
                  v-model="email"
                  label="EMAIL"
                  autocomplete="email"
                  type="text"
                  @enter="onSubmit"
                />
                <GlitchInput
                  id="login-password"
                  v-model="password"
                  label="PASSWORD"
                  autocomplete="current-password"
                  type="password"
                  @enter="onSubmit"
                />
              </div>
            </InputContainer>

            <GameButton action="login" :busy="busy" class="gbtn" @command="onCommand">
              {{ busy ? 'Logging in...' : 'Log in' }}
            </GameButton>

            <GameButton action="github" :busy="busy" class="gbtn" @command="onCommand">
              Continue with GitHub
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

.login-bg .input-type {
  display: flex;
  flex-direction: column;
  gap: 1.5em;
  align-items: center;
}
</style>
