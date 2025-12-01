import type { WebGameState } from '../types/WebGameState';

export abstract class Scene {
  protected readonly root: HTMLElement;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  abstract build(): void | Promise<void>;
  abstract destroy(): void;

  refresh?(state: WebGameState): void;

  onPushMessage?(env: any): void;
}

export interface SceneBuildContext {
  api?: any;
  push?: any;
  overlay?: any;
  createGameAlert?: (opts: { message: string }) => HTMLElement & {
    cleanup?: () => void;
  };
}
