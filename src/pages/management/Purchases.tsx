import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus, Search, Save, X, Truck, Package as PackageIcon,
  ScanBarcode, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// ─── Types ───
interface Product {
  id: string;
  barcodes: string[];
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  unit: string;
  packSize: number;
  supplier: string;
}

interface Purchase {
  id: string;
  date: string;
  supplier: string;
  productName: string;
  quantity: number;
  unitCost: number;
  total: number;
  status: "pending" | "received" | "partial";
  buyingMode: "unit" | "box";
}

type BuyingMode = "unit" | "box";

interface PurchaseFormState {
  productId: string;
  productName: string;
  supplier: string;
  buyingMode: BuyingMode;
  // Unit mode
  quantity: number;
  unitCost: number;
  // Box mode
  numBoxes: number;
  unitsPerBox: number;
  boxPrice: number;
  extraUnits: number;
  // locked = opened from product row
  locked: boolean;
}

// ─── Mock data (shared with ProductManagement in real app) ───
const mockProducts: Product[] = [
  { id: "1", barcodes: ["6191234567890"], name: "Lait 1L", category: "Alimentation", price: 100, cost: 80, stock: 45, unit: "pcs", packSize: 12, supplier: "Fournisseur A" },
  { id: "2", barcodes: ["6191234567891"], name: "Pain", category: "Alimentation", price: 50, cost: 35, stock: 120, unit: "pcs", packSize: 1, supplier: "" },
  { id: "3", barcodes: ["6191234567892"], name: "Pommes", category: "Fruits", price: 250, cost: 180, stock: 30, unit: "kg", packSize: 1, supplier: "" },
  { id: "4", barcodes: ["6191234567893"], name: "Bananes", category: "Fruits", price: 350, cost: 280, stock: 15, unit: "kg", packSize: 1, supplier: "" },
  { id: "5", barcodes: ["6191234567894", "6191234567899"], name: "Eau 1.5L", category: "Boissons", price: 25, cost: 18, stock: 200, unit: "pcs", packSize: 6, supplier: "Fournisseur B" },
  { id: "6", barcodes: ["6191234567895"], name: "Sucre 1kg", category: "Alimentation", price: 100, cost: 85, stock: 3, unit: "pcs", packSize: 1, supplier: "" },
  { id: "7", barcodes: ["6191234567896"], name: "Fromage", category: "Alimentation", price: 800, cost: 600, stock: 8, unit: "kg", packSize: 1, supplier: "" },
  { id: "8", barcodes: ["6191234567897"], name: "Olives", category: "Alimentation", price: 500, cost: 350, stock: 12, unit: "kg", packSize: 1, supplier: "" },
];

const mockPurchases: Purchase[] = [
  { id: "P001", date: "2026-03-23", supplier: "Fournisseur A", productName: "Lait 1L", quantity: 100, unitCost: 80, total: 8000, status: "received", buyingMode: "unit" },
  { id: "P002", date: "2026-03-22", supplier: "Fournisseur B", productName: "Sucre 1kg", quantity: 50, unitCost: 85, total: 4250, status: "pending", buyingMode: "unit" },
  { id: "P003", date: "2026-03-21", supplier: "Fournisseur A", productName: "Eau 1.5L", quantity: 200, unitCost: 18, total: 3600, status: "received", buyingMode: "box" },
  { id: "P004", date: "2026-03-20", supplier: "Fournisseur C", productName: "Pommes", quantity: 30, unitCost: 180, total: 5400, status: "partial", buyingMode: "unit" },
];

const emptyForm: PurchaseFormState = {
  productId: "", productName: "", supplier: "", buyingMode: "unit",
  quantity: 0, unitCost: 0,
  numBoxes: 0, unitsPerBox: 0, boxPrice: 0, extraUnits: 0,
  locked: false,
};

const statusColor = (s: string) =>
  s === "received" ? "bg-success/10 text-success" : s === "pending" ? "bg-warning/10 text-warning" : "bg-info/10 text-info";

