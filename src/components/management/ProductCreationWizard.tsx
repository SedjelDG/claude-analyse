import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Scale, Layers, Box, ScanBarcode, ArrowRight,
  Check, Plus, Calendar, DollarSign, AlertTriangle,
  RotateCcw, Sparkles, ShoppingCart, Weight, Hash
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EditableProduct, emptyProduct } from "@/components/management/ProductFormDialog";
import { Product } from "@/utils/mockProducts";

type SaleMode = "standard" | "weighed" | "mixte";

// All possible micro-step IDs
type StepId =
  | "type"
  | "name"
  | "category"
  | "brand"
  | "barcode"
  | "plu"
  | "purchase"       // intertwined packs bought / units-per-pack / pack price
  | "unitPrice"
  | "weightPrice"
  | "pricePerKg"
  | "costPerKg"
  | "margins"
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
      return ["name", "category", "brand", "barcode", "purchase", "unitPrice", "margins", "qPacks", "qExpiration", "qWholesale", "confirm"];
    case "weighed":
      return ["name", "category", "brand", "plu", "pricePerKg", "costPerKg", "margins", "qExpiration", "confirm"];
    case "mixte":
      return ["name", "category", "brand", "barcode", "plu", "purchase", "unitPrice", "weightPrice", "margins", "qPacks", "qExpiration", "qWholesale", "confirm"];
  }
}

