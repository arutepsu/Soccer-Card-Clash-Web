// utils/comparisonHandler.js

function ensureStyles() {
  if (document.getElementById('cmp-overlay-style')) return;
  const css = `
  .cmp-overlay{display:grid;gap:16px;place-items:center;
    background:url('/assets/images/frames/overlay.png') center/cover no-repeat;
    padding:16px;border-radius:12px}
  .cmp-row{display:flex;align-items:center;gap:24px}
  .pane{display:flex;flex-direction:column;align-items:center;gap:8px}
  .pane .cards{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
  .cmp-overlay.is-mirrored .pane--attacker{order:2}
  .cmp-overlay.is-mirrored .pane--defender{order:1}
  @keyframes slideInLeft{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:none}}
  @keyframes slideInRight{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}
  .pane--attacker .card{animation:slideInLeft .45s ease-out both}
  .pane--defender .card{animation:slideInRight .45s ease-out both}
  .cmp-overlay.is-mirrored .pane--attacker .card{animation:slideInRight .45s ease-out both}
  .cmp-overlay.is-mirrored .pane--defender .card{animation:slideInLeft .45s ease-out both}
  .winner{font:700 24px Rajdhani,system-ui;margin-top:4px}
  .winner--green{color:#21c265}.winner--red{color:#ff4d4f}
  .msg{font:600 16px Rajdhani,system-ui;color:#fff;opacity:.9}
  .tie{display:flex;gap:24px;align-items:center}
  .tie .cards{display:flex;gap:8px}
  .avatar{width:80px;height:80px;object-fit:cover;border-radius:50%}
  .card{width:160px;height:120px;object-fit:contain;border-radius:8px;box-shadow:0 6px 16px rgba(0,0,0,.35)}
  @keyframes glowGreen{to{box-shadow:0 0 0 3px rgba(33,194,101,.9),0 6px 16px rgba(0,0,0,.35)}}
  @keyframes glowRed{to{box-shadow:0 0 0 3px rgba(255,77,79,.9),0 6px 16px rgba(0,0,0,.35)}}
  .card--win{animation:glowGreen .2s .9s both}
  .card--lose{animation:glowRed .2s .9s both}
  `;
  const style = document.createElement('style');
  style.id = 'cmp-overlay-style';
  style.textContent = css;
  document.head.appendChild(style);
}

function h(tag, cls, attrs = {}) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v);
  }
  return el;
}
const bySel = (s, r=document) => r.querySelector(s);
const clear = (n) => { while (n.firstChild) n.removeChild(n.firstChild); };
const img = (src, cls) => Object.assign(new Image(), { src, className: cls, decoding: 'async', loading: 'lazy' });

function buildDom() {
  const root = h('div', 'cmp-overlay');

  const row = h('div', 'cmp-row');

  const paneAtt = h('div', 'pane pane--attacker');
  const attAvatar = img('', 'avatar');
  const attCards = h('div', 'cards');
  paneAtt.append(attAvatar, attCards);

  const paneDef = h('div', 'pane pane--defender');
  const defAvatar = img('', 'avatar');
  const defCards = h('div', 'cards');
  paneDef.append(defAvatar, defCards);

  row.append(paneAtt, paneDef);

  const tie = h('div', 'tie'); tie.hidden = true;
  const tieAtt = h('div', 'cards');
  const tieDef = h('div', 'cards');
  tie.append(tieAtt, tieDef);

  const result = h('div', 'result');
  const winner = h('div', 'winner', { text: '' });
  const msg = h('div', 'msg', { text: '' });
  result.append(winner, msg);

  root.append(row, tie, result);

  return {
    root,
    attAvatar, defAvatar,
    attCards, defCards,
    tie, tieAtt, tieDef,
    winner, msg
  };
}

function attachToOverlay(node) {
  // Prefer your overlay helper if present, else fallback to #overlay
  if (window.SCCOverlay?.show) {
    window.SCCOverlay.show(node);
    return () => window.SCCOverlay.close?.();
  }
  const overlay = document.getElementById('overlay');
  if (!overlay) {
    document.body.appendChild(node);
    return () => node.remove();
  }
  const content = overlay.querySelector('.overlay__content') || overlay;
  clear(content);
  content.appendChild(node);
  overlay.classList.add('is-open');
  return () => {
    overlay.classList.remove('is-open');
    clear(content);
  };
}

