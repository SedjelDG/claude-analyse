import { getRuntimeSetting, saveRuntimeSetting } from "@/lib/desktop-runtime";

export async function loadPersistedUserValue<T>(key: string): Promise<T | null> {
  return getRuntimeSetting<T>(key);
}

export async function savePersistedUserValue<T>(
  key: string,
  value: T,
): Promise<{ ok: true; updatedAt: string } | null> {
  return saveRuntimeSetting(key, value);
}
