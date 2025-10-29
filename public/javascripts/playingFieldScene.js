// /assets/javascripts/playingFieldScene.js
import { createPlayerAvatarRegistry } from './utils/playersAvatarRegistry.js';
import { createPlayersBar }          from './sceneComponents/playersBar.js';
import { createNavButtonBar }        from './sceneComponents/navButtonBar.js';
import { createActionButtonBar }     from './sceneComponents/actionButtonBar.js';

import { createCardImageRegistry }           from './utils/cardImageRegistry.js';
import { createDefaultFieldCardRenderer }    from './sceneComponents/fieldCardRenderer.js';
import { createPlayersFieldBar }             from './sceneComponents/playersFieldBar.js';

import { createDefaultHandCardRenderer } from './sceneComponents/handCardRenderer.js';
import { createPlayersHandBar }          from './sceneComponents/playersHandBar.js';

import { createComparisonHandler } from './utils/comparisonHandler.js';

/**
 * Build a lightweight view object for components that expect
 * { players: {attacker, defender}, cards: {...}, allowed }
 * using the REAL mapper output (WebGameState).
 */
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
    return {
      imgFront: front,
      imgBack: back,
      img: isLast ? front : back,
    };
  });

  const mapField = (list = []) =>
    list.map(slot => ({ img: toImg(slot?.card?.fileName) }));

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
  // 0) overlay
  const overlay = document.getElementById('overlay');
  if (overlay && !overlay.__openOverlay && window.SCCOverlay?.initOverlay) {
    window.SCCOverlay.initOverlay('#overlay', '[data-open-overlay]');
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

  // 3) field & hand components
  const fieldRenderer = createDefaultFieldCardRenderer({ defeatedImg: cardRegistry.getDefeatedImage() });
  let fieldBar;

  const handRenderer = createDefaultHandCardRenderer();
  let handBar;

  // 4) comparison / dialogs
  const comparison = createComparisonHandler();

  // 5) input blocker & attacker avatar box
  const inputBlocker = document.getElementById('input-blocker');
  const attackerAvatarBox = document.getElementById('attacker-avatar-box');
  function setAITurn(active) { inputBlocker?.classList.toggle('is-active', !!active); }

  // 6) controller bridge hook
  function dispatch(evt) {
    window.dispatchEvent(new CustomEvent('pf:event', { detail: evt }));
  }
  navBar.onSceneEvent((evt) => dispatch(evt));
  actionBar.onClick((action) => dispatch({ type: 'GameAction', action }));

  // 7) state update API (call with REAL WebGameState from ViewStateMapper.toWebState(ctx))
    function updateFromServerContext(web) {
    // 1) Assign avatars first (stable IDs must match what the bar uses internally)
    const attackerRef = { id: 'att', name: web.roles.attacker, playerType: 'Human' };
    const defenderRef = { id: 'def', name: web.roles.defender, playerType: 'Human' };
    avatarRegistry.assignAvatarsInOrder([attackerRef, defenderRef]);

    // 2) Update the PlayersBar with the WebGameState (it will look up by id 'att'/'def')
    playersBar.updateFromWebState(web);

    // 3) Bottom-right attacker avatar box — use the same object (ID!) you just assigned
    attackerAvatarBox.innerHTML = `
        <span class="attacker-label">Attacker:</span>
        <img class="attacker-avatar neon-avatar" src="${avatarRegistry.getAvatarUrl(attackerRef)}" alt="">
        <span class="attacker-name">${attackerRef.name}</span>
    `;

    // 4) Build the view for other components
    const st = buildSceneViewFromWeb(web, cardRegistry);
    window.cardRegistry = cardRegistry;
    window.lastSt = st;
    
    const defender = st.players.defender;
    if (!fieldBar) {
        fieldBar = createPlayersFieldBar(defender, () => st, fieldRenderer);
        fieldBar.mount(document.getElementById('field'));
    } else {
        fieldBar.updateBar(st);
    }

    const attacker = st.players.attacker;
    if (!handBar) {
      handBar = createPlayersHandBar(attacker, () => st, handRenderer);
      handBar.mount(document.getElementById('hand'));
    } else {
      handBar.updateBar(() => st);
    }
    }


  // 8) expose scene API
  return {
    setAITurn,
    updateFromServerContext,
    showComparison: (data) => comparison.openComparison(data),
    showGoal: (name) => comparison.goalScored({ winnerName: name }),
    showGameOver: (name, scoreLine) => comparison.gameOver({ winnerName: name, scoreLine }),
    setActionEnabled: (map) => actionBar.setEnabled(map),
    refreshOnRoleSwitch: () => playersBar.refreshOnRoleSwitch(),
  };
}
