// frontend/src/scenes/registry.ts

import * as PlayingField          from './playingField/playingFieldScene';
import * as AttackerHandCards     from './attackerHand/attackerHandScene';
import * as AttackerDefenderCards from './attackerDefenders/attackerDefenderScene';

import * as MainMenu     from './mainMenuScene';
import * as Multiplayer  from './multiplayerScene';
import * as SinglePlayer from './singlePlayerScene';
import * as AISelection  from './aiSelectionScene';
import * as LoadGame     from './loadGameScene';
import * as Login        from './loginScene'

import type { SceneBuildContext } from './Scene';

export interface SceneModule {
  build(ctx: SceneBuildContext): Promise<unknown> | unknown;
}

export const SceneSwitchEvent = {
  MainMenu: 'MainMenu',
  Multiplayer: 'Multiplayer',
  SinglePlayer: 'SinglePlayer',
  AISelection: 'AISelection',
  LoadGame: 'LoadGame',
  PlayingField: 'PlayingField',
  AttackerHandCards: 'AttackerHandCards',
  AttackerDefenderCards: 'AttackerDefenderCards',
  Login: 'Login',
} as const;

export type SceneId = (typeof SceneSwitchEvent)[keyof typeof SceneSwitchEvent];

export const SceneRegistry: Record<SceneId, SceneModule> = {
  [SceneSwitchEvent.MainMenu]: MainMenu,
  [SceneSwitchEvent.Multiplayer]: Multiplayer,
  [SceneSwitchEvent.SinglePlayer]: SinglePlayer,
  [SceneSwitchEvent.AISelection]: AISelection,
  [SceneSwitchEvent.LoadGame]: LoadGame,
  [SceneSwitchEvent.PlayingField]: PlayingField,
  [SceneSwitchEvent.AttackerHandCards]: AttackerHandCards,
  [SceneSwitchEvent.AttackerDefenderCards]: AttackerDefenderCards,
  [SceneSwitchEvent.Login]: Login,
};
