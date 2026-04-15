import { useEffect, useRef } from "react";
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

  const handlePrint = () => {
    if (!product) return;
    const printWindow = window.open("", "_blank", "width=400,height=300");
    if (!printWindow) return;

    const unit = product.unit || "pcs";
    const unitSuffix = unit === "kg" ? "DA/kg" : unit === "l" ? "DA/L" : "DA";
    
    // Calculate name font size based on length
    const nameLength = product.name.length;
    let nameFontSize = "14pt";
    if (nameLength > 30) nameFontSize = "9pt";
    else if (nameLength > 20) nameFontSize = "11pt";

    // Calculate price font size based on length
    const priceStr = product.price.toFixed(2);
    let priceFontSize = "42pt";
    let priceLetterSpacing = "-2px";
    if (priceStr.length > 10) {
      priceFontSize = "24pt";
      priceLetterSpacing = "-1px";
    } else if (priceStr.length > 7) {
      priceFontSize = "32pt";
      priceLetterSpacing = "-1.5px";
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Label - ${product.name}</title>
        <style>
          @page { size: 58mm 35mm; margin: 0; }
          body { 
            margin: 0; 
            padding: 1.5mm; 
            font-family: system-ui, -apple-system, sans-serif; 
            width: 55mm; 
            height: 32mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            color: black;
            background: white;
          }
          .name { 
            font-size: ${nameFontSize}; 
            font-weight: 800; 
            text-align: center; 
            line-height: 1.1;
            text-transform: uppercase;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
          .price-container {
            flex-grow: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 1mm 0;
          }
          .price { 
            font-size: ${priceFontSize}; 
            font-weight: 950; 
            letter-spacing: ${priceLetterSpacing};
          }
          .currency {
            font-size: 16pt;
            font-weight: 900;
            margin-left: 2px;
          }
          .footer {
            font-size: 8pt;
            font-weight: 700;
            text-align: center;
            border-top: 1.5pt solid black;
            padding-top: 0.5mm;
          }
        </style>
      </head>
      <body>
        <div class="name">${product.name}</div>
        <div class="price-container">
          <span class="price">${product.price.toFixed(2)}</span>
          <span class="currency">DA</span>
        </div>
        <div class="footer">
          ${new Date().toLocaleDateString('fr-FR')} • ${unitSuffix}
        </div>
        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  useEffect(() => {
    if (open && product) {
      handlePrint();
      const timer = setTimeout(onClose, 800);
      return () => clearTimeout(timer);
    }
  }, [open, product]);

  if (!open || !product) return null;

  const unit = product.unit || "pcs";
  const unitSuffix = unit === "kg" ? "DA/kg" : unit === "l" ? "DA/L" : "DA";
  const nameLength = product.name.length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-[360px] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Simple Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Printer className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-bold text-foreground tracking-tight uppercase">Impression Étiquette</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6 flex flex-col items-center gap-6">
            {/* The Sticker Preview - Classic Light style */}
            <div className="bg-white text-black p-4 rounded border border-black/10 shadow-sm w-[240px] aspect-[58/35] flex flex-col justify-between">
              <p className={`font-black text-center leading-none uppercase line-clamp-2 ${
                nameLength > 30 ? 'text-[10px]' : nameLength > 20 ? 'text-[12px]' : 'text-[14px]'
              }`}>
                {product.name}
              </p>
              
              <div className="flex items-center justify-center flex-1 overflow-hidden px-2">
                <span className={`font-black tracking-tighter tabular-nums ${
                  product.price.toFixed(2).length > 10 ? 'text-2xl' : product.price.toFixed(2).length > 7 ? 'text-4xl' : 'text-5xl'
                }`}>
                  {product.price.toFixed(2)}
                </span>
                <span className="text-lg font-black ml-1">DA</span>
              </div>

              <div className="border-t border-black pt-1 flex justify-between items-center text-[8px] font-bold uppercase text-black">
                <span>{new Date().toLocaleDateString('fr-FR')}</span>
                <span>{unitSuffix}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-primary">
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Envoi à l'imprimante thermique...</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LabelPreview;
