// import { Scene } from './Scene';
// import type { SceneBuildContext } from './Scene';
// import { SceneSwitchEvent } from './registry';

// class LoginScene extends Scene {
//   private readonly ctx: SceneBuildContext;
//   private readonly redirectUrl?: string;

//   private formEl: HTMLFormElement | null = null;
//   private usernameInput: HTMLInputElement | null = null;
//   private passwordInput: HTMLInputElement | null = null;

//   constructor(root: HTMLElement, ctx: SceneBuildContext, redirectUrl?: string) {
//     super(root);
//     this.ctx = ctx;
//     this.redirectUrl = redirectUrl;
//   }

//   async build(): Promise<void> {
//     this.formEl = this.root.querySelector<HTMLFormElement>('form.login-form');
//     this.usernameInput =
//       this.root.querySelector<HTMLInputElement>('input[name="username"]');
//     this.passwordInput =
//       this.root.querySelector<HTMLInputElement>('input[name="password"]');

//     if (!this.formEl) {
//       console.warn('[LoginScene] form.login-form not found');
//       return;
//     }

//     this.formEl.addEventListener('submit', this.handleSubmit);
//   }

//   destroy(): void {
//     if (this.formEl) {
//       this.formEl.removeEventListener('submit', this.handleSubmit);
//     }
//     this.formEl = null;
//     this.usernameInput = null;
//     this.passwordInput = null;
//   }

//   private handleSubmit = (ev: Event): void => {
//     ev.preventDefault();

//     const username = this.usernameInput?.value.trim() ?? '';
//     const password = this.passwordInput?.value ?? '';

//     if (!username || !password) {
//       this.showError('Please enter USER and PASSWORD.');
//       return;
//     }

//     console.log('[LoginScene] Fake login success for', username);

//     if (this.redirectUrl) {
//       window.location.href = this.redirectUrl;
//       return;
//     }

//     window.dispatchEvent(
//       new CustomEvent('SceneSwitch', {
//         detail: { id: SceneSwitchEvent.MainMenu, username },
//       }),
//     );
//   };

//   private showError(message: string): void {
//     if (this.ctx.overlay && this.ctx.createGameAlert) {
//       const el = this.ctx.createGameAlert({
//         message,
//         autoHideMs: 2500,
//       });
//       this.ctx.overlay.show?.(el, { autoHide: true });
//     } else {
//       window.alert(message);
//     }
//   }
// }

// export function build(ctx: SceneBuildContext): LoginScene {
//   const root = document.getElementById('app-root') as HTMLElement | null;
//   if (!root) {
//     throw new Error('LoginScene: #app-root not found');
//   }

//   const redirectUrl = root.dataset.mainmenuUrl;
//   const scene = new LoginScene(root, ctx, redirectUrl);
//   void scene.build();
//   return scene;
// }
