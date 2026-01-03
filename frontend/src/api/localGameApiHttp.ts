// frontend/src/api/localGameApiHttp.ts
import type { WebGameState } from '@/types/WebGameState'
import type { StreamHandle } from '@/api/gameEventStream'
import type { GameApi } from './GameApi'
import type { GameCommandType } from './serverPushClient'
import { apiGetJSON, apiPostJSON } from '@/api/apiClient'

interface CreateLocalGameApiHttpOptions {
  getPlayerId?: () => string | null
}

export function createLocalGameApiHttp(
  options: CreateLocalGameApiHttpOptions = {},
): GameApi {
  const getPlayerId = options.getPlayerId ?? (() => null)

  const csrf =
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ||
    (document.querySelector<HTMLInputElement>('input[name="csrfToken"]')?.value ?? null)

  const extraHeaders: HeadersInit = {
    ...(csrf ? { 'Csrf-Token': csrf } : {}),
  }

  const postJSON = <T = unknown>(url: string, payload: unknown = {}) =>
    apiPostJSON<T>(url, payload, extraHeaders)

  const getJSON = <T = unknown>(url: string) =>
    apiGetJSON<T>(url, extraHeaders)

  type FlatCommandBody = Record<string, unknown> & {
    type: string
    mode: 'local'
    playerId?: string
  }

  async function command(
    type: GameCommandType | string,
    fields: Record<string, unknown> = {},
  ): Promise<WebGameState | null> {
    const body: FlatCommandBody = { type: String(type), mode: 'local', ...fields }

    const pid = (getPlayerId() ?? '').trim()
    if (pid) body.playerId = pid

    return postJSON<WebGameState>('/api/command', body)
  }

  function openStream(): StreamHandle {
    return { type: 'none', close() {} }
  }

  async function fetchGameState(): Promise<WebGameState> {
    const snap = await getState()
    if (!snap) throw new Error('fetchGameState(local): GetState returned null')
    return snap
  }

  function getState(): Promise<WebGameState | null> {
    return command('GetState', {})
  }

  function createLocalMultiplayer(attackerName: string, defenderName: string) {
    return command('CreateGame', { p1: attackerName, p2: defenderName })
  }

  function restart(attackerName?: string | null, defenderName?: string | null) {
    const p1 = attackerName?.trim()
    const p2 = defenderName?.trim()
    if (!p1 || !p2) {
      return Promise.reject(new Error('restart(local): provide both attackerName and defenderName'))
    }
    return command('CreateGame', { p1, p2 })
  }

  function singleAttackDefender(index: number | string) {
    const idx = Number(index)
    if (!Number.isInteger(idx)) {
      return Promise.reject(new Error(`singleAttackDefender(local): invalid index ${index}`))
    }
    return command('RegularAttack', { target: 'defender', index: idx })
  }

  function singleAttackGoalkeeper() {
    return command('RegularAttack', { target: 'goalkeeper' })
  }

  function doubleAttack(index: number | string) {
    const idx = Number(index)
    if (!Number.isInteger(idx)) {
      return Promise.reject(new Error(`doubleAttack(local): invalid index ${index}`))
    }
    return command('DoubleAttack', { target: 'defender', index: idx })
  }

  function boost(payload: any) {
    if (!payload || typeof payload !== 'object') {
      return Promise.reject(new Error('boost(local): missing payload'))
    }
    if (payload.target === 'defender') {
      const idx = Number(payload.index)
      if (!Number.isInteger(idx)) {
        return Promise.reject(new Error(`boost(local): invalid defender index ${payload.index}`))
      }
    }
    return command('Boost', payload)
  }

  function swap(index: number | string) {
    const idx = Number(index)
    if (!Number.isInteger(idx)) {
      return Promise.reject(new Error(`swap(local): invalid index ${index}`))
    }
    return command('RegularSwap', { index: idx })
  }

  function reverseSwap() {
    return command('ReverseSwap', {})
  }

  function undo() {
    return command('Undo', {})
  }

  function redo() {
    return command('Redo', {})
  }

  function executeAI(action: any) {
    return command('ExecuteAI', action ?? {})
  }

  return {
    postJSON,
    getJSON,
    openStream,
    fetchGameState,
    getState,
    createLocalMultiplayer,
    restart,
    singleAttackDefender,
    singleAttackGoalkeeper,
    doubleAttack,
    boost,
    swap,
    reverseSwap,
    undo,
    redo,
    executeAI,
  }
}
