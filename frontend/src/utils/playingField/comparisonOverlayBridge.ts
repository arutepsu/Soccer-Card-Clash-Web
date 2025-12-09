// frontend/src/scenes/playingField/comparisonOverlayBridge.ts
import ComparisonDialog from '@/components/dialog/ComparisonDialog.vue';
import type {
  PlayerInfo,
  ComparisonCard,
} from './comparisonDialogHandler';
import { useOverlay } from '@/composables/useOverlay';

export type ComparisonVariant = 'single' | 'double' | 'tie' | 'doubleTie';

export interface ShowComparisonOverlayParams {
  variant: ComparisonVariant;

  attacker: PlayerInfo;
  defender: PlayerInfo;

  attackingCard: ComparisonCard | null;
  defendingCard: ComparisonCard | null;

  attackingCard2?: ComparisonCard | null;

  extraAttackerCard?: ComparisonCard | null;
  extraDefenderCard?: ComparisonCard | null;

  attackSuccess?: boolean;

  autoCloseMs?: number;
  onAutoClose?: () => void | Promise<void>;
}

export function showComparisonOverlay(params: ShowComparisonOverlayParams): void {
  const { show, hide } = useOverlay();

  const {
    autoCloseMs,
    onAutoClose,
    ...dialogProps
  } = params;

  show({
    title: '',
    message: '',
    content: ComparisonDialog,
    componentProps: {
      visible: true,
      ...dialogProps,
    },
  });

  if (autoCloseMs && autoCloseMs > 0) {
    setTimeout(async () => {
      hide();
      if (onAutoClose) {
        await onAutoClose();
      }
    }, autoCloseMs);
  }
}
