/**
 * useRegisterKeyboard — encapsulates ALL keyboard behavior for the
 * register page: barcode interception, hotkey dispatch, arrow
 * navigation, numpad multiplicateur, escape cascade, and smart
 * search trigger.
 *
 * Returns the current multiplier state for UI display.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { parseScaleBarcode } from "@/services/register/barcode";
import { ALL_ACTION_BUTTONS } from "@/services/register/registerConstants";

// ── Public types ────────────────────────────────────────────────────

export interface MultiplierDisplay {
  /** Digits typed on the numpad but not yet locked with '*' */
  pending: string;
  /** The multiplier value after the user pressed '*' */
  locked: number | null;
}

export interface OpenDialogs {
  search: boolean;
  quantity: boolean;
  discount: boolean;
  prixLibre: boolean;
  salesHistory: boolean;
  payment: boolean;
  cash: boolean;
}

export interface UseRegisterKeyboardOptions {
  /** Action dispatch map from createRegisterActions */
  actions: Record<string, () => void>;
  /** Resolved hotkeys from useSettings().getHotkeys() */
  hotkeys: Record<string, string>;
  /** Is the register screen locked? */
  isLocked: boolean;
  /** Which dialogs are currently open */
  openDialogs: OpenDialogs;
  /** Number of items in the active cart */
  cartLength: number;
  /** ID of the currently selected cart item */
  selectedItemId: string | null;

  // ── Navigation callbacks (UI-owned state changes) ──
  onNavigateCart: (direction: "up" | "down") => void;
  onSwitchClient: (direction: "left" | "right") => void;
  onTriggerSearch: (initialChar: string) => void;
  onDismissTopDialog: () => void;
  onDeselectItem: () => void;

  // ── Barcode callbacks ──
  onBarcodeScanned: (code: string) => void;
  onScaleBarcodeScanned: (plu: string, weight: number, rawCode: string) => void;
  barcodeScaleSettings: { enabled: boolean; prefix: string } | null | undefined;
}

export interface UseRegisterKeyboardResult {
  multiplier: number;
  multiplierDisplay: MultiplierDisplay;
  resetMultiplier: () => void;
}

// ── Hook implementation ─────────────────────────────────────────────

