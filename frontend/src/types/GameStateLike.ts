import type { WebGameState } from './WebGameState';
import type { SceneView } from '../scenes/playingField/sceneMapping';

export type GameStateLike =
  | SceneView
  | WebGameState
  | (WebGameState & { players?: SceneView['players'] })
  | null;
