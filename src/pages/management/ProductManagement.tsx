import { useState, useMemo, useEffect } from "react";
import { FixedSizeList as List } from "react-window";
import { generateMockProducts, Product, ExpirationEntry } from "@/utils/mockProducts";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Truck, BarChart3, Plus, Search, Edit2, Trash2,
  ChevronDown, ChevronUp, Save, X, Scale, Tag, AlertTriangle,
  ScanBarcode, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type Tab = "products" | "stock" | "purchases";

// Imported from mockProducts.ts

interface Purchase {
  id: string;
  date: string;
  supplier: string;
  productName: string;
  quantity: number;
  unitCost: number;
  total: number;
  status: "pending" | "received" | "partial";
}

const mockPurchases: Purchase[] = [
  { id: "P001", date: "2026-03-23", supplier: "Fournisseur A", productName: "Lait 1L", quantity: 100, unitCost: 80, total: 8000, status: "received" },
  { id: "P002", date: "2026-03-22", supplier: "Fournisseur B", productName: "Sucre 1kg", quantity: 50, unitCost: 85, total: 4250, status: "pending" },
  { id: "P003", date: "2026-03-21", supplier: "Fournisseur A", productName: "Eau 1.5L", quantity: 200, unitCost: 18, total: 3600, status: "received" },
  { id: "P004", date: "2026-03-20", supplier: "Fournisseur C", productName: "Pommes", quantity: 30, unitCost: 180, total: 5400, status: "partial" },
];

interface StockMovement {
  id: string;
  date: string;
  product: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  reason: string;
}

const mockMovements: StockMovement[] = [
  { id: "M1", date: "2026-03-23", product: "Lait 1L", type: "in", quantity: 100, reason: "Achat P001" },
  { id: "M2", date: "2026-03-23", product: "Lait 1L", type: "out", quantity: 55, reason: "Ventes" },
  { id: "M3", date: "2026-03-22", product: "Sucre 1kg", type: "adjustment", quantity: -2, reason: "Périmé" },
  { id: "M4", date: "2026-03-22", product: "Pommes", type: "in", quantity: 20, reason: "Achat P004 (partiel)" },
  { id: "M5", date: "2026-03-21", product: "Eau 1.5L", type: "in", quantity: 200, reason: "Achat P003" },
];

const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: "products", label: "Produits", icon: Package },
  { id: "stock", label: "Stock", icon: BarChart3 },
  { id: "purchases", label: "Achats", icon: Truck },
];

type EditableProduct = Omit<Product, "id"> & { id?: string };

const emptyProduct: EditableProduct = {
  barcodes: [""], name: "", category: "Alimentation", price: 0, cost: 0,
  stock: 0, minStock: 0, unit: "pcs", plu: "", scaleEnabled: false,
  packSize: 1, packBuyingPrice: 0, wholesaleEnabled: false,
  wholesalePrice: 0, wholesaleMinQty: 0, expirationDates: [],
};

const daysUntil = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const hasExpirationWarning = (p: Product) =>
  p.expirationDates.some((e) => daysUntil(e.date) <= 30 && daysUntil(e.date) >= 0);

