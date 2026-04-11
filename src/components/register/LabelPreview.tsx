import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Printer, Tag } from "lucide-react";

interface LabelPreviewProps {
  open: boolean;
  onClose: () => void;
  product: {
    name: string;
    price: number;
    barcode?: string;
    unit?: string;
  } | null;
}

const LabelPreview = ({ open, onClose, product }: LabelPreviewProps) => {
  const labelRef = useRef<HTMLDivElement>(null);

  if (!open || !product) return null;

  const unit = product.unit || "pcs";
  const unitSuffix = unit === "kg" ? "DA/kg" : unit === "l" ? "DA/L" : "DA";

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=300,height=400");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Étiquette</title>
        <style>
          @page { size: 58mm 40mm; margin: 0; }
          body { margin: 0; padding: 2mm; font-family: Arial, sans-serif; width: 54mm; }
          .price { font-size: 28pt; font-weight: 900; text-align: center; margin: 2mm 0; }
          .unit { font-size: 9pt; text-align: center; color: #666; }
          .name { font-size: 10pt; font-weight: 600; text-align: center; margin: 1mm 0; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
          .barcode { font-size: 8pt; text-align: center; color: #999; margin-top: 1mm; font-family: monospace; }
          .divider { border-top: 1px dashed #ccc; margin: 1mm 0; }
        </style>
      </head>
      <body>
        <div class="name">${product.name}</div>
        <div class="divider"></div>
        <div class="price">${product.price.toFixed(2)}</div>
        <div class="unit">${unitSuffix}</div>
        ${product.barcode ? `<div class="divider"></div><div class="barcode">${product.barcode}</div>` : ""}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="bg-card border border-border rounded-lg shadow-2xl w-[340px] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Aperçu Étiquette</h2>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>

          {/* Label preview (58mm simulated) */}
          <div className="p-6 flex justify-center">
            <div
              ref={labelRef}
              className="bg-white border-2 border-dashed border-border rounded shadow-inner"
              style={{ width: "220px", padding: "12px" }}
            >
              {/* Product name */}
              <p className="text-xs font-semibold text-center text-gray-800 leading-tight"
                style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {product.name}
              </p>

              <div className="border-t border-dashed border-gray-300 my-2" />

              {/* Price — oversized */}
              <p className="text-4xl font-black text-center text-gray-900 tracking-tight leading-none">
                {product.price.toFixed(2)}
              </p>
              <p className="text-[10px] text-center text-gray-500 font-medium mt-0.5">{unitSuffix}</p>

              {/* Barcode */}
              {product.barcode && (
                <>
                  <div className="border-t border-dashed border-gray-300 my-2" />
                  <div className="flex justify-center">
                    {/* Simple barcode visual representation */}
                    <div className="flex items-end gap-[1px] h-6">
                      {product.barcode.split("").map((char, i) => (
                        <div
                          key={i}
                          className="bg-gray-900"
                          style={{
                            width: parseInt(char) % 2 === 0 ? 1 : 2,
                            height: `${60 + (parseInt(char) * 4)}%`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-[8px] text-center text-gray-400 font-mono mt-1">{product.barcode}</p>
                </>
              )}
            </div>
          </div>

          {/* Print button */}
          <div className="px-4 pb-4">
            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-md font-bold text-sm hover:bg-primary/90 transition-all active:scale-95"
            >
              <Printer className="h-4 w-4" /> Imprimer l'étiquette
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LabelPreview;
