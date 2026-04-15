import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DiscountDialogProps {
  isOpen: boolean;
  value: string;
  type: "percent" | "fixed";
  isItemScoped: boolean;
  onChange: (val: string) => void;
  onTypeChange: (type: "percent" | "fixed") => void;
  onConfirm: () => void;
  onClose: () => void;
  t: (key: string) => string;
}

export const DiscountDialog: React.FC<DiscountDialogProps> = ({
  isOpen,
  value,
  type,
  isItemScoped,
  onChange,
  onTypeChange,
  onConfirm,
  onClose,
  t,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center pointer-events-auto"
        >
          <motion.div
            initial={{ scale: 0.9, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 10 }}
            className="bg-card p-5 w-[280px] border border-register-border shadow-2xl"
          >
            <h3 className="text-sm font-bold text-foreground mb-3">
              {t("dialog.discount.title")} {isItemScoped ? "(Article)" : "(Ticket)"}
            </h3>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => onTypeChange("percent")}
                className={`flex-1 py-1.5 text-xs font-bold transition-colors ${
                  type === "percent"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
                }`}
              >
                %
              </button>
              <button
                onClick={() => onTypeChange("fixed")}
                className={`flex-1 py-1.5 text-xs font-bold transition-colors ${
                  type === "fixed"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
                }`}
              >
                DA FIXE
              </button>
            </div>
            <input
              type="number"
              min="0"
              max={type === "percent" ? "100" : undefined}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onConfirm()}
              placeholder={type === "percent" ? "Ex: 10" : "Ex: 500"}
              className="w-full px-3 py-2 text-sm border border-input bg-background text-foreground outline-none mb-3"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 bg-muted text-foreground text-[10px] font-bold uppercase hover:bg-muted/80"
              >
                {t("dialog.cancel")}
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-2 bg-primary text-primary-foreground text-[10px] font-bold uppercase hover:bg-primary/90"
              >
                {t("dialog.confirm")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
