import { useState, useEffect, useCallback } from "react";

export const DEFAULT_HOTKEYS: Record<string, string> = {
  "action.add": "F3",
  "action.deduct": "F2",
  "action.search": "F4",
  "action.remove": "F5",
  "action.removeAll": "F6",
  "action.lock": "Ctrl+L",
  "action.discount": "Ctrl+D",
  "action.return": "Ctrl+R",
  "action.payment": "F9",
  "action.hold": "F1",
  "action.quantity": "F11",
  "action.deposit": "F7",
  "action.drawer": "Ctrl+T",
  "action.treasury": "Ctrl+Y",
  "action.client": "Ctrl+C",
  "action.gift": "Ctrl+G",
  "action.close": "Ctrl+X",
  "action.packCycle": "F8",
};

export interface AppSettings {
  language: "fr" | "ar" | "en";
  theme: "light" | "dark";
  layout: "desktop" | "tactile";
  lockRegisterPanels: boolean;
  customHotkeys: Record<string, string>;
  hiddenActions: string[];
  hardware: {
    printer: { enabled: boolean; port: string; type: string };
    scanner: { enabled: boolean; port: string; type: string };
    scale: { enabled: boolean; port: string; type: string; brand: string };
  };
}

const defaultSettings: AppSettings = {
  language: "fr",
  theme: "light",
  layout: "desktop",
  lockRegisterPanels: false,
  customHotkeys: {},
  hiddenActions: [],
  hardware: {
    printer: { enabled: false, port: "", type: "thermal" },
    scanner: { enabled: false, port: "", type: "usb" },
    scale: { enabled: false, port: "", type: "serial", brand: "" },
  },
};

function getStorageKey(userId?: string) {
  return userId ? `ds-settings-${userId}` : "ds-settings";
}

export const useSettings = (userId?: string) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(getStorageKey(userId));
      if (stored) return { ...defaultSettings, ...JSON.parse(stored) };
    } catch {}
    return defaultSettings;
  });

  // Reload settings when userId changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(getStorageKey(userId));
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } else {
        setSettings(defaultSettings);
      }
    } catch {
      setSettings(defaultSettings);
    }
  }, [userId]);

  useEffect(() => {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(settings));
  }, [settings, userId]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (settings.language === "ar") {
      root.setAttribute("dir", "rtl");
      root.setAttribute("lang", "ar");
      root.classList.add("font-arabic");
    } else {
      root.setAttribute("dir", "ltr");
      root.setAttribute("lang", settings.language);
      root.classList.remove("font-arabic");
    }
  }, [settings.theme, settings.language]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateHardware = useCallback(
    (device: keyof AppSettings["hardware"], patch: Record<string, any>) => {
      setSettings((prev) => ({
        ...prev,
        hardware: { ...prev.hardware, [device]: { ...prev.hardware[device], ...patch } },
      }));
    },
    []
  );

  const getHotkeys = useCallback((): Record<string, string> => {
    return { ...DEFAULT_HOTKEYS, ...settings.customHotkeys };
  }, [settings.customHotkeys]);

  const updateHotkey = useCallback((actionKey: string, combo: string) => {
    setSettings((prev) => ({
      ...prev,
      customHotkeys: { ...prev.customHotkeys, [actionKey]: combo },
    }));
  }, []);

  const resetHotkeys = useCallback(() => {
    setSettings((prev) => ({ ...prev, customHotkeys: {} }));
  }, []);

  return { settings, updateSettings, updateHardware, getHotkeys, updateHotkey, resetHotkeys };
};
