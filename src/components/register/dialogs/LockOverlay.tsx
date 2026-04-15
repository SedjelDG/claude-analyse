import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock } from "lucide-react";

interface LockOverlayProps {
  isLocked: boolean;
  lockPassword: string;
  setLockPassword: (val: string) => void;
  handleUnlock: () => void;
  t: (key: string) => string;
}

/**
 * LockOverlay — a full-screen security layer for the register.
 * Extracts ~15 lines of security UI from Register.tsx.
 */
export const LockOverlay: React.FC<LockOverlayProps> = ({
  isLocked,
  lockPassword,
  setLockPassword,
  handleUnlock,
  t,
}) => {
  return (
    <AnimatePresence>
      {isLocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-primary/95 flex items-center justify-center pointer-events-auto"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card p-6 w-[300px] border border-register-border shadow-2xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-bold text-foreground">
                {t("dialog.lock.title")}
              </h2>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">
              {t("dialog.lock.message")}
            </p>
            <input
              type="password"
              value={lockPassword}
              onChange={(e) => setLockPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              placeholder={t("dialog.lock.password")}
              className="w-full px-3 py-2 text-sm border border-input bg-background text-foreground outline-none mb-3"
              autoFocus
            />
            <button
              onClick={handleUnlock}
              className="w-full py-2 bg-primary text-primary-foreground text-[11px] font-bold uppercase hover:bg-primary/90 transition-colors"
            >
              {t("dialog.lock.unlock")}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
