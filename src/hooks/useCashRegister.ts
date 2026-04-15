import { useState, useEffect, useCallback } from "react";
import {
  createPersistedCashMovement,
  loadPersistedCashMovements,
} from "@/services/cash/movementsPersistence";
import type { CashMovement } from "@/types/cash";

export type { CashMovement } from "@/types/cash";

const STORAGE_KEY = "ds-cash-movements";

function loadMovements(): CashMovement[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { }
  return [];
}

export function useCashRegister() {
  const [movements, setMovements] = useState<CashMovement[]>(loadMovements);
  const [isHydratedFromNative, setIsHydratedFromNative] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const hydrateFromNative = async () => {
      try {
        const persistedMovements = await loadPersistedCashMovements();
        if (cancelled) {
          return;
        }

        if (persistedMovements) {
          setMovements(persistedMovements);
        }

        setIsHydratedFromNative(true);
      } catch (error) {
        console.error("Failed to load persisted cash movements", error);
        if (!cancelled) {
          setIsHydratedFromNative(true);
        }
      }
    };

    void hydrateFromNative();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isHydratedFromNative) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(movements));
  }, [isHydratedFromNative, movements]);

  const balance = movements.reduce((sum, m) => {
    if (m.type === "add" || m.type === "sale") return sum + m.amount;
    if (m.type === "remove" || m.type === "return") return sum - m.amount;
    return sum;
  }, 0);

  const addMovement = useCallback(async (movement: Omit<CashMovement, "id" | "timestamp">) => {
    const persistedMovement = await createPersistedCashMovement(movement);
    if (persistedMovement) {
      setMovements((prev) => [...prev, persistedMovement]);
      return persistedMovement;
    }

    const localMovement = {
      ...movement,
      id: `mov-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setMovements((prev) => [...prev, localMovement]);
    return localMovement;
  }, []);

  const clearMovements = useCallback(() => {
    setMovements([]);
  }, []);

  return { movements, balance, addMovement, clearMovements };
}
