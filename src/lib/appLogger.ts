export interface AppLogEntry {
  level: "info" | "warn" | "error";
  message: string;
  createdAt: string;
  context?: Record<string, unknown>;
}

const APP_LOG_STORAGE_KEY = "ds-app-logs";
const MAX_LOG_ENTRIES = 200;

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function appendAppLog(entry: Omit<AppLogEntry, "createdAt">) {
  const nextEntry: AppLogEntry = {
    ...entry,
    createdAt: new Date().toISOString(),
  };

  if (canUseLocalStorage()) {
    try {
      const current = localStorage.getItem(APP_LOG_STORAGE_KEY);
      const parsed = current ? (JSON.parse(current) as AppLogEntry[]) : [];
      const nextLogs = [...parsed, nextEntry].slice(-MAX_LOG_ENTRIES);
      localStorage.setItem(APP_LOG_STORAGE_KEY, JSON.stringify(nextLogs));
    } catch {
      console.error("Failed to persist app log entry", nextEntry);
    }
  }

  if (nextEntry.level === "error") {
    console.error(nextEntry.message, nextEntry.context);
    return;
  }

  if (nextEntry.level === "warn") {
    console.warn(nextEntry.message, nextEntry.context);
  } else if (nextEntry.level === "info") {
    console.info(nextEntry.message, nextEntry.context);
  }

}

export function logAppError(error: unknown, context?: Record<string, unknown>) {
  const normalizedError =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : {
          message: String(error),
        };

  appendAppLog({
    level: "error",
    message: "Application error",
    context: {
      ...context,
      error: normalizedError,
    },
  });
}
