import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, ShoppingCart, TrendingUp, Receipt,
  BarChart3, X, FileText, Package, Banknote, Users, Truck,
  ArrowRight
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type Period = "daily" | "weekly" | "monthly" | "yearly";

const periodLabels: Record<Period, string> = {
  daily: "Journalier",
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
  yearly: "Annuel",
};

const mockData: Record<Period, { label: string; sales: number; profit: number }[]> = {
  daily: [
    { label: "08h", sales: 4200, profit: 1260 }, { label: "09h", sales: 8500, profit: 2550 },
    { label: "10h", sales: 12300, profit: 3690 }, { label: "11h", sales: 15800, profit: 4740 },
    { label: "12h", sales: 22100, profit: 6630 }, { label: "13h", sales: 18400, profit: 5520 },
    { label: "14h", sales: 9800, profit: 2940 }, { label: "15h", sales: 11200, profit: 3360 },
    { label: "16h", sales: 14500, profit: 4350 }, { label: "17h", sales: 19300, profit: 5790 },
    { label: "18h", sales: 16700, profit: 5010 }, { label: "19h", sales: 8900, profit: 2670 },
  ],
  weekly: [
    { label: "Lun", sales: 45200, profit: 13560 }, { label: "Mar", sales: 38900, profit: 11670 },
    { label: "Mer", sales: 52100, profit: 15630 }, { label: "Jeu", sales: 41800, profit: 12540 },
    { label: "Ven", sales: 67300, profit: 20190 }, { label: "Sam", sales: 89400, profit: 26820 },
    { label: "Dim", sales: 34200, profit: 10260 },
  ],
  monthly: [
    { label: "S1", sales: 234000, profit: 70200 }, { label: "S2", sales: 289000, profit: 86700 },
    { label: "S3", sales: 312000, profit: 93600 }, { label: "S4", sales: 267000, profit: 80100 },
  ],
  yearly: [
    { label: "Jan", sales: 980000, profit: 294000 }, { label: "Fév", sales: 870000, profit: 261000 },
    { label: "Mar", sales: 1120000, profit: 336000 }, { label: "Avr", sales: 950000, profit: 285000 },
    { label: "Mai", sales: 1050000, profit: 315000 }, { label: "Jun", sales: 1180000, profit: 354000 },
    { label: "Jul", sales: 890000, profit: 267000 }, { label: "Aoû", sales: 760000, profit: 228000 },
    { label: "Sep", sales: 1020000, profit: 306000 }, { label: "Oct", sales: 1150000, profit: 345000 },
    { label: "Nov", sales: 1080000, profit: 324000 }, { label: "Déc", sales: 1340000, profit: 402000 },
  ],
};

// Mock transactions for detailed reports
const mockTransactions = [
  { id: "T001", date: "2026-03-23 09:15", items: "Lait 1L x2, Pain x3", total: 350, cashier: "Ahmed", method: "Espèces" },
  { id: "T002", date: "2026-03-23 09:32", items: "Eau 1.5L x6, Sucre 1kg", total: 250, cashier: "Ahmed", method: "Carte" },
  { id: "T003", date: "2026-03-23 10:05", items: "Fromage 0.5kg", total: 400, cashier: "Seddik", method: "Espèces" },
  { id: "T004", date: "2026-03-23 10:22", items: "Pommes 2kg, Bananes 1kg", total: 850, cashier: "Ahmed", method: "Espèces" },
  { id: "T005", date: "2026-03-23 11:10", items: "Olives 0.3kg, Pain x2", total: 250, cashier: "Seddik", method: "Carte" },
  { id: "T006", date: "2026-03-23 12:01", items: "Lait 1L x6 (Pack)", total: 550, cashier: "Ahmed", method: "Espèces" },
];

const mockTopProducts = [
  { name: "Lait 1L", qty: 245, revenue: 24500, margin: 20 },
  { name: "Pain", qty: 380, revenue: 19000, margin: 30 },
  { name: "Eau 1.5L", qty: 420, revenue: 10500, margin: 28 },
  { name: "Sucre 1kg", qty: 85, revenue: 8500, margin: 15 },
  { name: "Fromage", qty: 32, revenue: 25600, margin: 25 },
];

