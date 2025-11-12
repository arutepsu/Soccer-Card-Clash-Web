// /assets/javascripts/sceneComponents/attackerBar.js
export function createAttackerBar(avatarRegistry) {
  let $root = null;
  let webState = null;

  function mount(el) {
    $root = $(el);
    if (!$root.length) return;

    $root.addClass('attacker-bar').html(`
      <div class="attacker-bar__inner">
        <div class="attacker-avatar-col">
          <div class="player-avatar-box">
            <img class="player__avatar neon-avatar" data-attacker-avatar alt="Attacker avatar" />
          </div>
        </div>
        <div class="player-info">
          <div class="player-name" data-attacker-name></div>
          <pre class="player-actions" data-attacker-actions></pre>
        </div>
      </div>
    `);
  }

  function currentAttackerFrom(st) {
    const pa = st?.players?.attacker;
    if (pa) {
      return {
        id: 'att',
        name: pa.name ?? st?.roles?.attacker,
        playerType: pa.playerType ?? 'Human'
      };
    }
    return {
      id: 'att',
      name: st?.roles?.attacker,
      playerType: 'Human'
    };
  }

  function render() {
    if (!$root || !webState) return;

    const attacker = currentAttackerFrom(webState);

    try {
      avatarRegistry.getAvatarFileName(attacker);
    } catch {
      avatarRegistry.assignAvatarsInOrder([attacker]);
    }

    const $img = $root.find('[data-attacker-avatar]');
    const $name = $root.find('[data-attacker-name]');
    if ($img.length) $img.attr('src', avatarRegistry.getAvatarUrl(attacker));
    if ($name.length) $name.text(attacker.name ?? 'Attacker');

    const $actions = $root.find('[data-attacker-actions]');
    if ($actions.length) {
      const lim = webState.allowed?.attacker || webState.allowed?.[attacker.id] || {};
      const toNum = (x, f = 0) => (Number.isFinite(Number(x)) ? Number(x) : f);
      const swap = toNum(lim.swapRemaining, 0);
      const boost = toNum(lim.boostRemaining, 0);
      const da = toNum(lim.doubleAttackRemaining, 0);
      $actions.text(`Swap: ${swap}\nBoost: ${boost}\nDoubleAttack: ${da}`);
    }
  }

  function updateFromWebState(web) {
    webState = web;
    render();
  }

  return { mount, updateFromWebState };
}
