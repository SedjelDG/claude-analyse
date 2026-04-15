import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CashMovementDialogProps {
  type: "add" | "remove" | null;
  cashBalance: number;
  amount: string;
  note: string;
  onAmountChange: (val: string) => void;
  onNoteChange: (val: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  t: (key: string) => string;
}

export const CashMovementDialog: React.FC<CashMovementDialogProps> = ({
  type,
  cashBalance,
  amount,
  note,
  onAmountChange,
  onNoteChange,
  onConfirm,
  onClose,
  t,
}) => {
  return (
    <AnimatePresence>
      {type && (
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
            className="bg-card p-5 w-[320px] border border-register-border shadow-2xl"
          >
            <h3 className="text-sm font-bold text-foreground mb-1">
              {type === "add"
                ? t("dialog.cash.addTitle")
                : t("dialog.cash.removeTitle")}
            </h3>
            <p className="text-[11px] text-muted-foreground mb-3">
              {t("label.cashBalance")}:{" "}
              <span className="font-bold text-foreground">
                {cashBalance.toFixed(2)} DA
              </span>
            </p>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder={t("dialog.cash.amount")}
              className="w-full px-3 py-2 text-sm border border-input bg-background text-foreground outline-none mb-2"
              autoFocus
            />
            <input
              type="text"
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onConfirm()}
              placeholder={t("dialog.cash.note")}
              className="w-full px-3 py-2 text-sm border border-input bg-background text-foreground outline-none mb-3"
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
                className={`flex-1 py-2 text-[10px] font-bold uppercase ${
                  type === "add"
                    ? "bg-success text-success-foreground"
                    : "bg-accent text-accent-foreground"
                } hover:brightness-110`}
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
