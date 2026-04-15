import { motion } from "framer-motion";
import type { CartItem } from "@/types/register";

interface CartItemRowProps {
  item: CartItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onOpenQuantityDialog: (id: string) => void;
  t: (key: string) => string;
  index: number;
  rowRef?: React.RefObject<HTMLTableRowElement>;
  isShaking?: boolean;
}

/**
 * CartItemRow — renders a single row in the register cart table.
 * Extracts ~40 lines of complex inline JSX from Register.tsx.
 */
export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  isSelected,
  onSelect,
  onOpenQuantityDialog,
  t,
  index,
  rowRef,
  isShaking,
}) => {
  return (
    <motion.tr
      animate={isShaking ? {
        x: [0, -4, 4, -4, 4, 0],
        transition: { duration: 0.4 }
      } : {}}
      ref={isSelected ? rowRef : null}
      onClick={() => onSelect(item.id)}
      className={`scroll-mt-10 cursor-pointer border-b border-register-border ${
        isSelected
          ? "bg-primary/10 border-l-2 border-l-primary"
          : index % 2 === 0
          ? "bg-card hover:bg-muted/40"
          : "bg-muted/20 hover:bg-muted/40"
      }`}
    >
      <td className="px-3 py-2.5 text-[12px] font-medium text-foreground">
        <div className="flex items-center gap-2">
          <div
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isSelected ? "bg-primary scale-110" : "bg-muted-foreground/30"
            }`}
          />
          <span className="truncate max-w-[200px]" title={item.name}>
            {item.name}
          </span>
          {item.price === 0 && (
            <span className="text-[8px] px-1 py-0.5 bg-success text-success-foreground font-bold uppercase shrink-0">
              {t("action.gift")}
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-2.5 text-center text-[12px]">
        <div className="relative inline-flex flex-col items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenQuantityDialog(item.id);
            }}
            className="inline-block min-w-[32px] px-1.5 py-1 bg-muted text-foreground font-bold font-digital hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer rounded-sm active:scale-95 shadow-sm"
          >
            {item.quantity}
          </button>
          
          {item.packSize && item.packSize > 1 && (
            <div className="absolute -bottom-1 -right-2 transform translate-y-1/2">
              <span className="text-[8px] font-black text-primary bg-primary/10 px-1 py-0.5 rounded-full border border-primary/20 shadow-sm leading-none flex items-center">
                x{item.packSize}
              </span>
            </div>
          )}
        </div>
      </td>
      <td className="px-3 py-2.5 text-right text-[14px] font-digital">
        <div className="flex flex-col items-end justify-center h-full">
          <span
            className={
              item.originalPrice !== undefined && item.originalPrice > item.price
                ? "text-primary font-bold"
                : "text-muted-foreground"
            }
          >
            {item.price.toFixed(2)} DA
          </span>
          {item.originalPrice !== undefined && item.originalPrice > item.price && (
            <span className="text-[10px] text-muted-foreground/50 line-through leading-none -mt-0.5">
              {item.originalPrice.toFixed(2)} DA
            </span>
          )}
        </div>
      </td>
      <td className="pl-3 pr-[18px] py-2.5 text-right font-bold text-foreground text-[14px] font-digital">
        {(item.quantity * item.price).toFixed(2)} DA
      </td>
    </motion.tr>
  );
};
