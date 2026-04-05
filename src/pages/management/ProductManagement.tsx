import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { FixedSizeList as List } from "react-window";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Truck, BarChart3, Plus, Search, Edit2, Trash2,
  ChevronDown, ChevronUp, Save, X, Scale, Tag, AlertTriangle,
  ScanBarcode, Calendar, Image as ImageIcon, Info, Keyboard,
  ToggleLeft, Palette, ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { generateMockProducts, Product, ExpirationEntry, PackVariant } from "@/utils/mockProducts";


type PageTab = "products" | "stock";

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

const pageTabs: { id: PageTab; label: string; icon: typeof Package }[] = [
  { id: "products", label: "Produits", icon: Package },
  { id: "stock", label: "Stock", icon: BarChart3 },
];

type EditableProduct = Omit<Product, "id"> & { id?: string };

const emptyProduct: EditableProduct = {
  barcodes: [""], name: "", category: "Alimentation", brand: "", price: 0, cost: 0,
  stock: 0, minStock: 0, unit: "pcs", plu: "", scaleEnabled: false,
  packSize: 1, packBuyingPrice: 0, wholesaleEnabled: false,
  wholesalePrice: 0, wholesaleMinQty: 0, expirationDates: [],
  vatRate: 0, packVariants: [], supplier: "", image: "",
  shortLabel: "", buttonColor: "", allowPriceOverride: false, isActive: true,
  tareWeight: 0, labelFormat: "standard",
};

const daysUntil = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const hasExpirationWarning = (p: Product) =>
  p.expirationDates.some((e) => daysUntil(e.date) <= 30 && daysUntil(e.date) >= 0);

const BUTTON_COLORS = [
  { value: "", label: "Par défaut" },
  { value: "bg-register-btn-green", label: "Vert" },
  { value: "bg-register-btn-blue", label: "Bleu" },
  { value: "bg-register-btn-salmon", label: "Saumon" },
  { value: "bg-register-btn-gold", label: "Or" },
  { value: "bg-register-btn-pink", label: "Rose" },
  { value: "bg-register-btn-teal", label: "Sarcelle" },
  { value: "bg-register-btn-purple", label: "Violet" },
  { value: "bg-register-btn-olive", label: "Olive" },
];

/* ─── Section Divider ─── */
const SectionDivider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px bg-border" />
    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
    <div className="flex-1 h-px bg-border" />
  </div>
);

/* ─── Keyboard badge ─── */
const KBD = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-semibold bg-muted border border-border rounded text-muted-foreground">{children}</kbd>
);

const ProductManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PageTab>("products");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => { setProducts(generateMockProducts(20000)); }, []);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EditableProduct>(emptyProduct);
  const [sortField, setSortField] = useState<keyof Product>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [newBarcode, setNewBarcode] = useState("");
  const [formTab, setFormTab] = useState("general");

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

  const openNewProduct = () => { setEditingProduct({ ...emptyProduct, barcodes: [""] }); setFormTab("general"); setShowProductDialog(true); };
  const openEditProduct = (p: Product) => { setEditingProduct({ ...p }); setFormTab("general"); setShowProductDialog(true); };

  // ─── Calculations ───
  const unitCostFromPack = useMemo(() => {
    if (editingProduct.packSize > 1 && editingProduct.packBuyingPrice > 0) {
      return editingProduct.packBuyingPrice / editingProduct.packSize;
    }
    return null;
  }, [editingProduct.packSize, editingProduct.packBuyingPrice]);

  const effectiveCost = unitCostFromPack ?? editingProduct.cost;

  const margin = useMemo(() => {
    if (effectiveCost > 0 && editingProduct.price > 0) {
      return ((editingProduct.price - effectiveCost) / effectiveCost) * 100;
    }
    return null;
  }, [editingProduct.price, effectiveCost]);

  const vatAmount = useMemo(() => {
    if (editingProduct.vatRate > 0 && editingProduct.price > 0) {
      const ht = editingProduct.price / (1 + editingProduct.vatRate / 100);
      return editingProduct.price - ht;
    }
    return 0;
  }, [editingProduct.price, editingProduct.vatRate]);

  const priceHT = editingProduct.price - vatAmount;
  const profitPerUnit = editingProduct.price - effectiveCost;

  const marginBadge = margin !== null
    ? margin >= 20 ? { label: "Bonne", cls: "bg-success/15 text-success" }
    : margin >= 5 ? { label: "Correcte", cls: "bg-warning/15 text-warning" }
    : { label: "Faible", cls: "bg-accent/15 text-accent" }
    : null;

  // Bidirectional margin ↔ price
  const setMarginValue = (m: number) => {
    if (effectiveCost > 0) {
      const newPrice = effectiveCost * (1 + m / 100);
      setEditingProduct((p) => ({ ...p, price: Math.round(newPrice * 100) / 100 }));
    }
  };

  const saveProduct = () => {
    const finalProduct = { ...editingProduct };
    if (unitCostFromPack !== null) {
      finalProduct.cost = Math.round(unitCostFromPack * 100) / 100;
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

  const navigateToPurchase = (productId: string) => {
    navigate(`/management/purchases?product=${productId}`);
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

  const addPackVariant = () => {
    setEditingProduct((p) => ({ ...p, packVariants: [...p.packVariants, { size: 6, name: "", price: 0 }] }));
  };

  const updatePackVariant = (index: number, field: keyof PackVariant, value: string | number) => {
    setEditingProduct((p) => ({
      ...p,
      packVariants: p.packVariants.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }));
  };

  const removePackVariant = (index: number) => {
    setEditingProduct((p) => ({ ...p, packVariants: p.packVariants.filter((_, i) => i !== index) }));
  };

  // Keyboard shortcuts in dialog
  useEffect(() => {
    if (!showProductDialog) return;
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "s") { e.preventDefault(); saveProduct(); }
      if (e.key === "F2") {
        e.preventDefault();
        const nameInput = document.getElementById("product-name-input");
        nameInput?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const statusColor = (s: string) =>
    s === "received" ? "bg-success/10 text-success" : s === "pending" ? "bg-warning/10 text-warning" : "bg-info/10 text-info";

  const movementColor = (t: string) =>
    t === "in" ? "text-success" : t === "out" ? "text-accent" : "text-info";

  const formTabIndex = ["general", "stock", "scale", "cashier"].indexOf(formTab);
  const formTabCount = 4;
  const canGoNext = formTabIndex < formTabCount - 1;
  const canGoBack = formTabIndex > 0;
  const goNext = () => { if (canGoNext) setFormTab(["general", "stock", "scale", "cashier"][formTabIndex + 1]); };
  const goBack = () => { if (canGoBack) setFormTab(["general", "stock", "scale", "cashier"][formTabIndex - 1]); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion des produits</h2>
          <p className="text-sm text-muted-foreground">Produits, stock et achats en un seul endroit</p>
        </div>
      </div>

      {/* Page Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {pageTabs.map((t) => (
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
              {/* Table Header */}
              <div className="overflow-x-auto">
                <div className="grid text-xs font-semibold pos-table-header" style={{ gridTemplateColumns: "140px 1fr 100px 90px 90px 80px 60px 60px 40px 40px 100px" }}>
                  {[
                    { key: "barcodes", label: "Code-barres" },
                    { key: "name", label: "Nom" },
                    { key: "category", label: "Catégorie" },
                    { key: "price", label: "Prix (DA)" },
                    { key: "cost", label: "Coût (DA)" },
                    { key: "stock", label: "Stock" },
                    { key: "unit", label: "Unité" },
                    { key: "plu", label: "PLU" },
                  ].map((col) => (
                    <div
                      key={col.key}
                      className="px-3 py-2.5 cursor-pointer select-none"
                      onClick={() => handleSort(col.key as keyof Product)}
                    >
                      <span className="flex items-center gap-1">
                        {col.label} <SortIcon field={col.key as keyof Product} />
                      </span>
                    </div>
                  ))}
                  <div className="px-3 py-2.5 flex items-center"><Scale className="h-3.5 w-3.5" /></div>
                  <div className="px-3 py-2.5 flex items-center">⏰</div>
                  <div className="px-3 py-2.5 text-right">Actions</div>
                </div>
              </div>
              {/* Virtualized Rows */}
              <List
                height={600}
                itemCount={filteredProducts.length}
                itemSize={40}
                width="100%"
                overscanCount={10}
              >
                {({ index, style }: { index: number; style: React.CSSProperties }) => {
                  const p = filteredProducts[index];
                  if (!p) return null;
                  return (
                    <div className="grid items-center text-sm hover:bg-muted/50 transition-colors border-b border-border" key={p.id}
                      style={{ ...style, gridTemplateColumns: "140px 1fr 100px 90px 90px 80px 60px 60px 40px 40px 100px" }}>
                      <div className="px-3 py-1 font-mono text-xs text-muted-foreground truncate">
                        {p.barcodes[0] || "—"}
                        {p.barcodes.length > 1 && (
                          <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-info/10 text-info font-medium">
                            +{p.barcodes.length - 1}
                          </span>
                        )}
                      </div>
                      <div className="px-3 py-1 font-medium text-foreground truncate">
                        {p.name}
                        {!p.isActive && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">INACTIF</span>
                        )}
                        {p.wholesaleEnabled && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">GROS</span>
                        )}
                        {p.packVariants.length > 0 && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-info/10 text-info font-medium">PACKS</span>
                        )}
                      </div>
                      <div className="px-3 py-1 text-muted-foreground truncate">{p.category}</div>
                      <div className="px-3 py-1 font-semibold text-foreground">{p.price.toFixed(2)}</div>
                      <div className="px-3 py-1 text-muted-foreground">{p.cost.toFixed(2)}</div>
                      <div className="px-3 py-1">
                        <span className={`font-semibold ${p.stock <= p.minStock ? "text-accent" : "text-foreground"}`}>
                          {p.stock}
                        </span>
                        {p.stock <= p.minStock && (
                          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">BAS</span>
                        )}
                      </div>
                      <div className="px-3 py-1 text-muted-foreground">{p.unit}</div>
                      <div className="px-3 py-1 font-mono text-xs">{p.plu || "—"}</div>
                      <div className="px-3 py-1 text-center">
                        {p.scaleEnabled && <Scale className="h-3.5 w-3.5 text-info inline" />}
                      </div>
                      <div className="px-3 py-1 text-center">
                        {hasExpirationWarning(p) && (
                          <AlertTriangle className="h-3.5 w-3.5 text-warning inline" />
                        )}
                      </div>
                      <div className="px-3 py-1 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditProduct(p)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => navigateToPurchase(p.id)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-info">
                            <Truck className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => deleteProduct(p.id)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-accent">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }}
              </List>
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
                  <h3 className="font-semibold text-foreground">Alertes de stock</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="pos-table-header">
                      <th className="px-3 py-2.5 text-left text-xs font-semibold">Produit</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold">Catégorie</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold">Stock actuel</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold">Seuil minimum</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products
                      .filter((p) => p.stock <= p.minStock)
                      .sort((a, b) => a.stock - b.stock)
                      .slice(0, 50)
                      .map((p) => (
                      <tr key={p.id} className="hover:bg-muted/50">
                        <td className="px-3 py-2 font-medium text-foreground">{p.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{p.category}</td>
                        <td className={`px-3 py-2 font-semibold ${p.stock === 0 ? "text-accent" : "text-warning"}`}>
                          {p.stock}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{p.minStock}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            p.stock === 0 ? "bg-accent/10 text-accent" : "bg-warning/10 text-warning"
                          }`}>
                            {p.stock === 0 ? "Épuisé" : "Faible"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {products.filter((p) => p.stock <= p.minStock).length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Aucune alerte — tous les stocks sont au-dessus du seuil minimum.
                  </div>
                )}
              </div>

              {/* Stock Movements Log */}
              <div className="pos-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <h3 className="font-semibold text-foreground">Mouvements de stock récents</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Historique des entrées, sorties et ajustements</p>
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
                        <td className={`px-3 py-2 font-semibold ${
                          m.type === "in" ? "text-success" : m.type === "out" ? "text-accent" : "text-info"
                        }`}>
                          {m.type === "in" ? "+" : ""}{m.quantity}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{m.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-2 border-t border-border text-[10px] text-muted-foreground italic">
                  Les mouvements seront automatiquement enregistrés une fois le backend connecté.
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════
          PRODUCT FORM DIALOG — 4 Tabs
         ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
          {/* Header */}
          <div className="px-5 pt-5 pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-foreground truncate">
                  {editingProduct.name || (editingProduct.id ? "Modifier le produit" : "Nouveau produit")}
                </h2>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Keyboard className="h-3 w-3" />
                  <KBD>Tab</KBD> / <KBD>Shift+Tab</KBD> pour naviguer · <KBD>F2</KBD> nom · <KBD>Ctrl+S</KBD> sauvegarder
                </p>
              </div>
              {/* Image picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-10 h-10 rounded border-2 border-dashed border-border hover:border-primary flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shrink-0 ml-3 overflow-hidden">
                    {editingProduct.image ? (
                      <img src={editingProduct.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="h-4 w-4" />
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="end">
                  <Label className="text-xs font-medium">URL de l'image</Label>
                  <Input
                    value={editingProduct.image}
                    onChange={(e) => setEditingProduct((p) => ({ ...p, image: e.target.value }))}
                    placeholder="https://..."
                    className="mt-1 text-xs"
                  />
                  {editingProduct.image && (
                    <Button variant="ghost" size="sm" className="mt-2 text-xs text-accent" onClick={() => setEditingProduct((p) => ({ ...p, image: "" }))}>
                      Supprimer
                    </Button>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={formTab} onValueChange={setFormTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 pt-2 border-b border-border">
              <TabsList className="bg-transparent h-auto p-0 gap-0 rounded-none w-full justify-start">
                {[
                  { value: "general", label: "Général & Prix", icon: Tag },
                  { value: "stock", label: "Stock & Lots", icon: Package },
                  { value: "scale", label: "Balance & PLU", icon: Scale },
                  { value: "cashier", label: "Caisse", icon: ShoppingCart },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2 text-xs font-medium gap-1.5"
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* ─── TAB 1: General & Pricing ─── */}
              <TabsContent value="general" className="mt-0 space-y-0">
                {/* Identity */}
                <SectionDivider label="Identité" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="text-[11px] text-muted-foreground">Nom du produit</Label>
                    <Input
                      id="product-name-input"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct((p) => ({ ...p, name: e.target.value }))}
                      className="font-medium"
                      tabIndex={1}
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Catégorie</Label>
                    <Select value={editingProduct.category} onValueChange={(v) => setEditingProduct((p) => ({ ...p, category: v }))}>
                      <SelectTrigger tabIndex={2}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Alimentation", "Boissons", "Fruits", "Légumes", "Hygiène", "Autres"].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Marque</Label>
                    <Input
                      value={editingProduct.brand}
                      onChange={(e) => setEditingProduct((p) => ({ ...p, brand: e.target.value }))}
                      placeholder="Optionnel"
                      tabIndex={3}
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Unité</Label>
                    <Select value={editingProduct.unit} onValueChange={(v) => setEditingProduct((p) => ({ ...p, unit: v }))}>
                      <SelectTrigger tabIndex={4}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcs">Pièce</SelectItem>
                        <SelectItem value="kg">Kilogramme</SelectItem>
                        <SelectItem value="l">Litre</SelectItem>
                        <SelectItem value="m">Mètre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Barcodes */}
                <SectionDivider label="Codes-barres" />
                <div className="space-y-2">
                  {editingProduct.barcodes.map((bc, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <ScanBarcode className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          value={bc}
                          onChange={(e) => {
                            const updated = [...editingProduct.barcodes];
                            updated[i] = e.target.value;
                            setEditingProduct((p) => ({ ...p, barcodes: updated }));
                          }}
                          placeholder="Code-barres"
                          className="font-mono text-xs pl-8"
                          tabIndex={10 + i}
                        />
                      </div>
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {i === 0 ? "Principal" : `Alt ${i}`}
                      </span>
                      {editingProduct.barcodes.length > 1 && (
                        <button onClick={() => removeBarcode(i)} className="p-1 rounded hover:bg-accent/10 text-accent">
                          <X className="h-3 w-3" />
                        </button>
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
                      tabIndex={20}
                    />
                    <Button variant="outline" size="sm" onClick={addBarcode} className="text-xs shrink-0">
                      <Plus className="h-3 w-3 mr-1" /> Ajouter
                    </Button>
                  </div>
                </div>

                {/* Buying Price */}
                <SectionDivider label="Prix d'achat" />
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Taille du pack</Label>
                    <Input type="number" min={1} value={editingProduct.packSize || ""} onChange={(e) => setEditingProduct((p) => ({ ...p, packSize: +e.target.value }))} placeholder="1" tabIndex={21} />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Prix d'achat pack (DA)</Label>
                    <Input type="number" value={editingProduct.packBuyingPrice || ""} onChange={(e) => setEditingProduct((p) => ({ ...p, packBuyingPrice: +e.target.value }))} placeholder="0" tabIndex={22} />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Coût unitaire</Label>
                    <Input
                      value={unitCostFromPack !== null ? unitCostFromPack.toFixed(2) : editingProduct.cost || ""}
                      onChange={(e) => { if (unitCostFromPack === null) setEditingProduct((p) => ({ ...p, cost: +e.target.value })); }}
                      readOnly={unitCostFromPack !== null}
                      className={unitCostFromPack !== null ? "bg-muted text-muted-foreground" : ""}
                      tabIndex={23}
                    />
                  </div>
                </div>

                {/* Selling Price */}
                <SectionDivider label="Prix de vente" />
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Prix de vente TTC (DA)</Label>
                    <Input type="number" value={editingProduct.price || ""} onChange={(e) => setEditingProduct((p) => ({ ...p, price: +e.target.value }))} tabIndex={24} />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Marge cible (%)</Label>
                    <Input
                      type="number"
                      value={margin !== null ? margin.toFixed(1) : ""}
                      onChange={(e) => setMarginValue(+e.target.value)}
                      placeholder="—"
                      tabIndex={25}
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Taux TVA</Label>
                    <Select value={String(editingProduct.vatRate)} onValueChange={(v) => setEditingProduct((p) => ({ ...p, vatRate: +v }))}>
                      <SelectTrigger tabIndex={26}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="9">9%</SelectItem>
                        <SelectItem value="19">19%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Calculation Summary */}
                {effectiveCost > 0 && editingProduct.price > 0 && (
                  <div className="mt-3 bg-muted/60 border border-border rounded-lg p-3">
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Coût unitaire</span>
                        <p className="font-semibold text-foreground">{effectiveCost.toFixed(2)} DA</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Prix HT</span>
                        <p className="font-semibold text-foreground">{priceHT.toFixed(2)} DA</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">TVA ({editingProduct.vatRate}%)</span>
                        <p className="font-semibold text-foreground">{vatAmount.toFixed(2)} DA</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Prix TTC</span>
                        <p className="font-semibold text-foreground">{editingProduct.price.toFixed(2)} DA</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Profit / unité</span>
                        <p className={`font-semibold ${profitPerUnit >= 0 ? "text-success" : "text-accent"}`}>{profitPerUnit.toFixed(2)} DA</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Marge</span>
                        <div className="flex items-center gap-1.5">
                          <p className={`font-semibold ${(margin ?? 0) >= 0 ? "text-success" : "text-accent"}`}>{margin?.toFixed(1) ?? "—"}%</p>
                          {marginBadge && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${marginBadge.cls}`}>{marginBadge.label}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Wholesale */}
                <SectionDivider label="Vente en gros" />
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={editingProduct.wholesaleEnabled}
                      onCheckedChange={(c) => setEditingProduct((p) => ({ ...p, wholesaleEnabled: c }))}
                    />
                    <Label className="text-xs">Activer la vente en gros</Label>
                  </div>
                  {editingProduct.wholesaleEnabled && (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Qté minimum</Label>
                        <Input type="number" value={editingProduct.wholesaleMinQty || ""} onChange={(e) => setEditingProduct((p) => ({ ...p, wholesaleMinQty: +e.target.value }))} tabIndex={30} />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Prix de gros (DA)</Label>
                        <Input type="number" value={editingProduct.wholesalePrice || ""} onChange={(e) => setEditingProduct((p) => ({ ...p, wholesalePrice: +e.target.value }))} tabIndex={31} />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Marge gros</Label>
                        <Input
                          value={effectiveCost > 0 && editingProduct.wholesalePrice > 0 ? `${(((editingProduct.wholesalePrice - effectiveCost) / effectiveCost) * 100).toFixed(1)}%` : "—"}
                          readOnly
                          className="bg-muted text-muted-foreground"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Pack Selling Variants */}
                <SectionDivider label="Variantes de vente par pack" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={editingProduct.packVariants.length > 0}
                        onCheckedChange={(c) => {
                          if (c && editingProduct.packVariants.length === 0) addPackVariant();
                          else if (!c) setEditingProduct((p) => ({ ...p, packVariants: [] }));
                        }}
                      />
                      <Label className="text-xs">Activer les packs de vente</Label>
                    </div>
                    {editingProduct.packVariants.length > 0 && (
                      <Button variant="outline" size="sm" onClick={addPackVariant} className="text-xs h-7">
                        <Plus className="h-3 w-3 mr-1" /> Ajouter
                      </Button>
                    )}
                  </div>
                  {editingProduct.packVariants.length > 0 && (
                    <>
                      <div className="space-y-2">
                        {editingProduct.packVariants.map((v, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-16">
                              <Input type="number" min={2} value={v.size || ""} onChange={(e) => updatePackVariant(i, "size", +e.target.value)} placeholder="Qté" className="text-xs" />
                            </div>
                            <div className="flex-1">
                              <Input value={v.name} onChange={(e) => updatePackVariant(i, "name", e.target.value)} placeholder={`Pack de ${v.size}`} className="text-xs" />
                            </div>
                            <div className="w-24">
                              <Input type="number" value={v.price || ""} onChange={(e) => updatePackVariant(i, "price", +e.target.value)} placeholder="Prix DA" className="text-xs" />
                            </div>
                            <button onClick={() => removePackVariant(i)} className="p-1 rounded hover:bg-accent/10 text-accent">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded border border-border text-[10px] text-muted-foreground">
                        <Info className="h-3.5 w-3.5 shrink-0" />
                        <span>À la caisse, appuyez sur <KBD>F8</KBD> pour basculer entre les tailles de pack en ordre croissant.</span>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              {/* ─── TAB 2: Stock & Batches ─── */}
              <TabsContent value="stock" className="mt-0 space-y-0">
                <SectionDivider label="Niveaux de stock" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Stock actuel</Label>
                    <Input type="number" value={editingProduct.stock || ""} onChange={(e) => setEditingProduct((p) => ({ ...p, stock: +e.target.value }))} tabIndex={1} autoFocus />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Seuil minimum</Label>
                    <Input type="number" value={editingProduct.minStock || ""} onChange={(e) => setEditingProduct((p) => ({ ...p, minStock: +e.target.value }))} tabIndex={2} />
                  </div>
                </div>

                <SectionDivider label="Fournisseur" />
                <div>
                  <Label className="text-[11px] text-muted-foreground">Fournisseur principal</Label>
                  <Input value={editingProduct.supplier} onChange={(e) => setEditingProduct((p) => ({ ...p, supplier: e.target.value }))} placeholder="Nom du fournisseur" tabIndex={3} />
                </div>

                <SectionDivider label="Lots & dates d'expiration" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Suivi des lots</Label>
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
                          <Input type="date" value={exp.date} onChange={(e) => updateExpiration(i, "date", e.target.value)} className="text-xs" />
                          <Input type="number" value={exp.quantity || ""} onChange={(e) => updateExpiration(i, "quantity", +e.target.value)} placeholder="Qté" className="w-20 text-xs" />
                          {days !== null && days >= 0 && days <= 30 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning font-medium whitespace-nowrap">{days}j</span>
                          )}
                          {days !== null && days < 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium whitespace-nowrap">Expiré</span>
                          )}
                          <button onClick={() => removeExpiration(i)} className="p-1 rounded hover:bg-accent/10 text-accent">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              {/* ─── TAB 3: Scale & PLU ─── */}
              <TabsContent value="scale" className="mt-0 space-y-0">
                <SectionDivider label="Balance électronique" />
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={editingProduct.scaleEnabled}
                      onCheckedChange={(c) => setEditingProduct((p) => ({ ...p, scaleEnabled: !!c }))}
                    />
                    <Label className="text-xs">Activer la pesée</Label>
                  </div>

                  {editingProduct.scaleEnabled && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Code PLU</Label>
                        <Input value={editingProduct.plu} onChange={(e) => setEditingProduct((p) => ({ ...p, plu: e.target.value }))} placeholder="Ex: 001" tabIndex={1} autoFocus />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Tare (kg)</Label>
                        <Input type="number" step="0.001" value={editingProduct.tareWeight || ""} onChange={(e) => setEditingProduct((p) => ({ ...p, tareWeight: +e.target.value }))} placeholder="0.000" tabIndex={2} />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Format d'étiquette</Label>
                        <Select value={editingProduct.labelFormat} onValueChange={(v) => setEditingProduct((p) => ({ ...p, labelFormat: v }))}>
                          <SelectTrigger tabIndex={3}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="compact">Compact</SelectItem>
                            <SelectItem value="detailed">Détaillé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={editingProduct.isActive}
                            onCheckedChange={(c) => setEditingProduct((p) => ({ ...p, isActive: c }))}
                          />
                          <Label className="text-xs">Actif sur la balance</Label>
                        </div>
                      </div>
                    </div>
                  )}

                  {!editingProduct.scaleEnabled && (
                    <div className="p-4 bg-muted/50 rounded-lg border border-border text-center">
                      <Scale className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Activez la pesée pour configurer le PLU et les paramètres de balance</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ─── TAB 4: Cashier Settings ─── */}
              <TabsContent value="cashier" className="mt-0 space-y-0">
                <SectionDivider label="Raccourci caisse" />
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Libellé court</Label>
                      <Input
                        value={editingProduct.shortLabel}
                        onChange={(e) => setEditingProduct((p) => ({ ...p, shortLabel: e.target.value }))}
                        placeholder={editingProduct.name.slice(0, 12) || "Ex: LAIT"}
                        maxLength={12}
                        tabIndex={1}
                        autoFocus
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Couleur du bouton</Label>
                      <Select value={editingProduct.buttonColor} onValueChange={(v) => setEditingProduct((p) => ({ ...p, buttonColor: v }))}>
                        <SelectTrigger tabIndex={2}>
                          <div className="flex items-center gap-2">
                            {editingProduct.buttonColor && <span className={`w-3 h-3 rounded-full ${editingProduct.buttonColor}`} />}
                            <SelectValue placeholder="Par défaut" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {BUTTON_COLORS.map((c) => (
                            <SelectItem key={c.value} value={c.value || "default"}>
                              <div className="flex items-center gap-2">
                                {c.value && <span className={`w-3 h-3 rounded-full ${c.value}`} />}
                                {c.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Preview */}
                  {editingProduct.shortLabel && (
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-muted-foreground">Aperçu:</span>
                      <button className={`flex items-center gap-2 px-3 py-2 border border-border rounded text-left ${editingProduct.buttonColor || "bg-card"}`}>
                        <span className={`w-3 h-3 rounded-full ${editingProduct.buttonColor || "bg-muted"} shrink-0`} />
                        <span className="text-[11px] font-medium text-foreground">{editingProduct.shortLabel}</span>
                      </button>
                    </div>
                  )}
                </div>

                <SectionDivider label="Options de caisse" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border">
                    <div>
                      <Label className="text-xs font-medium">Modification du prix</Label>
                      <p className="text-[10px] text-muted-foreground">Autoriser le caissier à modifier le prix</p>
                    </div>
                    <Switch
                      checked={editingProduct.allowPriceOverride}
                      onCheckedChange={(c) => setEditingProduct((p) => ({ ...p, allowPriceOverride: c }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border">
                    <div>
                      <Label className="text-xs font-medium">Produit actif</Label>
                      <p className="text-[10px] text-muted-foreground">Désactiver pour masquer ce produit à la caisse</p>
                    </div>
                    <Switch
                      checked={editingProduct.isActive}
                      onCheckedChange={(c) => setEditingProduct((p) => ({ ...p, isActive: c }))}
                    />
                  </div>
                </div>
              </TabsContent>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-medium">
                  Onglet {formTabIndex + 1} / {formTabCount}
                </span>
                <KBD>Ctrl+S</KBD>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowProductDialog(false)} className="text-xs">
                  Annuler
                </Button>
                {canGoBack && (
                  <Button variant="outline" size="sm" onClick={goBack} className="text-xs">
                    Précédent
                  </Button>
                )}
                {canGoNext ? (
                  <Button size="sm" onClick={goNext} className="text-xs bg-primary text-primary-foreground">
                    Suivant
                  </Button>
                ) : (
                  <Button size="sm" onClick={saveProduct} className="text-xs bg-primary text-primary-foreground">
                    <Save className="h-3.5 w-3.5 mr-1" /> Enregistrer
                  </Button>
                )}
              </div>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;
