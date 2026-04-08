import { useState, useEffect, useCallback } from "react";

export interface SaleItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  barcode?: string;
}

export interface Sale {
  id: string;
  timestamp: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: "cash" | "card";
  clientNumber: number;
  cashierName: string;
  cashierId: string;
  refundedItems?: string[]; // item IDs that have been refunded
  fullyRefunded?: boolean;
}

const STORAGE_KEY = "ds-sales-history";

function loadSales(): Sale[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return generateMockSales();
}

function generateMockSales(): Sale[] {
  const now = Date.now();
  const DAY = 86400000;
  const products = [
    { name: "Lait 1L", price: 100, barcode: "6191234000001" },
    { name: "Pain", price: 50, barcode: "6191234000002" },
    { name: "Eau 1.5L", price: 25, barcode: "6191234000003" },
    { name: "Sucre 1kg", price: 100, barcode: "6191234000004" },
    { name: "Fromage (0.5kg)", price: 400, barcode: "6191234000005" },
    { name: "Café 250g", price: 350 },
    { name: "Farine 1kg", price: 80 },
    { name: "Huile 1L", price: 300 },
    { name: "Chocolat", price: 150 },
    { name: "Yaourt", price: 45 },
  ];

  const sales: Sale[] = [];
  for (let d = 0; d < 14; d++) {
    const salesPerDay = 3 + Math.floor(Math.random() * 5);
    for (let s = 0; s < salesPerDay; s++) {
      const itemCount = 1 + Math.floor(Math.random() * 5);
      const items: SaleItem[] = [];
      for (let i = 0; i < itemCount; i++) {
        const p = products[Math.floor(Math.random() * products.length)];
        items.push({
          id: `item-${d}-${s}-${i}`,
          name: p.name,
          quantity: 1 + Math.floor(Math.random() * 4),
          price: p.price,
          barcode: p.barcode,
        });
      }
      const subtotal = items.reduce((sum, it) => sum + it.quantity * it.price, 0);
      const discountPct = Math.random() > 0.8 ? Math.floor(Math.random() * 15) : 0;
      const discountAmt = subtotal * (discountPct / 100);
      const total = subtotal - discountAmt;
      const hour = 8 + Math.floor(Math.random() * 12);
      const minute = Math.floor(Math.random() * 60);
      const ts = new Date(now - d * DAY);
      ts.setHours(hour, minute, Math.floor(Math.random() * 60));

      sales.push({
        id: `sale-${Date.now()}-${d}-${s}`,
        timestamp: ts.toISOString(),
        items,
        subtotal,
        discount: discountPct,
        total,
        paymentMethod: Math.random() > 0.3 ? "cash" : "card",
        clientNumber: 1 + Math.floor(Math.random() * 6),
        cashierName: "Caissier",
        cashierId: "default",
      });
    }
  }
  return sales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function useSalesHistory() {
  const [sales, setSales] = useState<Sale[]>(loadSales);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
  }, [sales]);

  const addSale = useCallback((sale: Omit<Sale, "id" | "timestamp">) => {
    setSales((prev) => [
      { ...sale, id: `sale-${Date.now()}`, timestamp: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const refundSale = useCallback((saleId: string) => {
    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, fullyRefunded: true, refundedItems: s.items.map((i) => i.id) } : s))
    );
  }, []);

  const refundItems = useCallback((saleId: string, itemIds: string[]) => {
    setSales((prev) =>
      prev.map((s) => {
        if (s.id !== saleId) return s;
        const existing = s.refundedItems || [];
        const merged = [...new Set([...existing, ...itemIds])];
        return { ...s, refundedItems: merged, fullyRefunded: merged.length === s.items.length };
      })
    );
  }, []);

  return { sales, addSale, refundSale, refundItems };
}
