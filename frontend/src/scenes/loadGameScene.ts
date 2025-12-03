import { Scene, type SceneBuildContext } from './Scene';
import { createSoundManager, type SoundManager } from '../utils/soundManager';
import type { WebGameState } from '../types/WebGameState';
import type { PushClient } from '../api/serverPushClient';
import { fileIOApi } from '../api/fileIoApi';

declare const $: any;

class LoadGameScene extends Scene {
  private readonly overlay: any;
  private readonly createGameAlert?: SceneBuildContext['createGameAlert'];
  private readonly push?: PushClient;

  private soundManager: SoundManager;

  private $root: any;
  private $container: any;
  private $messagesEl: any;
  private $globalLoadBtn: any;

  private redirectTo: string = '/playing-field';

  private selectedGameId: string | null = null;

  constructor(root: HTMLElement, ctx: SceneBuildContext) {
    super(root);
    this.overlay = ctx.overlay;
    this.createGameAlert = ctx.createGameAlert;
    this.push = ctx.push as PushClient | undefined;

    this.soundManager = createSoundManager({ basePath: '/assets/sounds/' });

    this.$root = $('.scene--loadgame');
    this.$container = this.$root.find('.container');
    this.$messagesEl = this.$root.find('.loadgame-messages');
    this.$globalLoadBtn = this.$root.find('.load-game-btn');

    const redirect = this.$root.data('redirect') || '/playing-field';
    this.redirectTo = redirect;
  }

  async build(): Promise<void> {
    this.soundManager.preload('hover', 'hover.wav');
    this.soundManager.preload('click', 'attack.wav');

    if (!this.$root.length || !this.$container.length) return;

    if (this.$globalLoadBtn.length) {
      this.$globalLoadBtn.on('mouseenter', this.onGlobalLoadHover);
      this.$globalLoadBtn.on('click', this.onGlobalLoadClick);
    }

    await this.fetchAndRender();
  }

  destroy(): void {
    if (this.$container) {
      this.$container.empty();
    }
    if (this.$globalLoadBtn && this.$globalLoadBtn.length) {
      this.$globalLoadBtn.off('mouseenter', this.onGlobalLoadHover);
      this.$globalLoadBtn.off('click', this.onGlobalLoadClick);
    }
  }

  refresh(_state: WebGameState): Promise<void> {
    return this.fetchAndRender();
  }

  private showAlert(msg: string): void {
    if (this.overlay && this.createGameAlert) {
      const el = this.createGameAlert({ message: msg });
      this.overlay.show(el, { onHide: () => el.cleanup?.() });
    } else {
      alert(msg);
    }
  }

