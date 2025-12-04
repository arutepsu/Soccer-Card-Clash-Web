// frontend/src/types/FieldCards.ts
export interface FieldCardLike {
  id?: string | number;
  img?: string;
  isDefeated?: boolean;
}
export type SlotLike =
  | FieldSlot
  | FieldCardData
  | FieldCardLike
  | null
  | undefined;

  export interface FieldCardData {
  fileName?: string;
  isBoosted?: boolean;
  [key: string]: unknown;
}

export interface FieldSlot {
  id?: string;
  card?: FieldCardData | null;
  [key: string]: unknown;
}
