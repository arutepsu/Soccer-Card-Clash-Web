// import type { WebGameState } from '../types/WebGameState';
// import type { Overlay } from '../ui/overlay';
// import type {createGameAlert} from '../ui/gameAlert';

// export abstract class Scene {
//   protected readonly root: HTMLElement;

//   constructor(root: HTMLElement) {
//     this.root = root;
//   }

//   abstract build(): void | Promise<void>;
//   abstract destroy(): void;

//   refresh?(state: WebGameState): void;
//   onPushMessage?(env: any): void;
// }

// export interface SceneBuildContext {
//   api?: any;
//   push?: any;
//   overlay?: Overlay | null;
//   createGameAlert?: typeof createGameAlert;
// };

