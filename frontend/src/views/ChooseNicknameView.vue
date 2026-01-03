<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import GameButton from '@/components/button/GameButton.vue'
import GlitchInput from '@/components/input-field/GlitchInput.vue'
import InputContainer from '@/components/input-field/InputContainer.vue'
import { useAppServices } from '@/app/appServices'
import { authState } from '@/auth/authState'

const router = useRouter()
const { auth } = useAppServices()

const nickname = ref(authState.nickname ?? '')
const busy = ref(false)

function showError(message: string): void {
  alert(message)
}

function isValidNickname(s: string): boolean {
  return /^[A-Za-z0-9_-]{3,20}$/.test(s)
}

async function onSubmit(e?: Event) {
  if (e) e.preventDefault()

  const n = nickname.value.trim()
  if (!isValidNickname(n)) {
    showError('Nickname must be 3–20 chars: letters, numbers, _ or -')
    return
  }

  busy.value = true
  try {
    const res = await auth.updateNickname(n)

    authState.setLoggedIn({
      userId: authState.userId ?? undefined,
      email: authState.email ?? undefined,
      nickname: res.nickname,
    })

    await router.push({ name: 'MainMenu' })
  } catch (err: any) {
    showError(err?.message ?? 'Failed to set nickname')
  } finally {
    busy.value = false
  }
}

type NickAction = 'save'
function onCommand(payload: { action: NickAction }) {
  if (payload.action === 'save') void onSubmit()
}
</script>

<template>
  <div class="container">
    <h2>Choose your nickname</h2>

    <form @submit.prevent="onSubmit">
      <InputContainer>
        <GlitchInput
          id="nickname"
          v-model="nickname"
          label="NICKNAME"
          autocomplete="nickname"
          type="text"
          @enter="onSubmit"
        />
      </InputContainer>
      
      <GameButton action="save" :busy="busy" class="gbtn" @command="onCommand">
        {{ busy ? 'Saving...' : 'Save nickname' }}
      </GameButton>
    </form>

    <p v-if="authState.email" class="hint">Signed in as {{ authState.email }}</p>
  </div>
</template>

<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: center;
}
.hint {
  opacity: 0.8;
  font-style: italic;
}
</style>
