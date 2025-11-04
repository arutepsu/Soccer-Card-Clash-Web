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
import { createComparisonHandler } from './utils/comparisonHandler.js';

import { createGameApi } from './api/gameApi.js';
import { createPlayingFieldController } from './controllers/playingFieldController.js';

function buildSceneViewFromWeb(web, registry) {
  const attacker = {
    id: 'att',
    name: web.roles.attacker,
    score: web.scores.attacker,
    playerType: 'Human',
    actionStates: web.allowed?.attacker
  };
  const defender = {
    id: 'def',
    name: web.roles.defender,
    score: web.scores.defender,
    playerType: 'Human',
    actionStates: web.allowed?.defender
  };

  const toImg = (f) => registry.getImageForCard(f);
  const back  = registry.getImageUrl('flippedCard.png');

  const mapHand = (list = []) => list.map((c, i, arr) => {
    const isLast = i === arr.length - 1;
    const front  = toImg(c?.fileName);
    return { imgFront: front, imgBack: back, img: isLast ? front : back };
  });

  const mapField = (list = []) => list.map(slot => ({ img: toImg(slot?.card?.fileName) }));

  return {
    players: { attacker, defender },
    cards: {
      attackerHand: web.cards.attackerHand,
      defenderHand: web.cards.defenderHand,
      attackerField: web.cards.attackerField,
      defenderField: web.cards.defenderField,
      attackerGoalkeeper: web.cards.attackerGoalkeeper,
      defenderGoalkeeper: web.cards.defenderGoalkeeper
    },
    gameCards: {
      hands: {
        att: mapHand(web.cards.attackerHand),
        def: mapHand(web.cards.defenderHand),
      },
      fields: {
        att: mapField(web.cards.attackerField),
        def: mapField(web.cards.defenderField),
      },
      goalkeepers: {
        att: toImg(web.cards.attackerGoalkeeper?.fileName),
        def: toImg(web.cards.defenderGoalkeeper?.fileName),
      }
    },
    allowed: web.allowed
  };
}

