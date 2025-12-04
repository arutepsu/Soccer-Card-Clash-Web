// frontend/src/utils/mapFieldToScene.ts
import type { WebGameState } from '../types/WebGameState';
import type { CardImageRegistry } from './cardImageRegistry';
import type { FieldCardLike } from '../types/FieldCards';

export interface FieldSceneData {
  defenders: FieldCardLike[];
  goalkeeper: FieldCardLike | null;
}

/**
 * Similar idea to buildMapWebToScene, but for the field:
 * maps WebGameState -> simple view models for defenders + goalkeeper.
 */
export function buildMapFieldToScene(cardRegistry: CardImageRegistry) {
  const defaultDefeatedImg =
    cardRegistry.getImageUrl('defeated.png') ??
    '/assets/images/cards/defeated.png';

  const toImg = (fileName?: string | null): string => {
    if (!fileName) return defaultDefeatedImg;
    // reuse existing registry logic for card images
    return cardRegistry.getImageForCard(fileName);
  };

  function mapDefenderSlots(gs: WebGameState | null): FieldCardLike[] {
    const anyGs = gs as any;
    const slots: any[] = anyGs?.cards?.attackerField ?? [];

    const padded = [...slots];
    while (padded.length < 3) {
      padded.push({ id: `pad-${padded.length}`, card: null });
    }

    return padded.map((slot, index) => {
      const data = slot?.card ?? slot ?? null;
      const fileName = data?.fileName as string | undefined;
      const img = toImg(fileName ?? null);
      const isDefeated = !fileName;

      return {
        id: slot?.id ?? fileName ?? `slot-${index}`,
        img,
        isDefeated,
      };
    });
  }

  function mapGoalkeeper(gs: WebGameState | null): FieldCardLike | null {
    const anyGs = gs as any;
    const gkSlot = anyGs?.cards?.attackerGoalkeeper ?? null;

    if (!gkSlot) {
      // empty slot – still render something that looks defeated
      return {
        id: 'gk',
        img: defaultDefeatedImg,
        isDefeated: true,
      };
    }

    const data = gkSlot?.card ?? gkSlot;
    const fileName = data?.fileName as string | undefined;
    const img = toImg(fileName ?? null);
    const isDefeated = !fileName;

    return {
      id: gkSlot?.id ?? fileName ?? 'gk',
      img,
      isDefeated,
    };
  }

  return function mapFieldToScene(gs: WebGameState | null): FieldSceneData {
    return {
      defenders: mapDefenderSlots(gs),
      goalkeeper: mapGoalkeeper(gs),
    };
  };
}
