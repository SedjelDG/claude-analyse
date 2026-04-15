import {
  closeRuntimeActiveShift,
  ensureRuntimeActiveShift,
  getRuntimeActiveShift,
} from "@/lib/desktop-runtime";
import type { RegisterShift } from "@/types/shift";

export async function loadActiveShift(
  registerId: string,
): Promise<RegisterShift | null> {
  return getRuntimeActiveShift(registerId);
}

export async function ensureActiveShift(payload: {
  registerId: string;
  userId: string;
  userName: string;
  openingFloat?: number;
}): Promise<RegisterShift | null> {
  return ensureRuntimeActiveShift(payload);
}

export async function closeActiveShift(payload: {
  registerId: string;
  userId: string;
  userName: string;
  closingBalance: number;
  notes?: string;
}): Promise<RegisterShift | null> {
  return closeRuntimeActiveShift(payload);
}
