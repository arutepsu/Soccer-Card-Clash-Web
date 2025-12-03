// import { Scene, type SceneBuildContext } from './Scene';
// import { createSoundManager, type SoundManager } from '../utils/soundManager';
// import type { WebGameState } from '../types/WebGameState';

// class MainMenuScene extends Scene {
//   private readonly overlay: any;
//   private readonly createGameAlert?: SceneBuildContext['createGameAlert'];

//   private soundManager: SoundManager;

//   private nav: HTMLElement | null = null;
//   private buttons: HTMLButtonElement[] = [];
//   private btnAbout: HTMLElement | null = null;
//   private overlayHost: HTMLElement | null = null;

//   private unlockAudioHandler?: () => void;
//   private keydownHandler?: (e: KeyboardEvent) => void;

//   constructor(root: HTMLElement, ctx: SceneBuildContext) {
//     super(root);
//     this.overlay = ctx.overlay;
//     this.createGameAlert = ctx.createGameAlert;

//     this.soundManager = createSoundManager({ basePath: '/assets/sounds/' });
//   }

//   async build(): Promise<void> {
//     this.soundManager.preload('hover', 'hover.wav');
//     this.soundManager.preload('click', 'attack.wav');

//     this.unlockAudioHandler = () => {
//       this.soundManager.unlock();
//       window.removeEventListener('pointerdown', this.unlockAudioHandler!);
//       window.removeEventListener('keydown', this.unlockAudioHandler!);
//     };

//     window.addEventListener('pointerdown', this.unlockAudioHandler);
//     window.addEventListener('keydown', this.unlockAudioHandler);

//     setTimeout(() => this.soundManager.debug?.(), 1000);

//     this.nav = this.root.querySelector<HTMLElement>('.buttons');
//     if (!this.nav) {
//       return;
//     }

//     this.overlayHost = document.getElementById('overlay');

//     this.btnAbout = this.nav.querySelector<HTMLElement>('[data-open-overlay]');
//     this.buttons = Array.from(
//       this.nav.querySelectorAll<HTMLButtonElement>('.gbtn'),
//     );

//     this.buttons.forEach((btn) => {
//       btn.addEventListener('mouseenter', this.onButtonHover);
//       btn.addEventListener('click', this.onButtonClick);
//     });

//     this.keydownHandler = (e: KeyboardEvent) => this.onKeydown(e);

//     this.root.addEventListener('keydown', this.keydownHandler);

//     this.btnAbout?.addEventListener('click', this.openAbout);

//     this.buttons[0]?.focus?.();
//   }

//   destroy(): void {

//     if (this.unlockAudioHandler) {
//       window.removeEventListener('pointerdown', this.unlockAudioHandler);
//       window.removeEventListener('keydown', this.unlockAudioHandler);
//       this.unlockAudioHandler = undefined;
//     }

//     if (this.nav) {
//       this.buttons.forEach((btn) => {
//         btn.removeEventListener('mouseenter', this.onButtonHover);
//         btn.removeEventListener('click', this.onButtonClick);
//       });
//     }

//     if (this.keydownHandler) {
//       this.root.removeEventListener('keydown', this.keydownHandler);
//       this.keydownHandler = undefined;
//     }

//     this.btnAbout?.removeEventListener('click', this.openAbout);

//     this.buttons = [];
//     this.nav = null;
//     this.overlayHost = null;
//   }

//   refresh(_state: WebGameState): void {
//   }

//   private onButtonHover = () => {
//     this.soundManager.play('hover', { volume: 0.8 });
//   };

//   private onButtonClick = (ev: MouseEvent) => {
//     const btn = ev.currentTarget as HTMLButtonElement;
//     if (!btn.disabled) {
//       this.soundManager.play('click', { volume: 0.6 });
//     }
//   };

//   private openAbout = () => {
//     if (!this.overlay || !this.overlayHost) return;

//     const content =
//       this.overlayHost.querySelector('.overlay-scroll')?.firstElementChild ??
//       this.overlayHost.querySelector('.overlay-frame') ??
//       document.createElement('div');

//     this.overlay.show(content, { onHide: () => { /* no-op */ } });
//   };

//   private moveFocus(delta: number): void {
//     const focusables = this.buttons.filter((b) => !b.disabled);
//     if (!focusables.length) return;

//     const currentIdx = focusables.indexOf(
//       document.activeElement as HTMLButtonElement,
//     );
//     const idx = Math.max(0, currentIdx);
//     const next = (idx + delta + focusables.length) % focusables.length;
//     focusables[next].focus();
//   }

//   private onKeydown(e: KeyboardEvent): void {
//     switch (e.key) {
//       case 'ArrowDown':
//       case 'ArrowRight':
//         e.preventDefault();
//         this.moveFocus(+1);
//         break;
//       case 'ArrowUp':
//       case 'ArrowLeft':
//         e.preventDefault();
//         this.moveFocus(-1);
//         break;
//       case 'Escape':
//         this.overlay?.hide?.();
//         break;
//     }
//   }
// }

// export async function build(ctx: SceneBuildContext): Promise<Scene> {
//   const root = document.querySelector<HTMLElement>('.scene--mainmenu');
//   if (!root) {
//     console.warn('[MainMenuScene] .scene--mainmenu root not found');
//     return {
//       build() {},
//       destroy() {},
//     } as unknown as Scene;
//   }

//   const scene = new MainMenuScene(root, ctx);
//   await scene.build();
//   return scene;
// }
