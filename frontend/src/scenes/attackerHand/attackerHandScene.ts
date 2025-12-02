// AttackerHandScene.ts
import { Scene, type SceneBuildContext } from '../Scene';
import type { WebGameState, PlayerLike } from '../../types/WebGameState';
import {
  createPlayerAvatarRegistry,
  type PlayerAvatarRegistry,
} from '../../utils/playerAvatarRegistry';
import {
  createAttackerHandController,
  type AttackerHandController,
} from './attackerHandController';
import {
  createAttackerBar,
  type AttackerBarComponent,
} from '../../components/attackerBar';

function assignAvatarsFrom(
  registry: PlayerAvatarRegistry,
  state: WebGameState | null,
): void {
  if (!state) return;

  const attacker: PlayerLike =
    (state as any).players?.attacker ?? {
      id: 'att',
      name: state.roles?.attacker,
      playerType: 'Human',
    };

  const defender: PlayerLike =
    (state as any).players?.defender ?? {
      id: 'def',
      name: state.roles?.defender,
      playerType: 'Human',
    };

  registry.assignAvatarsInOrder([attacker, defender]);
}

export class AttackerHandScene extends Scene {
  private readonly api: SceneBuildContext['api'];
  private readonly push: SceneBuildContext['push'];
  private readonly overlay: SceneBuildContext['overlay'];
  private readonly createGameAlert?: SceneBuildContext['createGameAlert'];

  private avatarRegistry: PlayerAvatarRegistry | null = null;
  private attackerBar: AttackerBarComponent | null = null;
  private controller: AttackerHandController | null = null;
  private streamHandle: { close?: () => void } | null = null;

  constructor(root: HTMLElement, ctx: SceneBuildContext) {
    super(root);
    this.api = ctx.api;
    this.push = ctx.push;
    this.overlay = ctx.overlay ?? null;
    this.createGameAlert = ctx.createGameAlert;
  }

  async build(): Promise<void> {
    const playerBarEl = document.getElementById('attacker-bar');
    const handEl = document.getElementById('attacker-hand');
    const btnRegularSwap = document.getElementById(
      'btn-regular-swap',
    ) as HTMLButtonElement | null;
    const btnReverseSwap = document.getElementById(
      'btn-reverse-swap',
    ) as HTMLButtonElement | null;
    const btnInfo = document.getElementById('btn-info') as
      | HTMLButtonElement
      | HTMLAnchorElement
      | null;
    const btnBack = document.getElementById('btn-back') as
      | HTMLButtonElement
      | HTMLAnchorElement
      | null;

    if (!handEl || !playerBarEl) {
      console.error(
        '[AttackerHandScene] Missing #attacker-hand or #attacker-bar',
      );
      return;
    }

    this.avatarRegistry = createPlayerAvatarRegistry({
      avatarsPath: '/assets/images/players/',
      fileNames: [
        'player1.jpg',
        'player2.jpg',
        'ai.jpg',
        'taka.jpg',
        'defendra.jpg',
        'bitstrom.jpg',
        'meta.jpg',
      ],
    });

    await this.avatarRegistry.preloadAvatars().catch(() => {});

    this.attackerBar = createAttackerBar(this.avatarRegistry);
    this.attackerBar.mount(playerBarEl);

    let initial: WebGameState | null = null;
    if (this.api && typeof this.api.fetchGameState === 'function') {
      initial = await this.api.fetchGameState().catch(() => null);
    }

    if (initial && this.avatarRegistry && this.attackerBar) {
      assignAvatarsFrom(this.avatarRegistry, initial);
      this.attackerBar.updateFromWebState?.(initial);
    }

    this.controller = createAttackerHandController({
      api: this.api,
      push: this.push,
      els: {
        elHand: handEl,
        btnRegularSwap,
        btnReverseSwap,
        btnInfo,
        btnBack,
        overlay: this.overlay,
        attackerBar: this.attackerBar,
      },
      createGameAlert: this.createGameAlert!,
      onNavigateBack: () => {
        window.location.href = '/playing-field';
      },
    });

    await this.controller.initWithServerState(initial ?? undefined);

    if (this.api && typeof this.api.openStream === 'function') {
      this.streamHandle = this.api.openStream((web: WebGameState | null) => {
        if (!web) return;
        if (this.avatarRegistry && this.attackerBar) {
          assignAvatarsFrom(this.avatarRegistry, web);
          this.attackerBar.updateFromWebState?.(web);
        }
        this.controller?.updateFromServerContext(web);
      });
    }
  }

  refresh(state: WebGameState): void {
    this.controller?.updateFromServerContext(state);
  }

  destroy(): void {
    try {
      this.streamHandle?.close?.();
    } catch {
      /* ignore */
    }
    this.streamHandle = null;

    this.controller?.destroy();
    this.controller = null;
  }
}
export async function build(
  ctx: SceneBuildContext,
): Promise<AttackerHandScene> {
  const root = document.getElementById('scene-root') as HTMLElement | null;
  if (!root) {
    throw new Error('[AttackerHandScene] Missing #scene-root element');
  }

  const scene = new AttackerHandScene(root, ctx);
  await scene.build();
  return scene;
}
