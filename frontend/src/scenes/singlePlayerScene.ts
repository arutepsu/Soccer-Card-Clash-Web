// import { Scene, type SceneBuildContext } from './Scene';
// import { createSoundManager, type SoundManager } from '../utils/soundManager';
// import type { WebGameState } from '../types/WebGameState';

// class SinglePlayerScene extends Scene {
//   private readonly overlay: any;
//   private readonly createGameAlert?: SceneBuildContext['createGameAlert'];

//   private soundManager: SoundManager;

//   private input: HTMLInputElement | null = null;
//   private btnStart: HTMLButtonElement | null = null;
//   private btnBack: HTMLButtonElement | null = null;

//   constructor(root: HTMLElement, ctx: SceneBuildContext) {
//     super(root);
//     this.overlay = ctx.overlay;
//     this.createGameAlert = ctx.createGameAlert;

//     this.soundManager = createSoundManager({ basePath: '/assets/sounds/' });
//   }

//   async build(): Promise<void> {
//     this.soundManager.preload('hover', 'hover.wav');
//     this.soundManager.preload('click', 'attack.wav');

//     this.input = this.root.querySelector<HTMLInputElement>('#p1name');
//     this.btnStart = this.root.querySelector<HTMLButtonElement>('.btn-start');
//     this.btnBack = this.root.querySelector<HTMLButtonElement>('.btn-back');

//     [this.btnStart, this.btnBack].forEach((btn) => {
//       if (!btn) return;

//       btn.addEventListener('mouseenter', this.onButtonHover);
//       btn.addEventListener('click', this.onButtonClick);
//     });

//     this.btnStart?.addEventListener('click', this.onStartClick);
//   }

//   destroy(): void {
//     [this.btnStart, this.btnBack].forEach((btn) => {
//       if (!btn) return;

//       btn.removeEventListener('mouseenter', this.onButtonHover);
//       btn.removeEventListener('click', this.onButtonClick);
//     });

//     this.btnStart?.removeEventListener('click', this.onStartClick);

//     this.input = null;
//     this.btnStart = null;
//     this.btnBack = null;
//   }

//   refresh(_state: WebGameState): void {
//   }


//   private onButtonHover = (ev: Event) => {
//     const btn = ev.currentTarget as HTMLButtonElement;
//     if (!btn.disabled) {
//       this.soundManager.play('hover', { volume: 0.6 });
//     }
//   };

//   private onButtonClick = (ev: Event) => {
//     const btn = ev.currentTarget as HTMLButtonElement;
//     if (!btn.disabled) {
//       this.soundManager.play('click', { volume: 0.6 });
//     }
//   };

//   private showAlert = (msg: string): void => {
//     if (this.overlay && this.createGameAlert) {
//       const el = this.createGameAlert({ message: msg });
//       this.overlay.show(el, { onHide: () => el.cleanup?.() });
//     } else {
//       alert(msg);
//     }
//   };

//   private getHumanName = (): string => {
//     return (this.input?.value || '').trim();
//   };

//   private onStartClick = (e: MouseEvent): void => {
//     const name = this.getHumanName();
//     if (!name) {
//       e.preventDefault();
//       this.showAlert('Please enter your name first.');
//       this.input?.focus();
//       return;
//     }

//     try {
//       window.sessionStorage.setItem('humanPlayerName', name);
//     } catch (err) {
//       console.warn(
//         '[SinglePlayerScene] failed to store name in sessionStorage:',
//         err,
//       );
//     }
//   };
// }

// export async function build(ctx: SceneBuildContext): Promise<Scene> {
//   const root = document.querySelector<HTMLElement>('.scene--singleplayer');
//   if (!root) {
//     console.warn('[SinglePlayerScene] .scene--singleplayer root not found');
//     return {
//       build() {},
//       destroy() {},
//     } as unknown as Scene;
//   }

//   const scene = new SinglePlayerScene(root, ctx);
//   await scene.build();
//   return scene;
// }