// Insert a step after a given step
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
  const [stepIndex, setStepIndex] = useState(-1); // -1 = type selection
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [formData, setFormData] = useState<EditableProduct>({ ...emptyProduct, barcodes: [""] });

  // Purchase sub-fields
  const [packsBought, setPacksBought] = useState("");
  const [unitsPerPack, setUnitsPerPack] = useState("");
  const [packPrice, setPackPrice] = useState("");

  // Category selection index for arrow nav
  const [categoryIndex, setCategoryIndex] = useState(0);

  // Pack setup fields
  const [packSize, setPackSize] = useState("6");
  const [packName, setPackName] = useState("Pack de 6");
  const [packSalePrice, setPackSalePrice] = useState("");

  // Wholesale fields
  const [wholesaleMinQty, setWholesaleMinQty] = useState("10");
  const [wholesalePrice, setWholesalePrice] = useState("");

  // Expiration fields
  const [expDate, setExpDate] = useState("");
  const [expQty, setExpQty] = useState("");

  const update = (obj: Partial<EditableProduct>) => setFormData(prev => ({ ...prev, ...obj }));

  const currentStep = stepIndex >= 0 && stepIndex < stepFlow.length ? stepFlow[stepIndex] : "type";

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

  // Progress
  const totalSteps = stepFlow.length + 1; // +1 for type
  const progress = ((stepIndex + 2) / totalSteps) * 100;

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSaleMode(null);
      setStepFlow([]);
      setStepIndex(-1);
      setDirection("forward");
      setFormData({ ...emptyProduct, barcodes: [""] });
      setPacksBought("");
      setUnitsPerPack("");
      setPackPrice("");
      setCategoryIndex(0);
      setPackSize("6");
      setPackName("Pack de 6");
      setPackSalePrice("");
      setWholesaleMinQty("10");
      setWholesalePrice("");
      setExpDate("");
      setExpQty("");
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

  // Handle Y/N questions - dynamically insert sub-flows
  const answerQuestion = useCallback((questionStep: StepId, answer: boolean) => {
    if (answer) {
      const setupStep: StepId =
        questionStep === "qPacks" ? "packSetup" :
        questionStep === "qExpiration" ? "expirationSetup" :
        "wholesaleSetup";
      setStepFlow(prev => insertAfter(prev, questionStep, setupStep));
    }
    if (questionStep === "qPacks") {
      // no direct data change, handled in packSetup
    } else if (questionStep === "qWholesale") {
      update({ wholesaleEnabled: answer });
    }
    goForward();
  }, [goForward]);

  const handleSave = useCallback(() => {
    const final = { ...formData };
    onSave(final);
    onClose();
  }, [formData, onSave, onClose]);

  const handleSaveAndNew = useCallback(() => {
    const final = { ...formData };
    onSave(final);
    // Reset
    setSaleMode(null);
    setStepFlow([]);
    setStepIndex(-1);
    setDirection("forward");
    setFormData({ ...emptyProduct, barcodes: [""] });
    setPacksBought("");
    setUnitsPerPack("");
    setPackPrice("");
    setCategoryIndex(0);
    setPackSize("6");
    setPackName("Pack de 6");
    setPackSalePrice("");
    setWholesaleMinQty("10");
    setWholesalePrice("");
    setExpDate("");
    setExpQty("");
  }, [formData, onSave]);

  // Computed margins
  const profitPerUnit = formData.price - formData.cost;
  const margin = formData.cost > 0 ? (profitPerUnit / formData.cost) * 100 : null;

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
                />
              )}

              {currentStep === "brand" && (
                <SingleInputStep
                  icon={<Package className="w-5 h-5" />}
                  title="Marque"
                  subtitle="Optionnel — appuyez Entrée pour passer"
                  placeholder="Ex: Candia"
                  value={formData.brand}
                  onChange={v => update({ brand: v })}
                  onSubmit={goForward}
                  autoFocus
                  optional
                />
              )}

              {currentStep === "barcode" && (
                <SingleInputStep
                  icon={<ScanBarcode className="w-5 h-5" />}
                  title="Code-barres"
                  subtitle="Scannez ou tapez le code-barres"
                  placeholder="Scannez le code-barres..."
                  value={formData.barcodes[0] || ""}
                  onChange={v => { const b = [...formData.barcodes]; b[0] = v; update({ barcodes: b }); }}
                  onSubmit={goForward}
                  autoFocus
                  mono
                  optional
                />
              )}

              {currentStep === "plu" && (
                <SingleInputStep
                  icon={<Hash className="w-5 h-5" />}
                  title="Code PLU (Balance)"
                  subtitle={`Pré-généré automatiquement — Entrée pour accepter`}
                  placeholder="0001"
                  value={formData.plu}
                  onChange={v => update({ plu: v })}
                  onSubmit={goForward}
                  autoFocus
                  mono
                />
              )}

              {currentStep === "purchase" && (
                <PurchaseStep
                  packsBought={packsBought}
                  unitsPerPack={unitsPerPack}
                  packPrice={packPrice}
                  onPacksBought={setPacksBought}
                  onUnitsPerPack={setUnitsPerPack}
                  onPackPrice={setPackPrice}
                  onSubmit={(totalUnits, unitCost, totalStock) => {
                    update({ cost: unitCost, stock: totalStock, packSize: Number(unitsPerPack) || 1, packBuyingPrice: Number(packPrice) || 0 });
                    goForward();
                  }}
                />
              )}

              {currentStep === "unitPrice" && (
                <PriceInputStep
                  icon={<DollarSign className="w-5 h-5" />}
                  title="Prix de vente unitaire"
                  subtitle="Prix TTC à l'unité"
                  value={formData.price}
                  onChange={v => update({ price: v })}
                  onSubmit={goForward}
                  cost={formData.cost}
                />
              )}

              {currentStep === "weightPrice" && (
                <PriceInputStep
                  icon={<Weight className="w-5 h-5" />}
                  title="Prix de vente au KG"
                  subtitle="Prix au poids pour la balance"
                  value={formData.wholesalePrice}
                  onChange={v => update({ wholesalePrice: v })}
                  onSubmit={goForward}
                  cost={formData.cost}
                  label="DA/KG"
                />
              )}

              {currentStep === "pricePerKg" && (
                <PriceInputStep
                  icon={<DollarSign className="w-5 h-5" />}
                  title="Prix de vente / KG"
                  subtitle="Prix TTC au kilogramme"
                  value={formData.price}
                  onChange={v => update({ price: v })}
                  onSubmit={goForward}
                  cost={formData.cost}
                  label="DA/KG"
                />
              )}

              {currentStep === "costPerKg" && (
                <PriceInputStep
                  icon={<ShoppingCart className="w-5 h-5" />}
                  title="Coût d'achat / KG"
                  subtitle="Prix d'achat au kilogramme"
                  value={formData.cost}
                  onChange={v => update({ cost: v })}
                  onSubmit={goForward}
                  label="DA/KG"
                />
              )}

              {currentStep === "margins" && (
                <MarginsStep
                  cost={formData.cost}
                  price={formData.price}
                  onContinue={goForward}
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
                  onSubmit={() => {
                    const variants = [...formData.packVariants, {
                      size: Number(packSize) || 6,
                      name: packName || `Pack de ${packSize}`,
                      price: Number(packSalePrice) || formData.price * (Number(packSize) || 6),
                    }];
                    update({ packVariants: variants });
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

// SINGLE INPUT STEP (name, brand, barcode, plu)
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") return; // handled by parent
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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

// CATEGORY STEP with arrow key navigation
const CategoryStep: React.FC<{
  categories: string[];
  selectedIndex: number;
  onIndexChange: (i: number) => void;
  onSelect: (cat: string) => void;
  currentValue: string;
}> = ({ categories, selectedIndex, onIndexChange, onSelect, currentValue }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); onIndexChange((selectedIndex + 1) % categories.length); }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); onIndexChange((selectedIndex + categories.length - 1) % categories.length); }
      if (e.key === "Enter") { e.preventDefault(); onSelect(categories[selectedIndex]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedIndex, categories, onIndexChange, onSelect]);

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
            onClick={() => onSelect(cat)}
            className={`px-4 py-3 rounded-lg text-sm font-medium text-left transition-all ${
              i === selectedIndex
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted/50 text-foreground hover:bg-muted"
            }`}
          >
            {cat}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// PURCHASE STEP — intertwined packs/units/price
const PurchaseStep: React.FC<{
  packsBought: string;
  unitsPerPack: string;
  packPrice: string;
  onPacksBought: (v: string) => void;
  onUnitsPerPack: (v: string) => void;
  onPackPrice: (v: string) => void;
  onSubmit: (totalUnits: number, unitCost: number, totalStock: number) => void;
}> = ({ packsBought, unitsPerPack, packPrice, onPacksBought, onUnitsPerPack, onPackPrice, onSubmit }) => {
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => ref1.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  const packs = Number(packsBought) || 0;
  const units = Number(unitsPerPack) || 1;
  const price = Number(packPrice) || 0;
  const totalUnits = packs * units;
  const unitCost = totalUnits > 0 ? price / units : 0;

  const handleSubmit = () => {
    onSubmit(totalUnits, unitCost, totalUnits);
  };

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><ShoppingCart className="w-5 h-5" /></div>
        <div>
          <h3 className="text-base font-bold text-foreground">Achat & Stock</h3>
          <p className="text-xs text-muted-foreground">Entrée pour passer au champ suivant</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground">Nombre de colis achetés</Label>
          <Input
            ref={ref1}
            type="number"
            value={packsBought}
            onChange={e => onPacksBought(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); ref2.current?.focus(); } }}
            placeholder="Ex: 5"
            className="mt-1 h-12 text-lg"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Unités par colis</Label>
          <Input
            ref={ref2}
            type="number"
            value={unitsPerPack}
            onChange={e => onUnitsPerPack(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); ref3.current?.focus(); } }}
            placeholder="Ex: 12"
            className="mt-1 h-12 text-lg"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Prix du colis (DA)</Label>
          <Input
            ref={ref3}
            type="number"
            value={packPrice}
            onChange={e => onPackPrice(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(); } }}
            placeholder="Ex: 600"
            className="mt-1 h-12 text-lg"
          />
        </div>
      </div>

      {packs > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-muted/50 rounded-lg p-3 grid grid-cols-2 gap-3"
        >
          <div>
            <span className="text-[10px] text-muted-foreground uppercase">Total unités</span>
            <p className="font-bold text-sm text-foreground">{totalUnits}</p>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase">Coût unitaire</span>
            <p className="font-bold text-sm text-primary">{unitCost.toFixed(2)} DA</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// PRICE INPUT STEP
const PriceInputStep: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: number;
  onChange: (v: number) => void;
  onSubmit: () => void;
  cost?: number;
  label?: string;
}> = ({ icon, title, subtitle, value, onChange, onSubmit, cost, label = "DA" }) => {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  const profit = cost && value ? value - cost : null;
  const marginPct = cost && cost > 0 && value ? ((value - cost) / cost) * 100 : null;

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">{icon}</div>
        <div>
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Input
          ref={ref}
          type="number"
          value={value || ""}
          onChange={e => onChange(Number(e.target.value))}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onSubmit(); } }}
          placeholder="0"
          className="h-14 text-2xl font-bold text-primary"
        />
        <span className="text-sm text-muted-foreground font-semibold whitespace-nowrap">{label}</span>
      </div>
      {profit !== null && profit !== 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-4 text-xs"
        >
          <span className={profit >= 0 ? "text-success" : "text-destructive"}>
            Marge: {profit.toFixed(2)} {label} ({marginPct?.toFixed(1)}%)
          </span>
        </motion.div>
      )}
      <p className="text-center text-[10px] text-muted-foreground">
        <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono font-bold">Entrée</kbd> pour continuer
      </p>
    </div>
  );
};

