// /assets/javascripts/sceneComponents/attackerBar.js
export function createAttackerBar(avatarRegistry) {
  /** @type {HTMLElement | null} */
  let root = null;
  let webState = null;

  function mount(el) {
    // Support both a DOM element and a selector string
    if (el instanceof HTMLElement) {
      root = el;
    } else {
      root = document.querySelector(el);
    }
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
    if (!root || !webState) return;

    const attacker = currentAttackerFrom(webState);

    // Ensure attacker has an avatar assigned
    try {
      avatarRegistry.getAvatarFileName(attacker);
    } catch {
      avatarRegistry.assignAvatarsInOrder([attacker]);
    }

    const img = root.querySelector('[data-attacker-avatar]');
    const nameEl = root.querySelector('[data-attacker-name]');
    if (img) {
      img.setAttribute('src', avatarRegistry.getAvatarUrl(attacker));
    }
    if (nameEl) {
      nameEl.textContent = attacker.name ?? 'Attacker';
    }

    const actionsEl = root.querySelector('[data-attacker-actions]');
    if (actionsEl) {
      const lim =
        webState.allowed?.attacker ||
        webState.allowed?.[attacker.id] ||
        {};
      const toNum = (x, f = 0) =>
        Number.isFinite(Number(x)) ? Number(x) : f;

      const swap = toNum(lim.swapRemaining, 0);
      const boost = toNum(lim.boostRemaining, 0);
      const da = toNum(lim.doubleAttackRemaining, 0);

      actionsEl.textContent = `Swap: ${swap}\nBoost: ${boost}\nDoubleAttack: ${da}`;
    }
  }

  function updateFromWebState(web) {
    webState = web;
    render();
  }

  return { mount, updateFromWebState };
}
