export function createAttackerBar(avatarRegistry) {
  let root = null;
  let webState = null;

  function mount(el) {
    root = el;
    if (!root) return;
    root.classList.add('attacker-bar');
    root.innerHTML = `
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
    `;
  }

  function render() {
    if (!root || !webState) return;

    const attacker = { id: 'att', name: webState.roles?.attacker, playerType: 'Human' };
    const defender = { id: 'def', name: webState.roles?.defender, playerType: 'Human' };

    try { avatarRegistry.getAvatarFileName(attacker); }
    catch { avatarRegistry.assignAvatarsInOrder([attacker, defender]); }

    const imgEl  = root.querySelector('[data-attacker-avatar]');
    const nameEl = root.querySelector('[data-attacker-name]');
    if (imgEl)  imgEl.src = avatarRegistry.getAvatarUrl(attacker);
    if (nameEl) nameEl.textContent = attacker.name ?? 'Attacker';

    const actionsEl = root.querySelector('[data-attacker-actions]');
    if (actionsEl) {
      const lim = webState.allowed?.attacker || {};
      const toNum = (x, f=0) => (Number.isFinite(Number(x)) ? Number(x) : f);
      const swap  = toNum(lim.swapRemaining, 0);
      const boost = toNum(lim.boostRemaining, 0);
      const da    = toNum(lim.doubleAttackRemaining, 0);
      actionsEl.textContent = `Swap: ${swap}\nBoost: ${boost}\nDoubleAttack: ${da}`;
    }
  }

  function updateFromWebState(web) {
    webState = web;
    render();
  }

  return { mount, updateFromWebState };
}
