import type { WebGameState, PlayerLike } from '../../types/WebGameState';
import type { SceneBuildContext } from '../Scene';
import { Scene } from '../Scene';

import { createPlayerAvatarRegistry } from '../../utils/playerAvatarRegistry';
import { createPlayersBar } from '../../components/playersBar';
import { createNavButtonBar } from '../../components/navButtonBar';
import { createActionButtonBar } from '../../components/actionButtonBar';
import { createCardImageRegistry } from '../../utils/cardImageRegistry';
import { createDefaultFieldCardRenderer } from '../../components/fieldCardRenderer';
import { createPlayersFieldBar } from '../../components/playersFieldBar';
import { createDefaultHandCardRenderer } from '../../components/handCardRenderer';
import { createPlayersHandBar } from '../../components/playersHandBar';

import { UIActionScheduler } from '../../ui/uiActionScheduler';
import type { Overlay } from '../../ui/overlay';
import { createComparisonDialogHandler } from './comparisonDialogHandler';

import * as ComparisonDialogGenerator from './comparisonDialogGenerator';
import {
  buildSceneViewFromWeb,
  assignAvatarsFrom,
} from './sceneMapping';

import { createComparisonOrchestrator } from './comparisonOrchestrator';
import { createPlayingFieldController } from './playingFieldController';
import { createSoundManager } from '../../utils/soundManager';

export class PlayingFieldScene extends Scene {
  private api: any;
  private push: any;
  private overlay: Overlay | undefined;
  private createGameAlert: any;

  private controller: ReturnType<typeof createPlayingFieldController> | null = null;
  private orchestrator: any;
  private comparisonHandler: any;

  private playersBar: any;
  private navBar: any;
  private actionBar: any;

  private avatarRegistry: any;
  private cardRegistry: any;
  private soundManager: any;

  private lastRoles = { attacker: '', defender: '' };

  constructor(root: HTMLElement, ctx: SceneBuildContext) {
    super(root);
    this.api = ctx.api;
    this.push = ctx.push;
    this.overlay = ctx.overlay as Overlay | undefined;
    this.createGameAlert = ctx.createGameAlert;
  }

