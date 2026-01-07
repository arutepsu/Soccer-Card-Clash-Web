// frontend/src/types/StreamMeta.ts
import type { CardView } from '@/types/WebGameState'

export type StreamMeta =
  | { action: 'Comparison'; payload: ComparisonPayload }
  | { action: 'SessionEnded'; leftPlayerName?: string | null; reason?: string | null }
  | { [k: string]: any }

export type ComparisonKind = 'Regular' | 'Double' | 'Tie' | 'DoubleTie'

export interface ComparisonPayload {
  kind: ComparisonKind
  attacker: string
  defender: string
  attackSuccess: boolean
  attackCards: CardView[]
  defendCard: CardView
  extraAttackCard?: CardView | null
  extraDefendCard?: CardView | null
}
