// frontend/src/types/PlayingFieldTarget.ts (optional helper file)
export type PlayingFieldTarget =
  | { kind: 'defender'; index: number }
  | { kind: 'goalkeeper' }
  | null;
