import * as React from "react";
import { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Download, FileSpreadsheet, FileText, Check, X, AlertTriangle,
  ChevronRight, ChevronLeft, Eye, Settings2, Columns, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Product } from "@/utils/mockProducts";

/* ─── Column definitions for export/import ─── */
const PRODUCT_COLUMNS = [
  { key: "name", label: "Nom", required: true },
  { key: "barcodes", label: "Code-barres", required: false },
  { key: "category", label: "Catégorie", required: false },
  { key: "brand", label: "Marque", required: false },
  { key: "price", label: "Prix de vente", required: true },
  { key: "cost", label: "Prix d'achat", required: false },
  { key: "stock", label: "Stock", required: false },
  { key: "minStock", label: "Stock minimum", required: false },
  { key: "unit", label: "Unité", required: false },
  { key: "plu", label: "PLU", required: false },
  { key: "scaleEnabled", label: "Balance", required: false },
  { key: "wholesaleEnabled", label: "Vente en gros", required: false },
  { key: "wholesalePrice", label: "Prix gros", required: false },
  { key: "wholesaleMinQty", label: "Qté min gros", required: false },
  { key: "vatRate", label: "TVA (%)", required: false },
  { key: "supplier", label: "Fournisseur", required: false },
  { key: "isActive", label: "Actif", required: false },
] as const;

type ColKey = typeof PRODUCT_COLUMNS[number]["key"];

/* ─── CSV Parsing ─── */
function parseCSV(text: string, delimiter: string = ","): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === delimiter) { row.push(current.trim()); current = ""; }
      else if (ch === "\n" || (ch === "\r" && text[i + 1] === "\n")) {
        row.push(current.trim());
        if (row.some(c => c !== "")) rows.push(row);
        row = []; current = "";
        if (ch === "\r") i++;
      } else { current += ch; }
    }
  }
  row.push(current.trim());
  if (row.some(c => c !== "")) rows.push(row);
  return rows;
}

function detectDelimiter(text: string): string {
  const firstLine = text.split("\n")[0] || "";
  const semi = (firstLine.match(/;/g) || []).length;
  const comma = (firstLine.match(/,/g) || []).length;
  const tab = (firstLine.match(/\t/g) || []).length;
  if (tab > semi && tab > comma) return "\t";
  if (semi > comma) return ";";
  return ",";
}

/* ─── CSV Generation ─── */
function escapeCSV(val: string, delim: string): string {
  if (val.includes(delim) || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function productToRow(p: Product, columns: ColKey[], delim: string): string {
  return columns.map(col => {
    const v = p[col as keyof Product];
    if (col === "barcodes") return escapeCSV((p.barcodes || []).join("|"), delim);
    if (typeof v === "boolean") return v ? "Oui" : "Non";
    if (v == null) return "";
    return escapeCSV(String(v), delim);
  }).join(delim);
}

/* ─── Auto-map columns ─── */
function autoMapColumns(headers: string[]): Record<number, ColKey | ""> {
  const mapping: Record<number, ColKey | ""> = {};
  const aliases: Record<string, ColKey> = {
    nom: "name", name: "name", produit: "name", désignation: "name", designation: "name", article: "name", libellé: "name", libelle: "name",
    "code-barres": "barcodes", "code barre": "barcodes", barcode: "barcodes", ean: "barcodes", "code barres": "barcodes", codebarre: "barcodes", ean13: "barcodes",
    catégorie: "category", categorie: "category", category: "category", famille: "category", rayon: "category",
    marque: "brand", brand: "brand",
    prix: "price", "prix de vente": "price", "prix vente": "price", price: "price", pv: "price", "p.v": "price",
    "prix d'achat": "cost", "prix achat": "cost", coût: "cost", cout: "cost", cost: "cost", pa: "cost", "p.a": "cost",
    stock: "stock", quantité: "stock", quantite: "stock", qty: "stock", qté: "stock",
    "stock minimum": "minStock", "stock min": "minStock", "seuil alerte": "minStock",
    unité: "unit", unite: "unit", unit: "unit",
    plu: "plu",
    balance: "scaleEnabled", pesé: "scaleEnabled", pese: "scaleEnabled",
    gros: "wholesaleEnabled", "vente en gros": "wholesaleEnabled",
    "prix gros": "wholesalePrice",
    "qté min gros": "wholesaleMinQty",
    tva: "vatRate", "tva %": "vatRate", vat: "vatRate",
    fournisseur: "supplier", supplier: "supplier",
    actif: "isActive", active: "isActive",
  };

  headers.forEach((h, i) => {
    const normalized = h.toLowerCase().trim().replace(/[_\-\.]/g, " ");
    mapping[i] = aliases[normalized] || "";
  });
  return mapping;
}

/* ─── Validation ─── */
interface ValidationError {
  row: number;
  column: string;
  message: string;
}

function validateRow(rowData: Record<string, string>, rowIndex: number): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!rowData.name || rowData.name.trim() === "") {
    errors.push({ row: rowIndex, column: "Nom", message: "Le nom est obligatoire" });
  }
  if (rowData.price && isNaN(Number(rowData.price))) {
    errors.push({ row: rowIndex, column: "Prix", message: "Le prix doit être un nombre" });
  }
  if (rowData.cost && isNaN(Number(rowData.cost))) {
    errors.push({ row: rowIndex, column: "Coût", message: "Le coût doit être un nombre" });
  }
  if (rowData.stock && isNaN(Number(rowData.stock))) {
    errors.push({ row: rowIndex, column: "Stock", message: "Le stock doit être un nombre" });
  }
  return errors;
}

