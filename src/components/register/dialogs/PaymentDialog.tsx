import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Banknote, CreditCard } from "lucide-react";

interface PaymentDialogProps {
  isOpen: boolean;
  totalTTC: number;
  onPay: (method: "cash" | "card" | "credit") => void;
  onClose: () => void;
  t: (key: string) => string;
  hasAssignedClient?: boolean;
}

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
  isOpen,
  totalTTC,
  onPay,
  onClose,
  t,
  hasAssignedClient,
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
            className="bg-card p-5 w-[360px] border border-register-border shadow-2xl"
          >
            <h3 className="text-sm font-bold text-foreground mb-1">
              {t("dialog.payment.title")}
            </h3>
            <p className="text-[11px] text-muted-foreground mb-4">
              {t("dialog.payment.total")}:{" "}
              <span className="font-bold text-foreground">
                {totalTTC.toFixed(2)} DA
              </span>
            </p>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => onPay("cash")}
                className="flex-1 flex flex-col items-center gap-1 py-4 bg-success text-success-foreground hover:brightness-110 transition-all active:scale-95"
              >
                <Banknote className="h-6 w-6" />
                <span className="text-[10px] font-bold uppercase">
                  {t("dialog.payment.cash")}
                </span>
              </button>
              <button
                onClick={() => onPay("card")}
                className="flex-1 flex flex-col items-center gap-1 py-4 bg-info text-info-foreground hover:brightness-110 transition-all active:scale-95"
              >
                <CreditCard className="h-6 w-6" />
                <span className="text-[10px] font-bold uppercase">
                  {t("dialog.payment.card")}
                </span>
              </button>
              <button
                onClick={() => onPay("credit")}
                className="flex-1 flex flex-col items-center gap-1 py-4 bg-orange-500 text-white hover:brightness-110 transition-all active:scale-95"
              >
                <Banknote className="h-6 w-6" />
                <span className="text-[10px] font-bold uppercase">
                  CRÉDIT
                </span>
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2 bg-muted text-foreground text-[10px] font-bold uppercase hover:bg-muted/80"
            >
              {t("dialog.cancel")}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