export function createComparisonHandler() {
  ensureStyles();
  let teardown = null;

  function ensureOpen(node) {
    if (teardown) teardown();
    teardown = attachToOverlay(node);
  }

  function renderCards(container, urls, side, highlight) {
    clear(container);
    (urls || []).forEach(u => {
      const i = img(u, 'card');
      // set initial slide direction via class cascade; nothing else needed
      if (highlight === 'win')  i.classList.add('card--win');
      if (highlight === 'lose') i.classList.add('card--lose');
      container.appendChild(i);
    });
  }

  function renderComparison(opts) {
    const {
      attackSuccess,
      isTie,
      attackerName, defenderName,
      attackerAvatar, defenderAvatar,
      attackerCards, defenderCards,
      extraAttackerCards = [], extraDefenderCards = [],
      autoHideMs
    } = opts;

    const mirrored = !isTie && !attackSuccess;

    const dom = buildDom();
    if (mirrored) dom.root.classList.add('is-mirrored');

    // avatars
    dom.attAvatar.src = attackerAvatar || '';
    dom.attAvatar.alt = attackerName || 'Attacker';
    dom.defAvatar.src = defenderAvatar || '';
    dom.defAvatar.alt = defenderName || 'Defender';

    // highlight (green for winner side unless tie)
    const attHL = isTie ? null : (attackSuccess ? 'win' : 'lose');
    const defHL = isTie ? null : (attackSuccess ? 'lose' : 'win');

    // which visual side each pane is on (affects CSS animations only)
    // We don't need to compute; CSS handles it via .is-mirrored class.
    renderCards(dom.attCards, attackerCards, 'left',  attHL);
    renderCards(dom.defCards, defenderCards, 'right', defHL);

    // tie row: always symmetric (attacker left, defender right)
    const hasTie = isTie && (extraAttackerCards.length || extraDefenderCards.length);
    dom.tie.hidden = !hasTie;
    if (hasTie) {
      renderCards(dom.tieAtt, extraAttackerCards, 'left',  null);
      renderCards(dom.tieDef, extraDefenderCards, 'right', null);
    }

    // texts
    if (isTie) {
      dom.winner.textContent = 'Tie Break';
      dom.winner.classList.remove('winner--green', 'winner--red');
      dom.msg.textContent = 'Tie comparison';
    } else {
      const winnerName = attackSuccess ? attackerName : defenderName;
      dom.winner.textContent = `🏆 Winner: ${winnerName || ''}`;
      dom.winner.classList.toggle('winner--green', attackSuccess);
      dom.winner.classList.toggle('winner--red', !attackSuccess);
      dom.msg.textContent = attackSuccess ? 'Attack Successful!' : 'Attack Failed!';
    }

    ensureOpen(dom.root);

    if (autoHideMs && Number.isFinite(autoHideMs)) {
      window.setTimeout(() => close(), autoHideMs);
    }
  }

  function goalScored({ winnerName, autoHideMs }) {
    const dom = buildDom();
    dom.attCards.innerHTML = '';
    dom.defCards.innerHTML = '';
    dom.tie.hidden = true;
    dom.winner.textContent = `⚽ Goal! ${winnerName || ''}`;
    dom.winner.classList.add('winner--green');
    dom.msg.textContent = 'Kick-off in a moment…';
    ensureOpen(dom.root);
    if (autoHideMs && Number.isFinite(autoHideMs)) {
      window.setTimeout(() => close(), autoHideMs);
    }
  }

  function gameOver({ winnerName, scoreLine, autoHideMs }) {
    const dom = buildDom();
    dom.winner.textContent = `🏁 Game Over — Winner: ${winnerName || ''}`;
    dom.winner.classList.add('winner--green');
    dom.msg.textContent = scoreLine ? `Final score: ${scoreLine}` : '';
    dom.tie.hidden = true;
    ensureOpen(dom.root);
    if (autoHideMs && Number.isFinite(autoHideMs)) {
      window.setTimeout(() => close(), autoHideMs);
    }
  }

  function close() {
    if (teardown) {
      teardown();
      teardown = null;
    } else if (window.SCCOverlay?.close) {
      window.SCCOverlay.close();
    }
  }

  return {
    openComparison: renderComparison,
    goalScored,
    gameOver,
    close
  };
}
