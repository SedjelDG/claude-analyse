import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X, GripVertical, Plus, Minus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScaleProduct {
  id: string;
  plu: string;
  name: string;
  price: number;
  unit: string;
  tare: number;
  labelFormat: string;
  synced: boolean;
  active: boolean;
}

interface ScaleButtonLayoutProps {
  products: ScaleProduct[];
  onUpdateProducts: (products: ScaleProduct[]) => void;
}

const springTransition = { type: "spring" as const, stiffness: 500, damping: 30 };
const plopIn = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: [0, 1.12, 1], opacity: 1 },
  exit: { scale: 0, opacity: 0 },
  transition: { type: "spring" as const, stiffness: 500, damping: 30, scale: { times: [0, 0.6, 1], duration: 0.4 } },
};

const ScaleButtonLayout = ({ products, onUpdateProducts }: ScaleButtonLayoutProps) => {
  const [cols, setCols] = useState(5);
  const [rows, setRows] = useState(4);
  const totalSlots = cols * rows;

  // buttonMap: slot index → product id
  const [buttonMap, setButtonMap] = useState<Record<number, string | null>>(() => {
    const map: Record<number, string | null> = {};
    products
      .filter((p) => p.active && p.plu)
      .sort((a, b) => parseInt(a.plu) - parseInt(b.plu))
      .forEach((p) => {
        const idx = parseInt(p.plu) - 1;
        if (idx >= 0 && idx < 20) map[idx] = p.id;
      });
    return map;
  });

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragSource, setDragSource] = useState<"pool" | number | null>(null);
  const [hoverSlot, setHoverSlot] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const assignedIds = new Set(Object.values(buttonMap).filter(Boolean));
  const unassigned = products.filter((p) => p.active && !assignedIds.has(p.id));

  const getProductById = (id: string) => products.find((p) => p.id === id);

  const findSlotAtPoint = useCallback((x: number, y: number): number | null => {
    for (const [idx, el] of slotRefs.current.entries()) {
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return idx;
      }
    }
    return null;
  }, []);

  const handleDragEnd = useCallback(
    (productId: string, source: "pool" | number, _info: PanInfo, event: MouseEvent | TouchEvent | PointerEvent) => {
      const point = "touches" in event
        ? { x: (event as TouchEvent).changedTouches[0].clientX, y: (event as TouchEvent).changedTouches[0].clientY }
        : { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY };

      const targetSlot = findSlotAtPoint(point.x, point.y);
      setDraggingId(null);
      setDragSource(null);
      setHoverSlot(null);

      if (targetSlot === null) return;

      setButtonMap((prev) => {
        const next = { ...prev };
        // If dragged from a slot, clear old slot
        if (typeof source === "number") {
          next[source] = null;
        }
        // If target slot is occupied, swap or move to pool
        const existing = next[targetSlot];
        if (existing && typeof source === "number") {
          next[source] = existing; // swap
        }
        next[targetSlot] = productId;
        return next;
      });
    },
    [findSlotAtPoint]
  );

  const handleDrag = useCallback(
    (_: any, info: PanInfo) => {
      const el = document.elementFromPoint(info.point.x, info.point.y);
      if (!el) { setHoverSlot(null); return; }
      const slot = findSlotAtPoint(info.point.x, info.point.y);
      setHoverSlot(slot);
    },
    [findSlotAtPoint]
  );

  const clearSlot = (idx: number) => {
    setButtonMap((prev) => ({ ...prev, [idx]: null }));
  };

  // Sync PLU numbers back to products when buttonMap changes
  useEffect(() => {
    const updatedProducts = products.map((p) => {
      const slotIdx = Object.entries(buttonMap).find(([, pid]) => pid === p.id);
      if (slotIdx) {
        const newPlu = String(parseInt(slotIdx[0]) + 1).padStart(3, "0");
        return { ...p, plu: newPlu, synced: p.plu !== newPlu ? false : p.synced };
      }
      return p;
    });
    // Only update if something changed
    const changed = updatedProducts.some((p, i) => p.plu !== products[i].plu);
    if (changed) onUpdateProducts(updatedProducts);
  }, [buttonMap]);

  const DraggableProduct = ({
    product,
    source,
    compact = false,
  }: {
    product: ScaleProduct;
    source: "pool" | number;
    compact?: boolean;
  }) => {
    const isDragging = draggingId === product.id;
    return (
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        onDragStart={() => {
          setDraggingId(product.id);
          setDragSource(source);
        }}
        onDrag={handleDrag}
        onDragEnd={(e, info) => handleDragEnd(product.id, source, info, e as any)}
        whileDrag={{ scale: 1.08, zIndex: 100, boxShadow: "0 12px 32px rgba(0,0,0,0.25)" }}
        style={{ cursor: "grab", zIndex: isDragging ? 100 : 1, position: "relative" }}
        className="touch-none"
      >
        {compact ? (
          <div className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-lg px-3 py-2 text-xs font-semibold select-none">
            <GripVertical className="h-3 w-3 opacity-40" />
            <span className="truncate max-w-[80px]">{product.name}</span>
            <span className="text-[10px] opacity-60">{product.price} DA</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full select-none">
            <span className="text-[10px] font-mono text-muted-foreground">{product.plu}</span>
            <span className="text-xs font-bold text-foreground truncate max-w-full px-1 leading-tight">{product.name}</span>
            <span className="text-[10px] text-primary font-semibold">{product.price} DA</span>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={springTransition}
      className="space-y-4"
    >
      {/* Grid size controls */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <Settings className="h-4 w-4" />
        <div className="flex items-center gap-1.5">
          <span>Colonnes</span>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setCols((c) => Math.max(3, c - 1))}><Minus className="h-3 w-3" /></Button>
          <span className="font-bold text-foreground w-4 text-center">{cols}</span>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setCols((c) => Math.min(8, c + 1))}><Plus className="h-3 w-3" /></Button>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Lignes</span>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setRows((r) => Math.max(2, r - 1))}><Minus className="h-3 w-3" /></Button>
          <span className="font-bold text-foreground w-4 text-center">{rows}</span>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setRows((r) => Math.min(8, r + 1))}><Plus className="h-3 w-3" /></Button>
        </div>
        <span className="text-muted-foreground/60">{totalSlots} touches</span>
      </div>

      {/* Grid */}
      <div
        ref={gridRef}
        className="grid gap-2 p-4 rounded-xl bg-muted/30 border border-border"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: totalSlots }).map((_, idx) => {
          const productId = buttonMap[idx];
          const product = productId ? getProductById(productId) : null;
          const isHovered = hoverSlot === idx;

          return (
            <div
              key={idx}
              ref={(el) => { if (el) slotRefs.current.set(idx, el); else slotRefs.current.delete(idx); }}
              className={`relative rounded-lg border-2 border-dashed transition-all duration-200 aspect-square flex items-center justify-center min-h-[72px] ${
                isHovered
                  ? "border-primary bg-primary/10 scale-105"
                  : product
                  ? "border-primary/30 bg-card"
                  : "border-border/50 bg-muted/20"
              }`}
              onContextMenu={(e) => {
                e.preventDefault();
                if (product) clearSlot(idx);
              }}
            >
              {/* Slot number */}
              <span className="absolute top-1 left-1.5 text-[9px] font-mono text-muted-foreground/50">
                {String(idx + 1).padStart(3, "0")}
              </span>

              <AnimatePresence mode="popLayout">
                {product ? (
                  <motion.div
                    key={product.id}
                    {...plopIn}
                    layout
                    className="w-full h-full flex items-center justify-center"
                  >
                    <DraggableProduct product={product} source={idx} />
                    <button
                      onClick={() => clearSlot(idx)}
                      className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-destructive/80 text-destructive-foreground opacity-0 hover:opacity-100 transition-opacity z-10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.span
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    className="text-[10px] text-muted-foreground"
                  >
                    vide
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Unassigned pool */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Produits non assignés ({unassigned.length})
        </p>
        <div className="flex flex-wrap gap-2 min-h-[40px] p-3 rounded-xl bg-muted/20 border border-border/50">
          <AnimatePresence>
            {unassigned.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                className="text-xs text-muted-foreground italic"
              >
                Tous les produits actifs sont assignés
              </motion.p>
            ) : (
              unassigned.map((p) => (
                <motion.div
                  key={p.id}
                  {...plopIn}
                  layout
                >
                  <DraggableProduct product={p} source="pool" compact />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default ScaleButtonLayout;
