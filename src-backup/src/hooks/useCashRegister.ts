import { useState, useEffect, useCallback } from "react";

export interface CashMovement {
  id: string;
  type: "add" | "remove" | "sale" | "return";
  amount: number;
  timestamp: string;
  note: string;
  userId: string;
  userName: string;
}

const STORAGE_KEY = "ds-cash-movements";

function loadMovements(): CashMovement[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export function useCashRegister() {
  const [movements, setMovements] = useState<CashMovement[]>(loadMovements);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(movements));
  }, [movements]);

  const balance = movements.reduce((sum, m) => {
    if (m.type === "add" || m.type === "sale") return sum + m.amount;
    if (m.type === "remove" || m.type === "return") return sum - m.amount;
    return sum;
  }, 0);

  const addMovement = useCallback((movement: Omit<CashMovement, "id" | "timestamp">) => {
    setMovements((prev) => [
      ...prev,
      { ...movement, id: `mov-${Date.now()}`, timestamp: new Date().toISOString() },
    ]);
  }, []);

  const clearMovements = useCallback(() => {
    setMovements([]);
  }, []);

  return { movements, balance, addMovement, clearMovements };
}
