import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Barcode, X, CornerDownLeft } from "lucide-react";
import type { Product } from "@/types/product";

interface RegisterSearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: any) => void;
  t: (key: string) => string;
  initialQuery?: string;
  products: Product[];
}

const RegisterSearchBar = ({ isOpen, onClose, onSelectProduct, t, initialQuery, products }: RegisterSearchBarProps) => {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"name" | "barcode">("name");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.length > 0
    ? products.filter((p) =>
      mode === "name"
        ? p.name.toLowerCase().includes(query.toLowerCase())
        : (p.barcode || "").includes(query)
    ).slice(0, 8)
    : [];

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery || "");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      onSelectProduct(results[selectedIndex]);
      setQuery("");
      onClose();
    } else if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Tab") {
      e.preventDefault();
      setMode((m) => (m === "name" ? "barcode" : "name"));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="overflow-visible border-b border-register-border bg-card relative z-20"
        >
          {/* Search input row */}
          <div className="flex items-center gap-1.5 px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === "name" ? t("search.placeholder.name") : t("search.placeholder.barcode")}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground font-medium"
              autoComplete="off"
            />
            {/* Mode toggle */}
            <button
              onClick={() => setMode((m) => (m === "name" ? "barcode" : "name"))}
              className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold uppercase bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {mode === "name" ? <Search className="h-3 w-3" /> : <Barcode className="h-3 w-3" />}
              {mode === "name" ? t("search.mode.name") : t("search.mode.barcode")}
            </button>
            <span className="text-[8px] text-muted-foreground px-1">TAB</span>
            <button
              onClick={onClose}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Autocomplete dropdown — waterfall over cart */}
          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                style={{ transformOrigin: "top" }}
                className="absolute left-0 right-0 top-full bg-card border border-register-border shadow-lg z-30 max-h-[280px] overflow-auto"
              >
                {results.map((product, i) => (
                  <motion.button
                    key={product.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => {
                      onSelectProduct(product);
                      setQuery("");
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors border-b border-register-border last:border-b-0 ${i === selectedIndex
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted/60 text-foreground"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <CornerDownLeft className={`h-3 w-3 ${i === selectedIndex ? "text-primary-foreground/70" : "text-muted-foreground"}`} />
                      <span className="text-[12px] font-medium">{product.name}</span>
                      <span className={`text-[9px] ${i === selectedIndex ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {product.barcode}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold">
                      {product.price.toFixed(2)} DA
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* No results */}
          <AnimatePresence>
            {query.length > 0 && results.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute left-0 right-0 top-full bg-card border border-register-border shadow-lg z-30 px-3 py-3 text-center"
              >
                <span className="text-[11px] text-muted-foreground">{t("search.noResults")}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RegisterSearchBar;
