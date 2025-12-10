import { PlayerAvatarRegistry } from '../playerAvatarRegistry';
import type {
  WebGameState,
  PlayerLike,
  AllowedActionsView,
  ActionLimitsView,
} from '../../types/WebGameState';
import type { CardImageRegistry } from '../cardImageRegistry';
import type { CardView, CardSlotView } from '../../types/WebGameState';
export interface ScenePlayerView extends PlayerLike {
  score?: number;
  actionStates?: ActionLimitsView;
}
export type AvatarRegistry = PlayerAvatarRegistry;

export interface SceneCardsView {
  attackerHand: CardView[];
  defenderHand: CardView[];
  attackerField: CardSlotView[];
  defenderField: CardSlotView[];
  attackerGoalkeeper?: CardView;
  defenderGoalkeeper?: CardView;
}
export interface HandImageView {
  imgFront: string;
  imgBack: string;
  img: string;
}

export interface FieldImageView {
  img: string;
}

export interface GameCardsImages {
  hands: {
    att: HandImageView[];
    def: HandImageView[];
  };
  fields: {
    att: FieldImageView[];
    def: FieldImageView[];
  };
  goalkeepers: {
    att: string | undefined;
    def: string | undefined;
  };
}

export interface SceneView {
  players: {
    attacker: ScenePlayerView;
    defender: ScenePlayerView;
  };
  cards: SceneCardsView;
  gameCards: GameCardsImages;
  allowed: AllowedActionsView | undefined;
}

export function buildSceneViewFromWeb(
  web: WebGameState,
  registry: CardImageRegistry,
): SceneView {
  const attacker: ScenePlayerView = {
    id: 'att',
    name: web.roles?.attacker,
    score: web.scores?.attacker,
    playerType: 'Human',
    actionStates: web.allowed?.attacker,
  };

  const defender: ScenePlayerView = {
    id: 'def',
    name: web.roles?.defender,
    score: web.scores?.defender,
    playerType: 'Human',
    actionStates: web.allowed?.defender,
  };

  const toImg = (fileName?: string | null): string =>
    registry.getImageForCard(fileName ?? undefined);
  const back = registry.getImageUrl('flippedCard.png');

  const mapHand = (list: WebGameState['cards']['attackerHand'] = []): HandImageView[] =>
    list.map((c, i, arr) => {
      const isLast = i === arr.length - 1;
      const front = toImg(c?.fileName);
      return {
        imgFront: front,
        imgBack: back,
        img: isLast ? front : back,
      };
    });

  const mapField = (
    list: WebGameState['cards']['attackerField'] = [],
  ): FieldImageView[] =>
    list.map(slot => ({
      img: toImg(slot?.card?.fileName ?? undefined),
    }));

  return {
    players: { attacker, defender },
    cards: {
      attackerHand: web.cards?.attackerHand,
      defenderHand: web.cards?.defenderHand,
      attackerField: web.cards?.attackerField,
      defenderField: web.cards?.defenderField,
      attackerGoalkeeper: web.cards?.attackerGoalkeeper,
      defenderGoalkeeper: web.cards?.defenderGoalkeeper,
    },
    gameCards: {
      hands: {
        att: mapHand(web.cards?.attackerHand),
        def: mapHand(web.cards?.defenderHand),
      },
      fields: {
        att: mapField(web.cards?.attackerField),
        def: mapField(web.cards?.defenderField),
      },
      goalkeepers: {
        att: toImg(web.cards?.attackerGoalkeeper?.fileName ?? undefined),
        def: toImg(web.cards?.defenderGoalkeeper?.fileName ?? undefined),
      },
    },
    allowed: web.allowed,
  };
}

export function assignAvatarsFrom(
  registry: AvatarRegistry,
  web: WebGameState,
): void {
  const attackerRef: PlayerLike = {
    id: 'att',
    name: web.roles?.attacker,
    playerType: 'Human',
  };
  const defenderRef: PlayerLike = {
    id: 'def',
    name: web.roles?.defender,
    playerType: 'Human',
  };
  registry.assignAvatarsInOrder([attackerRef, defenderRef]);
}
