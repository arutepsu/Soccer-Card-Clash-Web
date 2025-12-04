import { FieldCardData, FieldSlot } from "../components/fieldCardRenderer";

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