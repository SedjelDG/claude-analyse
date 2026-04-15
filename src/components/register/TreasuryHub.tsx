import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, PiggyBank, ArrowDownCircle, ArrowUpCircle, DoorOpen,
  FileText, Users, TrendingUp, TrendingDown, Minus, Plus
} from "lucide-react";
import { useCashRegister, CashMovement } from "@/hooks/useCashRegister";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TreasuryHubProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: "cash" | "zreport" | "shift";
  userId: string;
  userName: string;
}

const PRESETS = [
  { label: "Fond de caisse", amount: 5000 },
  { label: "Dépôt banque", amount: 10000 },
  { label: "Petite caisse", amount: 2000 },
  { label: "Fournisseur", amount: 0 },
];

const TreasuryHub = ({ open, onClose, defaultTab = "cash", userId, userName }: TreasuryHubProps) => {
  const [tab, setTab] = useState(defaultTab);
  const { movements, balance, addMovement, clearMovements } = useCashRegister();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [countedCash, setCountedCash] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTab(defaultTab);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, defaultTab]);

  const handleSubmit = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    addMovement({ type: mode, amount: val, note: note || (mode === "add" ? "Entrée caisse" : "Sortie caisse"), userId, userName });
    setAmount("");
    setNote("");
  };

  const handlePreset = (preset: typeof PRESETS[0]) => {
    if (preset.amount > 0) {
      setAmount(String(preset.amount));
      setNote(preset.label);
    } else {
      setNote(preset.label);
    }
    inputRef.current?.focus();
  };

  // Z-Report calculations
  const today = new Date().toISOString().slice(0, 10);
  const todayMovements = movements.filter((m) => m.timestamp.slice(0, 10) === today);
  const totalSales = todayMovements.filter((m) => m.type === "sale").reduce((s, m) => s + m.amount, 0);
  const totalReturns = todayMovements.filter((m) => m.type === "return").reduce((s, m) => s + m.amount, 0);
  const totalCashIn = todayMovements.filter((m) => m.type === "add").reduce((s, m) => s + m.amount, 0);
  const totalCashOut = todayMovements.filter((m) => m.type === "remove").reduce((s, m) => s + m.amount, 0);
  const saleCount = todayMovements.filter((m) => m.type === "sale").length;

  const countedVal = parseFloat(countedCash) || 0;
  const gap = countedVal - balance;

  // Shift: per-user breakdown
  const userMap = new Map<string, { name: string; sales: number; cashIn: number; cashOut: number; returns: number; count: number }>();
  todayMovements.forEach((m) => {
    const entry = userMap.get(m.userId) || { name: m.userName, sales: 0, cashIn: 0, cashOut: 0, returns: 0, count: 0 };
    if (m.type === "sale") { entry.sales += m.amount; entry.count++; }
    if (m.type === "return") entry.returns += m.amount;
    if (m.type === "add") entry.cashIn += m.amount;
    if (m.type === "remove") entry.cashOut += m.amount;
    userMap.set(m.userId, entry);
  });

  if (!open) return null;

  const tabs = [
    { id: "cash" as const, label: "Caisse", icon: PiggyBank },
    { id: "zreport" as const, label: "Rapport Z", icon: FileText },
    { id: "shift" as const, label: "Équipe", icon: Users },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="bg-card border border-border rounded-lg shadow-2xl w-[600px] max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/50">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Pilotage Trésorerie</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-primary">{balance.toFixed(2)} DA</span>
              <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                  tab === t.id ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 p-5">
            {tab === "cash" && (
              <div className="space-y-4">
                {/* Mode toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode("add")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-sm font-bold transition-all ${
                      mode === "add" ? "bg-emerald-500 text-white shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <ArrowDownCircle className="h-4 w-4" /> Entrée
                  </button>
                  <button
                    onClick={() => setMode("remove")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-sm font-bold transition-all ${
                      mode === "remove" ? "bg-red-500 text-white shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <ArrowUpCircle className="h-4 w-4" /> Sortie
                  </button>
                </div>

                {/* Presets */}
                <div className="grid grid-cols-4 gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => handlePreset(p)}
                      className="px-2 py-2 text-[10px] font-bold uppercase bg-muted rounded hover:bg-muted/80 text-foreground transition-colors truncate"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Amount + Note */}
                <div className="space-y-2">
                  <input
                    ref={inputRef}
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="Montant (DA)"
                    className="w-full px-4 py-3 text-lg font-bold border border-input bg-background text-foreground rounded-md outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="Motif (optionnel)"
                    className="w-full px-3 py-2 text-sm border border-input bg-background text-foreground rounded-md outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSubmit}
                    className={`flex-1 py-3 rounded-md text-sm font-bold text-white transition-all active:scale-95 ${
                      mode === "add" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    Confirmer {mode === "add" ? "l'entrée" : "la sortie"}
                  </button>
                  <button
                    onClick={() => {
                      // Simulate drawer open pulse
                      const audio = new Audio();
                      audio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";
                      audio.play().catch(() => {});
                    }}
                    className="px-4 py-3 rounded-md bg-purple-500 text-white font-bold text-sm hover:bg-purple-600 transition-all active:scale-95"
                    title="Ouvrir le tiroir"
                  >
                    <DoorOpen className="h-5 w-5" />
                  </button>
                </div>

                {/* Recent movements */}
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Mouvements récents</p>
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {todayMovements.slice(-10).reverse().map((m) => (
                      <div key={m.id} className="flex items-center justify-between px-2 py-1.5 bg-muted/50 rounded text-xs">
                        <div className="flex items-center gap-2">
                          {(m.type === "add" || m.type === "sale") ? (
                            <Plus className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Minus className="h-3 w-3 text-red-500" />
                          )}
                          <span className="font-medium text-foreground">{m.note}</span>
                        </div>
                        <span className={`font-bold ${(m.type === "add" || m.type === "sale") ? "text-emerald-600" : "text-red-500"}`}>
                          {(m.type === "add" || m.type === "sale") ? "+" : "-"}{m.amount.toFixed(2)} DA
                        </span>
                      </div>
                    ))}
                    {todayMovements.length === 0 && (
                      <p className="text-center text-muted-foreground text-xs py-4">Aucun mouvement aujourd'hui</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {tab === "zreport" && (
              <div className="space-y-4">
                <div className="text-center border-b border-border pb-3">
                  <p className="text-lg font-black text-foreground">RAPPORT Z — JOURNALIER</p>
                  <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 text-center">
                    <TrendingUp className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                    <p className="text-xs text-emerald-700 font-bold uppercase">Ventes</p>
                    <p className="text-xl font-black text-emerald-700">{totalSales.toFixed(2)} DA</p>
                    <p className="text-[10px] text-emerald-600">{saleCount} transaction(s)</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 text-center">
                    <TrendingDown className="h-5 w-5 text-red-600 mx-auto mb-1" />
                    <p className="text-xs text-red-700 font-bold uppercase">Retours</p>
                    <p className="text-xl font-black text-red-700">{totalReturns.toFixed(2)} DA</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-center">
                    <ArrowDownCircle className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs text-blue-700 font-bold uppercase">Entrées</p>
                    <p className="text-xl font-black text-blue-700">{totalCashIn.toFixed(2)} DA</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-center">
                    <ArrowUpCircle className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                    <p className="text-xs text-orange-700 font-bold uppercase">Sorties</p>
                    <p className="text-xl font-black text-orange-700">{totalCashOut.toFixed(2)} DA</p>
                  </div>
                </div>

                <div className="bg-muted/50 border border-border rounded-md p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-foreground">Solde système (Attendu)</span>
                    <span className="font-bold text-foreground">{balance.toFixed(2)} DA</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-foreground">Total Compté (Physique)</span>
                    <input
                      type="number"
                      value={countedCash}
                      onChange={(e) => setCountedCash(e.target.value)}
                      placeholder="0.00"
                      className="w-[140px] px-3 py-1.5 text-right font-black text-lg border border-input rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  <div className="flex justify-between text-sm border-t border-border pt-3">
                    <span className="font-bold text-foreground">Écart de caisse</span>
                    <span className={`font-black text-lg ${Math.abs(gap) < 0.01 ? "text-emerald-600" : gap > 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {gap > 0.01 ? "+" : ""}{gap.toFixed(2)} DA
                    </span>
                  </div>
                </div>
              </div>
            )}

            {tab === "shift" && (
              <div className="space-y-4">
                <p className="text-xs font-bold text-muted-foreground uppercase">Résumé par caissier — {today}</p>
                {Array.from(userMap.entries()).map(([uid, data]) => (
                  <div key={uid} className="bg-muted/50 border border-border rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-foreground">{data.name}</span>
                      <span className="text-xs text-muted-foreground">{data.count} vente(s)</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                      <div>
                        <p className="text-muted-foreground">Ventes</p>
                        <p className="font-bold text-emerald-600">{data.sales.toFixed(0)} DA</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Retours</p>
                        <p className="font-bold text-red-500">{data.returns.toFixed(0)} DA</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Entrées</p>
                        <p className="font-bold text-blue-600">{data.cashIn.toFixed(0)} DA</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Sorties</p>
                        <p className="font-bold text-orange-600">{data.cashOut.toFixed(0)} DA</p>
                      </div>
                    </div>
                  </div>
                ))}
                {userMap.size === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">Aucune activité aujourd'hui</p>
                )}
              </div>
            )}
          </ScrollArea>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TreasuryHub;
