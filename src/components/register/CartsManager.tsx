import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Scissors, Merge, ShoppingCart, GripVertical } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";

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
  onMoveItems: (sourceCart: number, targetCart: number, itemIds: string[]) => void;
  onSplitItem: (sourceCart: number, targetCart: number, itemId: string, quantity: number) => void;
  onMergeCarts: (sourceCart: number, targetCart: number) => void;
  activeClient: number;
  assignedClients: Record<number, any>;
}

const CART_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-pink-500", "bg-cyan-500",
];

const CartsManager = ({ 
  open, 
  onClose, 
  clientCarts, 
  onMoveItems, 
  onSplitItem, 
  onMergeCarts, 
  activeClient,
  assignedClients
}: CartsManagerProps) => {
  const [selectedItems, setSelectedItems] = useState<Map<number, Set<string>>>(new Map());
  const [draggedItem, setDraggedItem] = useState<{ cartIdx: number; itemId: string } | null>(null);
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

  const handleTransfer = (targetCart: number) => {
    selectedItems.forEach((itemIds, sourceCart) => {
      if (sourceCart === targetCart) return;
      onMoveItems(sourceCart, targetCart, Array.from(itemIds));
    });
    setSelectedItems(new Map());
    toast({ title: "Transfert réussi", description: "Les articles ont été déplacés." });
  };

  const handleMerge = (sourceCart: number, targetCart: number) => {
    onMergeCarts(sourceCart, targetCart);
    toast({ title: "Fusion réussie", description: `Panier ${sourceCart} fusionné vers ${targetCart}.` });
  };

  const hasSelection = selectedItems.size > 0;
  const totalSelected = Array.from(selectedItems.values()).reduce((s, set) => s + set.size, 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="bg-card/95 border border-register-border/50 rounded-2xl shadow-2xl w-full max-w-[1200px] max-h-[90vh] overflow-hidden flex flex-col glass"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-register-border/50 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-xl">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground uppercase tracking-tight">Gestionnaire de Paniers</h2>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none">Vue d'ensemble Multi-Clients</p>
              </div>
              {hasSelection && (
                <motion.span 
                  initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                  className="ml-4 text-[10px] bg-primary text-primary-foreground px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                >
                  {totalSelected} sélectionné(s)
                </motion.span>
              )}
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl hover:bg-muted transition-colors group"
            >
              <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Action Bar (When selection exists) */}
          <AnimatePresence>
            {hasSelection && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 py-3 border-b border-register-border/50 bg-primary/5 flex items-center gap-3 overflow-hidden"
              >
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Déplacer vers :</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      onClick={() => handleTransfer(n)}
                        className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all active:scale-95 ${
                          CART_COLORS[n - 1]
                        } text-white shadow-lg shadow-black/5 hover:brightness-110`}
                      >
                        {assignedClients[n]?.name || `Client ${n}`}
                      </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main 6-Column Grid */}
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-6 h-full divide-x divide-register-border/30">
              {[1, 2, 3, 4, 5, 6].map((n) => {
                const items = clientCarts[n] || [];
                const total = items.reduce((s, i) => s + i.quantity * i.price * (i.isReturn ? -1 : 1), 0);
                const isActive = n === activeClient;

                return (
                  <div 
                    key={n} 
                    className={`flex flex-col relative transition-colors ${isActive ? "bg-primary/[0.03]" : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (draggedItem && draggedItem.cartIdx !== n) {
                        // Highlight target column?
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedItem && draggedItem.cartIdx !== n) {
                        onMoveItems(draggedItem.cartIdx, n, [draggedItem.itemId]);
                        setDraggedItem(null);
                        toast({ title: "Article déplacé", description: `Vers Client N°${n}` });
                      }
                    }}
                  >
                    {/* column header */}
                    <div className={`px-3 py-3 border-b border-register-border/50 ${CART_COLORS[n - 1]} bg-opacity-5 flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${CART_COLORS[n - 1]} shadow-lg shadow-black/10`} />
                        <span className="text-xs font-black uppercase text-foreground">{assignedClients[n]?.name || `Client ${n}`}</span>
                      </div>
                      <div className="text-right leading-none">
                        <p className="text-[11px] font-black font-digital text-foreground">{total.toFixed(2)}</p>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">DA TOTAL</p>
                      </div>
                    </div>

                    {/* item list */}
                    <ScrollArea className="flex-1">
                      <div className="p-2 space-y-1.5">
                        {items.length > 0 ? (
                          items.map((item) => {
                            const isSelected = selectedItems.get(n)?.has(item.id);
                            return (
                              <motion.div
                                key={item.id}
                                layoutId={item.id}
                                draggable
                                onDragStart={() => setDraggedItem({ cartIdx: n, itemId: item.id })}
                                onClick={() => toggleItem(n, item.id)}
                                className={`group p-2 rounded-xl border transition-all cursor-move active:scale-95 ${
                                  isSelected 
                                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                                    : "bg-background border-register-border/50 hover:border-primary/50 hover:shadow-md"
                                }`}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                              >
                                <div className="flex justify-between items-start gap-1">
                                  <p className={`text-[10px] font-black uppercase leading-tight truncate ${isSelected ? "text-white" : "text-foreground"}`}>
                                    {item.name}
                                  </p>
                                  <GripVertical className={`h-3 w-3 shrink-0 ${isSelected ? "text-white/50" : "text-muted-foreground/30 opacity-0 group-hover:opacity-100"}`} />
                                </div>
                                <div className={`flex justify-between items-end mt-1 ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                                  <span className="text-[9px] font-bold">×{item.quantity}</span>
                                  <span className={`text-[10px] font-black font-digital ${isSelected ? "text-white" : "text-primary"}`}>
                                    {(item.quantity * item.price).toFixed(2)}
                                  </span>
                                </div>
                              </motion.div>
                            );
                          })
                        ) : (
                          <div className="flex flex-col items-center justify-center py-10 opacity-20 group">
                            <ShoppingCart className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                            <p className="text-[9px] font-black uppercase tracking-widest">Panier Vide</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>

                    {/* Column footer actions */}
                    {items.length > 0 && (
                      <div className="p-2 border-t border-register-border/30 bg-muted/10 grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => {
                            // Select all in this cart
                            const ids = new Set(items.map(i => i.id));
                            setSelectedItems(prev => new Map(prev).set(n, ids));
                          }}
                          className="py-1.5 text-[9px] font-black uppercase bg-background border border-register-border/50 rounded-lg hover:bg-muted transition-colors"
                        >
                          Tout
                        </button>
                        <div className="flex gap-1.5 min-w-0">
                          <button
                            title="Diviser cet article"
                            onClick={(e) => { e.stopPropagation(); /* Split modal logic */ }}
                            className="p-1.5 text-muted-foreground hover:text-primary transition-colors border border-register-border/50 rounded-lg bg-background"
                          >
                            <Scissors className="h-3 w-3" />
                          </button>
                          <button
                            title="Fusionner vers un autre"
                            onClick={(e) => { e.stopPropagation(); /* Toggle merge mode */ }}
                            className="p-1.5 text-muted-foreground hover:text-orange-500 transition-colors border border-register-border/50 rounded-lg bg-background"
                          >
                            <Merge className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer info */}
          <div className="px-6 py-3 border-t border-register-border/50 bg-muted/20 flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <div className="flex items-center gap-4">
              <span>6 Paniers Découplés</span>
              <div className="h-3 w-[1px] bg-border" />
              <span>DND Activé</span>
            </div>
            <span>Double-clic pour diviser · Glisser-déposer pour transférer</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CartsManager;
