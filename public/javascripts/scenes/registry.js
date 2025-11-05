// Core scenes (already implemented)
import * as PlayingField          from './../playingFieldScene.js';
import * as AttackerHandCards     from './../attackerHandScene.js';
import * as AttackerDefenderCards from './../attackerDefendersScene.js';

// Missing scenes: add stubs (you can flesh these out later)
import * as MainMenu     from './../mainMenuScene.js';
import * as Multiplayer  from './../multiplayerScene.js';
import * as SinglePlayer from './../singleplayerScene.js';
import * as AISelection  from './../aiSelectionScene.js';
import * as LoadGame     from './../loadGameScene.js';

export const SceneSwitchEvent = {
  MainMenu: 'MainMenu',
  Multiplayer: 'Multiplayer',
  SinglePlayer: 'SinglePlayer',
  AISelection: 'AISelection',
  LoadGame: 'LoadGame',
  PlayingField: 'PlayingField',
  AttackerHandCards: 'AttackerHandCards',
  AttackerDefenderCards: 'AttackerDefenderCards',
};

export const SceneRegistry = {
  [SceneSwitchEvent.MainMenu]: MainMenu,
  [SceneSwitchEvent.Multiplayer]: Multiplayer,
  [SceneSwitchEvent.SinglePlayer]: SinglePlayer,
  [SceneSwitchEvent.AISelection]: AISelection,
  [SceneSwitchEvent.LoadGame]: LoadGame,
  [SceneSwitchEvent.PlayingField]: PlayingField,
  [SceneSwitchEvent.AttackerHandCards]: AttackerHandCards,
  [SceneSwitchEvent.AttackerDefenderCards]: AttackerDefenderCards,
};