  //----------------------------------------------------------------------
  // BUILD
  //----------------------------------------------------------------------
  async build(): Promise<void> {
    // Registries ----------------------------------------------------------
    this.avatarRegistry = createPlayerAvatarRegistry({
      avatarsPath: '/assets/images/players/',
      fileNames: [
        'player1.jpg', 'player2.jpg', 'ai.jpg',
        'taka.jpg', 'defendra.jpg', 'bitstrom.jpg', 'meta.jpg',
      ],
    });

    this.cardRegistry = createCardImageRegistry();

    await Promise.all([
      this.avatarRegistry.preloadAvatars().catch(() => {}),
      this.cardRegistry.preloadAll().catch(() => {}),
    ]);

    // ComparisonDialogGenerator.configure ---------------------------------
    const comparison = ComparisonDialogGenerator as any;
    comparison.configure?.({
      avatarRegistry: this.avatarRegistry,
      cardRegistry: this.cardRegistry,
    });

    // Sound ---------------------------------------------------------------
    this.soundManager = createSoundManager({ basePath: '/assets/sounds/' });
    this.soundManager.preload('attack', 'attack.wav');
    this.soundManager.preload('hover', 'hover.wav');

    // Players Bar ---------------------------------------------------------
    this.playersBar = createPlayersBar(this.avatarRegistry);
    this.playersBar.mount(this.root.querySelector('#players-bar'));

    // Nav Bar -------------------------------------------------------------
    this.navBar = createNavButtonBar({
      api: this.api,
      push: this.push,
      overlay: this.overlay ?? null,
      soundManager: this.soundManager,
    });
    this.navBar.mount(this.root.querySelector('#nav-bar') as HTMLElement);

    // Action Bar ----------------------------------------------------------
    this.actionBar = createActionButtonBar({ overlay: this.overlay ?? null });
    this.actionBar.mount(this.root.querySelector('#action-bar') as HTMLElement);

    // Card Renderers ------------------------------------------------------
    const fieldRenderer = createDefaultFieldCardRenderer({
      defeatedImg: this.cardRegistry.getDefeatedImage(),
    });

    const handRenderer = createDefaultHandCardRenderer();

    //----------------------------------------------------------------------
    // BUILD CONTROLLER + HANDLER + ORCHESTRATOR
    //----------------------------------------------------------------------

    const elField = this.root.querySelector('#field') as HTMLElement;
    const elHand  = this.root.querySelector('#hand') as HTMLElement;

    this.comparisonHandler = createComparisonDialogHandler({
    controller: null,
    overlay: this.overlay ?? null,
    contextHolder: {
        get: () => ({
        roles: {
            attacker: this.lastRoles.attacker,
            defender: this.lastRoles.defender,
        },
        }),
    },
    onAutoClose: async () => {
        try {
        const fresh = await this.api.fetchGameState();
        this.applyUiFromWeb(fresh);
        this.controller?.updateFromServerContext(fresh);
        } catch (err) {
        console.warn('[CMP auto-refresh failed]', err);
        }
    },
    generator: comparison,
    });


    // Controller ----------------------------------------------------------
    this.controller = createPlayingFieldController({
      api: this.api,
      push: this.push,
      fieldRenderer,
      handRenderer,
      createPlayersFieldBar,
      createPlayersHandBar,
      elField,
      elHand,
      mapWebToScene: (web) => buildSceneViewFromWeb(web, this.cardRegistry),
      afterServerApply: (payload, meta) =>
        this.orchestrator.afterServerApply(payload, meta),
    });

    // Now patch controller into handler
    (this.comparisonHandler as any).controller = this.controller;

    // Orchestrator --------------------------------------------------------
    this.orchestrator = createComparisonOrchestrator({
      api: this.api,
      push: this.push,
      overlay: this.overlay ?? null,
      scheduler: new UIActionScheduler(),
      comparisonHandler: this.comparisonHandler,
      ActionNames: {
        RegularAttack: 'RegularAttack',
        DoubleAttack: 'DoubleAttack',
        Undo: 'Undo',
        Redo: 'Redo',
        BoostDefender: 'BoostDefender',
        BoostGoalkeeper: 'BoostGoalkeeper',
        RegularSwap: 'RegularSwap',
        ReverseSwap: 'ReverseSwap',
      },
      getRoles: () => this.lastRoles,
      applyUiFromWeb: (web) => this.applyUiFromWeb(web),
      updateFromServerContext: (web) =>
        this.controller?.updateFromServerContext(web),
      generator: comparison,
      soundManager: this.soundManager,
    });

    //----------------------------------------------------------------------
    // NAV BAR EVENTS
    //----------------------------------------------------------------------
    this.navBar.onSceneEvent((ev: any) => {
      if (!ev) return;
      if (ev.type === 'PauseDialogAction') {
        if (ev.action === 'undo') this.controller?.onUndo?.();
        if (ev.action === 'redo') this.controller?.onRedo?.();
      }
    });

    //----------------------------------------------------------------------
    // ACTION BAR EVENTS
    //----------------------------------------------------------------------
    this.actionBar.onClick((action: any) => this.handleActionClick(action));
    this.actionBar.onHoverEvent?.((e: any) => {
      if (e?.type === 'hover') {
        this.soundManager.play('hover', { volume: 0.5 });
      }
    });

    //----------------------------------------------------------------------
    // EVENT STREAM
    //----------------------------------------------------------------------
    this.api.openStream?.((web: WebGameState) => {
      try {
        this.orchestrator.handleStreamWeb(web);
      } catch (err) {
        console.error('[Stream Error]', err);
      }
    });

    //----------------------------------------------------------------------
    // INITIAL LOAD
    //----------------------------------------------------------------------
    try {
      const initial = await this.api.fetchGameState();
      this.applyUiFromWeb(initial);
      this.controller?.updateFromServerContext(initial);
    } catch (err) {
      console.error('Initial state fetch failed', err);
      if (this.overlay && this.createGameAlert) {
        const alert = this.createGameAlert({ message: 'Failed to load game state.' });
        this.overlay.show(alert, { onHide: () => alert.cleanup?.() });
      }
    }
  }