const mockSlowProducts = [
  { name: "Olives", qty: 5, revenue: 2500, lastSold: "2026-03-21" },
  { name: "Bananes", qty: 8, revenue: 2800, lastSold: "2026-03-22" },
];

interface ReportCardDef {
  id: string;
  title: string;
  description: string;
  icon: typeof FileText;
  color: string;
}

const reportCards: ReportCardDef[] = [
  { id: "sales_detail", title: "Détails des ventes", description: "Ventes par période avec marges", icon: BarChart3, color: "text-primary" },
  { id: "transactions", title: "Toutes les transactions", description: "Chaque vente avec articles, caissier et mode de paiement", icon: Receipt, color: "text-info" },
  { id: "top_products", title: "Produits les plus vendus", description: "Classement par quantité et chiffre d'affaires", icon: TrendingUp, color: "text-success" },
  { id: "slow_products", title: "Produits les moins vendus", description: "Articles à faible rotation", icon: Package, color: "text-warning" },
  { id: "margins", title: "Marges par produit", description: "Analyse des marges bénéficiaires", icon: DollarSign, color: "text-primary" },
  { id: "cash_report", title: "Rapport de caisse", description: "Mouvements d'espèces et soldes", icon: Banknote, color: "text-accent" },
  { id: "supplier_report", title: "Rapport fournisseurs", description: "Achats par fournisseur et période", icon: Truck, color: "text-info" },
];

const anim = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.05, duration: 0.3 },
});

const fmt = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toFixed(0);

