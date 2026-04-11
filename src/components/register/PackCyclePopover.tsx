import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PackageOpen, X } from "lucide-react";

interface PackVariant {
  size: number;
  name: string;
  price: number;
}

interface PackCyclePopoverProps {
  open: boolean;
  onClose: () => void;
  variants: PackVariant[];
  currentIndex: number; // -1 = unit
  unitName: string;
  unitPrice: number;
  onSelect: (variantIndex: number) => void; // -1 = back to unit
  anchorRect?: DOMRect | null;
}

const PackCyclePopover = ({ open, onClose, variants, currentIndex, unitName, unitPrice, onSelect, anchorRect }: PackCyclePopoverProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      const num = parseInt(e.key);
      if (num === 0) { onSelect(-1); onClose(); return; }
      if (num >= 1 && num <= variants.length) { onSelect(num - 1); onClose(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, variants, onSelect, onClose]);

  if (!open || variants.length === 0) return null;

  const top = anchorRect ? anchorRect.top + anchorRect.height / 2 : "50%";
  const left = anchorRect ? anchorRect.left - 10 : "50%";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        onClick={onClose}
      >
        <motion.div
          ref={ref}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 400 }}
          className="absolute bg-card border border-border rounded-lg shadow-2xl overflow-hidden min-w-[200px]"
          style={{
            top: typeof top === "number" ? top : top,
            left: typeof left === "number" ? left : left,
            transform: "translate(-100%, -50%)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-border bg-muted/50 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <PackageOpen className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase text-foreground">Variantes</span>
            </div>
            <button onClick={onClose} className="p-0.5 rounded hover:bg-muted"><X className="h-3 w-3" /></button>
          </div>

          {/* Unit option */}
          <button
            onClick={() => { onSelect(-1); onClose(); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 border-b border-border hover:bg-muted/50 transition-colors ${
              currentIndex === -1 ? "bg-primary/10" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-muted-foreground bg-muted w-5 h-5 rounded flex items-center justify-center">0</span>
              <span className="text-xs font-medium text-foreground">Unité — {unitName}</span>
            </div>
            <span className="text-xs font-bold text-foreground">{unitPrice.toFixed(0)} DA</span>
          </button>

          {/* Variants */}
          {variants.map((v, i) => (
            <button
              key={i}
              onClick={() => { onSelect(i); onClose(); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors ${
                currentIndex === i ? "bg-primary/10" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-muted-foreground bg-muted w-5 h-5 rounded flex items-center justify-center">{i + 1}</span>
                <div className="text-left">
                  <span className="text-xs font-medium text-foreground">{v.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-1">×{v.size}</span>
                </div>
              </div>
              <span className="text-xs font-bold text-foreground">{v.price.toFixed(0)} DA</span>
            </button>
          ))}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PackCyclePopover;