// MARGINS DISPLAY STEP
const MarginsStep: React.FC<{
  cost: number;
  price: number;
  onContinue: () => void;
}> = ({ cost, price, onContinue }) => {
  const profit = price - cost;
  const margin = cost > 0 ? (profit / cost) * 100 : 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") { e.preventDefault(); onContinue(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onContinue]);

  return (
    <div className="space-y-5 py-4">
      <div className="text-center">
        <div className="inline-flex p-3 bg-primary/10 rounded-2xl text-primary mb-3">
          <DollarSign className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-foreground">Récapitulatif Tarification</h3>
      </div>
      <div className="bg-muted/30 rounded-xl p-5 space-y-3 border border-border">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase">Coût</span>
            <p className="font-bold text-lg text-foreground">{cost} DA</p>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase">Prix</span>
            <p className="font-bold text-lg text-primary">{price} DA</p>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase">Marge</span>
            <p className={`font-bold text-lg ${profit >= 0 ? "text-success" : "text-destructive"}`}>
              {profit} DA
            </p>
          </div>
        </div>
        <div className="h-px bg-border" />
        <div className="text-center">
          <span className="text-[10px] text-muted-foreground uppercase">Rentabilité</span>
          <p className={`font-black text-2xl ${margin >= 0 ? "text-success" : "text-destructive"}`}>
            {margin.toFixed(1)}%
          </p>
        </div>
      </div>
      <p className="text-center text-[10px] text-muted-foreground">
        <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono font-bold">Entrée</kbd> pour continuer
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
      if (key === "enter") { e.preventDefault(); onAnswer(false); } // Enter = skip (no)
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
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-colors font-medium text-sm"
        >
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-success/20 rounded">O</kbd>
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

// PACK SETUP STEP
const PackSetupStep: React.FC<{
  packSize: string;
  packName: string;
  packSalePrice: string;
  onPackSize: (v: string) => void;
  onPackName: (v: string) => void;
  onPackSalePrice: (v: string) => void;
  unitPrice: number;
  onSubmit: () => void;
}> = ({ packSize, packName, packSalePrice, onPackSize, onPackName, onPackSalePrice, unitPrice, onSubmit }) => {
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => ref1.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  // Auto-update name when size changes
  useEffect(() => {
    onPackName(`Pack de ${packSize}`);
  }, [packSize]);

  const suggestedPrice = unitPrice * (Number(packSize) || 1);

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Package className="w-5 h-5" /></div>
        <div>
          <h3 className="text-base font-bold text-foreground">Configuration du Pack</h3>
          <p className="text-xs text-muted-foreground">Entrée pour passer au champ suivant</p>
        </div>
      </div>
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
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onSubmit(); } }}
            placeholder={String(suggestedPrice)}
            className="mt-1 h-11 text-lg font-bold text-primary"
          />
        </div>
      </div>
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
        <div className="p-2.5 bg-warning/10 rounded-xl text-warning"><Calendar className="w-5 h-5" /></div>
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
  onSave: () => void;
  onSaveAndNew: () => void;
}> = ({ formData, saleMode, modeLabels, ModeIcon, onSave, onSaveAndNew }) => {
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

        {(formData.barcodes[0] || formData.plu) && (
          <>
            <div className="h-px bg-border" />
            <div className="flex gap-4 text-xs text-muted-foreground">
              {formData.barcodes[0] && <span className="font-mono">CB: {formData.barcodes[0]}</span>}
              {formData.plu && <span className="font-mono">PLU: {formData.plu}</span>}
            </div>
          </>
        )}

        {(formData.packVariants.length > 0 || formData.wholesaleEnabled || formData.expirationDates.length > 0) && (
          <>
            <div className="h-px bg-border" />
            <div className="flex gap-2 flex-wrap">
              {formData.packVariants.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-info/10 text-info font-medium">
                  {formData.packVariants.map(p => p.name).join(", ")}
                </span>
              )}
              {formData.wholesaleEnabled && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  Gros: {formData.wholesalePrice} DA (min {formData.wholesaleMinQty})
                </span>
              )}
              {formData.expirationDates.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning font-medium">
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
              <p className={`font-bold text-sm ${profit >= 0 ? "text-success" : "text-destructive"}`}>
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
