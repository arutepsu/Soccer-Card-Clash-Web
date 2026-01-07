import type { WebGameState } from './WebGameState';

export interface ComparisonControllerLike {
  updateFromServerContext(state: WebGameState | null): void;
}
