// frontend/src/utils/mapWebToScene.ts
import type { WebGameState } from '../types/WebGameState';
import type { PlayerLike } from '../types/Player';
import type { CardImageRegistry } from './cardImageRegistry';
import type { HandCardLike } from '../components/attackerHandBar';


export type EnrichedState = WebGameState & {
  players?: {
    attacker?: PlayerLike;
    defender?: PlayerLike;
  };
  gameCards?: {
    hands?: {
      att?: HandCardLike[];
      def?: HandCardLike[];
    };
    [key: string]: unknown;
  };
};

export function buildMapWebToScene(cardRegistry: CardImageRegistry) {
  const toImg = (f?: string | null): string =>
    cardRegistry.getImageForCard(f ?? '');
  const back = cardRegistry.getImageUrl('flippedCard.png');

  const mapHand = (list: any[] | undefined | null = []): HandCardLike[] =>
    (list ?? []).map((c, i, arr) => {
      const isLast = i === arr.length - 1;
      const front = toImg(c?.fileName);
      return {
        fileName: c?.fileName,
        imgFront: front,
        imgBack: back,
        img: isLast ? front : back,
      };
    });

  return function mapWebToScene(web: WebGameState): EnrichedState {
    const attacker: PlayerLike = {
      id: 'att',
      name: web.roles?.attacker,
      playerType: 'Human',
    };
    const defender: PlayerLike = {
      id: 'def',
      name: web.roles?.defender,
      playerType: 'Human',
    };

    return {
      ...(web as any),
      players: { attacker, defender },
      gameCards: {
        ...(web as any).gameCards,
        hands: {
          att: mapHand((web as any).cards?.attackerHand as any),
          def: mapHand((web as any).cards?.defenderHand as any),
        },
      },
    };
  };
}