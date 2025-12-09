// frontend/src/types/AttackerDefenders.ts
export type SelectedTarget =
  | { kind: 'defender'; index: number }
  | { kind: 'goalkeeper' }
  | null;
