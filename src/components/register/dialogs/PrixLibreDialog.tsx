import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PrixLibreDialogProps {
  isOpen: boolean;
  value: string;
  onChange: (val: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  t: (key: string) => string;
}

export const PrixLibreDialog: React.FC<PrixLibreDialogProps> = ({
  isOpen,
  value,
  onChange,
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
            <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">
              Prix Libre (DIVERS)
            </h3>
            <input
              type="number"
              min="0"
              step="10"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onConfirm()}
              placeholder="Ex: 150 (DA)"
              className="w-full px-3 py-2.5 text-lg font-black font-digital border border-input bg-background text-foreground outline-none mb-3 text-center"
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
                className="flex-1 py-2 bg-primary text-primary-foreground text-[10px] font-bold uppercase hover:brightness-110"
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
