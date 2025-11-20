// /assets/javascripts/playingFieldScene.js
import { createPlayerAvatarRegistry } from './utils/playersAvatarRegistry.js';
import { createPlayersBar }          from './sceneComponents/playersBar.js';
import { createNavButtonBar }        from './sceneComponents/navButtonBar.js';
import { createActionButtonBar }     from './sceneComponents/actionButtonBar.js';
import { createOverlay }             from './overlay.js';
import { createCardImageRegistry }   from './utils/cardImageRegistry.js';
import { createDefaultFieldCardRenderer } from './sceneComponents/fieldCardRenderer.js';
import { createPlayersFieldBar }          from './sceneComponents/playersFieldBar.js';
import { createDefaultHandCardRenderer }  from './sceneComponents/handCardRenderer.js';
import { createPlayersHandBar }           from './sceneComponents/playersHandBar.js';
import { UIActionScheduler, delayed } from './utils/uiActionScheduler.js';
import { createComparisonDialogHandler } from './utils/comparisonDialogHandler.js';
import * as ComparisonDialogGenerator from './utils/comparisonDialogGenerator.js';
import { buildSceneViewFromWeb, assignAvatarsFrom } from './utils/playingField/sceneMapping.js';
import { createComparisonOrchestrator } from './utils/playingField/comparisonOrchestrator.js';
import { createGameApi } from './api/gameApi.js';
import { createPlayingFieldController } from './controllers/playingFieldController.js';
import { createSoundManager } from './utils/soundManager.js';
// add this helper somewhere near top of the file (outside build())
function findPlayerByNameInWeb(web, name) {
  if (!web || !name || !web.players) return null;

  const candidates = [];
  (function visit(v) {
    if (!v) return;
    if (Array.isArray(v)) {
      v.forEach(visit);
      return;
    }
    if (typeof v === 'object') {
      if ('id' in v && 'name' in v && typeof v.name === 'string') {
        candidates.push(v);
      }
      for (const key of Object.keys(v)) {
        if (key === 'id' || key === 'name') continue;
        visit(v[key]);
      }
    }
  })(web.players);

  return candidates.find(p => p.name === name) || null;
}

