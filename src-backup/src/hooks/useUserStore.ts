import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import React from "react";

export type UserRole = "manager" | "cashier";

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  passkey: string;
}

const STORAGE_KEY = "ds-user-profiles";
const CURRENT_USER_KEY = "ds-current-user";

const defaultProfiles: UserProfile[] = [
  { id: "manager-1", name: "Admin", role: "manager", passkey: "1234" },
  { id: "cashier-1", name: "Caissier 1", role: "cashier", passkey: "4321" },
];

function loadProfiles(): UserProfile[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  // First time — seed defaults
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProfiles));
  return defaultProfiles;
}

function saveProfiles(profiles: UserProfile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

interface UserStoreContextValue {
  profiles: UserProfile[];
  currentUser: UserProfile | null;
  login: (passkey: string) => UserProfile | null;
  logout: () => void;
  hasProfiles: () => boolean;
  hasManagers: () => boolean;
  hasCashiers: () => boolean;
  addProfile: (profile: Omit<UserProfile, "id">) => UserProfile;
  updateProfile: (id: string, patch: Partial<Omit<UserProfile, "id">>) => void;
  deleteProfile: (id: string) => boolean;
  canDeleteProfile: (id: string) => { allowed: boolean; warning?: string };
  isOpenMode: () => boolean;
}

const UserStoreContext = createContext<UserStoreContextValue | null>(null);

export function UserStoreProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<UserProfile[]>(loadProfiles);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        const user = JSON.parse(stored);
        // Validate user still exists
        const allProfiles = loadProfiles();
        if (allProfiles.find((p) => p.id === user.id)) return user;
      }
    } catch {}
    return null;
  });

  useEffect(() => {
    saveProfiles(profiles);
  }, [profiles]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }, [currentUser]);

  const login = useCallback(
    (passkey: string): UserProfile | null => {
      const user = profiles.find((p) => p.passkey === passkey);
      if (user) {
        setCurrentUser(user);
        return user;
      }
      return null;
    },
    [profiles]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const hasProfiles = useCallback(() => {
    return profiles.some((p) => p.role === "manager") && profiles.some((p) => p.role === "cashier");
  }, [profiles]);

  const hasManagers = useCallback(() => profiles.some((p) => p.role === "manager"), [profiles]);
  const hasCashiers = useCallback(() => profiles.some((p) => p.role === "cashier"), [profiles]);

  const isOpenMode = useCallback(() => !hasProfiles(), [hasProfiles]);

  const addProfile = useCallback((profile: Omit<UserProfile, "id">): UserProfile => {
    const newProfile: UserProfile = { ...profile, id: `user-${Date.now()}` };
    setProfiles((prev) => [...prev, newProfile]);
    return newProfile;
  }, []);

  const updateProfile = useCallback((id: string, patch: Partial<Omit<UserProfile, "id">>) => {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    // Update current user if it's the one being edited
    setCurrentUser((cur) => (cur && cur.id === id ? { ...cur, ...patch } : cur));
  }, []);

  const canDeleteProfile = useCallback(
    (id: string): { allowed: boolean; warning?: string } => {
      const profile = profiles.find((p) => p.id === id);
      if (!profile) return { allowed: false };

      const managersCount = profiles.filter((p) => p.role === "manager").length;
      const cashiersCount = profiles.filter((p) => p.role === "cashier").length;

      if (profile.role === "manager" && managersCount === 1 && cashiersCount === 0) {
        return { allowed: true, warning: "Le système passera en mode ouvert (sans clé d'accès)." };
      }
      if (profile.role === "cashier" && cashiersCount === 1 && managersCount === 0) {
        return { allowed: true, warning: "Le système passera en mode ouvert (sans clé d'accès)." };
      }
      if (profile.role === "manager" && managersCount === 1) {
        return { allowed: true, warning: "Il n'y aura plus de gestionnaire. Le système passera en mode ouvert." };
      }
      if (profile.role === "cashier" && cashiersCount === 1) {
        return { allowed: true, warning: "Il n'y aura plus de caissier. Le système passera en mode ouvert." };
      }

      return { allowed: true };
    },
    [profiles]
  );

  const deleteProfile = useCallback(
    (id: string): boolean => {
      const { allowed } = canDeleteProfile(id);
      if (!allowed) return false;
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      if (currentUser?.id === id) setCurrentUser(null);
      return true;
    },
    [canDeleteProfile, currentUser]
  );

  const value: UserStoreContextValue = {
    profiles,
    currentUser,
    login,
    logout,
    hasProfiles,
    hasManagers,
    hasCashiers,
    addProfile,
    updateProfile,
    deleteProfile,
    canDeleteProfile,
    isOpenMode,
  };

  return React.createElement(UserStoreContext.Provider, { value }, children);
}

export function useUserStore() {
  const ctx = useContext(UserStoreContext);
  if (!ctx) throw new Error("useUserStore must be used within UserStoreProvider");
  return ctx;
}

// Standard cashier identity for open mode
export const STANDARD_CASHIER: UserProfile = {
  id: "standard-cashier",
  name: "Caissier Standard",
  role: "cashier",
  passkey: "",
};
