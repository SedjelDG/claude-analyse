import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Scale, Layers, Box, ScanBarcode, ArrowRight,
  Check, Plus, Calendar, DollarSign, AlertTriangle,
  RotateCcw, Sparkles, ShoppingCart, Weight, Hash, X, Truck
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EditableProduct, emptyProduct } from "@/components/management/ProductFormDialog";
import { Product } from "@/utils/mockProducts";

type SaleMode = "standard" | "weighed" | "mixte";

type StepId =
  | "type"
  | "name"
  | "category"
  | "brand"
  | "barcode"
  | "plu"
  | "stockMode"
  | "combinedFinance"
  | "qPacks"
  | "packSetup"
  | "qExpiration"
  | "expirationSetup"
  | "qWholesale"
  | "wholesaleSetup"
  | "confirm";

const CATEGORIES = ["Alimentation", "Boissons", "Frais", "Fruits", "Légumes", "Hygiène", "Entretien", "Autres"];

function getStepFlow(mode: SaleMode): StepId[] {
  switch (mode) {
    case "standard":
      return ["name", "category", "brand", "barcode", "stockMode", "combinedFinance", "qPacks", "qExpiration", "qWholesale", "confirm"];
    case "weighed":
      return ["name", "category", "brand", "plu", "combinedFinance", "qExpiration", "confirm"];
    case "mixte":
      return ["name", "category", "brand", "barcode", "plu", "stockMode", "combinedFinance", "qPacks", "qExpiration", "qWholesale", "confirm"];
  }
}

function insertAfter(flow: StepId[], after: StepId, toInsert: StepId): StepId[] {
  const idx = flow.indexOf(after);
  if (idx === -1) return flow;
  const copy = [...flow];
  copy.splice(idx + 1, 0, toInsert);
  return copy;
}

const slideVariants = {
  enter: { x: 80, opacity: 0, scale: 0.96 },
  center: { x: 0, opacity: 1, scale: 1 },
  exit: { x: -80, opacity: 0, scale: 0.96 },
};

const slideBackVariants = {
  enter: { x: -80, opacity: 0, scale: 0.96 },
  center: { x: 0, opacity: 1, scale: 1 },
  exit: { x: 80, opacity: 0, scale: 0.96 },
};

interface ProductCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (p: EditableProduct) => void;
  products?: Product[];
}

