import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Scale, Layers, Box, ScanBarcode, ArrowRight,
  Check, Plus, Calendar, DollarSign, AlertTriangle,
  RotateCcw, Sparkles
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EditableProduct, emptyProduct } from "@/components/management/ProductFormDialog";

type SaleMode = "standard" | "weighed" | "advanced";

interface Step {
  id: string;
  title: string;
  subtitle: string;
}

const STEPS: Step[] = [
  { id: "type", title: "Type de Vente", subtitle: "Choisissez le mode de vente de ce produit" },
  { id: "identity", title: "Identité", subtitle: "Nom et identification du produit" },
  { id: "pricing", title: "Tarification", subtitle: "Prix d'achat et de vente" },
  { id: "options", title: "Options", subtitle: "Configurations supplémentaires" },
  { id: "confirm", title: "Confirmation", subtitle: "Vérifiez et enregistrez" },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0, scale: 0.95 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0, scale: 0.95 }),
};

interface ProductCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (p: EditableProduct) => void;
}

export const ProductCreationWizard: React.FC<ProductCreationWizardProps> = ({ isOpen, onClose, onSave }) => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saleMode, setSaleMode] = useState<SaleMode | null>(null);
  const [formData, setFormData] = useState<EditableProduct>({ ...emptyProduct, barcodes: [""] });

  // Option questions
  const [wantsPacks, setWantsPacks] = useState<boolean | null>(null);
  const [wantsExpiration, setWantsExpiration] = useState<boolean | null>(null);
  const [wantsWholesale, setWantsWholesale] = useState<boolean | null>(null);

  // Refs for auto-focus
  const nameRef = useRef<HTMLInputElement>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const pluRef = useRef<HTMLInputElement>(null);
  const costRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const stockRef = useRef<HTMLInputElement>(null);

  const update = (obj: Partial<EditableProduct>) => setFormData(prev => ({ ...prev, ...obj }));

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setDirection(1);
      setSaleMode(null);
      setFormData({ ...emptyProduct, barcodes: [""] });
      setWantsPacks(null);
      setWantsExpiration(null);
      setWantsWholesale(null);
    }
  }, [isOpen]);

  const goNext = useCallback(() => {
    setDirection(1);
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep(s => Math.max(s - 1, 0));
  }, []);

  // Auto-focus on step change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (step === 1) nameRef.current?.focus();
      if (step === 2) costRef.current?.focus();
      if (step === 3) stockRef.current?.focus();
    }, 350);
    return () => clearTimeout(timer);
  }, [step]);

  // Global keyboard handler
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (step > 0) { e.preventDefault(); goBack(); }
        else onClose();
        return;
      }

      // Step 0: type selection with 1/2/3
      if (step === 0) {
        if (e.key === "1") { setSaleMode("standard"); update({ scaleEnabled: false, plu: "", unit: "pcs" }); setTimeout(goNext, 200); }
        if (e.key === "2") { setSaleMode("weighed"); update({ scaleEnabled: true, unit: "kg" }); setTimeout(goNext, 200); }
        if (e.key === "3") { setSaleMode("advanced"); setTimeout(goNext, 200); }
      }

      // Step 3: Y/N for option questions
      if (step === 3) {
        const key = e.key.toLowerCase();
        if (key === "o" || key === "y") {
          e.preventDefault();
          if (wantsPacks === null) setWantsPacks(true);
          else if (wantsExpiration === null) setWantsExpiration(true);
          else if (saleMode === "advanced" && wantsWholesale === null) setWantsWholesale(true);
        }
        if (key === "n") {
          e.preventDefault();
          if (wantsPacks === null) setWantsPacks(false);
          else if (wantsExpiration === null) setWantsExpiration(false);
          else if (saleMode === "advanced" && wantsWholesale === null) setWantsWholesale(false);
        }
      }

      // Step 4: Enter to save, A for save+new
      if (step === 4) {
        if (e.key === "Enter" && !(e.target instanceof HTMLInputElement)) {
          e.preventDefault();
          handleSave();
        }
        if (e.key.toLowerCase() === "a" && !(e.target instanceof HTMLInputElement)) {
          e.preventDefault();
          handleSaveAndNew();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, step, goNext, goBack, onClose, saleMode, wantsPacks, wantsExpiration, wantsWholesale]);

  // Auto-advance from options step when all questions answered
  useEffect(() => {
    if (step !== 3) return;
    const allAnswered = wantsPacks !== null && wantsExpiration !== null && (saleMode !== "advanced" || wantsWholesale !== null);
    if (allAnswered) {
      const timer = setTimeout(goNext, 400);
      return () => clearTimeout(timer);
    }
  }, [step, wantsPacks, wantsExpiration, wantsWholesale, saleMode, goNext]);

  // Enter key advances fields within a step
  const handleFieldEnter = (e: React.KeyboardEvent, nextRef?: React.RefObject<HTMLInputElement>, advanceStep?: boolean) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextRef?.current) nextRef.current.focus();
      else if (advanceStep) goNext();
    }
  };

  const handleSave = () => {
    const final = { ...formData };
    if (wantsPacks && final.packVariants.length === 0) {
      final.packVariants = [{ size: 6, name: "Pack de 6", price: final.price * 6 }];
    }
    if (wantsWholesale) {
      final.wholesaleEnabled = true;
      if (!final.wholesalePrice) final.wholesalePrice = Math.round(final.price * 0.85);
      if (!final.wholesaleMinQty) final.wholesaleMinQty = 10;
    }
    onSave(final);
  };

  const handleSaveAndNew = () => {
    handleSave();
    // Reset for new product
    setTimeout(() => {
      setStep(0);
      setDirection(1);
      setSaleMode(null);
      setFormData({ ...emptyProduct, barcodes: [""] });
      setWantsPacks(null);
      setWantsExpiration(null);
      setWantsWholesale(null);
    }, 100);
  };

  // Profit calc
  const profitPerUnit = formData.price - formData.cost;
  const margin = formData.cost > 0 ? (profitPerUnit / formData.cost) * 100 : null;

  const modeLabels: Record<SaleMode, string> = { standard: "Standard", weighed: "Pesé (Balance)", advanced: "Avancé / Mixte" };
  const ModeIcon: Record<SaleMode, typeof Box> = { standard: Box, weighed: Scale, advanced: Layers };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden bg-background border-border shadow-2xl rounded-xl">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-primary rounded-r-full"
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Header */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <motion.h2
                key={STEPS[step].title}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-black ds-gradient-text"
              >
                {STEPS[step].title}
              </motion.h2>
              <motion.p
                key={STEPS[step].subtitle}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-muted-foreground mt-0.5"
              >
                {STEPS[step].subtitle}
              </motion.p>
            </div>
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === step ? "bg-primary scale-125" : i < step ? "bg-primary/40" : "bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-5 min-h-[320px] flex flex-col justify-center relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="w-full"
            >
              {/* Step 0: Type Selection */}
              {step === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {(["standard", "weighed", "advanced"] as SaleMode[]).map((mode, i) => {
                      const Icon = ModeIcon[mode];
                      const selected = saleMode === mode;
                      return (
                        <motion.button
                          key={mode}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            setSaleMode(mode);
                            if (mode === "weighed") update({ scaleEnabled: true, unit: "kg" });
                            else if (mode === "standard") update({ scaleEnabled: false, plu: "", unit: "pcs" });
                            setTimeout(goNext, 200);
                          }}
                          className={`relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                            selected
                              ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                              : "border-border hover:border-primary/30 bg-muted/20"
                          }`}
                        >
                          <div className={`p-3 rounded-xl ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className="text-sm font-bold">{modeLabels[mode]}</span>
                          <kbd className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-muted border border-border rounded text-muted-foreground">
                            {i + 1}
                          </kbd>
                        </motion.button>
                      );
                    })}
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    Appuyez <kbd className="px-1 py-0.5 bg-muted border border-border rounded text-[10px] font-mono font-bold">1</kbd>{" "}
                    <kbd className="px-1 py-0.5 bg-muted border border-border rounded text-[10px] font-mono font-bold">2</kbd>{" "}
                    <kbd className="px-1 py-0.5 bg-muted border border-border rounded text-[10px] font-mono font-bold">3</kbd> pour choisir
                  </p>
                </div>
              )}

              {/* Step 1: Identity */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <Label className="text-sm font-semibold">Nom du produit</Label>
                    <Input
                      ref={nameRef}
                      value={formData.name}
                      onChange={e => update({ name: e.target.value })}
                      onKeyDown={e => handleFieldEnter(e, saleMode === "weighed" ? pluRef : barcodeRef)}
                      placeholder="Ex: Fromage Rouge Cheddar"
                      className="mt-2 text-base font-medium h-12"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Catégorie</Label>
                      <Select value={formData.category} onValueChange={v => update({ category: v })}>
                        <SelectTrigger className="mt-1 h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Alimentation", "Boissons", "Frais", "Fruits", "Légumes", "Hygiène", "Entretien", "Autres"].map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Marque (optionnel)</Label>
                      <Input
                        value={formData.brand}
                        onChange={e => update({ brand: e.target.value })}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (saleMode === "weighed") pluRef.current?.focus();
                            else barcodeRef.current?.focus();
                          }
                        }}
                        className="mt-1 h-10 text-sm"
                        placeholder="Ex: Candia"
                      />
                    </div>
                  </div>

                  {(saleMode === "standard" || saleMode === "advanced") && (
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <ScanBarcode className="w-3.5 h-3.5" /> Code-barres
                      </Label>
                      <Input
                        ref={barcodeRef}
                        value={formData.barcodes[0] || ""}
                        onChange={e => {
                          const b = [...formData.barcodes];
                          b[0] = e.target.value;
                          update({ barcodes: b });
                        }}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (saleMode === "advanced") pluRef.current?.focus();
                            else goNext();
                          }
                        }}
                        className="mt-1 font-mono h-10"
                        placeholder="Scannez ou tapez le code-barres..."
                      />
                    </div>
                  )}

                  {(saleMode === "weighed" || saleMode === "advanced") && (
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5" /> Code PLU (Balance)
                      </Label>
                      <Input
                        ref={pluRef}
                        value={formData.plu}
                        onChange={e => update({ plu: e.target.value })}
                        onKeyDown={e => handleFieldEnter(e, undefined, true)}
                        className="mt-1 font-mono h-10"
                        placeholder="Ex: 0045"
                      />
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    <kbd className="px-1 py-0.5 bg-muted border border-border rounded text-[10px] font-mono font-bold">Enter</kbd> pour passer au champ suivant
                  </p>
                </div>
              )}

              {/* Step 2: Pricing */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-border bg-muted/20">
                      <Label className="text-xs text-muted-foreground">Prix d'Achat (Unitaire)</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          ref={costRef}
                          type="number"
                          value={formData.cost || ""}
                          onChange={e => update({ cost: +e.target.value })}
                          onKeyDown={e => handleFieldEnter(e, priceRef)}
                          className="h-12 text-lg font-medium"
                          placeholder="0"
                        />
                        <span className="text-sm text-muted-foreground font-semibold">DA</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                      <Label className="text-xs text-primary font-medium">
                        Prix de Vente TTC {saleMode === "weighed" && "(Par KG)"}
                      </Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          ref={priceRef}
                          type="number"
                          value={formData.price || ""}
                          onChange={e => update({ price: +e.target.value })}
                          onKeyDown={e => handleFieldEnter(e, stockRef)}
                          className="h-12 text-lg font-bold text-primary"
                          placeholder="0"
                        />
                        <span className="text-sm text-primary font-semibold">DA</span>
                      </div>
                    </div>
                  </div>

                  {formData.cost > 0 && formData.price > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="bg-muted/50 rounded-lg p-3 grid grid-cols-2 gap-3"
                    >
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase">Marge brute</span>
                        <p className={`font-bold text-sm ${profitPerUnit >= 0 ? "text-success" : "text-accent"}`}>
                          {profitPerUnit.toFixed(2)} DA
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase">Rentabilité</span>
                        <p className={`font-bold text-sm ${(margin ?? 0) >= 0 ? "text-success" : "text-accent"}`}>
                          {margin?.toFixed(1) ?? "—"}%
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Stock Initial</Label>
                      <Input
                        ref={stockRef}
                        type="number"
                        value={formData.stock || ""}
                        onChange={e => update({ stock: +e.target.value })}
                        onKeyDown={e => handleFieldEnter(e, undefined, true)}
                        className="mt-1 h-10"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Seuil d'Alerte
                      </Label>
                      <Input
                        type="number"
                        value={formData.minStock || ""}
                        onChange={e => update({ minStock: +e.target.value })}
                        onKeyDown={e => handleFieldEnter(e, undefined, true)}
                        className="mt-1 h-10 border-warning/30"
                        placeholder="10"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    <kbd className="px-1 py-0.5 bg-muted border border-border rounded text-[10px] font-mono font-bold">Enter</kbd> pour continuer
                  </p>
                </div>
              )}

              {/* Step 3: Options (Y/N questions) */}
              {step === 3 && (
                <div className="space-y-4">
                  <AnimatePresence mode="wait">
                    {wantsPacks === null && (
                      <OptionQuestion
                        key="packs"
                        icon={<Package className="w-5 h-5" />}
                        question="Ce produit est-il vendu en packs (fardeaux) ?"
                        hint="Ex: Pack de 6, carton de 12..."
                      />
                    )}
                    {wantsPacks !== null && wantsExpiration === null && (
                      <OptionQuestion
                        key="expiration"
                        icon={<Calendar className="w-5 h-5" />}
                        question="Suivre les dates d'expiration ?"
                        hint="Alertes automatiques à l'approche de la date limite"
                      />
                    )}
                    {wantsPacks !== null && wantsExpiration !== null && saleMode === "advanced" && wantsWholesale === null && (
                      <OptionQuestion
                        key="wholesale"
                        icon={<DollarSign className="w-5 h-5" />}
                        question="Activer le prix de gros ?"
                        hint="Prix spécial à partir d'une quantité minimum"
                      />
                    )}
                  </AnimatePresence>

                  {/* Answered summary */}
                  <div className="space-y-2 mt-4">
                    {wantsPacks !== null && (
                      <AnsweredBadge label="Packs / Fardeaux" value={wantsPacks} />
                    )}
                    {wantsExpiration !== null && (
                      <AnsweredBadge label="Dates d'expiration" value={wantsExpiration} />
                    )}
                    {wantsWholesale !== null && (
                      <AnsweredBadge label="Prix de gros" value={wantsWholesale} />
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="bg-muted/30 rounded-xl p-5 space-y-3 border border-border">
                    <div className="flex items-center gap-3">
                      {saleMode && (() => {
                        const Icon = ModeIcon[saleMode];
                        return <div className="p-2 bg-primary/10 rounded-lg text-primary"><Icon className="w-5 h-5" /></div>;
                      })()}
                      <div>
                        <h3 className="font-bold text-foreground text-base">{formData.name || "Sans nom"}</h3>
                        <p className="text-xs text-muted-foreground">{formData.category} • {saleMode && modeLabels[saleMode]}</p>
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

                    <div className="h-px bg-border" />
                    <div className="flex gap-2 flex-wrap">
                      {wantsPacks && <span className="text-[10px] px-2 py-0.5 rounded-full bg-info/10 text-info font-medium">Packs</span>}
                      {wantsExpiration && <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning font-medium">Expirations</span>}
                      {wantsWholesale && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Gros</span>}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleSave}
                      className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Enregistrer
                      <kbd className="ml-2 px-1.5 py-0.5 text-[9px] font-mono bg-primary-foreground/20 rounded">Enter</kbd>
                    </Button>
                    <Button
                      onClick={handleSaveAndNew}
                      variant="outline"
                      className="flex-1 h-12 text-sm font-bold border-primary/30 text-primary hover:bg-primary/5"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Enregistrer + Nouveau
                      <kbd className="ml-2 px-1.5 py-0.5 text-[9px] font-mono bg-muted border border-border rounded text-muted-foreground">A</kbd>
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        <div className="px-6 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-between">
          <button
            onClick={step > 0 ? goBack : onClose}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            {step > 0 ? (
              <>
                <RotateCcw className="w-3 h-3" />
                Retour
                <kbd className="ml-1 px-1 py-0.5 text-[9px] font-mono bg-muted border border-border rounded">Esc</kbd>
              </>
            ) : (
              "Annuler"
            )}
          </button>
          {step > 0 && step < STEPS.length - 1 && (
            <Button onClick={goNext} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Suivant <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Sub-components
const OptionQuestion: React.FC<{ icon: React.ReactNode; question: string; hint: string }> = ({ icon, question, hint }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.95 }}
    transition={{ type: "spring", stiffness: 400, damping: 25 }}
    className="flex flex-col items-center text-center py-6 space-y-4"
  >
    <div className="p-4 bg-primary/10 rounded-2xl text-primary">{icon}</div>
    <div>
      <h3 className="text-base font-bold text-foreground">{question}</h3>
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    </div>
    <div className="flex gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <kbd className="px-2 py-1 text-xs font-mono font-bold bg-success/10 text-success border border-success/20 rounded">O</kbd>
        <span>Oui</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <kbd className="px-2 py-1 text-xs font-mono font-bold bg-accent/10 text-accent border border-accent/20 rounded">N</kbd>
        <span>Non</span>
      </div>
    </div>
  </motion.div>
);

const AnsweredBadge: React.FC<{ label: string; value: boolean }> = ({ label, value }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
      value ? "bg-success/10 text-success border border-success/20" : "bg-muted text-muted-foreground border border-border"
    }`}
  >
    <span>{label}</span>
    <span>{value ? "✓ Oui" : "✗ Non"}</span>
  </motion.div>
);
