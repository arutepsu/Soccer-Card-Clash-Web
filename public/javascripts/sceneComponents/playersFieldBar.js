// playersFieldBarWeb.js

export function createPlayersFieldBar(player, getGameState, renderer) {
  let root;
  let defenderRow, goalieRow;

  function mount(el) {
    root = el;
    root.classList.add('players-field-bar');
    const label = document.createElement('div');
    label.className = 'player-label';
    label.textContent = `${player.name}'s Field`;

    defenderRow = renderer.createDefenderRow(player, getGameState);
    goalieRow   = renderer.createGoalkeeperRow(player, getGameState);

    root.replaceChildren(label, defenderRow, goalieRow);
  }

  function updateBar(gameState) {
    const gsGetter = () => gameState;

    const newDef = renderer.createDefenderRow(player, gsGetter);
    const newGk  = renderer.createGoalkeeperRow(player, gsGetter);


    root.replaceChildren(
      root.querySelector('.player-label') || labelElement(player.name),
      newDef,
      newGk
    );
    defenderRow = newDef;
    goalieRow   = newGk;
  }

  function labelElement(name) {
    const el = document.createElement('div');
    el.className = 'player-label';
    el.textContent = `${name}'s Field`;
    return el;
  }

  function selectedDefenderIndex() { return null; }      // for selectable later
  function isGoalkeeperSelected() { return false; }      // for selectable later
  function resetSelectedDefender() { /* noop for now */ }

  return { mount, updateBar, selectedDefenderIndex, isGoalkeeperSelected, resetSelectedDefender };
}