const Reports = () => {
  const [period, setPeriod] = useState<Period>("daily");
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const data = mockData[period];

  const totalSales = data.reduce((s, d) => s + d.sales, 0);
  const totalProfit = data.reduce((s, d) => s + d.profit, 0);
  const transactions = Math.round(totalSales / 450);
  const avgTicket = totalSales / transactions;

  const stats = [
    { label: "Ventes totales", value: `${fmt(totalSales)} DA`, icon: DollarSign, color: "text-success" },
    { label: "Bénéfice", value: `${fmt(totalProfit)} DA`, icon: TrendingUp, color: "text-info" },
    { label: "Transactions", value: transactions.toString(), icon: ShoppingCart, color: "text-primary" },
    { label: "Ticket moyen", value: `${avgTicket.toFixed(0)} DA`, icon: Receipt, color: "text-warning" },
  ];

  const renderReportContent = (id: string) => {
    switch (id) {
      case "sales_detail":
        return (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-foreground">Période</th>
                <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-foreground">Ventes</th>
                <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-foreground">Bénéfice</th>
                <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-foreground">Marge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((d, i) => (
                <tr key={d.label} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-4 py-2.5 font-medium text-foreground">{d.label}</td>
                  <td className="px-4 py-2.5 text-right text-foreground">{d.sales.toLocaleString()} DA</td>
                  <td className="px-4 py-2.5 text-right text-success font-medium">{d.profit.toLocaleString()} DA</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{((d.profit / d.sales) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-primary text-primary-foreground font-bold">
                <td className="px-4 py-2.5">Total</td>
                <td className="px-4 py-2.5 text-right">{totalSales.toLocaleString()} DA</td>
                <td className="px-4 py-2.5 text-right">{totalProfit.toLocaleString()} DA</td>
                <td className="px-4 py-2.5 text-right">{((totalProfit / totalSales) * 100).toFixed(1)}%</td>
              </tr>
            </tfoot>
          </table>
        );

      case "transactions":
        return (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase">Réf</th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase">Date</th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase">Articles</th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase">Caissier</th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase">Paiement</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockTransactions.map((t, i) => (
                <tr key={t.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{t.id}</td>
                  <td className="px-3 py-2 text-muted-foreground">{t.date}</td>
                  <td className="px-3 py-2 text-foreground">{t.items}</td>
                  <td className="px-3 py-2 text-foreground">{t.cashier}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${t.method === "Espèces" ? "bg-success/10 text-success" : "bg-info/10 text-info"}`}>
                      {t.method}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-foreground">{t.total.toLocaleString()} DA</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "top_products":
        return (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase">#</th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase">Produit</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase">Qté vendue</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase">CA</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase">Marge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockTopProducts.map((p, i) => (
                <tr key={p.name} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-3 py-2 font-bold text-primary">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-foreground">{p.name}</td>
                  <td className="px-3 py-2 text-right text-foreground">{p.qty}</td>
                  <td className="px-3 py-2 text-right font-semibold text-foreground">{p.revenue.toLocaleString()} DA</td>
                  <td className="px-3 py-2 text-right text-success">{p.margin}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "slow_products":
        return (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase">Produit</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase">Qté vendue</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase">CA</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase">Dernière vente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockSlowProducts.map((p, i) => (
                <tr key={p.name} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-3 py-2 font-medium text-foreground">{p.name}</td>
                  <td className="px-3 py-2 text-right text-warning font-semibold">{p.qty}</td>
                  <td className="px-3 py-2 text-right text-foreground">{p.revenue.toLocaleString()} DA</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{p.lastSold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "margins":
        return (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase">Produit</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase">Coût</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase">Prix</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase">Marge</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase">Profit total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockTopProducts.map((p, i) => {
                const cost = p.revenue * (1 - p.margin / 100);
                return (
                  <tr key={p.name} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                    <td className="px-3 py-2 font-medium text-foreground">{p.name}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{Math.round(cost / p.qty)} DA</td>
                    <td className="px-3 py-2 text-right text-foreground">{Math.round(p.revenue / p.qty)} DA</td>
                    <td className="px-3 py-2 text-right">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${p.margin >= 20 ? "bg-success/10 text-success" : p.margin >= 10 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>
                        {p.margin}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-success">{Math.round(p.revenue * p.margin / 100).toLocaleString()} DA</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );

      default:
        return (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">Données bientôt disponibles</p>
          </div>
        );
    }
  };

  const activeReportDef = reportCards.find((r) => r.id === activeReport);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Rapports</h2>
          <p className="text-sm text-muted-foreground">Analyse des ventes et bénéfices</p>
        </div>
        <div className="flex gap-1">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-xs font-bold uppercase transition-colors border ${period === p ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}>
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} {...anim(i)} className="pos-stat-card flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-bold mt-1 text-foreground">{s.value}</p>
            </div>
            <div className={`p-2.5 rounded-lg bg-muted ${s.color}`}><s.icon className="h-5 w-5" /></div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...anim(4)} className="pos-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Ventes — {periodLabels[period]}</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="salesGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(24, 85%, 48%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(24, 85%, 48%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 13%, 87%)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(30, 9%, 46%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(30, 9%, 46%)" tickFormatter={fmt} />
              <Tooltip formatter={(v: number) => `${v.toLocaleString()} DA`} />
              <Area type="monotone" dataKey="sales" stroke="hsl(24, 85%, 48%)" fill="url(#salesGrad2)" strokeWidth={2} name="Ventes" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div {...anim(5)} className="pos-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-success" />
            <h3 className="font-semibold text-foreground">Bénéfice — {periodLabels[period]}</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 13%, 87%)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(30, 9%, 46%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(30, 9%, 46%)" tickFormatter={fmt} />
              <Tooltip formatter={(v: number) => `${v.toLocaleString()} DA`} />
              <Bar dataKey="profit" fill="hsl(142, 71%, 35%)" radius={[2, 2, 0, 0]} name="Bénéfice" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Report Catalog */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-3">Catalogue de rapports</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {reportCards.map((card, i) => (
            <motion.button
              key={card.id}
              {...anim(6 + i)}
              onClick={() => setActiveReport(card.id)}
              className="pos-card p-4 text-left hover:bg-muted/50 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg bg-muted ${card.color}`}>
                  <card.icon className="h-4 w-4" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h4 className="font-semibold text-foreground text-sm mt-3">{card.title}</h4>
              <p className="text-[11px] text-muted-foreground mt-1">{card.description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Report Dialog */}
      <Dialog open={!!activeReport} onOpenChange={(open) => !open && setActiveReport(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2">
              {activeReportDef && (
                <>
                  <div className={`p-1.5 rounded-lg bg-muted ${activeReportDef.color}`}>
                    <activeReportDef.icon className="h-4 w-4" />
                  </div>
                  {activeReportDef.title} — {periodLabels[period]}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <div className="p-0">
              {activeReport && renderReportContent(activeReport)}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports;
