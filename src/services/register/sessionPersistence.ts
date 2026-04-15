import {
  loadRuntimeRegisterSession,
  saveRuntimeRegisterSession,
} from "@/lib/desktop-runtime";
import type { RegisterSessionState } from "@/types/register";

const DEFAULT_REGISTER_ID = "register-main";

export async function loadRegisterSession(
  registerId: string = DEFAULT_REGISTER_ID,
): Promise<RegisterSessionState | null> {
  return loadRuntimeRegisterSession(registerId);
}

export async function saveRegisterSession(session: RegisterSessionState): Promise<void> {
  await saveRuntimeRegisterSession(session);
}
