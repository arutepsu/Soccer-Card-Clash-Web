// javascripts/sceneComponents/playersBar.js
export function createPlayersBar(registry) {
  let $root = null;
  /** @type {WebGameState | null} */
  let web = null;

  function mount(el) {
    $root = $(el);
    $root.addClass('players-bar');

    $root.html(`
      <div class="players-bar__inner">
        <div class="player-avatar-box">
          <img class="player__avatar" data-attacker-avatar alt="Attacker avatar" />
        </div>

        <div class="player-info">
          <div class="player-name" data-attacker-name></div>
          <pre class="player-actions" data-attacker-actions></pre>
        </div>

        <div class="score-box">
          <div class="scores-title">Scores</div>
          <div class="score-row">
            <span class="player-score" data-attacker-score>0</span>
            <span class="spacer"></span>
            <span class="player-score" data-defender-score>0</span>
          </div>
        </div>

        <div class="player-info">
          <div class="player-name" data-defender-name></div>
          <pre class="player-actions" data-defender-actions></pre>
        </div>

        <div class="player-avatar-box">
          <img class="player__avatar" data-defender-avatar alt="Defender avatar" />
        </div>
      </div>
    `);
  }

  /**
   * Update from WebGameState
   * @param {WebGameState} webState
   */
  function updateFromWebState(webState) {
    web = webState;
    if (!$root || !web) return;

    const aName = web.roles?.attacker ?? "";
    const dName = web.roles?.defender ?? "";
    const aScore = toNum(web.scores?.attacker, 0);
    const dScore = toNum(web.scores?.defender, 0);

    setText("[data-attacker-name]", aName);
    setText("[data-defender-name]", dName);
    setText("[data-attacker-score]", aScore);
    setText("[data-defender-score]", dScore);

    setAvatar("[data-attacker-avatar]", { id: "att", name: aName });
    setAvatar("[data-defender-avatar]", { id: "def", name: dName });

    refreshActionStates();
  }

  function refreshActionStates() {
    if (!$root || !web) return;
    const aAllowed = web.allowed?.attacker || {};
    const dAllowed = web.allowed?.defender || {};

    setText("[data-attacker-actions]", formatAllowed(aAllowed));
    setText("[data-defender-actions]", formatAllowed(dAllowed));
  }

  function refreshScores(scores) {
    if (!$root) return;
    if (scores) {
      if (scores.attacker != null) setText("[data-attacker-score]", toNum(scores.attacker, 0));
      if (scores.defender != null) setText("[data-defender-score]", toNum(scores.defender, 0));
      return;
    }
    if (!web) return;
    setText("[data-attacker-score]", toNum(web.scores?.attacker, 0));
    setText("[data-defender-score]", toNum(web.scores?.defender, 0));
  }

  function refreshOnRoleSwitch() {
    refreshActionStates();
    refreshScores();
  }

  function setText(sel, v) {
    $root.find(sel).text(String(v));
  }

  function setAvatar(sel, player) {
    const $img = $root.find(sel);
    if (!$img.length || !player) return;

    try {
      const url = registry.getAvatarUrl(player);
      if (!url) return;

      $img.attr({
        src: url,
        decoding: 'async',
        loading: 'lazy'
      }).css({
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: '0',
        display: 'block',
        maxWidth: '',
        maxHeight: ''
      }).removeAttr('width height');
    } catch (e) {
      // ignore
    }
  }

  function toNum(x, fallback) {
    const n = Number(x);
    return Number.isFinite(n) ? n : fallback;
  }

  function formatAllowed(lim) {
    const swap = toNum(lim.swapRemaining, 0);
    const boost = toNum(lim.boostRemaining, 0);
    const da = toNum(lim.doubleAttackRemaining, 0);
    return `Swap: ${swap}\nBoost: ${boost}\nDoubleAttack: ${da}`;
  }

  return {
    mount,
    updateFromWebState,
    refreshActionStates,
    refreshScores,
    refreshOnRoleSwitch
  };
}
