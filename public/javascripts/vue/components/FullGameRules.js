export default {
  name: 'FullGameRules',
  setup() {
    const rules = [
      'Players alternate roles each round.',
      'The attacker always uses the last card(s) in hand.',
      'The defender does not act — only endures the attack.',
      'Cards are compared — the stronger card wins.',
      'Exception: 2 can beat an Ace to maintain fairness.',
      "You can't attack the goalkeeper until all defenders are defeated.",
      'Beating the goalkeeper scores a goal and switches roles.'
    ];
    const attackTypes = [
      { type: 'Single Attack', desc: 'Uses the last card in the attacker’s hand.' },
      { type: 'Double Attack', desc: 'Uses the last two cards in the attacker’s hand.' }
    ];
    const outcomes = [
      { type: 'Success', icon: '✅', desc: 'Beaten defender(s) are added to the end of the attacker\'s hand. The attacker continues their turn.' },
      { type: 'Failure', icon: '❌', desc: 'Roles switch — the defender becomes the new attacker.' },
      { type: 'Tie', icon: '🤝', desc: 'The next-to-last cards are compared. The stronger pair wins the round.' }
    ];
    const boostTable = [
      { card: 'Two', value: '+6' },
      { card: 'Three', value: '+5' },
      { card: 'Four', value: '+5' },
      { card: 'Five', value: '+4' },
      { card: 'Six', value: '+4' },
      { card: 'Seven', value: '+3' },
      { card: 'Eight', value: '+3' },
      { card: 'Nine', value: '+2' },
      { card: 'Ten', value: '+2' },
      { card: 'Jack', value: '+1' },
      { card: 'Queen', value: '+1' },
      { card: 'King', value: '+1' },
      { card: 'Ace', value: '+0' }
    ];
    const boostingNotes = [
      'Boosting counts as one action per turn.',
      'If no actions remain, boosting is disabled and a warning appears.',
      'Whenever a boosted card is moved to a player\'s hand (whether attacker or defender), its original value is restored.'
    ];
    const swapMechanics = [
      { type: 'Regular Swap', icon: '🔁', desc: 'Select a card from your hand and swap it with the last card in your hand.' },
      { type: 'Reverse Swap', icon: '🔃', desc: 'Instantly reverses the entire hand order.' }
    ];
    const actionNotes = [
      'Every swap (regular or reverse) consumes one action.',
      'When all actions are used up, no further actions are allowed for that turn.'
    ];
    const actionLimit = [
      'Regular Swap',
      'Reverse Swap',
      'Defender Boost',
      'Goalkeeper Boost',
      'Double Attack'
    ];
    return {
      rules,
      attackTypes,
      outcomes,
      boostTable,
      boostingNotes,
      swapMechanics,
      actionNotes,
      actionLimit
    };
  },
  template: `
    <div>
      <h2>⚽ Game Rules</h2>
      <ul>
        <li v-for="rule in rules" :key="rule">{{ rule }}</li>
      </ul>
      <hr>
      <h3>🗡️ Attack Types</h3>
      <ul>
        <li v-for="a in attackTypes" :key="a.type">
          <strong>{{ a.type }}</strong><br>{{ a.desc }}
        </li>
      </ul>
      <hr>
      <h3>🎯 Attack Outcomes</h3>
      <ul>
        <li v-for="o in outcomes" :key="o.type">
          {{ o.icon }} <strong>{{ o.type }}:</strong><br>{{ o.desc }}
        </li>
      </ul>
      <hr>
      <h3>💥 Boosting</h3>
      <p>The attacker can boost their own defenders or goalkeeper.<br>
        Boosting increases card strength based on the boosting card's value:</p>
      <table border="1" cellspacing="0" cellpadding="6">
        <thead>
          <tr>
            <th>Boost Card</th>
            <th>Boost Value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in boostTable" :key="b.card">
            <td>{{ b.card }}</td>
            <td>{{ b.value }}</td>
          </tr>
        </tbody>
      </table>
      <ul>
        <li v-for="note in boostingNotes" :key="note">{{ note }}</li>
      </ul>
      <hr>
      <h3>🔄 Swap Mechanics</h3>
      <ul>
        <li v-for="s in swapMechanics" :key="s.type">
          {{ s.icon }} <strong>{{ s.type }}:</strong><br>{{ s.desc }}
        </li>
      </ul>
      <hr>
      <h3>📌 Notes on Actions</h3>
      <ul>
        <li v-for="note in actionNotes" :key="note">{{ note }}</li>
      </ul>
      <hr>
      <h3>🧮 Action Limit</h3>
      <p>Each turn comes with a limited number of actions. Once you've used all your actions, you won’t be able to perform any more until the next turn.</p>
      <p><strong>📝 Actions that count toward the limit:</strong></p>
      <ul>
        <li v-for="a in actionLimit" :key="a">{{ a }}</li>
      </ul>
      <p>⛔ Once the limit is reached, further actions are blocked for that turn.</p>
      <hr>
      <p><a href="/main-menu">⬅️ Back to Main Page</a></p>
    </div>
  `
};
