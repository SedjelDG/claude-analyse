import { useState } from "react";
import { motion } from "framer-motion";
import { Scale, Search, Upload, Download, RefreshCw, Settings, Tag, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface ScaleProduct {
  id: string;
  plu: string;
  name: string;
  price: number;
  unit: string;
  tare: number;
  labelFormat: string;
  synced: boolean;
  active: boolean;
}

const mockScaleProducts: ScaleProduct[] = [
  { id: "1", plu: "001", name: "Pommes", price: 250, unit: "kg", tare: 0, labelFormat: "Standard", synced: true, active: true },
  { id: "2", plu: "002", name: "Bananes", price: 350, unit: "kg", tare: 0, labelFormat: "Standard", synced: true, active: true },
  { id: "3", plu: "003", name: "Fromage", price: 800, unit: "kg", tare: 0.02, labelFormat: "Standard", synced: false, active: true },
  { id: "4", plu: "004", name: "Olives", price: 500, unit: "kg", tare: 0.05, labelFormat: "Standard", synced: true, active: true },
  { id: "5", plu: "005", name: "Viande hachée", price: 1200, unit: "kg", tare: 0.03, labelFormat: "Avec date", synced: false, active: false },
  { id: "6", plu: "006", name: "Poulet", price: 450, unit: "kg", tare: 0.02, labelFormat: "Avec date", synced: true, active: true },
];

const ScaleIntegration = () => {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState(mockScaleProducts);

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.plu.includes(search)
  );

  const syncedCount = products.filter((p) => p.synced).length;
  const activeCount = products.filter((p) => p.active).length;
  const unsyncedCount = products.filter((p) => !p.synced && p.active).length;

  const toggleActive = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active, synced: false } : p))
    );
  };

  const syncAll = () => {
    setProducts((prev) => prev.map((p) => (p.active ? { ...p, synced: true } : p)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" /> Balance / PLU
          </h2>
          <p className="text-sm text-muted-foreground">
            Gestion des produits intégrés à la balance électronique
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-primary text-primary" onClick={syncAll}>
            <Upload className="h-4 w-4 mr-1" /> Synchroniser
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-1" /> Exporter PLU
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pos-stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Produits PLU</p>
          <p className="text-2xl font-bold text-foreground">{products.length}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="pos-stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Actifs</p>
          <p className="text-2xl font-bold text-success">{activeCount}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="pos-stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Synchronisés</p>
          <p className="text-2xl font-bold text-info">{syncedCount}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="pos-stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">En attente</p>
          <p className="text-2xl font-bold text-warning">{unsyncedCount}</p>
        </motion.div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom ou PLU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="pos-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="pos-table-header">
              <th className="px-3 py-2.5 text-left text-xs font-semibold">PLU</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold">Produit</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold">Prix/kg (DA)</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold">Tare (kg)</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold">Format étiquette</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold">Sync</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold">Actif</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p) => (
              <tr key={p.id} className={`hover:bg-muted/50 transition-colors ${!p.active ? "opacity-50" : ""}`}>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded font-mono text-xs font-bold">
                    <Tag className="h-3 w-3" />
                    {p.plu}
                  </span>
                </td>
                <td className="px-3 py-2.5 font-medium text-foreground">{p.name}</td>
                <td className="px-3 py-2.5 font-semibold text-foreground">{p.price.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{p.tare > 0 ? p.tare.toFixed(3) : "—"}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{p.labelFormat}</td>
                <td className="px-3 py-2.5 text-center">
                  {p.synced ? (
                    <Check className="h-4 w-4 text-success inline" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-warning inline" />
                  )}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <Switch checked={p.active} onCheckedChange={() => toggleActive(p.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
          {filtered.length} produit(s) PLU
        </div>
      </div>

      {/* Info box */}
      <div className="pos-card p-4 border-l-4 border-info">
        <h4 className="font-semibold text-foreground text-sm mb-1">💡 Comment ajouter un produit à la balance ?</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Dans la section <strong>Gestion des produits</strong>, activez l'option "Inclure dans la balance électronique" 
          et assignez un code PLU au produit. Il apparaîtra automatiquement ici pour la synchronisation avec votre balance.
        </p>
      </div>
    </div>
  );
};

export default ScaleIntegration;
