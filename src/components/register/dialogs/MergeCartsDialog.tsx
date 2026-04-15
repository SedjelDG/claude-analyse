import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Combine } from "lucide-react";

interface MergeCartsDialogProps {
  isOpen: boolean;
  activeClient: number;
  clientStates: Record<number, { items: any[] }>;
  onMerge: (tabId: number) => void;
  onClose: () => void;
  t: (key: string) => string;
}

export const MergeCartsDialog: React.FC<MergeCartsDialogProps> = ({
  isOpen,
  activeClient,
  clientStates,
  onMerge,
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
            className="bg-card p-5 w-[320px] border border-register-border shadow-2xl"
          >
            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
              <Combine className="w-4 h-4 text-primary" />
              Fusionner avec...
            </h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[1, 2, 3, 4, 5, 6].map((tabId) => {
                const itemsCount = clientStates[tabId]?.items.length || 0;
                const isCurrent = tabId === activeClient;
                return (
                  <button
                    key={tabId}
                    disabled={isCurrent || itemsCount === 0}
                    onClick={() => onMerge(tabId)}
                    className={`flex flex-col items-center justify-center py-3 border transition-all ${
                      isCurrent
                        ? "bg-muted/30 opacity-30 cursor-not-allowed"
                        : itemsCount > 0
                        ? "bg-primary/10 border-primary shadow-sm hover:bg-primary/20"
                        : "bg-muted opacity-40 cursor-not-allowed"
                    }`}
                  >
                    <span className="text-[10px] font-bold">Tab {tabId}</span>
                    <span className="text-[14px] font-black font-digital text-primary">
                      {itemsCount}
                    </span>
                  </button>
                );
              })}
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