export async function build({ api, overlay, createGameAlert }) {
  const avatarRegistry = createPlayerAvatarRegistry({
    avatarsPath: '/assets/images/players/',
    fileNames: ['player1.jpg','player2.jpg','ai.jpg','taka.jpg','defendra.jpg','bitstrom.jpg','meta.jpg']
  });
  const cardRegistry = createCardImageRegistry();
  await Promise.all([
    avatarRegistry.preloadAvatars().catch(() => {}),
    cardRegistry.preloadAll().catch(() => {})
  ]);

  ComparisonDialogGenerator.configure({
    avatarRegistry,
    cardRegistry,
  });

  let lastRoles = { attacker: '', defender: '' };
  
  const soundManager = createSoundManager({ basePath: '/assets/sounds/' });
  soundManager.preload('attack', 'attack.wav'); 
  soundManager.preload('hover', 'hover.wav');
  
  await Promise.all([avatarRegistry.preloadAvatars().catch(() => {}), cardRegistry.preloadAll().catch(() => {})]);

  const playersBar = createPlayersBar(avatarRegistry);
  playersBar.mount(document.getElementById('players-bar'));

  const navBar = createNavButtonBar({ api, overlay, soundManager });
  navBar.mount(document.getElementById('nav-bar'));

  const actionBar = createActionButtonBar({ overlay });
  actionBar.mount(document.getElementById('action-bar'));

  const fieldRenderer = createDefaultFieldCardRenderer({ defeatedImg: cardRegistry.getDefeatedImage() });
  const handRenderer  = createDefaultHandCardRenderer();

  const ActionNames = {
    RegularAttack:    'RegularAttack',
    DoubleAttack:     'DoubleAttack',
    Undo:             'Undo',
    Redo:             'Redo',
    BoostDefender:    'BoostDefender',
    BoostGoalkeeper:  'BoostGoalkeeper',
    RegularSwap:      'RegularSwap',
    ReverseSwap:      'ReverseSwap'
  };

  const elField = document.getElementById('field');
  const elHand  = document.getElementById('hand');

  const attackerAvatarBox = document.getElementById('attacker-avatar-box');
  const inputBlocker      = document.getElementById('input-blocker');
  const setAITurn = (active) => inputBlocker?.classList.toggle('is-active', !!active);

  let controller;
  const scheduler = new UIActionScheduler();

  function applyUiFromWeb(web) {
    assignAvatarsFrom(avatarRegistry, web);
    playersBar.updateFromWebState(web);

    if (web?.roles) {
      lastRoles.attacker = web.roles.attacker || '';
      lastRoles.defender = web.roles.defender || '';
    }

    if (attackerAvatarBox) {
      const attackerRef = { id: 'att', name: web.roles?.attacker, playerType: 'Human' };
      attackerAvatarBox.innerHTML = `
        <span class="attacker-label">Attacker:</span>
        <img class="attacker-avatar neon-avatar" src="${avatarRegistry.getAvatarUrl(attackerRef)}" alt="">
        <span class="attacker-name">${attackerRef.name ?? ''}</span>
      `;
    }
  }

  const comparisonHandler = createComparisonDialogHandler({
    controller,
    contextHolder: {
      get: () => ({
        state: { roles: { attacker: lastRoles.attacker, defender: lastRoles.defender } }
      })
    },
    overlay,
    onAutoClose: async () => {
      try {
        const fresh = await api.fetchGameState();
        applyUiFromWeb(fresh);
        controller.updateFromServerContext(fresh);
      } catch (e) {
        console.warn('[CMP] refresh after auto-close failed', e);
      }
    },
    generator: ComparisonDialogGenerator,
  });

  const orchestrator = createComparisonOrchestrator({
    api,
    overlay,
    scheduler,
    comparisonHandler,
    ActionNames,
    getRoles: () => lastRoles,
    applyUiFromWeb,
    updateFromServerContext: (web) => controller.updateFromServerContext(web),
    generator: ComparisonDialogGenerator, 
    soundManager
  });


  controller = createPlayingFieldController({
    api,
    fieldRenderer,
    handRenderer,
    createPlayersFieldBar,
    createPlayersHandBar,
    elField,
    elHand,
    mapWebToScene: (web) => buildSceneViewFromWeb(web, cardRegistry),
    afterServerApply: orchestrator.afterServerApply,
  });

  comparisonHandler.controller = controller;

  navBar.onSceneEvent((ev) => {
    if (!ev) return;

    if (ev.type === 'PauseDialogAction') {
      switch (ev.action) {
        case 'undo':
          controller.onUndo?.();   return;
        case 'redo':
          controller.onRedo?.();   return;
        case 'restart':
        case 'mainmenu':
        case 'resume':
        default:
          return;
      }
    }
  });

  const onActionClick = (action) => {
    if (soundManager?.unlock) {
      soundManager.unlock();
    }

    const key = typeof action === 'string' ? action : action?.id || action?.type;

    switch (key) {
      // ---- SINGLE ATTACK (defender) ----
      case 'attack-regular':
      case 'attack-defender':
      case 'attack':
      case 'single-attack':
      case 'singleAttack': {
        orchestrator.setPendingAction(ActionNames.RegularAttack);
        controller.onSingleAttackDefender?.();

        const field = document.getElementById('field');
        if (field) {
          const firstCard = field.querySelector('.game-card');
          if (firstCard) {
            firstCard.classList.add('flip');
            setTimeout(() => firstCard.classList.remove('flip'), 700);
          }
        }
        return;
      }

      // ---- SINGLE ATTACK (goalkeeper) ----
      case 'attack-goalkeeper':
      case 'single-attack-gk':
      case 'attack-gk': {
        orchestrator.setPendingAction(ActionNames.RegularAttack);
        controller.onSingleAttackGoalkeeper?.();
        return;
      }

      // ---- DOUBLE ATTACK ----
      case 'attack-double':
      case 'double-attack': {
        orchestrator.setPendingAction(ActionNames.DoubleAttack);
        controller.onDoubleAttack?.();
        return;
      }

      // ---- SWAP (regular) ----
      case 'swap':
      case 'swap-regular': {
        orchestrator.setPendingAction(ActionNames.RegularSwap);
        controller.onSwapSelected?.();
        return;
      }

      // ---- SWAP (reverse) ----
      case 'swap-reverse':
      case 'reverse-swap': {
        orchestrator.setPendingAction(ActionNames.ReverseSwap);
        controller.onReverseSwap?.();
        return;
      }

      // ---- BOOST ----
      case 'boost':
      case 'boost-selected': {
        orchestrator.setPendingAction(ActionNames.BoostDefender);
        controller.onBoostSelected?.();
        return;
      }

      // ---- UNDO / REDO ----
      case 'undo': {
        orchestrator.setPendingAction(ActionNames.Undo);
        controller.onUndo?.();
        return;
      }

      case 'redo': {
        orchestrator.setPendingAction(ActionNames.Redo);
        controller.onRedo?.();
        return;
      }

      // ---- DEFAULT ----
      default:
        window.dispatchEvent(
          new CustomEvent('pf:event', {
            detail: { type: 'GameAction', action: key },
          })
        );
    }
  };

  actionBar.onClick(onActionClick);


  actionBar.onHoverEvent?.((event) => {
    if (event?.type === 'hover') {
      soundManager.play('hover', { volume: 0.5 });
    }
  });

  let es = api.openStream?.((web) => {
    try {
      orchestrator.handleStreamWeb(web);
    } catch (err) {
      console.error('stream update failed', err);
    }
  });

  try {
    const initial = await api.fetchGameState();
    applyUiFromWeb(initial);
    controller.updateFromServerContext(initial);
  } catch (e) {
    console.error('initial state fetch failed', e);
    if (overlay && createGameAlert) {
      const alert = createGameAlert({ message: 'Failed to load game state.' });
      overlay.show(alert, { onHide: () => alert.cleanup?.() });
    }
  }

  return {
    destroy() {
      try { es?.close?.(); } catch {}
      try { actionBar.onClick(() => {}); } catch {}
    },
    refresh: async () => {
      const fresh = await api.fetchGameState();
      applyUiFromWeb(fresh);
      controller.updateFromServerContext(fresh);
    },
    setAITurn,
    showComparison: (data) => comparison.openComparison(data),
    showGoal: (name) => comparison.goalScored({ winnerName: name }),
    showGameOver: (name, scoreLine) => comparison.gameOver({ winnerName: name, scoreLine }),
    setActionEnabled: (map) => actionBar.setEnabled(map),
    refreshOnRoleSwitch: () => playersBar.refreshOnRoleSwitch(),
  };
}