  //----------------------------------------------------------------------
  // APPLY UI UPDATE FROM SERVER
  //----------------------------------------------------------------------
  private applyUiFromWeb(web: WebGameState | null): void {
    if (!web) return;

    assignAvatarsFrom(this.avatarRegistry, web);
    this.playersBar.updateFromWebState(web);

    this.lastRoles.attacker = web.roles.attacker || '';
    this.lastRoles.defender = web.roles.defender || '';

    const avatarBox = this.root.querySelector('#attacker-avatar-box');
    if (avatarBox) {
      const attackerRef: PlayerLike = {
        id: 'att',
        name: web.roles.attacker,
        playerType: 'Human',
      };

      avatarBox.innerHTML = `
        <span class="attacker-label">Attacker:</span>
        <img class="attacker-avatar neon-avatar"
             src="${this.avatarRegistry.getAvatarUrl(attackerRef)}" />
        <span class="attacker-name">${attackerRef.name ?? ''}</span>
      `;
    }
  }

  //----------------------------------------------------------------------
  // ACTION HANDLING
  //----------------------------------------------------------------------
  private handleActionClick(action: any): void {
    const key =
      typeof action === 'string'
        ? action
        : action?.id || action?.type;

    switch (key) {
      case 'attack-regular':
      case 'attack-defender':
      case 'attack':
      case 'single-attack':
      case 'singleAttack':
        this.orchestrator.setPendingAction('RegularAttack');
        this.controller?.onSingleAttackDefender?.();
        return;

      case 'attack-goalkeeper':
      case 'attack-gk':
      case 'single-attack-gk':
        this.orchestrator.setPendingAction('RegularAttack');
        this.controller?.onSingleAttackGoalkeeper?.();
        return;

      case 'double-attack':
      case 'attack-double':
        this.orchestrator.setPendingAction('DoubleAttack');
        this.controller?.onDoubleAttack?.();
        return;

      case 'swap':
      case 'swap-regular':
        this.orchestrator.setPendingAction('RegularSwap');
        this.controller?.onSwapSelected?.();
        return;

      case 'swap-reverse':
      case 'reverse-swap':
        this.orchestrator.setPendingAction('ReverseSwap');
        this.controller?.onReverseSwap?.();
        return;

      case 'boost':
      case 'boost-selected':
        this.orchestrator.setPendingAction('BoostDefender');
        this.controller?.onBoostSelected?.();
        return;

      case 'undo':
        this.orchestrator.setPendingAction('Undo');
        this.controller?.onUndo?.();
        return;

      case 'redo':
        this.orchestrator.setPendingAction('Redo');
        this.controller?.onRedo?.();
        return;

      default:
        window.dispatchEvent(
          new CustomEvent('pf:event', {
            detail: { type: 'GameAction', action: key },
          }),
        );
    }
  }

  //----------------------------------------------------------------------
  // REFRESH
  //----------------------------------------------------------------------
  refresh(state: WebGameState): void {
    this.applyUiFromWeb(state);
    this.controller?.updateFromServerContext(state);
  }

  //----------------------------------------------------------------------
  // DESTROY
  //----------------------------------------------------------------------
  destroy(): void {
    try {
      this.actionBar.onClick(() => {});
    } catch {
      // ignore
    }
    // TODO: close stream handle if you start storing it
  }
}
export async function build(ctx: SceneBuildContext): Promise<PlayingFieldScene> {
  const root = document.getElementById('scene-root') as HTMLElement | null;
  if (!root) {
    throw new Error('[PlayingFieldScene] Missing #scene-root element');
  }

  const scene = new PlayingFieldScene(root, ctx);
  await scene.build();
  return scene;
}