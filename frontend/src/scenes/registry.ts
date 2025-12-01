// frontend/src/scenes/registry.ts

import * as PlayingField          from './../playingFieldScene.js';
import * as AttackerHandCards     from './../attackerHandScene.js';
import * as AttackerDefenderCards from './../attackerDefendersScene.js';

import * as MainMenu     from './../mainMenuScene.js';
import * as Multiplayer  from './../multiplayerScene.js';
import * as SinglePlayer from './../singleplayerScene.js';
import * as AISelection  from './../aiSelectionScene.js';
import * as LoadGame     from './../loadGameScene.js';

import type { SceneBuildContext } from './Scene';

export interface SceneModule {
  build(ctx: SceneBuildContext): Promise<any> | any;
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
};
