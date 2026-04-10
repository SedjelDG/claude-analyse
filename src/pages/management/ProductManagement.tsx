import * as React from "react";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { FixedSizeList as List } from "react-window";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Truck, BarChart3, Plus, Search, Edit2, Trash2,
  ChevronDown, ChevronUp, Save, X, Scale, Tag, AlertTriangle,
  ScanBarcode, Calendar, Image as ImageIcon, Info, Keyboard,
  ToggleLeft, Palette, ShoppingCart, Upload, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { ScrollBar } from "@/components/ui/scroll-area";
import { generateMockProducts, Product, ExpirationEntry, PackVariant } from "@/utils/mockProducts";
import { ProductFormDialog, EditableProduct, emptyProduct } from "@/components/management/ProductFormDialog";
import { ProductCreationWizard } from "@/components/management/ProductCreationWizard";
import { ExportDialog, ImportDialog } from "@/components/management/ProductImportExport";

const VirtualScrollArea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
  <ScrollAreaPrimitive.Root className="relative h-full w-full overflow-hidden radix-virtual-container">
    <ScrollAreaPrimitive.Viewport ref={ref} className="h-full w-full rounded-[inherit] [&>div]:!block [&::-webkit-scrollbar]:hidden" {...props} />
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
VirtualScrollArea.displayName = "VirtualScrollArea";

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

// Shared utilities
const movementColor = (t: string) =>
  t === "in" ? "text-success" : t === "out" ? "text-accent" : "text-info";

const ProductManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PageTab>("products");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => { setProducts(generateMockProducts(20000)); }, []);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showCreationWizard, setShowCreationWizard] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EditableProduct>(emptyProduct);
  const [sortField, setSortField] = useState<keyof Product>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [newBarcode, setNewBarcode] = useState("");
  const [stockSubTabState, setStockSubTabState] = useState<"movements" | "alerts">("movements");

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

  const openNewProduct = () => { setShowCreationWizard(true); };
  const openEditProduct = (p: Product) => { setEditingProduct({ ...p }); setShowProductDialog(true); };

  const deleteProduct = (id: string) => setProducts((prev) => prev.filter((p) => p.id !== id));

  const navigateToPurchase = (productId: string) => {
    navigate(`/management/purchases?product=${productId}`);
  };

  const handleSaveProduct = (updatedProduct: EditableProduct) => {
    if (!updatedProduct.name) return;
    
    const cleanPackVariants = (updatedProduct.packVariants || []).filter(v => v.size > 1 && v.name && v.price > 0);
    const finalProduct = { ...updatedProduct, packVariants: cleanPackVariants } as Product;
    
    if (finalProduct.id) {
      setProducts(prev => prev.map(p => p.id === finalProduct.id ? finalProduct : p));
    } else {
      const newProduct = { ...finalProduct, id: `prod-${Date.now()}` };
      setProducts(prev => [newProduct, ...prev]);
    }
    setShowProductDialog(false);
  };

  const handleWizardSave = (newProduct: EditableProduct) => {
    if (!newProduct.name) return;
    const cleanPackVariants = (newProduct.packVariants || []).filter(v => v.size > 1 && v.name && v.price > 0);
    const product = { ...newProduct, packVariants: cleanPackVariants, id: `prod-${Date.now()}` } as Product;
    setProducts(prev => [product, ...prev]);
  };

  const handleBulkImport = (imported: Partial<Product>[]) => {
    const newProducts = imported.map((p, i) => ({
      ...p,
      id: `prod-import-${Date.now()}-${i}`,
    } as Product));
    setProducts(prev => [...newProducts, ...prev]);
  };

  const statusColor = (s: string) =>
    s === "received" ? "bg-success/10 text-success" : s === "pending" ? "bg-warning/10 text-warning" : "bg-info/10 text-info";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black ds-gradient-text tracking-tight">Gestion des produits</h2>
          <p className="text-sm text-muted-foreground">Produits, stock et achats en un seul endroit</p>
        </div>
      </div>

      {/* Page Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {pageTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${
              activeTab === t.id
                ? "ds-gradient-border bg-primary/[0.03] text-primary shadow-sm"
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
                outerElementType={VirtualScrollArea}
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
          {activeTab === "stock" && (() => {
            const lowStockProducts = products.filter((p) => p.stock <= p.minStock && p.stock > 0);
            const outOfStockProducts = products.filter((p) => p.stock === 0);
            const expiringProducts = products.filter((p) =>
              p.expirationDates.some((e) => { const d = daysUntil(e.date); return d >= 0 && d <= 30; })
            );
            return (
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

              {/* Stock sub-tabs */}
              {(() => {
                const [stockSubTab, setStockSubTab] = [stockSubTabState, setStockSubTabState];
                return (
                <>
                <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
                  <button onClick={() => setStockSubTab("movements")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${stockSubTab === "movements" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    Mouvements de stock
                  </button>
                  <button onClick={() => setStockSubTab("alerts")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${stockSubTab === "alerts" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    Alertes de stock
                    {(lowStockProducts.length + outOfStockProducts.length + expiringProducts.length) > 0 && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${stockSubTab === "alerts" ? "bg-primary-foreground/20" : "bg-destructive/10 text-destructive"}`}>
                        {lowStockProducts.length + outOfStockProducts.length + expiringProducts.length}
                      </span>
                    )}
                  </button>
                </div>

                <AnimatePresence mode="wait">
                {stockSubTab === "movements" ? (
                  <motion.div key="movements" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="pos-card overflow-hidden">
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
                  </motion.div>
                ) : (
                  <motion.div key="alerts" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                    {/* Out of stock */}
                    {outOfStockProducts.length > 0 && (
                      <div className="pos-card overflow-hidden">
                        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-destructive" />
                          <h3 className="font-semibold text-foreground">Rupture de stock ({outOfStockProducts.length})</h3>
                        </div>
                        <div className="divide-y divide-border">
                          {outOfStockProducts.map((p) => (
                            <div key={p.id} className="px-4 py-2.5 flex items-center justify-between">
                              <span className="text-sm font-medium text-foreground">{p.name}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-destructive/10 text-destructive">RUPTURE</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Low stock */}
                    {lowStockProducts.length > 0 && (
                      <div className="pos-card overflow-hidden">
                        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-warning" />
                          <h3 className="font-semibold text-foreground">Stock faible ({lowStockProducts.length})</h3>
                        </div>
                        <div className="divide-y divide-border">
                          {lowStockProducts.map((p) => (
                            <div key={p.id} className="px-4 py-2.5 flex items-center justify-between">
                              <div>
                                <span className="text-sm font-medium text-foreground">{p.name}</span>
                                <span className="text-[10px] text-muted-foreground ml-2">Stock: {p.stock} / Min: {p.minStock}</span>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-warning/10 text-warning">BAS</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expiring soon */}
                    {expiringProducts.length > 0 && (
                      <div className="pos-card overflow-hidden">
                        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-accent" />
                          <h3 className="font-semibold text-foreground">Expiration proche ({expiringProducts.length})</h3>
                        </div>
                        <div className="divide-y divide-border">
                          {expiringProducts.map((p) => (
                            <div key={p.id} className="px-4 py-2.5 flex items-center justify-between">
                              <div>
                                <span className="text-sm font-medium text-foreground">{p.name}</span>
                                {p.expirationDates.filter((e) => daysUntil(e.date) <= 30 && daysUntil(e.date) >= 0).map((e, i) => (
                                  <span key={i} className="text-[10px] text-muted-foreground ml-2">{e.date} ({daysUntil(e.date)}j, qté: {e.quantity})</span>
                                ))}
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent/10 text-accent">EXPIRE BIENTÔT</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {outOfStockProducts.length === 0 && lowStockProducts.length === 0 && expiringProducts.length === 0 && (
                      <div className="pos-card p-8 text-center">
                        <p className="text-sm text-muted-foreground">Aucune alerte de stock</p>
                      </div>
                    )}
                  </motion.div>
                )}
                </AnimatePresence>
                </>
                );
              })()}
            </div>
            );
          })()}
        </motion.div>
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════
          PRODUCT FORM DIALOG (PRO-MAX COMPONENT)
         ═══════════════════════════════════════════════════════════════ */}
      <ProductFormDialog
        isOpen={showProductDialog}
        onClose={() => setShowProductDialog(false)}
        product={editingProduct}
        onSave={handleSaveProduct}
      />
        <ProductCreationWizard
          isOpen={showCreationWizard}
          onClose={() => setShowCreationWizard(false)}
          onSave={handleWizardSave}
          products={products}
        />
    </div>
  );
};

export default ProductManagement;