export async function initPlayingFieldScene() {
  const overlayHost = document.getElementById('overlay');
  const overlayInst = overlayHost ? createOverlay({ host: overlayHost }) : null;

  if (overlayHost && overlayInst) {
    const htmlToNode = (html) => {
      const tpl = document.createElement('template');
      tpl.innerHTML = html.trim();
      return tpl.content.firstElementChild || document.createTextNode('');
    };
    overlayHost.__showOverlay = (nodeOrHtml, opts) => {
      const node = typeof nodeOrHtml === 'string' ? htmlToNode(nodeOrHtml) : nodeOrHtml;
      overlayInst.show(node, opts);
    };
    overlayHost.__hideOverlay = () => overlayInst.hide();
    overlayHost.__openOverlay = (opts) => overlayInst.show(
      overlayHost.querySelector('.overlay-scroll')?.firstElementChild ?? document.createElement('div'),
      opts
    );
    overlayHost.addEventListener('click', (e) => {
      if (e.target.closest?.('[data-close-overlay]')) overlayInst.hide();
    });
  }

  // 1) registries
  const avatarRegistry = createPlayerAvatarRegistry({
    avatarsPath: '/assets/images/players/',
    fileNames: ['player1.jpg','player2.jpg','ai.jpg','taka.jpg','defendra.jpg','bitstrom.jpg','meta.jpg']
  });
  const cardRegistry = createCardImageRegistry();
  await Promise.all([avatarRegistry.preloadAvatars(), cardRegistry.preloadAll().catch(() => {})]);

  // 2) mount bars
  const playersBar = createPlayersBar(avatarRegistry);
  playersBar.mount(document.getElementById('players-bar'));

  const navBar = createNavButtonBar();
  navBar.mount(document.getElementById('nav-bar'));

  const actionBar = createActionButtonBar();
  actionBar.mount(document.getElementById('action-bar'));

  // 3) renderers
  const fieldRenderer = createDefaultFieldCardRenderer({ defeatedImg: cardRegistry.getDefeatedImage() });
  const handRenderer  = createDefaultHandCardRenderer();

  // 4) comparison / dialogs
  const comparison = createComparisonHandler();

  // 5) input blocker & attacker avatar box
  const inputBlocker = document.getElementById('input-blocker');
  const attackerAvatarBox = document.getElementById('attacker-avatar-box');
  function setAITurn(active) { inputBlocker?.classList.toggle('is-active', !!active); }

  // 6) API + Controller
  const api = createGameApi();

  const controller = createPlayingFieldController({
    api,
    fieldRenderer,
    handRenderer,
    createPlayersFieldBar,
    createPlayersHandBar,
    elField: document.getElementById('field'),
    elHand:  document.getElementById('hand'),
    mapWebToScene: (web) => buildSceneViewFromWeb(web, cardRegistry),
  });

  // 7) action buttons → controller
  actionBar.onClick((action) => {
    const key = typeof action === 'string' ? action : action?.id || action?.type;

  switch (key) {
    case 'attack-regular':
    case 'attack-defender':
    case 'attack':
    case 'single-attack':
    case 'singleAttack':
      controller.onSingleAttackDefender?.();
      return;

    case 'attack-goalkeeper':
    case 'single-attack-gk':
    case 'attack-gk':
      controller.onSingleAttackGoalkeeper?.();
      return;

    case 'attack-double':
    case 'double-attack':
      controller.onDoubleAttack?.();
      return;

    case 'swap':
    case 'swap-regular':
      controller.onSwapSelected?.();
      return;
    case 'swap-reverse':
    case 'reverse-swap':
      controller.onReverseSwap?.();
      return;

    case 'boost':
    case 'boost-selected':
      controller.onBoostSelected?.();
      return;

    case 'undo':
      controller.onUndo?.();
      return;
    case 'redo':
      controller.onRedo?.();
      return;

    default:
      window.dispatchEvent(new CustomEvent('pf:event', { detail: { type: 'GameAction', action: key } }));
      }
  });

  // 8) SSE live updates
  const evtSrc = new EventSource('/api/stream');
  evtSrc.addEventListener('message', (e) => {
    try {
      const web = JSON.parse(e.data);
      applyUiFromWeb(web);
      controller.updateFromServerContext(web);
    } catch (err) {
      console.error('stream parse failed', err);
    }
  });

  function applyUiFromWeb(web) {
    const attackerRef = { id: 'att', name: web.roles.attacker, playerType: 'Human' };
    const defenderRef = { id: 'def', name: web.roles.defender, playerType: 'Human' };
    avatarRegistry.assignAvatarsInOrder([attackerRef, defenderRef]);

    playersBar.updateFromWebState(web);
    if (attackerAvatarBox) {
      attackerAvatarBox.innerHTML = `
        <span class="attacker-label">Attacker:</span>
        <img class="attacker-avatar neon-avatar" src="${avatarRegistry.getAvatarUrl(attackerRef)}" alt="">
        <span class="attacker-name">${attackerRef.name}</span>
      `;
    }
  }

  // 9) initial state (helpful on first load before SSE ticks)
  try {
    const initial = await api.fetchGameState();
    applyUiFromWeb(initial);
    controller.updateFromServerContext(initial);
  } catch (e) {
    console.error('initial state fetch failed', e);
  }

  // 10) expose scene API
  return {
    setAITurn,
    updateFromServerContext(web) {
      applyUiFromWeb(web);
      window.cardRegistry = cardRegistry;
      window.lastSt = buildSceneViewFromWeb(web, cardRegistry);
      controller.updateFromServerContext(web);
    },
    showComparison: (data) => comparison.openComparison(data),
    showGoal: (name) => comparison.goalScored({ winnerName: name }),
    showGameOver: (name, scoreLine) => comparison.gameOver({ winnerName: name, scoreLine }),
    setActionEnabled: (map) => actionBar.setEnabled(map),
    refreshOnRoleSwitch: () => playersBar.refreshOnRoleSwitch(),
    destroy() { evtSrc.close(); }
  };
}