export const ProductCreationWizard: React.FC<ProductCreationWizardProps> = ({ isOpen, onClose, onSave, products = [] }) => {
  const [saleMode, setSaleMode] = useState<SaleMode | null>(null);
  const [stepFlow, setStepFlow] = useState<StepId[]>([]);
  const [stepIndex, setStepIndex] = useState(-1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [formData, setFormData] = useState<EditableProduct>({ ...emptyProduct, barcodes: [""] });

  // Stock mode: "packs" or "units"
  const [stockMode, setStockMode] = useState<"packs" | "units">("packs");

  // Purchase sub-fields (pack mode)
  const [packsBought, setPacksBought] = useState("");
  const [unitsPerPack, setUnitsPerPack] = useState("");
  const [packPrice, setPackPrice] = useState("");

  // Purchase sub-fields (unit mode)
  const [unitQty, setUnitQty] = useState("");
  const [unitCostInput, setUnitCostInput] = useState("");

  // Category
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [customCategory, setCustomCategory] = useState("");
  const [categoryMode, setCategoryMode] = useState<"list" | "custom">("list");

  // Brand
  const [brandIndex, setBrandIndex] = useState(-1); // -1 = typing mode
  const [brandInput, setBrandInput] = useState("");

  // Pack setup fields — multiple variants
  const [packSize, setPackSize] = useState("6");
  const [packName, setPackName] = useState("Pack de 6");
  const [packSalePrice, setPackSalePrice] = useState("");
  const [currentPackVariants, setCurrentPackVariants] = useState<Array<{ size: number; name: string; price: number }>>([]);

  // Wholesale fields
  const [wholesaleMinQty, setWholesaleMinQty] = useState("10");
  const [wholesalePrice, setWholesalePrice] = useState("");

  // Expiration fields
  const [expDate, setExpDate] = useState("");
  const [expQty, setExpQty] = useState("");

  // Combined finance fields
  const [salePrice, setSalePrice] = useState("");
  const [weightPrice, setWeightPrice] = useState("");

  const update = (obj: Partial<EditableProduct>) => setFormData(prev => ({ ...prev, ...obj }));

  const currentStep = stepIndex >= 0 && stepIndex < stepFlow.length ? stepFlow[stepIndex] : "type";

  // Extract unique brands from products
  const existingBrands = React.useMemo(() => {
    const brands = new Set<string>();
    for (const p of products) {
      if (p.brand && p.brand.trim()) brands.add(p.brand.trim());
    }
    return Array.from(brands).sort();
  }, [products]);

  // Auto-compute next PLU
  const nextPlu = React.useMemo(() => {
    let maxPlu = 0;
    for (const p of products) {
      if (p.plu) {
        const num = parseInt(p.plu.replace(/\D/g, ""), 10);
        if (!isNaN(num) && num > maxPlu) maxPlu = num;
      }
    }
    return String(maxPlu + 1).padStart(4, "0");
  }, [products]);

  const totalSteps = stepFlow.length + 1;
  const progress = ((stepIndex + 2) / totalSteps) * 100;

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSaleMode(null);
      setStepFlow([]);
      setStepIndex(-1);
      setDirection("forward");
      setFormData({ ...emptyProduct, barcodes: [""] });
      setStockMode("packs");
      setPacksBought("");
      setUnitsPerPack("");
      setPackPrice("");
      setUnitQty("");
      setUnitCostInput("");
      setCategoryIndex(0);
      setCustomCategory("");
      setCategoryMode("list");
      setBrandIndex(-1);
      setBrandInput("");
      setPackSize("6");
      setPackName("Pack de 6");
      setPackSalePrice("");
      setCurrentPackVariants([]);
      setWholesaleMinQty("10");
      setWholesalePrice("");
      setExpDate("");
      setExpQty("");
      setSalePrice("");
      setWeightPrice("");
    }
  }, [isOpen]);

  const goForward = useCallback(() => {
    setDirection("forward");
    setStepIndex(i => i + 1);
  }, []);

  const goBack = useCallback(() => {
    setDirection("back");
    if (stepIndex <= 0) {
      setSaleMode(null);
      setStepIndex(-1);
    } else {
      setStepIndex(i => i - 1);
    }
  }, [stepIndex]);

  const selectMode = useCallback((mode: SaleMode) => {
    setSaleMode(mode);
    const flow = getStepFlow(mode);
    setStepFlow(flow);
    if (mode === "weighed") {
      update({ scaleEnabled: true, unit: "kg", plu: nextPlu });
    } else if (mode === "standard") {
      update({ scaleEnabled: false, unit: "pcs", plu: "" });
    } else {
      update({ scaleEnabled: true, unit: "pcs", plu: nextPlu });
    }
    setDirection("forward");
    setStepIndex(0);
  }, [nextPlu]);

  const answerQuestion = useCallback((questionStep: StepId, answer: boolean) => {
    if (answer) {
      const setupStep: StepId =
        questionStep === "qPacks" ? "packSetup" :
        questionStep === "qExpiration" ? "expirationSetup" :
        "wholesaleSetup";
      setStepFlow(prev => insertAfter(prev, questionStep, setupStep));
    }
    if (questionStep === "qWholesale") {
      update({ wholesaleEnabled: answer });
    }
    goForward();
  }, [goForward]);

  const handleSave = useCallback(() => {
    const final = { ...formData };
    if (currentPackVariants.length > 0) {
      final.packVariants = currentPackVariants;
    }
    onSave(final);
    onClose();
  }, [formData, currentPackVariants, onSave, onClose]);

  const handleSaveAndNew = useCallback(() => {
    const final = { ...formData };
    if (currentPackVariants.length > 0) {
      final.packVariants = currentPackVariants;
    }
    onSave(final);
    // Reset
    setSaleMode(null);
    setStepFlow([]);
    setStepIndex(-1);
    setDirection("forward");
    setFormData({ ...emptyProduct, barcodes: [""] });
    setStockMode("packs");
    setPacksBought("");
    setUnitsPerPack("");
    setPackPrice("");
    setUnitQty("");
    setUnitCostInput("");
    setCategoryIndex(0);
    setCustomCategory("");
    setCategoryMode("list");
    setBrandIndex(-1);
    setBrandInput("");
    setPackSize("6");
    setPackName("Pack de 6");
    setPackSalePrice("");
    setCurrentPackVariants([]);
    setWholesaleMinQty("10");
    setWholesalePrice("");
    setExpDate("");
    setExpQty("");
    setSalePrice("");
    setWeightPrice("");
  }, [formData, currentPackVariants, onSave]);

  const modeLabels: Record<SaleMode, string> = { standard: "Standard", weighed: "Pesé (Balance)", mixte: "Mixte" };
  const ModeIcon: Record<SaleMode, typeof Box> = { standard: Box, weighed: Scale, mixte: Layers };

  const variants = direction === "forward" ? slideVariants : slideBackVariants;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden bg-background border-border shadow-2xl rounded-xl">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-primary rounded-r-full"
            animate={{ width: `${stepIndex < 0 ? 5 : progress}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Content */}
        <div className="px-6 py-6 min-h-[280px] flex flex-col justify-center relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep + "-" + stepIndex}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="w-full"
            >
              {currentStep === "type" && (
                <TypeStep onSelect={selectMode} />
              )}

              {currentStep === "name" && (
                <SingleInputStep
                  icon={<Sparkles className="w-5 h-5" />}
                  title="Nom du produit"
                  subtitle="Saisissez la désignation du produit"
                  placeholder="Ex: Fromage Rouge Cheddar"
                  value={formData.name}
                  onChange={v => update({ name: v })}
                  onSubmit={goForward}
                  autoFocus
                />
              )}

              {currentStep === "category" && (
                <CategoryStep
                  categories={CATEGORIES}
                  selectedIndex={categoryIndex}
                  onIndexChange={setCategoryIndex}
                  onSelect={(cat) => { update({ category: cat }); goForward(); }}
                  currentValue={formData.category}
                  mode={categoryMode}
                  onModeChange={setCategoryMode}
                  customCategory={customCategory}
                  onCustomCategoryChange={setCustomCategory}
                />
              )}

              {currentStep === "brand" && (
                <BrandStep
                  brands={existingBrands}
                  brandIndex={brandIndex}
                  onBrandIndexChange={setBrandIndex}
                  brandInput={brandInput}
                  onBrandInputChange={setBrandInput}
                  onSelect={(brand) => { update({ brand }); goForward(); }}
                />
              )}

              {currentStep === "barcode" && (
                <BarcodeStep
                  barcodes={formData.barcodes}
                  onBarcodesChange={(b) => update({ barcodes: b })}
                  onSubmit={goForward}
                />
              )}

              {currentStep === "plu" && (
                <SingleInputStep
                  icon={<Hash className="w-5 h-5" />}
                  title="Code PLU (Balance)"
                  subtitle="Pré-généré automatiquement — Entrée pour accepter"
                  placeholder="0001"
                  value={formData.plu}
                  onChange={v => update({ plu: v })}
                  onSubmit={goForward}
                  autoFocus
                  mono
                />
              )}

              {currentStep === "stockMode" && (
                <StockModeStep
                  mode={stockMode}
                  onSelect={(m) => { setStockMode(m); goForward(); }}
                />
              )}

              {currentStep === "combinedFinance" && (
                <CombinedFinanceStep
                  saleMode={saleMode!}
                  stockMode={stockMode}
                  // Pack purchase fields
                  packsBought={packsBought}
                  unitsPerPack={unitsPerPack}
                  packPrice={packPrice}
                  onPacksBought={setPacksBought}
                  onUnitsPerPack={setUnitsPerPack}
                  onPackPrice={setPackPrice}
                  // Unit purchase fields
                  unitQty={unitQty}
                  unitCostInput={unitCostInput}
                  onUnitQty={setUnitQty}
                  onUnitCostInput={setUnitCostInput}
                  // Sale prices
                  salePrice={salePrice}
                  weightPrice={weightPrice}
                  onSalePrice={setSalePrice}
                  onWeightPrice={setWeightPrice}
                  // Submit
                  onSubmit={(cost, stock, price, wPrice) => {
                    update({ cost, stock, price, wholesalePrice: wPrice || 0 });
                    if (saleMode === "weighed") {
                      update({ cost, price, stock: 0 });
                    }
                    goForward();
                  }}
                />
              )}

              {currentStep === "qPacks" && (
                <YesNoStep
                  icon={<Package className="w-5 h-5" />}
                  question="Ce produit est-il vendu en packs ?"
                  hint="Ex: Pack de 6, carton de 12..."
                  onAnswer={(answer) => answerQuestion("qPacks", answer)}
                />
              )}

              {currentStep === "packSetup" && (
                <PackSetupStep
                  packSize={packSize}
                  packName={packName}
                  packSalePrice={packSalePrice}
                  onPackSize={setPackSize}
                  onPackName={setPackName}
                  onPackSalePrice={setPackSalePrice}
                  unitPrice={formData.price}
                  existingVariants={currentPackVariants}
                  onAddVariant={(variant) => {
                    setCurrentPackVariants(prev => [...prev, variant]);
                    setPackSize("12");
                    setPackName("Pack de 12");
                    setPackSalePrice("");
                  }}
                  onSubmit={() => {
                    // Add the last variant if fields are filled
                    const lastVariant = {
                      size: Number(packSize) || 6,
                      name: packName || `Pack de ${packSize}`,
                      price: Number(packSalePrice) || formData.price * (Number(packSize) || 6),
                    };
                    const allVariants = [...currentPackVariants, lastVariant];
                    setCurrentPackVariants(allVariants);
                    update({ packVariants: allVariants });
                    goForward();
                  }}
                />
              )}

              {currentStep === "qExpiration" && (
                <YesNoStep
                  icon={<Calendar className="w-5 h-5" />}
                  question="Suivre les dates d'expiration ?"
                  hint="Alertes automatiques à l'approche de la date limite"
                  onAnswer={(answer) => answerQuestion("qExpiration", answer)}
                />
              )}

              {currentStep === "expirationSetup" && (
                <ExpirationSetupStep
                  expDate={expDate}
                  expQty={expQty}
                  onExpDate={setExpDate}
                  onExpQty={setExpQty}
                  onSubmit={() => {
                    if (expDate) {
                      const entries = [...formData.expirationDates, { date: expDate, quantity: Number(expQty) || formData.stock }];
                      update({ expirationDates: entries });
                    }
                    goForward();
                  }}
                />
              )}

              {currentStep === "qWholesale" && (
                <YesNoStep
                  icon={<DollarSign className="w-5 h-5" />}
                  question="Activer le prix de gros ?"
                  hint="Prix spécial à partir d'une quantité minimum"
                  onAnswer={(answer) => answerQuestion("qWholesale", answer)}
                />
              )}

              {currentStep === "wholesaleSetup" && (
                <WholesaleSetupStep
                  minQty={wholesaleMinQty}
                  price={wholesalePrice}
                  onMinQty={setWholesaleMinQty}
                  onPrice={setWholesalePrice}
                  unitPrice={formData.price}
                  onSubmit={() => {
                    update({
                      wholesaleEnabled: true,
                      wholesaleMinQty: Number(wholesaleMinQty) || 10,
                      wholesalePrice: Number(wholesalePrice) || Math.round(formData.price * 0.85),
                    });
                    goForward();
                  }}
                />
              )}

              {currentStep === "confirm" && (
                <ConfirmStep
                  formData={formData}
                  saleMode={saleMode!}
                  modeLabels={modeLabels}
                  ModeIcon={ModeIcon}
                  packVariants={currentPackVariants}
                  onSave={handleSave}
                  onSaveAndNew={handleSaveAndNew}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-between">
          <button
            onClick={stepIndex >= 0 ? goBack : onClose}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            {stepIndex >= 0 ? "Retour" : "Annuler"}
            <kbd className="ml-1 px-1 py-0.5 text-[9px] font-mono bg-muted border border-border rounded">Esc</kbd>
          </button>
          <div className="text-[10px] text-muted-foreground font-mono">
            {stepIndex >= 0 ? `${stepIndex + 1}/${stepFlow.length}` : ""}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ═══════════════════════════════════════════
   MICRO-STEP COMPONENTS
   ═══════════════════════════════════════════ */

// TYPE SELECTION STEP
const TypeStep: React.FC<{ onSelect: (mode: SaleMode) => void }> = ({ onSelect }) => {
  const [focused, setFocused] = useState(0);
  const modes: SaleMode[] = ["standard", "weighed", "mixte"];
  const labels = { standard: "Standard", weighed: "Pesé (Balance)", mixte: "Mixte" };
  const descriptions = {
    standard: "Vendu à l'unité avec code-barres",
    weighed: "Vendu au poids via la balance",
    mixte: "Vendu à l'unité ET au poids",
  };
  const Icons = { standard: Box, weighed: Scale, mixte: Layers };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); setFocused(f => (f + 1) % 3); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); setFocused(f => (f + 2) % 3); }
      if (e.key === "Enter") { e.preventDefault(); onSelect(modes[focused]); }
      if (e.key === "1") { e.preventDefault(); onSelect("standard"); }
      if (e.key === "2") { e.preventDefault(); onSelect("weighed"); }
      if (e.key === "3") { e.preventDefault(); onSelect("mixte"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focused, onSelect]);

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-lg font-black text-foreground">Type de Vente</h2>
        <p className="text-xs text-muted-foreground mt-1">Choisissez le mode de vente de ce produit</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {modes.map((mode, i) => {
          const Icon = Icons[mode];
          const isFocused = focused === i;
          return (
            <motion.button
              key={mode}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(mode)}
              className={`relative flex flex-col items-center gap-2.5 p-5 rounded-xl border-2 transition-all ${
                isFocused
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/30 bg-muted/20"
              }`}
            >
              <div className={`p-3 rounded-xl ${isFocused ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold">{labels[mode]}</span>
              <span className="text-[10px] text-muted-foreground leading-tight text-center">{descriptions[mode]}</span>
              <kbd className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-muted border border-border rounded text-muted-foreground">
                {i + 1}
              </kbd>
            </motion.button>
          );
        })}
      </div>
      <p className="text-center text-[10px] text-muted-foreground">
        ← → pour naviguer • Entrée pour confirmer
      </p>
    </div>
  );
};