const Purchases = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [purchases, setPurchases] = useState(mockPurchases);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<PurchaseFormState>(emptyForm);
  const [tableSearch, setTableSearch] = useState("");

  // Product search state (for search mode)
  const [productQuery, setProductQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle URL param ?product=ID for locked mode
  useEffect(() => {
    const pid = searchParams.get("product");
    if (pid) {
      const p = mockProducts.find((x) => x.id === pid);
      if (p) {
        setForm({
          ...emptyForm,
          productId: p.id,
          productName: p.name,
          unitCost: p.cost,
          unitsPerBox: p.packSize > 1 ? p.packSize : 0,
          supplier: p.supplier,
          locked: true,
        });
        setShowDialog(true);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, setSearchParams]);

  // Close results dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const searchResults = useMemo(() => {
    if (!productQuery.trim()) return [];
    const q = productQuery.toLowerCase();
    return mockProducts
      .filter((p) => p.name.toLowerCase().includes(q) || p.barcodes.some((b) => b.includes(q)))
      .slice(0, 8);
  }, [productQuery]);

  const openNewPurchase = () => {
    setForm(emptyForm);
    setProductQuery("");
    setShowDialog(true);
  };

  const selectProduct = (p: Product) => {
    setForm((f) => ({
      ...f,
      productId: p.id,
      productName: p.name,
      unitCost: p.cost,
      unitsPerBox: p.packSize > 1 ? p.packSize : 0,
      supplier: p.supplier || f.supplier,
    }));
    setProductQuery("");
    setShowResults(false);
  };

  const clearProduct = () => {
    if (form.locked) return;
    setForm((f) => ({ ...f, productId: "", productName: "", unitCost: 0, unitsPerBox: 0 }));
  };

  // ─── Calculations ───
  const calcUnitCost = useMemo(() => {
    if (form.buyingMode === "box" && form.unitsPerBox > 0 && form.boxPrice > 0) {
      return form.boxPrice / form.unitsPerBox;
    }
    return form.unitCost;
  }, [form.buyingMode, form.boxPrice, form.unitsPerBox, form.unitCost]);

  const calcTotalUnits = useMemo(() => {
    if (form.buyingMode === "box") {
      return (form.numBoxes * form.unitsPerBox) + form.extraUnits;
    }
    return form.quantity;
  }, [form.buyingMode, form.numBoxes, form.unitsPerBox, form.extraUnits, form.quantity]);

  const calcMontant = useMemo(() => {
    if (form.buyingMode === "box") {
      const boxTotal = form.numBoxes * form.boxPrice;
      const extraTotal = form.extraUnits * calcUnitCost;
      return boxTotal + extraTotal;
    }
    return form.quantity * form.unitCost;
  }, [form, calcUnitCost]);

  const savePurchase = () => {
    const newPurchase: Purchase = {
      id: `P${String(purchases.length + 1).padStart(3, "0")}`,
      date: new Date().toISOString().split("T")[0],
      supplier: form.supplier,
      productName: form.productName,
      quantity: calcTotalUnits,
      unitCost: Math.round(calcUnitCost * 100) / 100,
      total: Math.round(calcMontant * 100) / 100,
      status: "pending",
      buyingMode: form.buyingMode,
    };
    setPurchases((prev) => [newPurchase, ...prev]);
    setShowDialog(false);
  };

  const filteredPurchases = purchases.filter((p) =>
    p.productName.toLowerCase().includes(tableSearch.toLowerCase()) ||
    p.supplier.toLowerCase().includes(tableSearch.toLowerCase()) ||
    p.id.toLowerCase().includes(tableSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Achats</h2>
          <p className="text-sm text-muted-foreground">Historique et enregistrement des achats fournisseurs</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par réf, produit ou fournisseur..."
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openNewPurchase} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" /> Nouvel achat
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="pos-stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total achats</p>
          <p className="text-2xl font-bold text-foreground">{purchases.length}</p>
        </div>
        <div className="pos-stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">En attente</p>
          <p className="text-2xl font-bold text-warning">{purchases.filter((p) => p.status === "pending").length}</p>
        </div>
        <div className="pos-stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Montant total</p>
          <p className="text-2xl font-bold text-foreground">
            {purchases.reduce((s, p) => s + p.total, 0).toLocaleString()} DA
          </p>
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pos-card overflow-hidden"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="pos-table-header">
              <th className="px-3 py-2.5 text-left text-xs font-semibold">Réf</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold">Date</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold">Fournisseur</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold">Produit</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold">Mode</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold">Qté</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold">Coût unit.</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold">Montant (DA)</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredPurchases.map((p) => (
              <tr key={p.id} className="hover:bg-muted/50">
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{p.id}</td>
                <td className="px-3 py-2 text-muted-foreground">{p.date}</td>
                <td className="px-3 py-2 text-foreground">{p.supplier}</td>
                <td className="px-3 py-2 font-medium text-foreground">{p.productName}</td>
                <td className="px-3 py-2">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    p.buyingMode === "box" ? "bg-info/10 text-info" : "bg-muted text-muted-foreground"
                  }`}>
                    {p.buyingMode === "box" ? "Carton" : "Unité"}
                  </span>
                </td>
                <td className="px-3 py-2 text-foreground">{p.quantity}</td>
                <td className="px-3 py-2 text-muted-foreground">{p.unitCost.toFixed(2)}</td>
                <td className="px-3 py-2 font-semibold text-foreground">{p.total.toLocaleString()}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(p.status)}`}>
                    {p.status === "received" ? "Reçu" : p.status === "pending" ? "En attente" : "Partiel"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
          {filteredPurchases.length} achat(s)
        </div>
      </motion.div>

      {/* ═══ Purchase Dialog ═══ */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              {form.locked ? `Achat — ${form.productName}` : "Nouvel achat"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Product selection */}
            {!form.locked ? (
              <div ref={searchRef} className="relative">
                <Label className="text-xs font-medium">Produit</Label>
                {form.productId ? (
                  <div className="mt-1 flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-md">
                    <PackageIcon className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-medium text-foreground flex-1">{form.productName}</span>
                    <button onClick={clearProduct} className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative mt-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher par nom ou code-barres..."
                        value={productQuery}
                        onChange={(e) => { setProductQuery(e.target.value); setShowResults(true); }}
                        onFocus={() => productQuery && setShowResults(true)}
                        className="pl-8 text-sm"
                        autoFocus
                      />
                    </div>
                    {showResults && searchResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {searchResults.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => selectProduct(p)}
                            className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm"
                          >
                            <PackageIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="font-medium text-foreground flex-1">{p.name}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{p.barcodes[0]}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {showResults && productQuery && searchResults.length === 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-popover border border-border rounded-md shadow-lg p-3 text-sm text-muted-foreground text-center">
                        Aucun produit trouvé
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2.5 bg-primary/5 border border-primary/20 rounded-md">
                <PackageIcon className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-semibold text-foreground">{form.productName}</span>
              </div>
            )}

            {/* Supplier */}
            <div>
              <Label className="text-xs font-medium">Fournisseur</Label>
              <Input
                value={form.supplier}
                onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
                placeholder="Nom du fournisseur"
                className="mt-1"
              />
            </div>

            {/* Buying mode toggle */}
            <div>
              <Label className="text-xs font-medium mb-2 block">Mode d'achat</Label>
              <div className="flex gap-1 bg-muted p-1 rounded-lg">
                <button
                  onClick={() => setForm((f) => ({ ...f, buyingMode: "unit" }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    form.buyingMode === "unit"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Unité
                </button>
                <button
                  onClick={() => setForm((f) => ({ ...f, buyingMode: "box" }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    form.buyingMode === "box"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Carton / Pack
                </button>
              </div>
            </div>

            {/* Unit mode fields */}
            {form.buyingMode === "unit" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Quantité</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.quantity || ""}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: +e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Coût unitaire (DA)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.unitCost || ""}
                    onChange={(e) => setForm((f) => ({ ...f, unitCost: +e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Box mode fields */}
            {form.buyingMode === "box" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium">Nombre de cartons</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.numBoxes || ""}
                      onChange={(e) => setForm((f) => ({ ...f, numBoxes: +e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Unités par carton</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.unitsPerBox || ""}
                      onChange={(e) => setForm((f) => ({ ...f, unitsPerBox: +e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium">Prix du carton (DA)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.boxPrice || ""}
                    onChange={(e) => setForm((f) => ({ ...f, boxPrice: +e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Unités supplémentaires (hors cartons)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.extraUnits || ""}
                    onChange={(e) => setForm((f) => ({ ...f, extraUnits: +e.target.value }))}
                    className="mt-1"
                    placeholder="0"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Ex: 3 unités en plus des cartons
                  </p>
                </div>

                {/* Calculated fields */}
                {form.unitsPerBox > 0 && form.boxPrice > 0 && (
                  <div className="bg-muted/50 rounded-md p-3 space-y-1.5 border border-border">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Coût unitaire calculé</span>
                      <span className="font-semibold text-foreground">{calcUnitCost.toFixed(2)} DA</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Total unités</span>
                      <span className="font-semibold text-foreground">
                        {form.numBoxes * form.unitsPerBox}
                        {form.extraUnits > 0 && ` + ${form.extraUnits}`}
                        {" = "}{calcTotalUnits}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Montant summary — always visible */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Montant</span>
                <span className="text-lg font-bold text-foreground">
                  {calcMontant > 0 ? `${calcMontant.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA` : "—"}
                </span>
              </div>
              {form.buyingMode === "unit" && form.quantity > 0 && form.unitCost > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {form.quantity} × {form.unitCost.toFixed(2)} DA
                </p>
              )}
              {form.buyingMode === "box" && calcMontant > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {form.numBoxes} carton(s) × {form.boxPrice.toFixed(2)} DA
                  {form.extraUnits > 0 && ` + ${form.extraUnits} unité(s) × ${calcUnitCost.toFixed(2)} DA`}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Annuler</Button>
            <Button
              onClick={savePurchase}
              disabled={!form.productId || calcMontant <= 0}
              className="bg-primary text-primary-foreground"
            >
              <Save className="h-4 w-4 mr-1" /> Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Purchases;
