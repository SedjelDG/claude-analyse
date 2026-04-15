import React, { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSettings, DEFAULT_HOTKEYS } from "@/hooks/useSettings";
import { useUserStore } from "@/hooks/useUserStore";

export const MIN_VISIBLE_ACTIONS = 6;

/**
 * useSettingsScreen — Master hook for the Settings page UI logic.
 * Encapsulates key capturing, connection testing, and action toggling.
 */
export function useSettingsScreen() {
  const { currentUser } = useUserStore();
  const { 
    settings, 
    updateSettings, 
    updateHardware, 
    getHotkeys, 
    updateHotkey, 
    resetHotkeys 
  } = useSettings(currentUser?.id);
  
  const { toast } = useToast();
  const [capturingKey, setCapturingKey] = useState<string | null>(null);

  const testConnection = useCallback((device: string) => {
    toast({ title: `Test de ${device}`, description: "Connexion en cours... (simulation)" });
    setTimeout(() => toast({ title: device, description: "Connexion réussie ✓" }), 1500);
  }, [toast]);

  const handleKeyCapture = useCallback((actionKey: string) => {
    setCapturingKey(actionKey);
  }, []);

  const handleKeyCaptureKeyDown = useCallback((e: React.KeyboardEvent, actionKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    let combo = "";
    if (e.ctrlKey) combo += "Ctrl+";
    if (e.altKey) combo += "Alt+";
    if (e.shiftKey) combo += "Shift+";
    
    const key = e.key;
    if (["Control", "Alt", "Shift", "Meta"].includes(key)) return;
    
    const displayKey = key.startsWith("F") && key.length > 1 ? key : key.toUpperCase();
    combo += displayKey;
    
    updateHotkey(actionKey, combo);
    setCapturingKey(null);
    toast({ title: "Raccourci modifié", description: `${actionKey}: ${combo}` });
  }, [updateHotkey, toast]);

  const hiddenActions = settings.hiddenActions || [];
  
  const toggleAction = useCallback((actionKey: string, visible: boolean, totalActions: number) => {
    const currentVisibleCount = totalActions - hiddenActions.length;
    if (!visible && currentVisibleCount <= MIN_VISIBLE_ACTIONS) {
      toast({ 
        title: "Minimum 6 boutons requis", 
        description: "Vous devez garder au moins 6 boutons actifs." 
      });
      return;
    }
    
    updateSettings({
      hiddenActions: visible
        ? hiddenActions.filter((a) => a !== actionKey)
        : [...hiddenActions, actionKey],
    });
  }, [hiddenActions, updateSettings, toast]);

  const handleResetHotkeys = useCallback(() => {
    resetHotkeys();
    toast({ title: "Raccourcis réinitialisés" });
  }, [resetHotkeys, toast]);

  return {
    settings,
    updateSettings,
    updateHardware,
    hotkeys: getHotkeys(),
    capturingKey,
    handleKeyCapture,
    handleKeyCaptureKeyDown,
    handleBlur: () => setCapturingKey(null),
    toggleAction,
    testConnection,
    handleResetHotkeys,
    currentUser,
    isLoggedIn: !!currentUser,
    DEFAULT_HOTKEYS
  };
}