const ProductManagement = () => {
  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>(mockPurchases);
  useEffect(() => {
    setProducts(generateMockProducts(20000));
  }, []);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EditableProduct>(emptyProduct);
  const [purchaseForm, setPurchaseForm] = useState({ productId: "", supplier: "", quantity: 0, unitCost: 0 });
  const [sortField, setSortField] = useState<keyof Product>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [newBarcode, setNewBarcode] = useState("");

  const filteredProducts = products
    .filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcodes.some((b) => b.includes(search)) ||
      p.plu.includes(search)
    )
    .sort((a, b) => {
      const av = a[sortField], bv = b[sortField];
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      if (typeof av === "number") return sortDir === "asc" ? av - (bv as number) : (bv as number) - av;
      return 0;
    });

  const handleSort = (field: keyof Product) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: keyof Product }) =>
    sortField === field ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null;

  const openNewProduct = () => { setEditingProduct({ ...emptyProduct, barcodes: [""] }); setShowProductDialog(true); };
  const openEditProduct = (p: Product) => { setEditingProduct({ ...p }); setShowProductDialog(true); };

  const unitCostFromPack = useMemo(() => {
    if (editingProduct.packSize > 1 && editingProduct.packBuyingPrice > 0) {
      return (editingProduct.packBuyingPrice / editingProduct.packSize).toFixed(2);
    }
    return null;
  }, [editingProduct.packSize, editingProduct.packBuyingPrice]);

  const margin = useMemo(() => {
    const cost = unitCostFromPack ? parseFloat(unitCostFromPack) : editingProduct.cost;
    if (cost > 0 && editingProduct.price > 0) {
      return (((editingProduct.price - cost) / cost) * 100).toFixed(1);
    }
    return null;
  }, [editingProduct.price, editingProduct.cost, unitCostFromPack]);

  const saveProduct = () => {
    const finalProduct = { ...editingProduct };
    if (unitCostFromPack) {
      finalProduct.cost = parseFloat(unitCostFromPack);
    }
    finalProduct.barcodes = finalProduct.barcodes.filter((b) => b.trim() !== "");
    if (finalProduct.id) {
      setProducts((prev) => prev.map((p) => (p.id === finalProduct.id ? { ...finalProduct, id: p.id } as Product : p)));
    } else {
      setProducts((prev) => [...prev, { ...finalProduct, id: Date.now().toString() } as Product]);
    }
    setShowProductDialog(false);
  };

  const deleteProduct = (id: string) => setProducts((prev) => prev.filter((p) => p.id !== id));

  const openNewPurchase = (productId?: string) => {
    const p = products.find((x) => x.id === productId);
    setPurchaseForm({ productId: productId || "", supplier: "", quantity: 0, unitCost: p?.cost || 0 });
    setShowPurchaseDialog(true);
  };

  const savePurchase = () => {
    if (!purchaseForm.productId || purchaseForm.quantity <= 0) return;
    const targetProduct = products.find((p) => p.id === purchaseForm.productId);
    if (!targetProduct) return;
    
    const newPurchase: Purchase = {
      id: `P${String(purchases.length + 1).padStart(3, "0")}`,
      date: new Date().toISOString().split("T")[0],
      supplier: purchaseForm.supplier || "Inconnu",
      productName: targetProduct.name,
      quantity: purchaseForm.quantity,
      unitCost: purchaseForm.unitCost,
      total: purchaseForm.quantity * purchaseForm.unitCost,
      status: "received"
    };
    setPurchases((prev) => [newPurchase, ...prev]);

    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === purchaseForm.productId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { 
          ...updated[idx], 
          stock: updated[idx].stock + purchaseForm.quantity,
          cost: purchaseForm.unitCost > 0 ? purchaseForm.unitCost : updated[idx].cost
        };
        return updated;
      }
      return prev;
    });

    setPurchaseForm({ productId: "", supplier: "", quantity: 0, unitCost: 0 });
    setShowPurchaseDialog(false);
  };

  const addBarcode = () => {
    if (newBarcode.trim()) {
      setEditingProduct((p) => ({ ...p, barcodes: [...p.barcodes, newBarcode.trim()] }));
      setNewBarcode("");
    }
  };

  const removeBarcode = (index: number) => {
    setEditingProduct((p) => ({ ...p, barcodes: p.barcodes.filter((_, i) => i !== index) }));
  };

  const addExpiration = () => {
    setEditingProduct((p) => ({ ...p, expirationDates: [...p.expirationDates, { date: "", quantity: 0 }] }));
  };

  const updateExpiration = (index: number, field: keyof ExpirationEntry, value: string | number) => {
    setEditingProduct((p) => ({
      ...p,
      expirationDates: p.expirationDates.map((e, i) => (i === index ? { ...e, [field]: value } : e)),
    }));
  };

  const removeExpiration = (index: number) => {
    setEditingProduct((p) => ({ ...p, expirationDates: p.expirationDates.filter((_, i) => i !== index) }));
  };

  const statusColor = (s: string) =>
    s === "received" ? "bg-success/10 text-success" : s === "pending" ? "bg-warning/10 text-warning" : "bg-info/10 text-info";

  const movementColor = (t: string) =>
    t === "in" ? "text-success" : t === "out" ? "text-accent" : "text-info";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion des produits</h2>
          <p className="text-sm text-muted-foreground">Produits, stock et achats en un seul endroit</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === t.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, code-barres ou PLU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {activeTab === "products" && (
          <Button onClick={openNewProduct} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-1" /> Nouveau produit
          </Button>
        )}
        {activeTab === "purchases" && (
          <div className="flex gap-2">
            <Button onClick={() => openNewPurchase()} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-1" /> Nouvel achat
            </Button>
            <Button onClick={() => { openNewProduct(); }} variant="outline" className="border-primary text-primary">
              <Plus className="h-4 w-4 mr-1" /> Produit + Achat
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Products tab */}
          {activeTab === "products" && (
            <div className="pos-card overflow-hidden">
              <div className="overflow-x-auto">
                  <div className="flex w-full pos-table-header bg-muted border-b border-border text-xs font-semibold py-2">
                    {[
                      { key: "barcodes", label: "Code-barres", w: "15%" },
                      { key: "name", label: "Nom", w: "20%" },
                      { key: "category", label: "Catégorie", w: "12%" },
                      { key: "price", label: "Prix (DA)", w: "8%" },
                      { key: "cost", label: "Coût (DA)", w: "8%" },
                      { key: "stock", label: "Stock", w: "7%" },
                      { key: "unit", label: "Unité", w: "5%" },
                      { key: "plu", label: "PLU", w: "7%" },
                      { key: "scale", label: <Scale className="h-3.5 w-3.5" />, w: "4%" },
                      { key: "clock", label: "⏰", w: "4%" },
                      { key: "actions", label: "Actions", w: "10%", right: true },
                    ].map((col) => (
                      <div
                        key={col.key}
                        className={`px-3 flex items-center gap-1 cursor-pointer select-none ${col.right ? 'justify-end' : ''}`}
                        style={{ width: col.w }}
                        onClick={() => col.key !== 'scale' && col.key !== 'clock' && col.key !== 'actions' && handleSort(col.key as keyof Product)}
                      >
                        {col.label} <SortIcon field={col.key as keyof Product} />
                      </div>
                    ))}
                  </div>
                  <div className="divide-y divide-border">
                    <List
                      height={600}
                      itemCount={filteredProducts.length}
                      itemSize={50}
                      width={"100%"}
                      className="hide-scrollbar"
                      itemData={filteredProducts}
                      style={{}}
                    >
                      {({ index, style }) => {
                        const p = filteredProducts[index];
                        if (!p) return <div style={style}></div>;
                        return (
                          <div style={{ ...style, display: "flex", alignItems: "center" }} className="hover:bg-muted/50 transition-colors border-b border-border w-full text-sm">
                            <div className="px-3 font-mono text-xs text-muted-foreground truncate" style={{ width: "15%" }}>
                              {p.barcodes[0] || "—"}
                              {p.barcodes.length > 1 && (
                                <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-info/10 text-info font-medium">
                                  +{p.barcodes.length - 1}
                                </span>
                              )}
                            </div>
                            <div className="px-3 font-medium text-foreground truncate" style={{ width: "20%" }}>
                              {p.name}
                              {p.wholesaleEnabled && (
                                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">GROS</span>
                              )}
                            </div>
                            <div className="px-3 text-muted-foreground truncate" style={{ width: "12%" }}>{p.category}</div>
                            <div className="px-3 font-semibold text-foreground truncate" style={{ width: "8%" }}>{p.price.toFixed(2)}</div>
                            <div className="px-3 text-muted-foreground truncate" style={{ width: "8%" }}>{p.cost.toFixed(2)}</div>
                            <div className="px-3 truncate" style={{ width: "7%" }}>
                              <span className={`font-semibold ${p.stock <= p.minStock ? "text-accent" : "text-foreground"}`}>
                                {p.stock}
                              </span>
                              {p.stock <= p.minStock && (
                                <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">BAS</span>
                              )}
                            </div>
                            <div className="px-3 text-muted-foreground truncate" style={{ width: "5%" }}>{p.unit}</div>
                            <div className="px-3 font-mono text-xs truncate" style={{ width: "7%" }}>{p.plu || "—"}</div>
                            <div className="px-3 flex justify-center" style={{ width: "4%" }}>
                              {p.scaleEnabled && <Scale className="h-3.5 w-3.5 text-info" />}
                            </div>
                            <div className="px-3 flex justify-center" style={{ width: "4%" }}>
                              {hasExpirationWarning(p) && (
                                <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                              )}
                            </div>
                            <div className="px-3 flex items-center justify-end gap-1" style={{ width: "10%" }}>
                              <button onClick={() => openEditProduct(p)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => openNewPurchase(p.id)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-info">
                                <Truck className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => deleteProduct(p.id)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-accent">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      }}
                    </List>
                  </div>
              </div>
              <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
                {filteredProducts.length} produit(s) trouvé(s)
              </div>
            </div>
          )}

          {/* Stock tab */}
          {activeTab === "stock" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="pos-stat-card">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Total produits</p>
                  <p className="text-2xl font-bold text-foreground">{products.length}</p>
                </div>
                <div className="pos-stat-card">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Stock faible</p>
                  <p className="text-2xl font-bold text-accent">{products.filter((p) => p.stock <= p.minStock).length}</p>
                </div>
                <div className="pos-stat-card">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Valeur du stock</p>
                  <p className="text-2xl font-bold text-foreground">
                    {products.reduce((s, p) => s + p.stock * p.cost, 0).toLocaleString()} DA
                  </p>
                </div>
              </div>

              <div className="pos-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <h3 className="font-semibold text-foreground">Mouvements de stock récents</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="pos-table-header">
                      <th className="px-3 py-2.5 text-left text-xs font-semibold">Date</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold">Produit</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold">Type</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold">Quantité</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold">Raison</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mockMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-muted/50">
                        <td className="px-3 py-2 text-muted-foreground">{m.date}</td>
                        <td className="px-3 py-2 font-medium text-foreground">{m.product}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            m.type === "in" ? "bg-success/10 text-success" : m.type === "out" ? "bg-accent/10 text-accent" : "bg-info/10 text-info"
                          }`}>
                            {m.type === "in" ? "Entrée" : m.type === "out" ? "Sortie" : "Ajustement"}
                          </span>
                        </td>
                        <td className={`px-3 py-2 font-semibold ${movementColor(m.type)}`}>
                          {m.type === "in" ? "+" : ""}{m.quantity}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{m.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Purchases tab */}
          {activeTab === "purchases" && (
            <div className="pos-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="pos-table-header">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold">Réf</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold">Date</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold">Fournisseur</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold">Produit</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold">Qté</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold">Coût unit.</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold">Total (DA)</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mockPurchases.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/50">
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{p.id}</td>
                      <td className="px-3 py-2 text-muted-foreground">{p.date}</td>
                      <td className="px-3 py-2 text-foreground">{p.supplier}</td>
                      <td className="px-3 py-2 font-medium text-foreground">{p.productName}</td>
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
                {mockPurchases.length} achat(s)
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Enhanced Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct.id ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
            <DialogDescription className="sr-only">Remplissez les informations du produit ci-dessous.</DialogDescription>
          </DialogHeader>

          <Accordion type="multiple" defaultValue={["general", "barcodes", "pricing"]} className="space-y-1">
            {/* General Info */}
            <AccordionItem value="general" className="border rounded-lg px-3">
              <AccordionTrigger className="text-sm font-semibold py-3 hover:no-underline">
                <span className="flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Informations générales</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-3 pb-2">
                  <div className="col-span-2">
                    <Label className="text-xs">Nom du produit</Label>
                    <Input value={editingProduct.name} onChange={(e) => setEditingProduct((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Catégorie</Label>
                    <Select value={editingProduct.category} onValueChange={(v) => setEditingProduct((p) => ({ ...p, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Alimentation", "Boissons", "Fruits", "Légumes", "Hygiène", "Autres"].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Unité</Label>
                    <Select value={editingProduct.unit} onValueChange={(v) => setEditingProduct((p) => ({ ...p, unit: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcs">Pièce</SelectItem>
                        <SelectItem value="kg">Kilogramme</SelectItem>
                        <SelectItem value="l">Litre</SelectItem>
                        <SelectItem value="m">Mètre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Code PLU</Label>
                    <Input value={editingProduct.plu} onChange={(e) => setEditingProduct((p) => ({ ...p, plu: e.target.value }))} placeholder="Ex: 001" />
                  </div>
                  <div className="flex items-end pb-1">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={editingProduct.scaleEnabled}
                        onCheckedChange={(c) => setEditingProduct((p) => ({ ...p, scaleEnabled: !!c }))}
                      />
                      <Label className="text-xs cursor-pointer">Balance électronique</Label>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Barcodes */}
            <AccordionItem value="barcodes" className="border rounded-lg px-3">
              <AccordionTrigger className="text-sm font-semibold py-3 hover:no-underline">
                <span className="flex items-center gap-2"><ScanBarcode className="h-4 w-4 text-primary" /> Codes-barres ({editingProduct.barcodes.filter(b => b).length})</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pb-2">
                  {editingProduct.barcodes.map((bc, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={bc}
                        onChange={(e) => {
                          const updated = [...editingProduct.barcodes];
                          updated[i] = e.target.value;
                          setEditingProduct((p) => ({ ...p, barcodes: updated }));
                        }}
                        placeholder="Code-barres"
                        className="font-mono text-xs"
                      />
                      {editingProduct.barcodes.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-accent" onClick={() => removeBarcode(i)}>
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <Input
                      value={newBarcode}
                      onChange={(e) => setNewBarcode(e.target.value)}
                      placeholder="Ajouter un code-barres..."
                      className="font-mono text-xs"
                      onKeyDown={(e) => e.key === "Enter" && addBarcode()}
                    />
                    <Button variant="outline" size="sm" onClick={addBarcode} className="text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Ajouter
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Pricing */}
            <AccordionItem value="pricing" className="border rounded-lg px-3">
              <AccordionTrigger className="text-sm font-semibold py-3 hover:no-underline">
                <span className="flex items-center gap-2"><Tag className="h-4 w-4 text-primary" /> Tarification</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-3 pb-2">
                  <div>
                    <Label className="text-xs">Prix de vente (DA)</Label>
                    <Input type="number" value={editingProduct.price || ""} onChange={(e) => setEditingProduct((p) => ({ ...p, price: +e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Coût d'achat unitaire (DA)</Label>
                    <Input type="number" value={editingProduct.cost || ""} onChange={(e) => setEditingProduct((p) => ({ ...p, cost: +e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Taille du pack</Label>
                    <Input type="number" min={1} value={editingProduct.packSize || ""} onChange={(e) => setEditingProduct((p) => ({ ...p, packSize: +e.target.value }))} placeholder="1" />
                  </div>
                  <div>
                    <Label className="text-xs">Prix d'achat du pack (DA)</Label>
                    <Input type="number" value={editingProduct.packBuyingPrice || ""} onChange={(e) => setEditingProduct((p) => ({ ...p, packBuyingPrice: +e.target.value }))} placeholder="0" />
                  </div>
                  {(unitCostFromPack || margin) && (
                    <div className="col-span-2 bg-muted rounded-md p-3 flex gap-6 text-sm">
                      {unitCostFromPack && (
                        <div>
                          <span className="text-xs text-muted-foreground">Coût unitaire calculé: </span>
                          <span className="font-bold text-foreground">{unitCostFromPack} DA</span>
                        </div>
                      )}
                      {margin && (
                        <div>
                          <span className="text-xs text-muted-foreground">Marge: </span>
                          <span className={`font-bold ${parseFloat(margin) >= 0 ? "text-success" : "text-accent"}`}>{margin}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Wholesale */}
            <AccordionItem value="wholesale" className="border rounded-lg px-3">
              <AccordionTrigger className="text-sm font-semibold py-3 hover:no-underline">
                <span className="flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Vente en gros / par pack</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pb-2">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={editingProduct.wholesaleEnabled}
                      onCheckedChange={(c) => setEditingProduct((p) => ({ ...p, wholesaleEnabled: c }))}
                    />
                    <Label className="text-xs">Activer la vente en gros</Label>
                  </div>
                  {editingProduct.wholesaleEnabled && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <Label className="text-xs">Prix de gros (DA)</Label>
                        <Input type="number" value={editingProduct.wholesalePrice || ""} onChange={(e) => setEditingProduct((p) => ({ ...p, wholesalePrice: +e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Quantité minimum</Label>
                        <Input type="number" value={editingProduct.wholesaleMinQty || ""} onChange={(e) => setEditingProduct((p) => ({ ...p, wholesaleMinQty: +e.target.value }))} />
                      </div>
                      <div className="col-span-2 bg-muted rounded-md p-2.5 text-xs text-muted-foreground">
                        💡 Le prix de gros sera appliqué automatiquement à la caisse quand la quantité atteint {editingProduct.wholesaleMinQty || "..."} unités.
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Stock & Expiration */}
            <AccordionItem value="stock" className="border rounded-lg px-3">
              <AccordionTrigger className="text-sm font-semibold py-3 hover:no-underline">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" /> Stock & Dates d'expiration
                  {editingProduct.expirationDates.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/10 text-warning font-medium">
                      {editingProduct.expirationDates.length}
                    </span>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pb-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Stock actuel</Label>
                      <Input type="number" value={editingProduct.stock || ""} onChange={(e) => setEditingProduct((p) => ({ ...p, stock: +e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-xs">Stock minimum</Label>
                      <Input type="number" value={editingProduct.minStock || ""} onChange={(e) => setEditingProduct((p) => ({ ...p, minStock: +e.target.value }))} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-medium">Lots et dates d'expiration</Label>
                      <Button variant="outline" size="sm" onClick={addExpiration} className="h-7 text-xs">
                        <Plus className="h-3 w-3 mr-1" /> Ajouter un lot
                      </Button>
                    </div>
                    {editingProduct.expirationDates.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">Aucune date d'expiration enregistrée</p>
                    )}
                    <div className="space-y-2">
                      {editingProduct.expirationDates.map((exp, i) => {
                        const days = exp.date ? daysUntil(exp.date) : null;
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <Input
                              type="date"
                              value={exp.date}
                              onChange={(e) => updateExpiration(i, "date", e.target.value)}
                              className="text-xs"
                            />
                            <Input
                              type="number"
                              value={exp.quantity || ""}
                              onChange={(e) => updateExpiration(i, "quantity", +e.target.value)}
                              placeholder="Qté"
                              className="w-20 text-xs"
                            />
                            {days !== null && days <= 30 && days >= 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning font-medium whitespace-nowrap">
                                {days}j
                              </span>
                            )}
                            {days !== null && days < 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium whitespace-nowrap">
                                Expiré
                              </span>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-accent" onClick={() => removeExpiration(i)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>
              <X className="h-4 w-4 mr-1" /> Annuler
            </Button>
            <Button onClick={saveProduct} className="bg-primary text-primary-foreground">
              <Save className="h-4 w-4 mr-1" /> Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvel achat</DialogTitle>
            <DialogDescription className="sr-only">Formulaire pour enregistrer un nouvel achat de produit.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Produit</Label>
              <Select value={purchaseForm.productId} onValueChange={(v) => {
                const p = products.find((x) => x.id === v);
                setPurchaseForm((f) => ({ ...f, productId: v, unitCost: p?.cost || f.unitCost }));
              }}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un produit" /></SelectTrigger>
                <SelectContent>
                  {products
                    .filter((p, i) => p.id === purchaseForm.productId || i < 50)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Produit absent ? <button onClick={() => { setShowPurchaseDialog(false); openNewProduct(); }} className="text-info underline">Créer un nouveau produit</button>
              </p>
            </div>
            <div>
              <Label>Fournisseur</Label>
              <Input value={purchaseForm.supplier} onChange={(e) => setPurchaseForm((f) => ({ ...f, supplier: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantité</Label>
                <Input type="number" value={purchaseForm.quantity} onChange={(e) => setPurchaseForm((f) => ({ ...f, quantity: +e.target.value }))} />
              </div>
              <div>
                <Label>Coût unitaire (DA)</Label>
                <Input type="number" value={purchaseForm.unitCost} onChange={(e) => setPurchaseForm((f) => ({ ...f, unitCost: +e.target.value }))} />
              </div>
            </div>
            <div className="bg-muted rounded-md p-3 text-sm">
              <span className="text-muted-foreground">Total: </span>
              <span className="font-bold text-foreground">{(purchaseForm.quantity * purchaseForm.unitCost).toLocaleString()} DA</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>Annuler</Button>
            <Button onClick={savePurchase} disabled={!purchaseForm.productId || purchaseForm.quantity <= 0} className="bg-primary text-primary-foreground">
              <Save className="h-4 w-4 mr-1" /> Enregistrer l'achat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;
