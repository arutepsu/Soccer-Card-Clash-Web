import { Scene, type SceneBuildContext } from './Scene';
import type { WebGameState } from '../types/WebGameState';
import type { PushClient } from '../api/serverPushClient';
import type { GameApi } from '../api/gameApi';

class AISelectionScene extends Scene {
  private readonly overlay: any;
  private readonly createGameAlert?: SceneBuildContext['createGameAlert'];
  private readonly api?: GameApi;
  private readonly push?: PushClient;

  private cards: HTMLElement[] = [];
  private startBtn: HTMLButtonElement | null = null;

  private selectedAI: string | null = null;

  constructor(root: HTMLElement, ctx: SceneBuildContext) {
    super(root);
    this.overlay = ctx.overlay;
    this.createGameAlert = ctx.createGameAlert;
    this.api = ctx.api as GameApi | undefined;
    this.push = ctx.push as PushClient | undefined;
  }

  async build(): Promise<void> {
    this.cards = Array.from(
      this.root.querySelectorAll<HTMLElement>('.card[data-ai]'),
    );
    this.startBtn = this.root.querySelector<HTMLButtonElement>('#btn-start');

    if (!this.cards.length && !this.startBtn) {
      // nothing to do
      return;
    }

    this.cards.forEach((card) => {
      card.addEventListener('click', this.onCardClick);
    });

    this.startBtn?.addEventListener('click', this.onStartClick);
  }

  destroy(): void {
    this.cards.forEach((card) => {
      card.removeEventListener('click', this.onCardClick);
    });
    this.startBtn?.removeEventListener('click', this.onStartClick);
    this.setBusy(false);

    this.cards = [];
    this.startBtn = null;
    this.selectedAI = null;
  }

  refresh(_state: WebGameState): void {
  }


  private selectCard(cardEl: HTMLElement): void {
    this.cards.forEach((c) => c.classList.remove('is-selected'));
    cardEl.classList.add('is-selected');
    this.selectedAI = cardEl.getAttribute('data-ai');
  }

  private showAlert(msg: string): void {
    if (this.overlay && this.createGameAlert) {
      const el = this.createGameAlert({ message: msg });
      this.overlay.show(el, { onHide: () => el.cleanup?.() });
    } else {
      alert(msg);
    }
  }

  private setBusy(busy: boolean): void {
    const flag = !!busy;
    if (this.startBtn) {
      this.startBtn.disabled = flag;
      this.startBtn.classList.toggle('is-busy', flag);
    }
    this.cards.forEach((c) => {
      (c.style as CSSStyleDeclaration).pointerEvents = flag ? 'none' : '';
    });
  }

  private getHumanName(): string {
    try {
      const stored = window.sessionStorage.getItem('humanPlayerName');
      const trimmed = (stored || '').trim();
      return trimmed || 'Player';
    } catch {
      return 'Player';
    }
  }

  private formatAiName(aiKey: string | null): string {
    if (!aiKey) return 'AI';
    return aiKey.charAt(0).toUpperCase() + aiKey.slice(1);
  }


  private onCardClick = (e: Event): void => {
    const card = e.currentTarget as HTMLElement;
    if (!card) return;
    this.selectCard(card);
  };

  private onStartClick = async (e: Event): Promise<void> => {
    e.preventDefault();

    if (!this.selectedAI) {
      this.showAlert('Please select an AI opponent first!');
      return;
    }

    const humanName = this.getHumanName();
    const aiPlayerName = this.formatAiName(this.selectedAI);

    this.setBusy(true);

    try {
      if (this.push && typeof this.push.createGameWithAI === 'function') {
        this.push.createGameWithAI(humanName, aiPlayerName);
        window.location.href = '/playing-field';
        return;
      }

      if (this.api && typeof this.api.restart === 'function') {
        await this.api.restart(humanName, aiPlayerName);
        window.location.href = '/playing-field';
        return;
      }

      const res = await fetch('/start-singleplayer-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          humanPlayer: humanName,
          aiPlayer: aiPlayerName,
        }),
      });

      if (res.redirected) {
        window.location.href = res.url;
      } else {
        this.showAlert('Failed to start singleplayer game.');
        this.setBusy(false);
      }
    } catch (err) {
      console.error('[AISelection] Error starting game:', err);
      this.showAlert('Error starting the game.');
      this.setBusy(false);
    }
  };
}

export async function build(ctx: SceneBuildContext): Promise<Scene> {
  const root = document.querySelector<HTMLElement>('.scene--ai');
  if (!root) {
    console.warn('[AISelectionScene] .scene--ai root not found');
    return {
      build() {},
      destroy() {},
    } as unknown as Scene;
  }

  const scene = new AISelectionScene(root, ctx);
  await scene.build();
  return scene;
}
