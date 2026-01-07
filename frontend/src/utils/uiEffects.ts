import type { WebGameState } from '@/types/WebGameState'
import type { ComparisonPayload } from '@/types/ComparisonPayload'

type OverlayApi = {
  showComparison: (payload: ComparisonPayload) => Promise<void>
  showGoal: (payload: any) => Promise<void>
  showGameOver: (payload: any) => Promise<void>
}

export function createUiEffects(overlays: OverlayApi) {
  return {
    async handleMeta(meta: any | null, state: WebGameState): Promise<void> {
      if (!meta) return

      const t = String(meta.action ?? meta.type ?? '')

      if (t === 'Comparison') {
        const payload = meta.payload as ComparisonPayload | undefined
        if (payload) await overlays.showComparison(payload)
        return
      }

      if (t === 'ScoreEvent' || t === 'GoalScored') {
        await overlays.showGoal(meta.payload ?? null)
        return
      }

      if (t === 'GameOver') {
        await overlays.showGameOver(meta.payload ?? null)
        return
      }
    },
  }
}
