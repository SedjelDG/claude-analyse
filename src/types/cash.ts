export type CashMovementType = "add" | "remove" | "sale" | "return";

export interface CashMovement {
  id: string;
  type: CashMovementType;
  amount: number;
  timestamp: string;
  note: string;
  userId: string;
  userName: string;
}
