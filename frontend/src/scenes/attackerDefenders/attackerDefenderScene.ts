// import type { WebGameState, PlayerLike } from '../../types/WebGameState';
// import { Scene, type SceneBuildContext } from '../Scene';
// import { createAttackerDefendersController } from './attackerDefendersController';
// import { createPlayerAvatarRegistry } from '../../utils/playerAvatarRegistry';
// import { createAttackerBar } from '../../components/attackerBar';

// function assignAvatarsFrom(
//   registry: ReturnType<typeof createPlayerAvatarRegistry>,
//   state: WebGameState | (WebGameState & { players?: { attacker?: PlayerLike; defender?: PlayerLike } }) | null,
// ): void {
//   if (!state) return;

//   const attacker: PlayerLike =
//     (state as any).players?.attacker ?? {
//       id: 'att',
//       name: state.roles?.attacker,
//       playerType: 'Human',
//     };

//   const defender: PlayerLike =
//     (state as any).players?.defender ?? {
//       id: 'def',
//       name: state.roles?.defender,
//       playerType: 'Human',
//     };

//   registry.assignAvatarsInOrder([attacker, defender]);
// }

// class AttackerDefendersScene extends Scene {
//   private readonly api: SceneBuildContext['api'];
//   private readonly overlay: SceneBuildContext['overlay'];
//   private readonly createGameAlert: SceneBuildContext['createGameAlert'];

//   private attackerBar: ReturnType<typeof createAttackerBar> | null = null;
//   private controller: ReturnType<typeof createAttackerDefendersController> | null = null;
//   private streamHandle: { close?: () => void } | null = null;

//   constructor(root: HTMLElement, ctx: SceneBuildContext) {
//     super(root);
//     this.api = ctx.api;
//     this.overlay = ctx.overlay;
//     this.createGameAlert = ctx.createGameAlert;
//   }

//   async build(): Promise<void> {
//     const playerBarEl = document.getElementById('attacker-bar');
//     const fieldEl = document.getElementById('attacker-defenders-field');
//     const btnBoost = document.getElementById('btn-boost') as HTMLButtonElement | null;
//     const btnInfo  = document.getElementById('btn-info') as (HTMLButtonElement | HTMLAnchorElement | null);
//     const btnBack  = document.getElementById('btn-back') as (HTMLButtonElement | HTMLAnchorElement | null);

//     if (!fieldEl || !playerBarEl) {
//       console.error(
//         '[AttackerDefendersScene] Missing #attacker-defenders-field or #attacker-bar',
//       );
//       return;
//     }

//     const avatarRegistry = createPlayerAvatarRegistry({
//       avatarsPath: '/assets/images/players/',
//       fileNames: [
//         'player1.jpg',
//         'player2.jpg',
//         'ai.jpg',
//         'taka.jpg',
//         'defendra.jpg',
//         'bitstrom.jpg',
//         'meta.jpg',
//       ],
//     });

//     await avatarRegistry.preloadAvatars().catch(() => {});

//     this.attackerBar = createAttackerBar(avatarRegistry);
//     this.attackerBar.mount(playerBarEl);

//     let initial: WebGameState | null = null;
//     if (this.api && typeof this.api.fetchGameState === 'function') {
//       initial = (await this.api.fetchGameState().catch(() => null)) as WebGameState | null;
//     }

//     if (initial && this.attackerBar) {
//       assignAvatarsFrom(avatarRegistry, initial);
//       this.attackerBar.updateFromWebState?.(initial);
//     }

//     this.controller = createAttackerDefendersController({
//       api: this.api,
//       els: {
//         fieldEl,
//         btnBoost,
//         btnInfo,
//         btnBack,
//         overlay: this.overlay,
//         attackerBar: this.attackerBar,
//       },
//       onNavigateBack: () => {
//         window.location.href = '/playing-field';
//       },
//       createGameAlert: this.createGameAlert,
//       onPlayersChange: (state: WebGameState) => {
//         assignAvatarsFrom(avatarRegistry, state);
//         this.attackerBar?.updateFromWebState?.(state);
//       },
//     });

//     await this.controller.initWithServerState(initial);

//     if (this.api && typeof this.api.openStream === 'function') {
//       this.streamHandle = this.api.openStream((web: WebGameState) => {
//         if (!web) return;
//         this.controller?.updateFromServerContext?.(web);
//       });
//     }
//   }

//   destroy(): void {
//     const ids = ['btn-boost', 'btn-info', 'btn-back'];
//     ids.forEach((id) => {
//       const el = document.getElementById(id);
//       if (el && el.parentNode) {
//         const clone = el.cloneNode(true) as HTMLElement;
//         el.parentNode.replaceChild(clone, el);
//       }
//     });

//     try {
//       this.streamHandle?.close?.();
//     } catch {
//     }

//     this.streamHandle = null;
//     this.controller = null;
//   }

//   override refresh(state: WebGameState): void {
//     this.controller?.updateFromServerContext?.(state);
//   }
// }

// export async function build(ctx: SceneBuildContext): Promise<Scene> {
//   const root = document.getElementById('app') as HTMLElement | null;
//   if (!root) {
//     console.error('[AttackerDefendersScene] #app root not found');
//     return new (class extends Scene {
//       constructor() {
//         super(document.body);
//       }
//       build(): void {}
//       destroy(): void {}
//       refresh(): void {}
//     })();
//   }

//   const scene = new AttackerDefendersScene(root, ctx);
//   await scene.build();
//   return scene;
// }
