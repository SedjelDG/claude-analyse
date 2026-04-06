import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Scale, Layers, X, Save, ScanBarcode, Tag, AlertTriangle, Box, Keyboard, Plus, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Product } from "@/utils/mockProducts";

type SaleMode = "standard" | "weighed" | "advanced";

export type EditableProduct = Omit<Product, "id"> & { id?: string };

export const emptyProduct: EditableProduct = {
  barcodes: [""], name: "", category: "Alimentation", brand: "", price: 0, cost: 0,
  stock: 0, minStock: 0, unit: "pcs", plu: "", scaleEnabled: false,
  packSize: 1, packBuyingPrice: 0, wholesaleEnabled: false,
  wholesalePrice: 0, wholesaleMinQty: 0, expirationDates: [],
  vatRate: 0, packVariants: [], supplier: "", image: "",
  shortLabel: "", buttonColor: "", allowPriceOverride: false, isActive: true,
  tareWeight: 0, labelFormat: "standard",
};

interface ProductFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: EditableProduct;
  onSave: (p: EditableProduct) => void;
}

const KBD = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-semibold bg-muted border border-border rounded text-muted-foreground">{children}</kbd>
);

const SectionDivider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px bg-border" />
    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
    <div className="flex-1 h-px bg-border" />
  </div>
);