export function useRegisterKeyboard(
  opts: UseRegisterKeyboardOptions,
): UseRegisterKeyboardResult {
  // Multiplier state
  const numpadBufferRef = useRef("");
  const multiplierRef = useRef(1);
  const [multiplierDisplay, setMultiplierDisplay] = useState<MultiplierDisplay>({
    pending: "",
    locked: null,
  });

  const resetMultiplier = useCallback(() => {
    multiplierRef.current = 1;
    numpadBufferRef.current = "";
    setMultiplierDisplay({ pending: "", locked: null });
  }, []);

  // Barcode interceptor refs
  const barcodeBuffer = useRef("");
  const lastKeyTime = useRef(0);
  const lastIsFast = useRef(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep a stable ref to the latest options so the effect doesn't
  // need to re-register on every render.
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // ── Build shortcut lookup map ──
  const shortcutMapRef = useRef<Record<string, string>>({});
  useEffect(() => {
    const map: Record<string, string> = {};
    ALL_ACTION_BUTTONS.forEach((btn) => {
      const hk = opts.hotkeys[btn.key];
      if (hk) map[hk.toLowerCase()] = btn.key;
    });
    shortcutMapRef.current = map;
  }, [opts.hotkeys]);

  // ── Master keydown handler ──
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const o = optsRef.current;

      // Never intercept when focus is in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // ── Barcode scanner detection (fast-key buffering) ──
      const now = Date.now();
      const isFast = now - lastKeyTime.current < 50;
      lastIsFast.current = isFast;

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }

      // Clear partial scanner buffer on slow human keystrokes
      if (!isFast && barcodeBuffer.current !== "" && e.key !== "Enter") {
        barcodeBuffer.current = "";
      }

      if (e.key === "Enter") {
        if (barcodeBuffer.current.length >= 5 && isFast) {
          const code = barcodeBuffer.current;

          // Try scale barcode first
          const parsed = parseScaleBarcode(code, o.barcodeScaleSettings);
          if (parsed) {
            o.onScaleBarcodeScanned(parsed.plu, parsed.weight, code);
          } else {
            o.onBarcodeScanned(code);
          }

          e.preventDefault();
          e.stopPropagation();
        } else {
          // BUG FIX: If Enter is pressed while a multiplier is active (either typed or locked)
          // but NOT as part of a barcode scan, reset the multiplier to prevent it from 
          // accidentally applying to the current selection.
          const hasMultiplier = numpadBufferRef.current !== "" || multiplierRef.current > 1;
          if (hasMultiplier) {
            resetMultiplier();
            e.preventDefault();
            e.stopPropagation();
          }
        }
        barcodeBuffer.current = "";
        lastKeyTime.current = now;
        return;
      }

      if (e.key.length === 1 && /[0-9a-zA-Z]/.test(e.key)) {
        if (isFast || barcodeBuffer.current === "") {
          barcodeBuffer.current += e.key;
        } else {
          barcodeBuffer.current = e.key;
        }
      }
      lastKeyTime.current = now;

      // ── Below this point: only process if not locked ──
      if (o.isLocked) return;

      // ── ESCAPE CASCADE ──
      if (e.key === "Escape") {
        e.preventDefault();
        const hasMultiplier = numpadBufferRef.current !== "" || multiplierRef.current > 1;
        // Dismiss the most recent open dialog, multiplier, or deselect item
        if (o.openDialogs.search || o.openDialogs.quantity ||
            o.openDialogs.discount || o.openDialogs.prixLibre ||
            o.openDialogs.salesHistory ||
            o.openDialogs.payment || o.openDialogs.cash) {
          o.onDismissTopDialog();
        } else if (hasMultiplier) {
          resetMultiplier();
        } else if (o.selectedItemId) {
          o.onDeselectItem();
        }
        return;
      }

      const isAnyDialogOpen =
        o.openDialogs.search || o.openDialogs.quantity ||
        o.openDialogs.discount || o.openDialogs.prixLibre ||
        o.openDialogs.salesHistory ||
        o.openDialogs.payment || o.openDialogs.cash;

      // ── ARROW NAVIGATION (only when no dialog is open) ──
      if (!isAnyDialogOpen) {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          if (o.cartLength > 0) {
            o.onNavigateCart(e.key === "ArrowUp" ? "up" : "down");
          }
          return;
        }

        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          o.onSwitchClient(e.key === "ArrowLeft" ? "left" : "right");
          return;
        }
      }

      // ── F-KEY DISPATCH ──
      if (e.key.startsWith("F") && e.key.length > 1 && !e.ctrlKey) {
        const actionKey = shortcutMapRef.current[e.key.toLowerCase()];
        if (actionKey && o.actions[actionKey]) {
          e.preventDefault();
          o.actions[actionKey]();
          return;
        }
      }

      // ── CTRL+KEY DISPATCH ──
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        const combo = `ctrl+${e.key.toLowerCase()}`;
        const actionKey = shortcutMapRef.current[combo];
        if (actionKey && o.actions[actionKey]) {
          e.preventDefault();
          o.actions[actionKey]();
          return;
        }
      }

      // ── MULTIPLICATEUR (Numpad buffer) ──
      if (!isAnyDialogOpen) {
        if (e.code.startsWith("Numpad") && e.key >= "0" && e.key <= "9") {
          e.preventDefault();
          numpadBufferRef.current += e.key;
          setMultiplierDisplay((prev) => ({
            ...prev,
            pending: numpadBufferRef.current,
          }));
          return;
        }

        if (e.key === "*" || e.code === "NumpadMultiply") {
          e.preventDefault();
          if (numpadBufferRef.current !== "") {
            const val = parseInt(numpadBufferRef.current, 10);
            multiplierRef.current = val;
            setMultiplierDisplay({ pending: "", locked: val });
            numpadBufferRef.current = "";
          } else if (multiplierRef.current > 1) {
            // Reset back to 1
            multiplierRef.current = 1;
            setMultiplierDisplay({ pending: "", locked: null });
          }
          return;
        }

        if (e.key === "Backspace" && numpadBufferRef.current !== "") {
          numpadBufferRef.current = numpadBufferRef.current.slice(0, -1);
          setMultiplierDisplay((prev) => ({
            ...prev,
            pending: numpadBufferRef.current,
          }));
          return;
        }
      }

      // ── SMART SEARCH TRIGGER ──
      // Only fires on slow human typing when no dialog is open
      if (
        !isAnyDialogOpen &&
        e.key.length === 1 &&
        /[a-zA-Z0-9]/.test(e.key) &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.code.startsWith("Numpad")
      ) {
        // Ignore if scanner buffer is building
        if (
          barcodeBuffer.current.length > 1 ||
          (barcodeBuffer.current.length === 1 && lastIsFast.current)
        ) {
          return;
        }

        searchTimeoutRef.current = setTimeout(() => {
          optsRef.current.onTriggerSearch(e.key);
          searchTimeoutRef.current = null;
        }, 50);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown, true);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // We use optsRef so this effect only needs to register once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    multiplier: multiplierRef.current > 1 || numpadBufferRef.current !== "" 
      ? (numpadBufferRef.current !== "" ? parseInt(numpadBufferRef.current, 10) : multiplierRef.current) 
      : 1,
    multiplierDisplay,
    resetMultiplier,
  };
}
// Forced sync: 2026-04-11T13:45:00Z
