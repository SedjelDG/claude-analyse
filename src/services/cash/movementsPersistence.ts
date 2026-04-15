import { createRuntimeCashMovement, loadRuntimeCashMovements } from "@/lib/desktop-runtime";
import type { CashMovement } from "@/types/cash";

export async function loadPersistedCashMovements(): Promise<CashMovement[] | null> {
  return loadRuntimeCashMovements();
}

export async function createPersistedCashMovement(
  movement: Omit<CashMovement, "id" | "timestamp">,
): Promise<CashMovement | null> {
  return createRuntimeCashMovement(movement);
}
