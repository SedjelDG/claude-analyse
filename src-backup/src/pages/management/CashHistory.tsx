import { useState } from "react";
import { motion } from "framer-motion";
import { Banknote, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Trash2 } from "lucide-react";
import { useCashRegister, CashMovement } from "@/hooks/useCashRegister";

const anim = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.05, duration: 0.3 },
});

const typeLabels: Record<CashMovement["type"], string> = {
  add: "Ajout",
  remove: "Retrait",
  sale: "Vente",
  return: "Retour",
};

const typeColors: Record<CashMovement["type"], string> = {
  add: "text-success",
  remove: "text-accent",
  sale: "text-info",
  return: "text-warning",
};

const CashHistory = () => {
  const { movements, balance, clearMovements } = useCashRegister();
  const [filter, setFilter] = useState<"all" | CashMovement["type"]>("all");

  const filtered = filter === "all" ? movements : movements.filter((m) => m.type === filter);

  const totalIn = movements.filter((m) => m.type === "add" || m.type === "sale").reduce((s, m) => s + m.amount, 0);
  const totalOut = movements.filter((m) => m.type === "remove" || m.type === "return").reduce((s, m) => s + m.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Caisse — Historique</h2>
        <p className="text-sm text-muted-foreground">Suivi des mouvements de caisse</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div {...anim(0)} className="pos-stat-card flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Solde actuel</p>
            <p className="text-2xl font-bold mt-1 text-foreground">{balance.toFixed(2)} DA</p>
          </div>
          <div className="p-2.5 rounded-lg bg-muted text-primary"><Banknote className="h-5 w-5" /></div>
        </motion.div>
        <motion.div {...anim(1)} className="pos-stat-card flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total entrées</p>
            <p className="text-2xl font-bold mt-1 text-success">{totalIn.toFixed(2)} DA</p>
          </div>
          <div className="p-2.5 rounded-lg bg-muted text-success"><TrendingUp className="h-5 w-5" /></div>
        </motion.div>
        <motion.div {...anim(2)} className="pos-stat-card flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total sorties</p>
            <p className="text-2xl font-bold mt-1 text-accent">{totalOut.toFixed(2)} DA</p>
          </div>
          <div className="p-2.5 rounded-lg bg-muted text-accent"><TrendingDown className="h-5 w-5" /></div>
        </motion.div>
      </div>

      {/* Filters + clear */}
      <motion.div {...anim(3)} className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["all", "add", "remove", "sale", "return"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-bold uppercase transition-colors border ${filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}>
              {f === "all" ? "Tout" : typeLabels[f]}
            </button>
          ))}
        </div>
        {movements.length > 0 && (
          <button onClick={clearMovements} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent/10 transition-colors border border-border">
            <Trash2 className="h-3 w-3" /> Effacer
          </button>
        )}
      </motion.div>

      {/* Movements table */}
      <motion.div {...anim(4)} className="pos-card">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-foreground">Mouvements ({filtered.length})</h3>
        </div>
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">Aucun mouvement</div>
        ) : (
          <div className="divide-y divide-border max-h-[500px] overflow-auto">
            {[...filtered].reverse().map((m) => (
              <div key={m.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded bg-muted ${typeColors[m.type]}`}>
                    {m.type === "add" || m.type === "sale" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{typeLabels[m.type]}</p>
                    <p className="text-xs text-muted-foreground">{m.note} — {m.userName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${m.type === "add" || m.type === "sale" ? "text-success" : "text-accent"}`}>
                    {m.type === "add" || m.type === "sale" ? "+" : "-"}{m.amount.toFixed(2)} DA
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(m.timestamp).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CashHistory;
