import { useState, useEffect, useCallback } from "react";
import { 
  createPersistedSale, 
  loadPersistedSales,
  refundPersistedSale,
  refundPersistedItems
} from "@/services/sales/historyPersistence";
import type { Sale, SaleItem } from "@/types/sales";

export type { Sale, SaleItem } from "@/types/sales";

const STORAGE_KEY = "ds-sales-history";

function loadSales(): Sale[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export function useSalesHistory() {
  const [sales, setSales] = useState<Sale[]>(loadSales);
  const [isHydratedFromNative, setIsHydratedFromNative] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const hydrateFromNative = async () => {
      try {
        const persistedSales = await loadPersistedSales();
        if (!persistedSales || cancelled) {
          setIsHydratedFromNative(true);
          return;
        }
        setSales(persistedSales);
        setIsHydratedFromNative(true);
      } catch (error) {
        console.error("Failed to load persisted sales", error);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
  }, [isHydratedFromNative, sales]);

  const addSale = useCallback(async (sale: Omit<Sale, "id" | "timestamp">) => {
    const persisted = await createPersistedSale(sale);
    if (persisted) {
      setSales((prev) => [persisted, ...prev]);
      return persisted;
    }

    const localSale = { ...sale, id: `sale-${Date.now()}`, timestamp: new Date().toISOString() };
    setSales((prev) => [localSale, ...prev]);
    return localSale;
  }, []);

  const injectSale = useCallback((sale: Sale) => {
    setSales(prev => [sale, ...prev]);
  }, []);

  const refundSale = useCallback(async (saleId: string) => {
    try {
      const updated = await refundPersistedSale(saleId);
      if (updated) {
        setSales((prev) => prev.map((s) => (s.id === saleId ? updated : s)));
        return;
      }
    } catch (error) {
      console.error("Failed to persist refund", error);
    }
    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, fullyRefunded: true, refundedItems: s.items.map((i) => i.id) } : s))
    );
  }, []);

  const refundItems = useCallback(async (saleId: string, itemIds: string[]) => {
    try {
      const updated = await refundPersistedItems(saleId, itemIds);
      if (updated) {
        setSales((prev) => prev.map((s) => (s.id === saleId ? updated : s)));
        return;
      }
    } catch (error) {
      console.error("Failed to persist item refunds", error);
    }
    setSales((prev) =>
      prev.map((s) => {
        if (s.id !== saleId) return s;
        const existing = s.refundedItems || [];
        const merged = [...new Set([...existing, ...itemIds])];
        return { ...s, refundedItems: merged, fullyRefunded: merged.length === s.items.length };
      })
    );
  }, []);

  return { sales, addSale, refundSale, refundItems, injectSale };
}
