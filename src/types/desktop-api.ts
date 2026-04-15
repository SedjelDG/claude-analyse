export interface DesktopAppInfo {
  name: string;
  version: string;
  platform: string;
  isPackaged: boolean;
  versions: Record<string, string | undefined>;
}

export interface DesktopAppPaths {
  userData: string;
  documents: string;
  temp: string;
}

export interface DesktopDatabaseStatus {
  driver: string;
  configured: boolean;
  connected: boolean;
  databasePath: string;
  migrationCount?: number;
  lastMigration?: { id: string; applied_at: string } | null;
  tables?: string[];
}
