import ComparisonDialog from '@/components/dialog/ComparisonDialog.vue'
import type { PlayerInfo, ComparisonCard } from './comparisonDialogHandler'
import type { PlayerAvatarRegistry } from '@/utils/playerAvatarRegistry'
import { useOverlay } from '@/composables/useOverlay'

export type ComparisonVariant = 'single' | 'double' | 'tie' | 'doubleTie'

export interface ShowComparisonOverlayParams {
  variant: ComparisonVariant
  attacker: PlayerInfo
  defender: PlayerInfo
  attackingCard: ComparisonCard | null
  defendingCard: ComparisonCard | null
  attackingCard2?: ComparisonCard | null
  extraAttackerCard?: ComparisonCard | null
  extraDefenderCard?: ComparisonCard | null
  attackSuccess?: boolean
  autoCloseMs?: number
  avatarRegistry: PlayerAvatarRegistry
}

export async function showComparisonOverlay(params: ShowComparisonOverlayParams): Promise<void> {
  const { showAndWait } = useOverlay()

  const ms =
    typeof params.autoCloseMs === 'number' && params.autoCloseMs > 0
      ? params.autoCloseMs
      : 3000

  await showAndWait({
    title: '',
    message: '',
    content: ComparisonDialog,
    autoHide: true,
    durationMs: ms,
    componentProps: {
      visible: true,
      ...params,
    },
  })
}
