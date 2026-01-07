import type { CardView } from '@/types/WebGameState'

export type AttackType = 'RegularAttack' | 'DoubleAttack'

export type ComparisonResult =
  | 'ATTACKER_WINS'
  | 'DEFENDER_WINS'
  | 'GOAL'
  | 'NO_EFFECT'

export interface ComparisonPayload {
  attackType: AttackType

  attackerName: string
  defenderName: string

  attackCards: CardView[]
  defendCard?: CardView | null
  goalkeeperCard?: CardView | null

  attackValue: number
  defendValue: number

  result: ComparisonResult
}