function rowToProduct(rowData: Record<string, string>): Partial<Product> {
  return {
    name: rowData.name || "",
    barcodes: rowData.barcodes ? rowData.barcodes.split("|").map(b => b.trim()).filter(Boolean) : [],
    category: rowData.category || "Autres",
    brand: rowData.brand || "",
    price: Number(rowData.price) || 0,
    cost: Number(rowData.cost) || 0,
    stock: Number(rowData.stock) || 0,
    minStock: Number(rowData.minStock) || 10,
    unit: rowData.unit || "pcs",
    plu: rowData.plu || "",
    scaleEnabled: ["oui", "true", "1", "yes"].includes((rowData.scaleEnabled || "").toLowerCase()),
    wholesaleEnabled: ["oui", "true", "1", "yes"].includes((rowData.wholesaleEnabled || "").toLowerCase()),
    wholesalePrice: Number(rowData.wholesalePrice) || 0,
    wholesaleMinQty: Number(rowData.wholesaleMinQty) || 0,
    vatRate: Number(rowData.vatRate) || 0,
    supplier: rowData.supplier || "",
    isActive: rowData.isActive ? ["oui", "true", "1", "yes"].includes(rowData.isActive.toLowerCase()) : true,
    packSize: 1,
    packBuyingPrice: 0,
    expirationDates: [],
    packVariants: [],
    image: "",
    shortLabel: "",
    buttonColor: "",
    allowPriceOverride: false,
    tareWeight: 0,
    labelFormat: "standard",
  };
}