// SINGLE INPUT STEP
const SingleInputStep: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  autoFocus?: boolean;
  mono?: boolean;
  optional?: boolean;
}> = ({ icon, title, subtitle, placeholder, value, onChange, onSubmit, autoFocus, mono, optional }) => {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => ref.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  return (
    <div className="space-y-5 py-2">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">{icon}</div>
        <div>
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <Input
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") { e.preventDefault(); onSubmit(); }
        }}
        placeholder={placeholder}
        className={`h-14 text-lg font-medium ${mono ? "font-mono" : ""}`}
      />
      <p className="text-center text-[10px] text-muted-foreground">
        <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono font-bold">Entrée</kbd>
        {" "}pour {optional ? "passer ou " : ""}continuer
      </p>
    </div>
  );
};

// CATEGORY STEP — with custom category support when "Autres" selected
const CategoryStep: React.FC<{
  categories: string[];
  selectedIndex: number;
  onIndexChange: (i: number) => void;
  onSelect: (cat: string) => void;
  currentValue: string;
  mode: "list" | "custom";
  onModeChange: (m: "list" | "custom") => void;
  customCategory: string;
  onCustomCategoryChange: (v: string) => void;
}> = ({ categories, selectedIndex, onIndexChange, onSelect, mode, onModeChange, customCategory, onCustomCategoryChange }) => {
  const customRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "custom") {
      const t = setTimeout(() => customRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [mode]);

  useEffect(() => {
    if (mode === "list") {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); onIndexChange((selectedIndex + 1) % categories.length); }
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); onIndexChange((selectedIndex + categories.length - 1) % categories.length); }
        if (e.key === "Enter") {
          e.preventDefault();
          const selected = categories[selectedIndex];
          if (selected === "Autres") {
            onModeChange("custom");
          } else {
            onSelect(selected);
          }
        }
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }
  }, [mode, selectedIndex, categories, onIndexChange, onSelect, onModeChange]);

  if (mode === "custom") {
    return (
      <div className="space-y-5 py-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Package className="w-5 h-5" /></div>
          <div>
            <h3 className="text-base font-bold text-foreground">Catégorie personnalisée</h3>
            <p className="text-xs text-muted-foreground">Saisissez le nom de la nouvelle catégorie</p>
          </div>
        </div>
        <Input
          ref={customRef}
          value={customCategory}
          onChange={e => onCustomCategoryChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (customCategory.trim()) {
                onSelect(customCategory.trim());
              }
            }
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              onModeChange("list");
            }
          }}
          placeholder="Ex: Épicerie fine"
          className="h-14 text-lg font-medium"
        />
        <p className="text-center text-[10px] text-muted-foreground">
          <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono font-bold">Entrée</kbd> pour confirmer •
          <kbd className="ml-1 px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono font-bold">Esc</kbd> pour revenir à la liste
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Package className="w-5 h-5" /></div>
        <div>
          <h3 className="text-base font-bold text-foreground">Catégorie</h3>
          <p className="text-xs text-muted-foreground">↑ ↓ pour naviguer • Entrée pour sélectionner</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {categories.map((cat, i) => (
          <motion.button
            key={cat}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (cat === "Autres") {
                onModeChange("custom");
              } else {
                onSelect(cat);
              }
            }}
            className={`px-4 py-3 rounded-lg text-sm font-medium text-left transition-all ${
              i === selectedIndex
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted/50 text-foreground hover:bg-muted"
            }`}
          >
            {cat === "Autres" ? "Autres (personnalisé)" : cat}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// BRAND STEP — searchable list of existing brands + free text
const BrandStep: React.FC<{
  brands: string[];
  brandIndex: number;
  onBrandIndexChange: (i: number) => void;
  brandInput: string;
  onBrandInputChange: (v: string) => void;
  onSelect: (brand: string) => void;
}> = ({ brands, brandIndex, onBrandIndexChange, brandInput, onBrandInputChange, onSelect }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  const filtered = brandInput.trim()
    ? brands.filter(b => b.toLowerCase().includes(brandInput.toLowerCase()))
    : brands;

  // Reset index when filter changes
  useEffect(() => {
    onBrandIndexChange(-1);
  }, [brandInput]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target !== inputRef.current) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        onBrandIndexChange(Math.min(brandIndex + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        onBrandIndexChange(Math.max(brandIndex - 1, -1));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (brandIndex >= 0 && brandIndex < filtered.length) {
          onSelect(filtered[brandIndex]);
        } else {
          onSelect(brandInput.trim());
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [brandIndex, filtered, brandInput, onBrandIndexChange, onSelect]);

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Package className="w-5 h-5" /></div>
        <div>
          <h3 className="text-base font-bold text-foreground">Marque</h3>
          <p className="text-xs text-muted-foreground">Tapez pour filtrer ou créer • Entrée pour passer</p>
        </div>
      </div>
      <Input
        ref={inputRef}
        value={brandInput}
        onChange={e => onBrandInputChange(e.target.value)}
        placeholder="Ex: Candia"
        className="h-12 text-lg font-medium"
      />
      {filtered.length > 0 && (
        <div className="max-h-[140px] overflow-y-auto rounded-lg border border-border bg-muted/20">
          {filtered.map((brand, i) => (
            <button
              key={brand}
              onClick={() => onSelect(brand)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                i === brandIndex
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      )}
      {brands.length === 0 && (
        <p className="text-xs text-muted-foreground text-center italic">Aucune marque existante</p>
      )}
      <p className="text-center text-[10px] text-muted-foreground">
        <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono font-bold">↑↓</kbd> naviguer •
        <kbd className="ml-1 px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono font-bold">Entrée</kbd> confirmer ou passer
      </p>
    </div>
  );
};

// BARCODE STEP — supports multiple barcodes
const BarcodeStep: React.FC<{
  barcodes: string[];
  onBarcodesChange: (b: string[]) => void;
  onSubmit: () => void;
}> = ({ barcodes, onBarcodesChange, onSubmit }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const t = setTimeout(() => inputRefs.current[0]?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  // Focus newly added barcode input
  useEffect(() => {
    if (barcodes.length > 1) {
      const t = setTimeout(() => inputRefs.current[barcodes.length - 1]?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [barcodes.length]);

  const updateBarcode = (idx: number, value: string) => {
    const updated = [...barcodes];
    updated[idx] = value;
    onBarcodesChange(updated);
  };

  const addBarcode = () => {
    onBarcodesChange([...barcodes, ""]);
  };

  const removeBarcode = (idx: number) => {
    if (barcodes.length <= 1) return;
    const updated = barcodes.filter((_, i) => i !== idx);
    onBarcodesChange(updated);
  };

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><ScanBarcode className="w-5 h-5" /></div>
        <div>
          <h3 className="text-base font-bold text-foreground">Code-barres</h3>
          <p className="text-xs text-muted-foreground">Scannez ou tapez • <kbd className="px-1 py-0.5 bg-muted border border-border rounded text-[10px] font-mono">+</kbd> pour ajouter</p>
        </div>
      </div>
      <div className="space-y-2">
        {barcodes.map((bc, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input
              ref={el => { inputRefs.current[idx] = el; }}
              value={bc}
              onChange={e => updateBarcode(idx, e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  // If this is the last barcode and it has a value, advance
                  if (idx === barcodes.length - 1) {
                    onSubmit();
                  } else {
                    inputRefs.current[idx + 1]?.focus();
                  }
                }
                if (e.key === "+" || (e.key === "Tab" && !e.shiftKey)) {
                  if (e.key === "+") {
                    e.preventDefault();
                    addBarcode();
                  }
                }
              }}
              placeholder={idx === 0 ? "Scannez le code-barres..." : `Code-barres #${idx + 1}`}
              className="h-12 text-lg font-mono flex-1"
            />
            {barcodes.length > 1 && (
              <button
                onClick={() => removeBarcode(idx)}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={addBarcode}
        className="w-full py-2 text-xs text-primary hover:bg-primary/5 rounded-lg transition-colors flex items-center justify-center gap-1"
      >
        <Plus className="w-3 h-3" /> Ajouter un code-barres
      </button>
      <p className="text-center text-[10px] text-muted-foreground">
        <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono font-bold">Entrée</kbd> pour continuer
      </p>
    </div>
  );
};

// STOCK MODE STEP — choose units vs packs
const StockModeStep: React.FC<{
  mode: "packs" | "units";
  onSelect: (m: "packs" | "units") => void;
}> = ({ mode, onSelect }) => {
  const [focused, setFocused] = useState(mode === "packs" ? 0 : 1);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocused(f => f === 0 ? 1 : 0);
      }
      if (e.key === "Enter") { e.preventDefault(); onSelect(focused === 0 ? "packs" : "units"); }
      if (e.key === "1") { e.preventDefault(); onSelect("packs"); }
      if (e.key === "2") { e.preventDefault(); onSelect("units"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focused, onSelect]);

  const options = [
    { key: "packs" as const, label: "Par colis", desc: "Saisir le nombre de colis achetés", icon: Truck },
    { key: "units" as const, label: "Par unités", desc: "Saisir directement la quantité et le coût", icon: Hash },
  ];

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="inline-flex p-3 bg-primary/10 rounded-2xl text-primary mb-3">
          <ShoppingCart className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-foreground">Mode d'achat</h2>
        <p className="text-xs text-muted-foreground mt-1">Comment avez-vous acheté ce produit ?</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt, i) => {
          const Icon = opt.icon;
          return (
            <motion.button
              key={opt.key}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(opt.key)}
              className={`relative flex flex-col items-center gap-2.5 p-5 rounded-xl border-2 transition-all ${
                focused === i
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/30 bg-muted/20"
              }`}
            >
              <div className={`p-3 rounded-xl ${focused === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold">{opt.label}</span>
              <span className="text-[10px] text-muted-foreground leading-tight text-center">{opt.desc}</span>
              <kbd className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-muted border border-border rounded text-muted-foreground">
                {i + 1}
              </kbd>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// COMBINED FINANCE + STOCK STEP
const CombinedFinanceStep: React.FC<{
  saleMode: SaleMode;
  stockMode: "packs" | "units";
  packsBought: string;
  unitsPerPack: string;
  packPrice: string;
  onPacksBought: (v: string) => void;
  onUnitsPerPack: (v: string) => void;
  onPackPrice: (v: string) => void;
  unitQty: string;
  unitCostInput: string;
  onUnitQty: (v: string) => void;
  onUnitCostInput: (v: string) => void;
  salePrice: string;
  weightPrice: string;
  onSalePrice: (v: string) => void;
  onWeightPrice: (v: string) => void;
  onSubmit: (cost: number, stock: number, price: number, weightPriceNum?: number) => void;
}> = ({
  saleMode, stockMode,
  packsBought, unitsPerPack, packPrice, onPacksBought, onUnitsPerPack, onPackPrice,
  unitQty, unitCostInput, onUnitQty, onUnitCostInput,
  salePrice, weightPrice, onSalePrice, onWeightPrice,
  onSubmit,
}) => {
  const refPacksBought = useRef<HTMLInputElement>(null);
  const refUnitsPerPack = useRef<HTMLInputElement>(null);
  const refPackPrice = useRef<HTMLInputElement>(null);
  const refUnitQty = useRef<HTMLInputElement>(null);
  const refUnitCost = useRef<HTMLInputElement>(null);
  const refSalePrice = useRef<HTMLInputElement>(null);
  const refWeightPrice = useRef<HTMLInputElement>(null);

  const isWeighed = saleMode === "weighed";
  const isMixte = saleMode === "mixte";

  // Auto-focus first relevant field
  useEffect(() => {
    const t = setTimeout(() => {
      if (isWeighed) {
        refUnitCost.current?.focus();
      } else if (stockMode === "packs") {
        refPacksBought.current?.focus();
      } else {
        refUnitQty.current?.focus();
      }
    }, 80);
    return () => clearTimeout(t);
  }, [stockMode, isWeighed]);

  // Computed values for pack mode
  const packs = Number(packsBought) || 0;
  const units = Number(unitsPerPack) || 1;
  const pPrice = Number(packPrice) || 0;
  const totalUnits = packs * units;
  const unitCostCalc = totalUnits > 0 ? pPrice / units : 0;

  // Computed values for unit mode
  const directQty = Number(unitQty) || 0;
  const directCost = Number(unitCostInput) || 0;

  // Effective values
  const effectiveStock = isWeighed ? 0 : (stockMode === "packs" ? totalUnits : directQty);
  const effectiveCost = isWeighed ? (Number(unitCostInput) || 0) : (stockMode === "packs" ? unitCostCalc : directCost);
  const effectivePrice = Number(salePrice) || 0;
  const effectiveWeightPrice = Number(weightPrice) || 0;

  const profit = effectivePrice - effectiveCost;
  const marginPct = effectiveCost > 0 ? (profit / effectiveCost) * 100 : 0;

  const handleSubmit = () => {
    onSubmit(effectiveCost, effectiveStock, effectivePrice, isMixte ? effectiveWeightPrice : undefined);
  };

  return (
    <div className="space-y-3 py-1">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><DollarSign className="w-5 h-5" /></div>
        <div>
          <h3 className="text-base font-bold text-foreground">
            {isWeighed ? "Tarification au KG" : "Achat, Prix & Stock"}
          </h3>
          <p className="text-xs text-muted-foreground">Entrée pour passer au champ suivant</p>
        </div>
      </div>

      <div className="bg-muted/20 rounded-xl border border-border p-4 space-y-3">
        {/* PURCHASE SECTION - not for weighed */}
        {!isWeighed && (
          <>
            <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Achat</Label>
            {stockMode === "packs" ? (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Colis</Label>
                  <Input
                    ref={refPacksBought}
                    type="number"
                    value={packsBought}
                    onChange={e => onPacksBought(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); refUnitsPerPack.current?.focus(); } }}
                    placeholder="5"
                    className="mt-0.5 h-10"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Unités/colis</Label>
                  <Input
                    ref={refUnitsPerPack}
                    type="number"
                    value={unitsPerPack}
                    onChange={e => onUnitsPerPack(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); refPackPrice.current?.focus(); } }}
                    placeholder="12"
                    className="mt-0.5 h-10"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Prix colis (DA)</Label>
                  <Input
                    ref={refPackPrice}
                    type="number"
                    value={packPrice}
                    onChange={e => onPackPrice(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); refSalePrice.current?.focus(); } }}
                    placeholder="600"
                    className="mt-0.5 h-10"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Quantité</Label>
                  <Input
                    ref={refUnitQty}
                    type="number"
                    value={unitQty}
                    onChange={e => onUnitQty(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); refUnitCost.current?.focus(); } }}
                    placeholder="60"
                    className="mt-0.5 h-10"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Coût unitaire (DA)</Label>
                  <Input
                    ref={refUnitCost}
                    type="number"
                    value={unitCostInput}
                    onChange={e => onUnitCostInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); refSalePrice.current?.focus(); } }}
                    placeholder="50"
                    className="mt-0.5 h-10"
                  />
                </div>
              </div>
            )}

            {/* Stock summary */}
            {effectiveStock > 0 && (
              <div className="flex items-center gap-3 text-xs bg-muted/40 rounded-lg px-3 py-2">
                <span className="text-muted-foreground">Stock:</span>
                <span className="font-bold text-foreground">{effectiveStock} unités</span>
                {stockMode === "packs" && effectiveCost > 0 && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">Coût unitaire:</span>
                    <span className="font-bold text-primary">{effectiveCost.toFixed(2)} DA</span>
                  </>
                )}
              </div>
            )}

            <div className="h-px bg-border" />
          </>
        )}

        {/* COST FOR WEIGHED */}
        {isWeighed && (
          <>
            <div>
              <Label className="text-[10px] text-muted-foreground">Coût d'achat / KG (DA)</Label>
              <Input
                ref={refUnitCost}
                type="number"
                value={unitCostInput}
                onChange={e => onUnitCostInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); refSalePrice.current?.focus(); } }}
                placeholder="200"
                className="mt-0.5 h-11 text-lg"
              />
            </div>
            <div className="h-px bg-border" />
          </>
        )}

        {/* SALE PRICE */}
        <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
          {isWeighed ? "Prix de vente / KG" : "Prix de vente"}
        </Label>
        <div className="flex items-center gap-2">
          <Input
            ref={refSalePrice}
            type="number"
            value={salePrice}
            onChange={e => onSalePrice(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (isMixte) {
                  refWeightPrice.current?.focus();
                } else {
                  handleSubmit();
                }
              }
            }}
            placeholder="0"
            className="h-12 text-xl font-bold text-primary flex-1"
          />
          <span className="text-sm text-muted-foreground font-semibold">{isWeighed ? "DA/KG" : "DA"}</span>
        </div>

        {/* WEIGHT PRICE for mixte only */}
        {isMixte && (
          <>
            <div className="h-px bg-border" />
            <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Prix de vente au KG</Label>
            <div className="flex items-center gap-2">
              <Input
                ref={refWeightPrice}
                type="number"
                value={weightPrice}
                onChange={e => onWeightPrice(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(); } }}
                placeholder="0"
                className="h-12 text-xl font-bold text-primary flex-1"
              />
              <span className="text-sm text-muted-foreground font-semibold">DA/KG</span>
            </div>
          </>
        )}

        {/* MARGINS SUMMARY */}
        {effectivePrice > 0 && effectiveCost > 0 && (
          <>
            <div className="h-px bg-border" />
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase">Coût</span>
                <p className="font-bold text-sm text-foreground">{effectiveCost.toFixed(2)} DA</p>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase">Marge</span>
                <p className={`font-bold text-sm ${profit >= 0 ? "text-green-600" : "text-destructive"}`}>
                  {profit.toFixed(2)} DA
                </p>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase">Rentabilité</span>
                <p className={`font-black text-sm ${marginPct >= 0 ? "text-green-600" : "text-destructive"}`}>
                  {marginPct.toFixed(1)}%
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <p className="text-center text-[10px] text-muted-foreground">
        <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono font-bold">Entrée</kbd> pour avancer entre les champs
      </p>
    </div>
  );
};

// YES/NO QUESTION STEP
const YesNoStep: React.FC<{
  icon: React.ReactNode;
  question: string;
  hint: string;
  onAnswer: (yes: boolean) => void;
}> = ({ icon, question, hint, onAnswer }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "o" || key === "y") { e.preventDefault(); onAnswer(true); }
      if (key === "n") { e.preventDefault(); onAnswer(false); }
      if (key === "enter") { e.preventDefault(); onAnswer(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onAnswer]);

  return (
    <div className="flex flex-col items-center text-center py-6 space-y-5">
      <div className="p-4 bg-primary/10 rounded-2xl text-primary">{icon}</div>
      <div>
        <h3 className="text-base font-bold text-foreground">{question}</h3>
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      </div>
      <div className="flex gap-4">
        <button
          onClick={() => onAnswer(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-500/10 text-green-600 border border-green-500/20 hover:bg-green-500/20 transition-colors font-medium text-sm"
        >
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-green-500/20 rounded">O</kbd>
          Oui
        </button>
        <button
          onClick={() => onAnswer(false)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-muted text-muted-foreground border border-border hover:bg-muted/80 transition-colors font-medium text-sm"
        >
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-muted border border-border rounded">N</kbd>
          Non
        </button>
      </div>
    </div>
  );
};

// PACK SETUP STEP — supports multiple variants
const PackSetupStep: React.FC<{
  packSize: string;
  packName: string;
  packSalePrice: string;
  onPackSize: (v: string) => void;
  onPackName: (v: string) => void;
  onPackSalePrice: (v: string) => void;
  unitPrice: number;
  existingVariants: Array<{ size: number; name: string; price: number }>;
  onAddVariant: (v: { size: number; name: string; price: number }) => void;
  onSubmit: () => void;
}> = ({ packSize, packName, packSalePrice, onPackSize, onPackName, onPackSalePrice, unitPrice, existingVariants, onAddVariant, onSubmit }) => {
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const [showAddMore, setShowAddMore] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => ref1.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    onPackName(`Pack de ${packSize}`);
  }, [packSize]);

  const suggestedPrice = unitPrice * (Number(packSize) || 1);

  // Listen for O/N on "add more" prompt
  useEffect(() => {
    if (!showAddMore) return;
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "o" || key === "y") {
        e.preventDefault();
        const variant = {
          size: Number(packSize) || 6,
          name: packName || `Pack de ${packSize}`,
          price: Number(packSalePrice) || suggestedPrice,
        };
        onAddVariant(variant);
        setShowAddMore(false);
        setTimeout(() => ref1.current?.focus(), 80);
      }
      if (key === "n" || key === "enter") {
        e.preventDefault();
        setShowAddMore(false);
        onSubmit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showAddMore, packSize, packName, packSalePrice, suggestedPrice, onAddVariant, onSubmit]);

  return (
    <div className="space-y-3 py-2">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Package className="w-5 h-5" /></div>
        <div>
          <h3 className="text-base font-bold text-foreground">Configuration du Pack</h3>
          <p className="text-xs text-muted-foreground">Entrée pour passer au champ suivant</p>
        </div>
      </div>

      {/* Existing variants chips */}
      {existingVariants.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {existingVariants.map((v, i) => (
            <span key={i} className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {v.name} — {v.price} DA
            </span>
          ))}
        </div>
      )}

      {showAddMore ? (
        <div className="flex flex-col items-center text-center py-4 space-y-4">
          <h3 className="text-sm font-bold text-foreground">Ajouter un autre pack ?</h3>
          <div className="flex gap-4">
            <button
              onClick={() => {
                const variant = {
                  size: Number(packSize) || 6,
                  name: packName || `Pack de ${packSize}`,
                  price: Number(packSalePrice) || suggestedPrice,
                };
                onAddVariant(variant);
                setShowAddMore(false);
                setTimeout(() => ref1.current?.focus(), 80);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-500/10 text-green-600 border border-green-500/20 hover:bg-green-500/20 transition-colors font-medium text-sm"
            >
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-green-500/20 rounded">O</kbd>
              Oui
            </button>
            <button
              onClick={onSubmit}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-muted text-muted-foreground border border-border hover:bg-muted/80 transition-colors font-medium text-sm"
            >
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-muted border border-border rounded">N</kbd>
              Terminer
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Nombre d'unités par pack</Label>
            <Input
              ref={ref1}
              type="number"
              value={packSize}
              onChange={e => onPackSize(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); ref2.current?.focus(); } }}
              className="mt-1 h-11 text-lg"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Nom du pack</Label>
            <Input
              ref={ref2}
              value={packName}
              onChange={e => onPackName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); ref3.current?.focus(); } }}
              className="mt-1 h-11"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Prix du pack (DA) — suggestion: {suggestedPrice}</Label>
            <Input
              ref={ref3}
              type="number"
              value={packSalePrice}
              onChange={e => onPackSalePrice(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setShowAddMore(true);
                }
              }}
              placeholder={String(suggestedPrice)}
              className="mt-1 h-11 text-lg font-bold text-primary"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// EXPIRATION SETUP STEP
const ExpirationSetupStep: React.FC<{
  expDate: string;
  expQty: string;
  onExpDate: (v: string) => void;
  onExpQty: (v: string) => void;
  onSubmit: () => void;
}> = ({ expDate, expQty, onExpDate, onExpQty, onSubmit }) => {
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => ref1.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500"><Calendar className="w-5 h-5" /></div>
        <div>
          <h3 className="text-base font-bold text-foreground">Date d'expiration</h3>
          <p className="text-xs text-muted-foreground">Entrée pour confirmer</p>
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground">Date d'expiration</Label>
          <Input
            ref={ref1}
            type="date"
            value={expDate}
            onChange={e => onExpDate(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); ref2.current?.focus(); } }}
            className="mt-1 h-11"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Quantité concernée</Label>
          <Input
            ref={ref2}
            type="number"
            value={expQty}
            onChange={e => onExpQty(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onSubmit(); } }}
            placeholder="Toute la quantité"
            className="mt-1 h-11"
          />
        </div>
      </div>
    </div>
  );
};

// WHOLESALE SETUP STEP
const WholesaleSetupStep: React.FC<{
  minQty: string;
  price: string;
  onMinQty: (v: string) => void;
  onPrice: (v: string) => void;
  unitPrice: number;
  onSubmit: () => void;
}> = ({ minQty, price, onMinQty, onPrice, unitPrice, onSubmit }) => {
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => ref1.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  const suggestedPrice = Math.round(unitPrice * 0.85);

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><DollarSign className="w-5 h-5" /></div>
        <div>
          <h3 className="text-base font-bold text-foreground">Prix de Gros</h3>
          <p className="text-xs text-muted-foreground">Entrée pour passer au champ suivant</p>
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground">Quantité minimum</Label>
          <Input
            ref={ref1}
            type="number"
            value={minQty}
            onChange={e => onMinQty(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); ref2.current?.focus(); } }}
            placeholder="10"
            className="mt-1 h-11 text-lg"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Prix de gros unitaire (DA) — suggestion: {suggestedPrice}</Label>
          <Input
            ref={ref2}
            type="number"
            value={price}
            onChange={e => onPrice(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onSubmit(); } }}
            placeholder={String(suggestedPrice)}
            className="mt-1 h-11 text-lg font-bold text-primary"
          />
        </div>
      </div>
    </div>
  );
};

// CONFIRM STEP
const ConfirmStep: React.FC<{
  formData: EditableProduct;
  saleMode: SaleMode;
  modeLabels: Record<SaleMode, string>;
  ModeIcon: Record<SaleMode, typeof Box>;
  packVariants: Array<{ size: number; name: string; price: number }>;
  onSave: () => void;
  onSaveAndNew: () => void;
}> = ({ formData, saleMode, modeLabels, ModeIcon, packVariants, onSave, onSaveAndNew }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !(e.target instanceof HTMLInputElement)) { e.preventDefault(); onSave(); }
      if (e.key.toLowerCase() === "a" && !(e.target instanceof HTMLInputElement)) { e.preventDefault(); onSaveAndNew(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSave, onSaveAndNew]);

  const Icon = ModeIcon[saleMode];
  const profit = formData.price - formData.cost;
  const allBarcodes = formData.barcodes.filter(b => b.trim());

  return (
    <div className="space-y-4">
      <div className="bg-muted/30 rounded-xl p-5 space-y-3 border border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary"><Icon className="w-5 h-5" /></div>
          <div>
            <h3 className="font-bold text-foreground text-base">{formData.name || "Sans nom"}</h3>
            <p className="text-xs text-muted-foreground">{formData.category} • {modeLabels[saleMode]} {formData.brand && `• ${formData.brand}`}</p>
          </div>
        </div>

        <div className="h-px bg-border" />

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase">Prix</span>
            <p className="font-bold text-primary">{formData.price} DA</p>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase">Coût</span>
            <p className="font-semibold text-foreground">{formData.cost} DA</p>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase">Stock</span>
            <p className="font-semibold text-foreground">{formData.stock} {formData.unit}</p>
          </div>
        </div>

        {(allBarcodes.length > 0 || formData.plu) && (
          <>
            <div className="h-px bg-border" />
            <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
              {allBarcodes.map((bc, i) => (
                <span key={i} className="font-mono">CB{allBarcodes.length > 1 ? `${i+1}` : ""}: {bc}</span>
              ))}
              {formData.plu && <span className="font-mono">PLU: {formData.plu}</span>}
            </div>
          </>
        )}

        {(packVariants.length > 0 || formData.wholesaleEnabled || formData.expirationDates.length > 0) && (
          <>
            <div className="h-px bg-border" />
            <div className="flex gap-2 flex-wrap">
              {packVariants.map((p, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-medium">
                  {p.name}: {p.price} DA
                </span>
              ))}
              {formData.wholesaleEnabled && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  Gros: {formData.wholesalePrice} DA (min {formData.wholesaleMinQty})
                </span>
              )}
              {formData.expirationDates.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium">
                  Exp: {formData.expirationDates[0]?.date}
                </span>
              )}
            </div>
          </>
        )}

        {profit !== 0 && (
          <>
            <div className="h-px bg-border" />
            <div className="text-center">
              <span className="text-[10px] text-muted-foreground uppercase">Marge</span>
              <p className={`font-bold text-sm ${profit >= 0 ? "text-green-600" : "text-destructive"}`}>
                {profit.toFixed(2)} DA ({formData.cost > 0 ? ((profit / formData.cost) * 100).toFixed(1) : "—"}%)
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onSave}
          className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold"
        >
          <Check className="w-4 h-4 mr-2" />
          Enregistrer
          <kbd className="ml-2 px-1.5 py-0.5 text-[9px] font-mono bg-primary-foreground/20 rounded">Entrée</kbd>
        </Button>
        <Button
          onClick={onSaveAndNew}
          variant="outline"
          className="flex-1 h-12 text-sm font-bold border-primary/30 text-primary hover:bg-primary/5"
        >
          <Plus className="w-4 h-4 mr-2" />
          + Nouveau
          <kbd className="ml-2 px-1.5 py-0.5 text-[9px] font-mono bg-muted border border-border rounded text-muted-foreground">A</kbd>
        </Button>
      </div>
    </div>
  );
};