  private fmtDate(iso: string | null | undefined): string {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  private announce(msg: string, type: 'info' | 'error' | 'success' = 'info'): void {
    if (!this.$messagesEl || !this.$messagesEl.length) return;
    const $div = $('<div>')
      .addClass(`msg msg--${type}`)
      .text(msg);
    this.$messagesEl.empty().append($div);
    setTimeout(() => {
      $div.fadeOut(400, function (this: any) {
        $(this).remove();
      });
    }, 4000);
  }

  private renderList(items: string[] = []): void {
    this.$container.empty();
    this.selectedGameId = null;

    if (this.$globalLoadBtn.length) {
      this.$globalLoadBtn
        .addClass('disabled')
        .css({ 'pointer-events': 'none', opacity: '0.5' });
    }

    if (!items.length) {
      const $empty = $('<p>')
        .addClass('empty-note')
        .text('No saved games found.');
      this.$container.append($empty);
      return;
    }

    const $list = $('<div>').addClass('save-list');

    $.each(items, (_index: number, fileName: string) => {
      const name = fileName;
      const id = fileName;
      const when: string | null = null;

      const $card = $('<div>')
        .addClass('save-card')
        .css('cursor', 'pointer')
        .data('game-id', id);

      const $header = $('<div>')
        .addClass('save-card__header')
        .html(`<strong class="save-title">${name}</strong>`);

      const $meta = $('<div>')
        .addClass('save-card__meta')
        .text(when ? `Updated: ${this.fmtDate(when)}` : '');

      $card.on('mouseenter', () => {
        this.soundManager.play('hover', { volume: 0.3 });
      });

      $card.on('click', () => {
        this.soundManager.play('click', { volume: 0.6 });

        $list.find('.save-card').removeClass('selected');
        $card.addClass('selected');
        this.selectedGameId = id;

        if (this.$globalLoadBtn.length) {
          this.$globalLoadBtn
            .removeClass('disabled')
            .css({ 'pointer-events': 'auto', opacity: '1' });
        }

        this.announce(`Selected: ${name}`, 'info');
      });

      $card.append($header, $meta);
      $list.append($card);
    });

    this.$container.append($list);
  }

  private async fetchAndRender(): Promise<void> {
    try {
      const files = await fileIOApi.listSavedGames();
      this.renderList(files);
      this.announce(
        `Found ${files.length} saved game${files.length !== 1 ? 's' : ''}`,
        'info',
      );
    } catch (err) {
      console.error('Could not fetch saved games:', err);
      this.announce('Could not fetch saved games.', 'error');
      this.renderList([]);
    }
  }

  private setLoadBusy(busy: boolean): void {
    if (!this.$globalLoadBtn.length) return;
    const $btn = this.$globalLoadBtn;
    if (busy) {
      $btn.addClass('disabled').css('pointer-events', 'none');
    } else {
      $btn
        .removeClass('disabled')
        .css('pointer-events', this.selectedGameId ? 'auto' : 'none');
    }
  }

  private onGlobalLoadHover = function (this: any): void {
    const $btn = this.$globalLoadBtn;
    if (!$btn.length) return;
    if (!$btn.hasClass('disabled')) {
      this.soundManager.play('hover', { volume: 0.3 });
    }
  };

  private onGlobalLoadClick = async (e: Event): Promise<void> => {
    e.preventDefault();

    const $btn = this.$globalLoadBtn;

    if (!this.selectedGameId || $btn.hasClass('disabled')) {
      this.announce('Please select a game to load.', 'error');
      return;
    }

    this.soundManager.play('click', { volume: 0.6 });

    const originalText = $btn.text();
    $btn.text('Loading...');
    this.setLoadBusy(true);

    if (this.push && typeof this.push.load === 'function') {
      try {
        this.push.load(this.selectedGameId);
        this.announce(`Loading via server push: ${this.selectedGameId}`, 'info');
      } catch (err) {
        console.error('Push load failed:', err);
        this.announce('Could not load game via server push.', 'error');
        $btn.text(originalText);
        this.setLoadBusy(false);
      }
      return;
    }

    try {
      const sessionId = await fileIOApi.resolveSessionId();
      const response = await fileIOApi.loadGame(this.selectedGameId, sessionId);

      this.announce(`Successfully loaded: ${this.selectedGameId}`, 'success');

      if (response.gameState) {
        this.updateGameDataDisplay(response.gameState);
      }

      setTimeout(() => {
        window.location.href = this.redirectTo;
      }, 800);
    } catch (err: any) {
      console.error('Error loading game:', err);
      const msg = err?.message || 'Failed to load the selected game.';
      this.announce(msg, 'error');
      $btn.text(originalText);
      this.setLoadBusy(false);
    }
  };

  private updateGameDataDisplay(gameState: any): void {
    if (!gameState) return;

    const $preview = $('<div>')
      .addClass('game-preview')
      .html(`
        <h3>Game Preview</h3>
        <div class="preview-content">
          ${
            gameState.currentScene
              ? `<p><strong>Scene:</strong> ${gameState.currentScene}</p>`
              : ''
          }
          ${
            gameState.players
              ? `<p><strong>Players:</strong> ${gameState.players.length}</p>`
              : ''
          }
          ${
            gameState.round
              ? `<p><strong>Round:</strong> ${gameState.round}</p>`
              : ''
          }
        </div>
      `);

    $('.game-preview').remove();
    this.$container.before($preview);
  }
}

export async function build(ctx: SceneBuildContext): Promise<Scene> {
  const root = document.querySelector<HTMLElement>('.scene--loadgame');
  if (!root) {
    console.warn('[LoadGameScene] .scene--loadgame root not found');
    return {
      build() {},
      destroy() {},
    } as unknown as Scene;
  }

  const scene = new LoadGameScene(root, ctx);
  await scene.build();
  return scene;
}