/* ─── EXPORT DIALOG ─── */
interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ open, onClose, products }) => {
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [delimiter, setDelimiter] = useState<"," | ";" | "\t">(",");
  const [selectedCols, setSelectedCols] = useState<Set<ColKey>>(new Set(PRODUCT_COLUMNS.map(c => c.key)));
  const [includeInactive, setIncludeInactive] = useState(false);

  const toggleCol = (key: ColKey) => {
    setSelectedCols(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const exportProducts = useMemo(() =>
    includeInactive ? products : products.filter(p => p.isActive),
    [products, includeInactive]
  );

  const handleExport = useCallback(() => {
    const cols = PRODUCT_COLUMNS.filter(c => selectedCols.has(c.key)).map(c => c.key);

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === "csv") {
      const headers = cols.map(c => PRODUCT_COLUMNS.find(col => col.key === c)!.label);
      const headerRow = headers.map(h => escapeCSV(h, delimiter)).join(delimiter);
      const dataRows = exportProducts.map(p => productToRow(p, cols, delimiter));
      content = [headerRow, ...dataRows].join("\n");
      filename = `produits_${new Date().toISOString().slice(0, 10)}.csv`;
      mimeType = "text/csv;charset=utf-8;";
      // Add BOM for Excel compatibility
      content = "\uFEFF" + content;
    } else {
      const data = exportProducts.map(p => {
        const obj: Record<string, unknown> = {};
        cols.forEach(c => {
          if (c === "barcodes") obj[c] = p.barcodes;
          else obj[c] = p[c as keyof Product];
        });
        return obj;
      });
      content = JSON.stringify(data, null, 2);
      filename = `produits_${new Date().toISOString().slice(0, 10)}.json`;
      mimeType = "application/json;charset=utf-8;";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    onClose();
  }, [format, delimiter, selectedCols, exportProducts, onClose]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Exporter les produits
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Format */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Format</Label>
            <div className="flex gap-2">
              {([["csv", "CSV", FileSpreadsheet], ["json", "JSON", FileText]] as const).map(([f, label, Icon]) => (
                <button key={f} onClick={() => setFormat(f)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                    format === f ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                  }`}>
                  <Icon className="h-4 w-4" />{label}
                </button>
              ))}
            </div>
          </div>

          {/* CSV options */}
          {format === "csv" && (
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Séparateur</Label>
              <Select value={delimiter} onValueChange={(v) => setDelimiter(v as typeof delimiter)}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value=",">Virgule (,)</SelectItem>
                  <SelectItem value=";">Point-virgule (;)</SelectItem>
                  <SelectItem value={"\t"}>Tabulation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Columns */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Colonnes</Label>
              <button
                onClick={() => setSelectedCols(prev => prev.size === PRODUCT_COLUMNS.length ? new Set(PRODUCT_COLUMNS.filter(c => c.required).map(c => c.key)) : new Set(PRODUCT_COLUMNS.map(c => c.key)))}
                className="text-[11px] text-primary font-semibold hover:underline"
              >
                {selectedCols.size === PRODUCT_COLUMNS.length ? "Sélection minimale" : "Tout sélectionner"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
              {PRODUCT_COLUMNS.map(col => (
                <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm">
                  <Checkbox checked={selectedCols.has(col.key)} onCheckedChange={() => toggleCol(col.key)} disabled={col.required} />
                  <span className={col.required ? "font-semibold" : ""}>{col.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Include inactive */}
          <div className="flex items-center justify-between px-1">
            <Label className="text-sm">Inclure les produits inactifs</Label>
            <Switch checked={includeInactive} onCheckedChange={setIncludeInactive} />
          </div>

          <div className="bg-muted/50 rounded-lg px-3 py-2 text-xs text-muted-foreground">
            {exportProducts.length} produit(s) seront exportés • {selectedCols.size} colonne(s)
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" /> Exporter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ─── IMPORT DIALOG ─── */
type ImportStep = "upload" | "mapping" | "preview" | "result";

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (products: Partial<Product>[]) => void;
  existingProducts: Product[];
}

export const ImportDialog: React.FC<ImportDialogProps> = ({ open, onClose, onImport, existingProducts }) => {
  const [step, setStep] = useState<ImportStep>("upload");
  const [rawData, setRawData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<number, ColKey | "">>({});
  const [hasHeaderRow, setHasHeaderRow] = useState(true);
  const [delimiter, setDelimiter] = useState(",");
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [duplicateField, setDuplicateField] = useState<"name" | "barcodes">("barcodes");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("upload");
    setRawData([]);
    setHeaders([]);
    setMapping({});
    setErrors([]);
    setImportedCount(0);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;

      if (file.name.endsWith(".json")) {
        try {
          const data = JSON.parse(text);
          if (Array.isArray(data) && data.length > 0) {
            const keys = Object.keys(data[0]);
            setHeaders(keys);
            setRawData(data.map((row: Record<string, unknown>) => keys.map(k => String(row[k] ?? ""))));
            setMapping(autoMapColumns(keys));
            setHasHeaderRow(false);
            setStep("mapping");
          }
        } catch {
          alert("Fichier JSON invalide");
        }
        return;
      }

      const det = detectDelimiter(text);
      setDelimiter(det);
      const parsed = parseCSV(text, det);
      if (parsed.length < 2) { alert("Fichier vide ou invalide"); return; }

      setHeaders(parsed[0]);
      setRawData(parsed);
      setMapping(autoMapColumns(parsed[0]));
      setHasHeaderRow(true);
      setStep("mapping");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const dataRows = useMemo(() =>
    hasHeaderRow ? rawData.slice(1) : rawData,
    [rawData, hasHeaderRow]
  );

  const mappedProducts = useMemo(() => {
    return dataRows.map((row, idx) => {
      const rowData: Record<string, string> = {};
      Object.entries(mapping).forEach(([colIdx, colKey]) => {
        if (colKey) rowData[colKey] = row[Number(colIdx)] || "";
      });
      return { data: rowData, index: idx + (hasHeaderRow ? 2 : 1) };
    });
  }, [dataRows, mapping, hasHeaderRow]);

  const validationResults = useMemo(() => {
    const allErrors: ValidationError[] = [];
    mappedProducts.forEach(({ data, index }) => {
      allErrors.push(...validateRow(data, index));
    });
    return allErrors;
  }, [mappedProducts]);

  const handleGoToPreview = () => {
    setErrors(validationResults);
    setStep("preview");
  };

  const handleImport = () => {
    const existingBarcodes = new Set(existingProducts.flatMap(p => p.barcodes));
    const existingNames = new Set(existingProducts.map(p => p.name.toLowerCase()));

    const validProducts: Partial<Product>[] = [];
    const errorRows = new Set(validationResults.map(e => e.row));

    mappedProducts.forEach(({ data, index }) => {
      if (errorRows.has(index)) return;

      if (skipDuplicates) {
        if (duplicateField === "barcodes" && data.barcodes) {
          const codes = data.barcodes.split("|").map(b => b.trim());
          if (codes.some(c => existingBarcodes.has(c))) return;
        }
        if (duplicateField === "name" && data.name) {
          if (existingNames.has(data.name.toLowerCase())) return;
        }
      }

      validProducts.push(rowToProduct(data));
    });

    onImport(validProducts);
    setImportedCount(validProducts.length);
    setStep("result");
  };

  const mappedCount = Object.values(mapping).filter(Boolean).length;
  const hasNameMapped = Object.values(mapping).includes("name");

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Importer des produits
          </DialogTitle>
        </DialogHeader>

        {/* Progress bar */}
        <div className="flex items-center gap-1 text-xs mb-2">
          {(["upload", "mapping", "preview", "result"] as ImportStep[]).map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              <span className={`px-2 py-1 rounded-full font-semibold transition-colors ${
                step === s ? "bg-primary text-primary-foreground" :
                (["upload", "mapping", "preview", "result"].indexOf(step) > i ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")
              }`}>
                {["Fichier", "Colonnes", "Aperçu", "Résultat"][i]}
              </span>
            </React.Fragment>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>

              {/* STEP: Upload */}
              {step === "upload" && (
                <div className="space-y-4 py-4">
                  <input ref={fileInputRef} type="file" accept=".csv,.tsv,.txt,.json" className="hidden" onChange={handleFileSelect} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-border rounded-xl py-16 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-primary/[0.02] transition-all group"
                  >
                    <div className="p-4 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-foreground">Glissez un fichier ici ou cliquez pour parcourir</p>
                      <p className="text-sm text-muted-foreground mt-1">CSV, TSV ou JSON • Encodage UTF-8 recommandé</p>
                    </div>
                  </button>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Settings2 className="h-3.5 w-3.5" /> Format attendu
                    </p>
                    <p className="text-xs text-muted-foreground">
                      La première ligne doit contenir les en-têtes. Colonnes reconnues automatiquement :
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {PRODUCT_COLUMNS.map(c => (
                        <span key={c.key} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          c.required ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}>
                          {c.label}{c.required ? " *" : ""}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      💡 Codes-barres multiples : séparez-les par | (ex: 6131234|6135678)
                    </p>
                  </div>
                </div>
              )}

              {/* STEP: Mapping */}
              {step === "mapping" && (
                <div className="space-y-4 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{headers.length} colonnes détectées • {dataRows.length} lignes</p>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={hasHeaderRow} onCheckedChange={(v) => setHasHeaderRow(!!v)} />
                      Première ligne = en-têtes
                    </label>
                  </div>

                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {headers.map((h, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors">
                        <span className="text-xs font-mono text-muted-foreground w-6 text-right">{i + 1}</span>
                        <span className="text-sm font-medium w-36 truncate" title={h}>{h}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <Select value={mapping[i] || "_none"} onValueChange={(v) => setMapping(prev => ({ ...prev, [i]: v === "_none" ? "" : v as ColKey }))}>
                          <SelectTrigger className="w-48 h-8 text-xs">
                            <SelectValue placeholder="— Ignorer —" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">— Ignorer —</SelectItem>
                            {PRODUCT_COLUMNS.map(col => (
                              <SelectItem key={col.key} value={col.key} disabled={Object.values(mapping).includes(col.key) && mapping[i] !== col.key}>
                                {col.label}{col.required ? " *" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {mapping[i] && (
                          <Check className="h-4 w-4 text-success flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Preview of first 3 rows */}
                  {dataRows.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" /> Aperçu (3 premières lignes)
                      </p>
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-muted/50">
                              {headers.map((h, i) => mapping[i] ? (
                                <th key={i} className="px-2 py-1.5 text-left font-semibold text-primary">{PRODUCT_COLUMNS.find(c => c.key === mapping[i])?.label}</th>
                              ) : (
                                <th key={i} className="px-2 py-1.5 text-left font-normal text-muted-foreground/50 line-through">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {dataRows.slice(0, 3).map((row, ri) => (
                              <tr key={ri} className="border-t border-border">
                                {row.map((cell, ci) => (
                                  <td key={ci} className={`px-2 py-1.5 truncate max-w-[120px] ${!mapping[ci] ? "text-muted-foreground/30" : ""}`}>{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="bg-muted/50 rounded-lg px-3 py-2 text-xs text-muted-foreground">
                    {mappedCount} colonnes mappées
                    {!hasNameMapped && (
                      <span className="text-accent font-semibold ml-2">⚠ La colonne "Nom" est obligatoire</span>
                    )}
                  </div>
                </div>
              )}

              {/* STEP: Preview */}
              {step === "preview" && (
                <div className="space-y-4 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{dataRows.length} lignes à importer</p>
                    {errors.length > 0 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent font-semibold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> {errors.length} erreur(s) — ces lignes seront ignorées
                      </span>
                    )}
                  </div>

                  {/* Duplicate handling */}
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Ignorer les doublons</Label>
                      <Switch checked={skipDuplicates} onCheckedChange={setSkipDuplicates} />
                    </div>
                    {skipDuplicates && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Comparer par :</Label>
                        <Select value={duplicateField} onValueChange={(v) => setDuplicateField(v as typeof duplicateField)}>
                          <SelectTrigger className="w-40 h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="barcodes">Code-barres</SelectItem>
                            <SelectItem value="name">Nom du produit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Data preview table */}
                  <div className="overflow-x-auto rounded-lg border border-border max-h-52">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-muted">
                        <tr>
                          <th className="px-2 py-1.5 text-left w-8">#</th>
                          {Object.entries(mapping).filter(([, v]) => v).map(([idx, colKey]) => (
                            <th key={idx} className="px-2 py-1.5 text-left font-semibold">
                              {PRODUCT_COLUMNS.find(c => c.key === colKey)?.label}
                            </th>
                          ))}
                          <th className="px-2 py-1.5 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {mappedProducts.slice(0, 50).map(({ data, index }) => {
                          const rowErrors = validationResults.filter(e => e.row === index);
                          return (
                            <tr key={index} className={`border-t border-border ${rowErrors.length > 0 ? "bg-accent/5" : ""}`}>
                              <td className="px-2 py-1.5 text-muted-foreground">{index}</td>
                              {Object.entries(mapping).filter(([, v]) => v).map(([idx, colKey]) => (
                                <td key={idx} className="px-2 py-1.5 truncate max-w-[120px]">{data[colKey!] || "—"}</td>
                              ))}
                              <td className="px-2 py-1.5">
                                {rowErrors.length > 0 && <AlertTriangle className="h-3.5 w-3.5 text-accent" />}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {dataRows.length > 50 && (
                    <p className="text-[10px] text-muted-foreground text-center">… et {dataRows.length - 50} lignes supplémentaires</p>
                  )}
                </div>
              )}

              {/* STEP: Result */}
              {step === "result" && (
                <div className="flex flex-col items-center gap-4 py-10">
                  <div className="p-4 rounded-full bg-success/10">
                    <Check className="h-10 w-10 text-success" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-foreground">{importedCount} produit(s) importé(s)</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {dataRows.length - importedCount > 0 && `${dataRows.length - importedCount} ligne(s) ignorée(s) (erreurs ou doublons)`}
                    </p>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        <DialogFooter className="gap-2">
          {step === "upload" && (
            <Button variant="outline" onClick={() => { reset(); onClose(); }}>Annuler</Button>
          )}
          {step === "mapping" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Retour
              </Button>
              <Button onClick={handleGoToPreview} disabled={!hasNameMapped}>
                Aperçu <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("mapping")}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Colonnes
              </Button>
              <Button onClick={handleImport} className="gap-2">
                <Upload className="h-4 w-4" /> Importer {dataRows.length - validationResults.length} produit(s)
              </Button>
            </>
          )}
          {step === "result" && (
            <Button onClick={() => { reset(); onClose(); }}>Fermer</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
