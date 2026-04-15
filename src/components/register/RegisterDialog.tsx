import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

interface RegisterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

/**
 * Unified dialog shell for all register-side modals.
 * Replaces the 6x copy-pasted motion.div patterns in Register.tsx.
 */
export const RegisterDialog: React.FC<RegisterDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "w-[300px]",
}) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center backdrop-blur-[1px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`bg-card p-5 border border-register-border shadow-2xl ${maxWidth}`}
          >
            <h3 className="text-sm font-black text-foreground mb-1 uppercase tracking-tight">
              {title}
            </h3>
            {description && (
              <p className="text-[11px] text-muted-foreground mr-1 mb-4 leading-tight">
                {description}
              </p>
            )}

            <div className="mb-4">{children}</div>

            {footer ? (
              footer
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-1.5 bg-muted text-foreground text-[10px] font-bold uppercase hover:bg-muted/80 transition-colors"
                >
                  {t("dialog.cancel")}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
