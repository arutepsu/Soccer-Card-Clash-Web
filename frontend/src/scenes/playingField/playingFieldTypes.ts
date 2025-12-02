import type { WebGameState } from '../../types/WebGameState';
import type { SceneView } from './sceneMapping';

export type GameStateLike =
  | SceneView
  | WebGameState
  | (WebGameState & { players?: SceneView['players'] })