export const ProductFormDialog: React.FC<ProductFormDialogProps> = ({ isOpen, onClose, product, onSave }) => {
  const [formData, setFormData] = useState<EditableProduct>(product);
  
  // Auto-detect mode based on incoming product data
  const [saleMode, setSaleMode] = useState<SaleMode>("standard");
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    if (isOpen) {
      setFormData(product);
      if (product.packVariants?.length > 0 || product.wholesaleEnabled || product.barcodes.length > 1) {
        setSaleMode("advanced");
      } else if (product.scaleEnabled || product.plu) {
        setSaleMode("weighed");
      } else {
        setSaleMode("standard");
      }
      setActiveTab("general");
    }
  }, [isOpen, product]);

  const update = (obj: Partial<EditableProduct>) => setFormData((prev) => ({ ...prev, ...obj }));

  // Profit calculations
  const effectiveCost = useMemo(() => {
    if (formData.packSize > 1 && formData.packBuyingPrice > 0) return formData.packBuyingPrice / formData.packSize;
    return formData.cost || 0;
  }, [formData.packSize, formData.packBuyingPrice, formData.cost]);

  const priceHT = formData.price / (1 + formData.vatRate / 100);
  const vatAmount = formData.price - priceHT;
  const profitPerUnit = formData.price - vatAmount - effectiveCost;
  const margin = effectiveCost > 0 ? (profitPerUnit / effectiveCost) * 100 : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden bg-background border-border shadow-2xl rounded-xl">
        <DialogHeader className="bg-white p-5 border-b border-border shrink-0">
          <DialogTitle className="ds-gradient-text font-black text-xl flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Package className="w-5 h-5" />
            </div>
            {formData.id ? "Modifier le produit" : "Ajouter un produit"}
          </DialogTitle>
        </DialogHeader>

        {/* Mode Selector */}
        <div className="px-5 pt-5 pb-3">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 block">Type de Vente</Label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => {
                setSaleMode("standard");
                update({ scaleEnabled: false, plu: "" });
              }}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                saleMode === "standard" ? "ds-gradient-border bg-primary/[0.03] text-primary shadow-sm" : "border-border text-muted-foreground hover:border-primary/20"
              }`}
            >
              <Box className="w-5 h-5" />
              <span className="text-xs font-medium">Standard</span>
            </button>
            <button
              onClick={() => {
                setSaleMode("weighed");
                update({ scaleEnabled: true, unit: "kg" });
              }}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                saleMode === "weighed" ? "ds-gradient-border bg-primary/[0.03] text-primary shadow-sm" : "border-border text-muted-foreground hover:border-primary/20"
              }`}
            >
              <Scale className="w-5 h-5" />
              <span className="text-xs font-medium">Pesé (Balance)</span>
            </button>
            <button
              onClick={() => setSaleMode("advanced")}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                saleMode === "advanced" ? "ds-gradient-border bg-primary/[0.03] text-primary shadow-sm" : "border-border text-muted-foreground hover:border-primary/20"
              }`}
            >
              <Layers className="w-5 h-5" />
              <span className="text-xs font-medium">Avancé / Mixte</span>
            </button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-5 shrink-0 border-b border-border/50">
            <TabsList className="w-full bg-muted/50 p-1 mb-2">
              <TabsTrigger value="general" className="flex-1 text-xs">Général</TabsTrigger>
              <TabsTrigger value="pricing" className="flex-1 text-xs">Prix</TabsTrigger>
              <TabsTrigger value="inventory" className="flex-1 text-xs">Stock</TabsTrigger>
              {saleMode === "advanced" && <TabsTrigger value="variants" className="flex-1 text-xs">Variantes</TabsTrigger>}
              <TabsTrigger value="options" className="flex-1 text-xs">Options</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 h-[400px] px-5">
            <TabsContent value="general" className="mt-4 mb-6 space-y-5 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
              <div className="space-y-4">
                <div>
                  <Label>Nom du produit</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => update({ name: e.target.value })} 
                    placeholder="Ex: Fromage Rouge Cheddar" 
                    className="text-base font-medium h-10 mt-1" 
                    autoFocus 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Catégorie</Label>
                    <Select value={formData.category} onValueChange={(v) => update({ category: v })}>
                      <SelectTrigger className="mt-1 text-xs h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alimentation">Alimentation</SelectItem>
                        <SelectItem value="Boissons">Boissons</SelectItem>
                        <SelectItem value="Frais">Frais</SelectItem>
                        <SelectItem value="Entretien">Entretien</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Marque (Optionnel)</Label>
                    <Input value={formData.brand} onChange={(e) => update({ brand: e.target.value })} className="mt-1 text-xs h-9" />
                  </div>
                </div>

                <SectionDivider label="Identification Principale" />
                <div className="grid grid-cols-2 gap-4">
                  {(saleMode === "standard" || saleMode === "advanced") && (
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1"><ScanBarcode className="w-3 h-3"/> Code-barres</Label>
                      <Input 
                        value={formData.barcodes[0] || ""} 
                        onChange={(e) => {
                          const b = [...formData.barcodes];
                          b[0] = e.target.value;
                          update({ barcodes: b });
                        }} 
                        className="mt-1 font-mono text-xs h-9" 
                        placeholder="Scan..." 
                      />
                    </div>
                  )}
                  {(saleMode === "weighed" || saleMode === "advanced") && (
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1"><Scale className="w-3 h-3"/> Code PLU (Balance)</Label>
                      <Input 
                        value={formData.plu} 
                        onChange={(e) => update({ plu: e.target.value })} 
                        className="mt-1 font-mono text-xs h-9" 
                        placeholder="Ex: 0045" 
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="mt-4 mb-6 space-y-5 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
               <div>
                 <SectionDivider label="Achat & Vente" />
                 <div className="grid grid-cols-2 gap-4">
                   <div className="relative p-4 rounded-xl border border-border bg-muted/20">
                     <Label className="text-xs text-muted-foreground">Prix d'Achat (Unitaire)</Label>
                     <div className="flex items-center gap-2 mt-2">
                       <Input type="number" value={formData.cost || ""} onChange={(e) => update({ cost: +e.target.value })} className="h-10 text-base font-medium" />
                       <span className="text-xs text-muted-foreground font-semibold">DA</span>
                     </div>
                   </div>
                   <div className="relative p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                     <Label className="text-xs text-primary font-medium">Prix de Vente TTC {saleMode === "weighed" && "(Par KG)"}</Label>
                     <div className="flex items-center gap-2 mt-2">
                       <Input type="number" value={formData.price || ""} onChange={(e) => update({ price: +e.target.value })} className="h-10 text-lg font-bold text-primary" />
                       <span className="text-xs text-primary font-semibold">DA</span>
                     </div>
                   </div>
                 </div>
               </div>

               {effectiveCost > 0 && formData.price > 0 && (
                 <div className="bg-muted/50 rounded-lg p-3 grid grid-cols-3 gap-2">
                   <div>
                     <span className="text-[10px] text-muted-foreground uppercase">Marge brute</span>
                     <p className={`font-semibold text-sm ${profitPerUnit >= 0 ? "text-success" : "text-accent"}`}>{profitPerUnit.toFixed(2)} DA</p>
                   </div>
                   <div>
                     <span className="text-[10px] text-muted-foreground uppercase">Rentabilité</span>
                     <p className={`font-semibold text-sm ${(margin ?? 0) >= 0 ? "text-success" : "text-accent"}`}>{margin?.toFixed(1) ?? "—"}%</p>
                   </div>
                   <div>
                     <span className="text-[10px] text-muted-foreground uppercase">TVA ({formData.vatRate}%)</span>
                     <p className="font-semibold text-sm text-foreground">{vatAmount.toFixed(2)} DA</p>
                   </div>
                 </div>
               )}
            </TabsContent>

            <TabsContent value="inventory" className="mt-4 mb-6 space-y-5 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
               <SectionDivider label="Niveaux de stock ({formData.unit})" />
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Label className="text-xs">Stock Actuel</Label>
                   <Input type="number" value={formData.stock || ""} onChange={(e) => update({ stock: +e.target.value })} className="mt-1 h-9" />
                 </div>
                 <div>
                   <Label className="text-xs text-warning flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Seuil d'Alerte</Label>
                   <Input type="number" value={formData.minStock || ""} onChange={(e) => update({ minStock: +e.target.value })} className="mt-1 h-9 border-warning/30 focus-visible:ring-warning" />
                 </div>
               </div>

               {saleMode === "advanced" && (
                 <>
                   <SectionDivider label="Fournisseur & Arrivages" />
                   <div>
                     <Label className="text-xs">Fournisseur</Label>
                     <Input value={formData.supplier || ""} onChange={(e) => update({ supplier: e.target.value })} className="mt-1 h-9 text-xs" />
                   </div>
                 </>
               )}
            </TabsContent>

            {saleMode === "advanced" && (
              <TabsContent value="variants" className="mt-4 mb-6 space-y-5 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                <div className="bg-info/10 text-info text-xs p-3 rounded-lg flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>Séparez un produit en mode Mixte. Vendez-le à l'unité (scan complet), au KG (Balance PLU), ou configurez des prix de gros et des packs (fardeaux).</p>
                </div>
                
                <SectionDivider label="Prix de Gros (Wholesale)" />
                <div className="grid grid-cols-2 gap-4 items-end">
                   <div>
                     <Label className="text-xs">Prix de Gros (DA)</Label>
                     <Input type="number" value={formData.wholesalePrice || ""} onChange={(e) => update({ wholesalePrice: +e.target.value, wholesaleEnabled: true })} className="mt-1 h-9 text-xs" placeholder="Ex: 90" />
                   </div>
                   <div>
                     <Label className="text-xs">Déclencheur (Qté Minimum)</Label>
                     <Input type="number" value={formData.wholesaleMinQty || ""} onChange={(e) => update({ wholesaleMinQty: +e.target.value })} className="mt-1 h-9 text-xs" placeholder="Ex: 10" />
                   </div>
                </div>

                <SectionDivider label="Vente par Pack (Packs Fardeau)" />
                <div className="space-y-3 border border-border rounded-lg p-3 bg-muted/20">
                  {formData.packVariants?.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input type="number" value={v.size || ""} onChange={(e) => {
                        const pv = [...formData.packVariants]; pv[i].size = +e.target.value; update({ packVariants: pv });
                      }} placeholder="Qté (ex: 6)" className="text-xs w-20" />
                      <Input value={v.name} onChange={(e) => {
                        const pv = [...formData.packVariants]; pv[i].name = e.target.value; update({ packVariants: pv });
                      }} placeholder="Nom du pack" className="text-xs flex-1" />
                      <Input type="number" value={v.price || ""} onChange={(e) => {
                        const pv = [...formData.packVariants]; pv[i].price = +e.target.value; update({ packVariants: pv });
                      }} placeholder="Prix TTC" className="text-xs w-24" />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => update({ packVariants: [...(formData.packVariants || []), { size: 6, name: "Nouveau Pack", price: formData.price * 6 }] })} className="text-xs w-full border-dashed">
                    <Plus className="w-3 h-3 mr-1" /> Ajouter une configuration pack
                  </Button>
                </div>
              </TabsContent>
            )}

            <TabsContent value="options" className="mt-4 mb-6 space-y-5 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
              <SectionDivider label="Visibilité Caisse" />
              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary"><Keyboard className="w-4 h-4" /></div>
                  <div>
                    <Label className="text-sm font-medium">Bouton de Raccourci</Label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Épingler ce produit sur la page principale de la caisse.</p>
                  </div>
                </div>
                <Switch checked={formData.isActive} onCheckedChange={(c) => update({ isActive: c })} />
              </div>
            </TabsContent>
          </ScrollArea>

          <DialogFooter className="p-4 border-t border-border/50 shrink-0 bg-muted/20 sm:justify-between">
            <Button variant="ghost" onClick={onClose} className="text-muted-foreground">Annuler</Button>
            <Button onClick={() => onSave(formData)} className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
