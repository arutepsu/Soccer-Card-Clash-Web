export type PlayingFieldTarget =
  | { kind: 'defender'; index: number }
  | { kind: 'goalkeeper' }
  | null;
