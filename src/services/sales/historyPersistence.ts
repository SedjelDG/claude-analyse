import {
  createRuntimeSale,
  finalizeRuntimeRegisterCheckout,
  loadRuntimeSales,
  refundRuntimeSale,
  refundRuntimeItems,
} from "@/lib/desktop-runtime";
import type { RegisterSessionState } from "@/types/register";
import type { Sale } from "@/types/sales";

export async function createPersistedSale(
  sale: Omit<Sale, "id" | "timestamp">,
): Promise<Sale | null> {
  return createRuntimeSale(sale);
}

export async function loadPersistedSales(): Promise<Sale[] | null> {
  return loadRuntimeSales();
}

export async function finalizePersistedRegisterCheckout(payload: {
  sale: Omit<Sale, "id" | "timestamp">;
  session: RegisterSessionState;
}): Promise<Sale | null> {
  return finalizeRuntimeRegisterCheckout(payload);
}

export async function refundPersistedSale(saleId: string): Promise<Sale | null> {
  return refundRuntimeSale(saleId);
}

export async function refundPersistedItems(saleId: string, itemIds: string[]): Promise<Sale | null> {
  return refundRuntimeItems(saleId, itemIds);
}
