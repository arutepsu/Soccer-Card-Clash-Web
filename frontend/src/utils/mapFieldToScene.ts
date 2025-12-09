// frontend/src/utils/mapFieldToScene.ts
import type { WebGameState } from '../types/WebGameState';
import type { CardImageRegistry } from './cardImageRegistry';
import type { FieldCardLike } from '../types/FieldCards';

export interface FieldSceneData {
  defenders: FieldCardLike[];
  goalkeeper: FieldCardLike | null;
}

export function buildMapFieldToScene(cardRegistry: CardImageRegistry) {
  const defaultDefeatedImg = cardRegistry.getImageForCard('defeated');

  const toImg = (fileName?: string | null): string => {
    if (!fileName) return defaultDefeatedImg;
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
      console.log('[mapFieldToScene] defenders', padded.map(s => ({
        backendFileName: s?.card?.fileName,
        finalImg: toImg(s?.card?.fileName ?? null),
      })));

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
