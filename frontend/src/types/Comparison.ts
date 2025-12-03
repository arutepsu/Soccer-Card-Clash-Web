import type { WebGameState } from './WebGameState';

export interface ComparisonControllerLike {
  updateFromServerContext(state: WebGameState | null): void;
  // + any comparison-specific methods if needed
}
