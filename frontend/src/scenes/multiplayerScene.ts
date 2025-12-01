import { Scene, type SceneBuildContext } from './Scene';
import { createSoundManager, type SoundManager } from '../utils/soundManager';
import { setPlayers } from '../utils/playerSideRegistry';
import type { WebGameState } from '../types/WebGameState';
import type { PushClient } from '../api/serverPushClient';

class CreateMultiplayerScene extends Scene {
  private readonly overlay: any;
  private readonly createGameAlert?: SceneBuildContext['createGameAlert'];
  private readonly push?: PushClient;

  private soundManager: SoundManager;

  private form: HTMLFormElement | null = null;
  private p1: HTMLInputElement | null = null;
  private p2: HTMLInputElement | null = null;
  private btnOk: HTMLButtonElement | null = null;
  private btnBack: HTMLElement | null = null;
  private buttons: (HTMLElement & { disabled?: boolean })[] = [];

  constructor(root: HTMLElement, ctx: SceneBuildContext) {
    super(root);
    this.overlay = ctx.overlay;
    this.createGameAlert = ctx.createGameAlert;
    this.push = ctx.push as PushClient | undefined;

    this.soundManager = createSoundManager({ basePath: '/assets/sounds/' });
  }

  async build(): Promise<void> {
    this.soundManager.preload('hover', 'hover.wav');
    this.soundManager.preload('click', 'attack.wav');

    this.form = this.root.querySelector<HTMLFormElement>('form');
    this.p1 = this.root.querySelector<HTMLInputElement>('input[name="player1"]');
    this.p2 = this.root.querySelector<HTMLInputElement>('input[name="player2"]');
    this.btnOk = this.root.querySelector<HTMLButtonElement>('button[type="submit"]');
    this.btnBack = this.root.querySelector<HTMLElement>(
      'a.gbtn.gbtn--secondary',
    );

    this.buttons = [this.btnOk, this.btnBack].filter(
      (b): b is HTMLElement & { disabled?: boolean } => !!b,
    );

    this.buttons.forEach((btn) => {
      btn.addEventListener('mouseenter', this.onButtonHover);
      btn.addEventListener('click', this.onButtonClick);
    });

    this.form?.addEventListener('submit', this.onSubmit);
    this.p1?.addEventListener('keydown', this.onKeyDown);
    this.p2?.addEventListener('keydown', this.onKeyDown);
  }

  destroy(): void {
    this.form?.removeEventListener('submit', this.onSubmit);
    this.p1?.removeEventListener('keydown', this.onKeyDown);
    this.p2?.removeEventListener('keydown', this.onKeyDown);

    this.buttons.forEach((btn) => {
      btn.removeEventListener('mouseenter', this.onButtonHover);
      btn.removeEventListener('click', this.onButtonClick);
    });

    this.setBusy(false);

    this.form = null;
    this.p1 = null;
    this.p2 = null;
    this.btnOk = null;
    this.btnBack = null;
    this.buttons = [];
  }

  refresh(_state: WebGameState): void {
  }

  private trim(el: HTMLInputElement | null): string {
    return (el?.value ?? '').trim();
  }

  private setBusy(busy: boolean): void {
    const flag = !!busy;
    if (this.btnOk) {
      this.btnOk.disabled = flag;
      this.btnOk.classList.toggle('is-busy', flag);
    }
    if (this.p1) this.p1.disabled = flag;
    if (this.p2) this.p2.disabled = flag;
  }

  private showAlert(msg: string): void {
    if (this.overlay && this.createGameAlert) {
      const el = this.createGameAlert({ message: msg });
      this.overlay.show(el, { onHide: () => el.cleanup?.() });
    } else {
      alert(msg);
    }
  }

  private validate(): boolean {
    const v1 = this.trim(this.p1);
    const v2 = this.trim(this.p2);

    setPlayers(v1, v2);

    if (!v1 || !v2) {
      this.showAlert('Please enter both player names.');
      return false;
    }
    if (v1.length > 40 || v2.length > 40) {
      this.showAlert('Names should be 40 characters or fewer.');
      return false;
    }
    return true;
  }

  private onButtonHover = (ev: Event): void => {
    const btn = ev.currentTarget as HTMLElement & { disabled?: boolean };
    if (!btn.disabled) {
      this.soundManager.play('hover', { volume: 0.3 });
    }
  };

  private onButtonClick = (ev: Event): void => {
    const btn = ev.currentTarget as HTMLElement & { disabled?: boolean };
    if (!btn.disabled) {
      this.soundManager.play('click', { volume: 0.6 });
    }
  };

  private onSubmit = async (e: Event): Promise<void> => {
    if (!this.validate()) {
      e.preventDefault();
      return;
    }

    const v1 = this.trim(this.p1);
    const v2 = this.trim(this.p2);

    if (this.push && typeof this.push.createGame === 'function') {
      e.preventDefault();
      this.setBusy(true);

      try {
        this.push.createGame(v1, v2);
        window.location.href = '/playing-field';
      } catch (err) {
        console.error('[Multiplayer] createGame via push failed:', err);
        this.showAlert('Could not create game, please try again.');
        this.setBusy(false);
      }

      return;
    }
  };

  private onKeyDown = (_e: KeyboardEvent): void => {
  };
}

export async function build(ctx: SceneBuildContext): Promise<Scene> {
  const root = document.querySelector<HTMLElement>('.scene--create-multiplayer');
  if (!root) {
    console.warn(
      '[CreateMultiplayerScene] .scene--create-multiplayer root not found',
    );
    return {
      build() {},
      destroy() {},
    } as unknown as Scene;
  }

  const scene = new CreateMultiplayerScene(root, ctx);
  await scene.build();
  return scene;
}
