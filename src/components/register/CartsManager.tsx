import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Scissors, Merge, ShoppingCart } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  barcode?: string;
  packVariantIndex?: number;
  packSize: number;
  originalName?: string;
  originalPrice?: number;
  isReturn?: boolean;
}

interface CartsManagerProps {
  open: boolean;
  onClose: () => void;
  clientCarts: Record<number, CartItem[]>;
  setClientCarts: React.Dispatch<React.SetStateAction<Record<number, CartItem[]>>>;
  activeClient: number;
}

const CART_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-pink-500", "bg-cyan-500",
];

const CartsManager = ({ open, onClose, clientCarts, setClientCarts, activeClient }: CartsManagerProps) => {
  const [selectedItems, setSelectedItems] = useState<Map<number, Set<string>>>(new Map());
  const [splitDialog, setSplitDialog] = useState<{ cartIdx: number; itemId: string; maxQty: number } | null>(null);
  const [splitQty, setSplitQty] = useState("");
  const [splitTarget, setSplitTarget] = useState<number | null>(null);

  if (!open) return null;

  const toggleItem = (cartIdx: number, itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(cartIdx) || []);
      if (set.has(itemId)) set.delete(itemId);
      else set.add(itemId);
      if (set.size === 0) next.delete(cartIdx);
      else next.set(cartIdx, set);
      return next;
    });
  };

  const transferTo = (targetCart: number) => {
    setClientCarts((prev) => {
      const next = { ...prev };
      selectedItems.forEach((itemIds, sourceCart) => {
        if (sourceCart === targetCart) return;
        const source = [...(next[sourceCart] || [])];
        const target = [...(next[targetCart] || [])];
        itemIds.forEach((id) => {
          const idx = source.findIndex((i) => i.id === id);
          if (idx !== -1) {
            const [item] = source.splice(idx, 1);
            // Merge if same item exists in target
            const existing = target.find((t) => t.name === item.name && t.price === item.price && !t.isReturn);
            if (existing) {
              existing.quantity += item.quantity;
            } else {
              target.push({ ...item, id: `${item.id}-t${Date.now()}` });
            }
          }
        });
        next[sourceCart] = source;
        next[targetCart] = target;
      });
      return next;
    });
    setSelectedItems(new Map());
  };

  const confirmSplit = () => {
    if (!splitDialog || !splitTarget) return;
    const qty = parseInt(splitQty);
    if (isNaN(qty) || qty <= 0 || qty >= splitDialog.maxQty) return;

    setClientCarts((prev) => {
      const next = { ...prev };
      const source = [...(next[splitDialog.cartIdx] || [])];
      const target = [...(next[splitTarget] || [])];
      const itemIdx = source.findIndex((i) => i.id === splitDialog.itemId);
      if (itemIdx !== -1) {
        const item = { ...source[itemIdx] };
        item.quantity -= qty;
        source[itemIdx] = item;
        target.push({ ...item, id: `split-${Date.now()}`, quantity: qty });
      }
      next[splitDialog.cartIdx] = source;
      next[splitTarget] = target;
      return next;
    });
    setSplitDialog(null);
    setSplitQty("");
    setSplitTarget(null);
  };

  const mergeAll = (sourceCart: number, targetCart: number) => {
    if (sourceCart === targetCart) return;
    setClientCarts((prev) => {
      const next = { ...prev };
      const items = [...(next[sourceCart] || [])];
      const target = [...(next[targetCart] || [])];
      items.forEach((item) => {
        const existing = target.find((t) => t.name === item.name && t.price === item.price && !t.isReturn);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          target.push({ ...item, id: `merge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` });
        }
      });
      next[sourceCart] = [];
      next[targetCart] = target;
      return next;
    });
  };

  const hasSelection = selectedItems.size > 0;
  const totalSelected = Array.from(selectedItems.values()).reduce((s, set) => s + set.size, 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="bg-card border border-border rounded-lg shadow-2xl w-[95vw] max-w-[1200px] max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/50">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Gestionnaire de Paniers</h2>
              {hasSelection && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold">
                  {totalSelected} sélectionné(s)
                </span>
              )}
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>

          {/* Transfer bar */}
          {hasSelection && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              className="px-5 py-2 border-b border-border bg-primary/5 flex items-center gap-2 flex-wrap"
            >
              <span className="text-xs font-bold text-foreground mr-2">Transférer vers :</span>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => transferTo(n)}
                  className={`px-3 py-1.5 text-xs font-bold rounded transition-all active:scale-95 ${
                    CART_COLORS[n - 1]
                  } text-white hover:brightness-110`}
                >
                  Client {n}
                </button>
              ))}
            </motion.div>
          )}

          {/* 6-column grid */}
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-6 h-full divide-x divide-border">
              {[1, 2, 3, 4, 5, 6].map((n) => {
                const items = clientCarts[n] || [];
                const total = items.reduce((s, i) => s + i.quantity * i.price * (i.isReturn ? -1 : 1), 0);
                const isActive = n === activeClient;

                return (
                  <div key={n} className={`flex flex-col ${isActive ? "bg-primary/5" : ""}`}>
                    {/* Column header */}
                    <div className={`px-2 py-2 border-b border-border flex items-center justify-between ${CART_COLORS[n - 1]} bg-opacity-10`}>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${CART_COLORS[n - 1]}`} />
                        <span className="text-[10px] font-black uppercase text-foreground">C{n}</span>
                        {items.length > 0 && (
                          <span className="text-[9px] bg-muted text-foreground px-1 rounded font-bold">{items.length}</span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-foreground">{total.toFixed(0)}</span>
                    </div>

                    {/* Items */}
                    <ScrollArea className="flex-1 max-h-[50vh]">
                      <div className="p-1 space-y-0.5">
                        {items.map((item) => {
                          const isSelected = selectedItems.get(n)?.has(item.id);
                          return (
                            <motion.div
                              key={item.id}
                              layout
                              onClick={() => toggleItem(n, item.id)}
                              className={`px-1.5 py-1 rounded text-[10px] cursor-pointer transition-all ${
                                isSelected ? "bg-primary/20 ring-1 ring-primary" : "bg-muted/50 hover:bg-muted"
                              } ${item.isReturn ? "line-through opacity-60" : ""}`}
                            >
                              <p className="font-medium text-foreground truncate">{item.name}</p>
                              <div className="flex justify-between text-muted-foreground">
                                <span>×{item.quantity}</span>
                                <span>{(item.quantity * item.price).toFixed(0)}</span>
                              </div>
                            </motion.div>
                          );
                        })}
                        {items.length === 0 && (
                          <p className="text-center text-[10px] text-muted-foreground py-4">Vide</p>
                        )}
                      </div>
                    </ScrollArea>

                    {/* Cart actions */}
                    {items.length > 0 && (
                      <div className="p-1 border-t border-border flex gap-0.5">
                        <button
                          onClick={() => {
                            const itemIds = new Set(items.map((i) => i.id));
                            setSelectedItems((prev) => {
                              const next = new Map(prev);
                              next.set(n, itemIds);
                              return next;
                            });
                          }}
                          className="flex-1 py-1 text-[8px] font-bold uppercase bg-muted text-foreground rounded hover:bg-muted/80 transition-colors"
                        >
                          Tout
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CartsManager;
