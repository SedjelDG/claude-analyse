import type { CashMovement } from "@/types/cash";
import type { DesktopAppInfo, DesktopAppPaths, DesktopDatabaseStatus } from "@/types/desktop-api";
import type { RegisterSessionState } from "@/types/register";
import type { Sale, SaleDraft } from "@/types/sales";
import type { RegisterShift } from "@/types/shift";

type TauriInvoke = <T>(command: string, args?: Record<string, unknown>) => Promise<T>;

export function getTauriInvoke(): TauriInvoke {
  if (typeof window === "undefined" || !window.__TAURI_INTERNALS__?.invoke) {
    throw new Error("Native desktop runtime is unavailable. Start the app with Tauri.");
  }

  return window.__TAURI_INTERNALS__.invoke;
}

export async function loadRuntimeRegisterSession(
  registerId: string,
): Promise<RegisterSessionState | null> {
  return getTauriInvoke()<RegisterSessionState | null>("register_load_session", { registerId });
}

export async function saveRuntimeRegisterSession(
  session: RegisterSessionState,
): Promise<{ ok: true; updatedAt: string }> {
  return getTauriInvoke()<{ ok: true; updatedAt: string }>("register_save_session", { session });
}

export async function loadRuntimeSales(): Promise<Sale[]> {
  return getTauriInvoke()<Sale[]>("sales_list");
}

export async function createRuntimeSale(sale: SaleDraft): Promise<Sale> {
  return getTauriInvoke()<Sale>("sales_create", { sale });
}

export async function refundRuntimeSale(saleId: string): Promise<Sale> {
  return getTauriInvoke()<Sale>("sales_refund", { saleId });
}

export async function refundRuntimeItems(saleId: string, itemIds: string[]): Promise<Sale> {
  return getTauriInvoke()<Sale>("sales_refund_items", { saleId, itemIds });
}

export async function finalizeRuntimeRegisterCheckout(payload: {
  sale: SaleDraft;
  session: RegisterSessionState;
}): Promise<Sale> {
  return getTauriInvoke()<Sale>("sales_finalize_register_checkout", payload);
}

export async function getRuntimeAppInfo(): Promise<DesktopAppInfo> {
  const info = await getTauriInvoke()<{
    name: string;
    version: string;
    platform: string;
    is_packaged: boolean;
  }>("app_get_info");

  return {
    name: info.name,
    version: info.version,
    platform: info.platform,
    isPackaged: info.is_packaged,
    versions: {},
  };
}

export async function getRuntimeAppPaths(): Promise<DesktopAppPaths> {
  const paths = await getTauriInvoke()<{
    user_data: string;
    documents: string;
    temp: string;
  }>("app_get_paths");

  return {
    userData: paths.user_data,
    documents: paths.documents,
    temp: paths.temp,
  };
}

export async function getRuntimeDatabaseStatus(): Promise<DesktopDatabaseStatus> {
  const status = await getTauriInvoke()<{
    driver: string;
    configured: boolean;
    connected: boolean;
    database_path: string;
  }>("db_status");

  return {
    driver: status.driver,
    configured: status.configured,
    connected: status.connected,
    databasePath: status.database_path,
  };
}

export async function getRuntimeSetting<T = unknown>(key: string): Promise<T | null> {
  return getTauriInvoke()<T | null>("settings_get", { key });
}

export async function saveRuntimeSetting<T = unknown>(
  key: string,
  value: T,
): Promise<{ ok: true; updatedAt: string }> {
  return getTauriInvoke()<{ ok: true; updatedAt: string }>("settings_save", { key, value });
}

export async function loadRuntimeCashMovements(): Promise<CashMovement[]> {
  return getTauriInvoke()<CashMovement[]>("cash_list");
}

export async function createRuntimeCashMovement(
  movement: Omit<CashMovement, "id" | "timestamp">,
): Promise<CashMovement> {
  // satisfies backend requirement for strict deserialization
  const payload = {
    ...movement,
    id: "",
    timestamp: new Date().toISOString()
  };
  return getTauriInvoke()<CashMovement>("cash_create", { movement: payload });
}

export async function getRuntimeActiveShift(registerId: string): Promise<RegisterShift | null> {
  return getTauriInvoke()<RegisterShift | null>("shift_get_active", { registerId });
}

export async function ensureRuntimeActiveShift(payload: {
  registerId: string;
  userId: string;
  userName: string;
  openingFloat?: number;
}): Promise<RegisterShift | null> {
  return getTauriInvoke()<RegisterShift>("shift_ensure_active", payload);
}

export async function closeRuntimeActiveShift(payload: {
  registerId: string;
  userId: string;
  userName: string;
  closingBalance: number;
  notes?: string;
}): Promise<RegisterShift | null> {
  return getTauriInvoke()<RegisterShift | null>("shift_close_active", payload);
}
