export const ActionNames = {
  RegularAttack:   'RegularAttack',
  DoubleAttack:    'DoubleAttack',
  Undo:            'Undo',
  Redo:            'Redo',
  BoostDefender:   'BoostDefender',
  BoostGoalkeeper: 'BoostGoalkeeper',
  RegularSwap:     'RegularSwap',
  ReverseSwap:     'ReverseSwap',
} as const;

export type ActionName = typeof ActionNames[keyof typeof ActionNames];
