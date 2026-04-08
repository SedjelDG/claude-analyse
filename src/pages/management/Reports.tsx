import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, ShoppingCart, TrendingUp, Receipt,
  BarChart3, FileText, Package, Banknote, Truck,
  ArrowRight, CalendarIcon, Download, Printer,
  CreditCard, Coins, ChevronDown, ChevronRight, Filter
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useSalesHistory, Sale } from "@/hooks/useSalesHistory";
import { format, startOfDay, endOfDay, startOfWeek, startOfMonth, startOfYear, subDays, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";

type PaymentFilter = "all" | "cash" | "card";

const PROFIT_MARGIN = 0.30; // 30% assumed margin

const anim = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.05, duration: 0.3 },
});

const fmt = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toFixed(0);

const presets = [
  { label: "Aujourd'hui", fn: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: "Cette semaine", fn: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfDay(new Date()) }) },
  { label: "Ce mois", fn: () => ({ from: startOfMonth(new Date()), to: endOfDay(new Date()) }) },
  { label: "30 derniers jours", fn: () => ({ from: startOfDay(subDays(new Date(), 30)), to: endOfDay(new Date()) }) },
  { label: "Cette année", fn: () => ({ from: startOfYear(new Date()), to: endOfDay(new Date()) }) },
];

interface ReportCardDef {
  id: string;
  title: string;
  description: string;
  icon: typeof FileText;
  color: string;
}

const reportCards: ReportCardDef[] = [
  { id: "transactions", title: "Toutes les transactions", description: "Chaque vente avec articles, caissier et mode de paiement", icon: Receipt, color: "text-info" },
  { id: "top_products", title: "Produits les plus vendus", description: "Classement par quantité et chiffre d'affaires", icon: TrendingUp, color: "text-success" },
  { id: "slow_products", title: "Produits les moins vendus", description: "Articles à faible rotation", icon: Package, color: "text-warning" },
  { id: "payment_breakdown", title: "Répartition paiements", description: "Espèces vs Carte — volume et montants", icon: CreditCard, color: "text-primary" },
  { id: "cash_report", title: "Rapport de caisse", description: "Mouvements d'espèces et soldes", icon: Banknote, color: "text-accent" },
  { id: "supplier_report", title: "Rapport fournisseurs", description: "Achats par fournisseur et période", icon: Truck, color: "text-info" },
];

const PIE_COLORS = ["hsl(24, 85%, 48%)", "hsl(172, 66%, 40%)"];

function groupSalesByTime(sales: Sale[], from: Date, to: Date) {
  const diffDays = (to.getTime() - from.getTime()) / 86400000;
  
  if (diffDays <= 1) {
    // Group by hour
    const buckets: Record<string, { sales: number; profit: number }> = {};
    for (let h = 0; h < 24; h++) {
      const key = `${h.toString().padStart(2, "0")}h`;
      buckets[key] = { sales: 0, profit: 0 };
    }
    sales.forEach(s => {
      const h = new Date(s.timestamp).getHours();
      const key = `${h.toString().padStart(2, "0")}h`;
      buckets[key].sales += s.total;
      buckets[key].profit += s.total * PROFIT_MARGIN;
    });
    return Object.entries(buckets)
      .filter(([_, v]) => v.sales > 0)
      .map(([label, v]) => ({ label, sales: Math.round(v.sales), profit: Math.round(v.profit) }));
  }
  
  if (diffDays <= 7) {
    // Group by day
    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const buckets: Record<string, { sales: number; profit: number }> = {};
    sales.forEach(s => {
      const d = new Date(s.timestamp);
      const key = days[d.getDay()];
      if (!buckets[key]) buckets[key] = { sales: 0, profit: 0 };
      buckets[key].sales += s.total;
      buckets[key].profit += s.total * PROFIT_MARGIN;
    });
    return ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
      .filter(d => buckets[d])
      .map(label => ({ label, sales: Math.round(buckets[label].sales), profit: Math.round(buckets[label].profit) }));
  }
  
  if (diffDays <= 31) {
    // Group by week
    const buckets: { label: string; sales: number; profit: number }[] = [];
    let weekStart = new Date(from);
    let weekNum = 1;
    while (weekStart < to) {
      const weekEnd = new Date(Math.min(weekStart.getTime() + 7 * 86400000, to.getTime()));
      const weekSales = sales.filter(s => {
        const t = new Date(s.timestamp);
        return t >= weekStart && t < weekEnd;
      });
      const total = weekSales.reduce((sum, s) => sum + s.total, 0);
      buckets.push({ label: `S${weekNum}`, sales: Math.round(total), profit: Math.round(total * PROFIT_MARGIN) });
      weekStart = weekEnd;
      weekNum++;
    }
    return buckets;
  }
  
  // Group by month
  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const buckets: Record<string, { sales: number; profit: number }> = {};
  sales.forEach(s => {
    const d = new Date(s.timestamp);
    const key = months[d.getMonth()];
    if (!buckets[key]) buckets[key] = { sales: 0, profit: 0 };
    buckets[key].sales += s.total;
    buckets[key].profit += s.total * PROFIT_MARGIN;
  });
  return months
    .filter(m => buckets[m])
    .map(label => ({ label, sales: Math.round(buckets[label].sales), profit: Math.round(buckets[label].profit) }));
}

function getProductStats(sales: Sale[]) {
  const map: Record<string, { name: string; qty: number; revenue: number; lastSold: string }> = {};
  sales.forEach(s => {
    s.items.forEach(item => {
      if (!map[item.name]) map[item.name] = { name: item.name, qty: 0, revenue: 0, lastSold: s.timestamp };
      map[item.name].qty += item.quantity;
      map[item.name].revenue += item.quantity * item.price;
      if (s.timestamp > map[item.name].lastSold) map[item.name].lastSold = s.timestamp;
    });
  });
  return Object.values(map).sort((a, b) => b.qty - a.qty);
}

function exportToCSV(sales: Sale[], from: Date, to: Date) {
  const header = "Date,Référence,Articles,Caissier,Paiement,Sous-total,Remise %,Total\n";
  const rows = sales.map(s => {
    const items = s.items.map(i => `${i.name} x${i.quantity}`).join(" + ");
    return `${format(new Date(s.timestamp), "dd/MM/yyyy HH:mm")},${s.id},"${items}",${s.cashierName},${s.paymentMethod === "cash" ? "Espèces" : "Carte"},${s.subtotal},${s.discount},${s.total}`;
  }).join("\n");
  const csv = "\uFEFF" + header + rows;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rapport_ventes_${format(from, "dd-MM-yyyy")}_${format(to, "dd-MM-yyyy")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function printReport(filteredSales: Sale[], chartData: { label: string; sales: number; profit: number }[], totalSales: number, totalProfit: number, transactions: number, avgTicket: number, from: Date, to: Date) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  const salesRows = filteredSales.slice(0, 100).map(s => `
    <tr>
      <td style="padding:4px 8px;border-bottom:1px solid #eee;font-size:11px">${format(new Date(s.timestamp), "dd/MM/yyyy HH:mm")}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #eee;font-size:11px;font-family:monospace">${s.id.slice(-8)}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #eee;font-size:11px">${s.items.map(i => `${i.name} ×${i.quantity}`).join(", ")}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #eee;font-size:11px">${s.cashierName}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #eee;font-size:11px">${s.paymentMethod === "cash" ? "Espèces" : "Carte"}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #eee;font-size:11px;text-align:right;font-weight:600">${s.total.toLocaleString()} DA</td>
    </tr>
  `).join("");

  win.document.write(`<!DOCTYPE html><html><head><title>Rapport des ventes</title>
    <style>body{font-family:Arial,sans-serif;margin:30px;color:#333}
    h1{font-size:20px;margin-bottom:4px}
    .meta{color:#888;font-size:12px;margin-bottom:20px}
    .stats{display:flex;gap:20px;margin-bottom:24px}
    .stat{background:#f5f5f5;padding:12px 16px;border-radius:6px;flex:1}
    .stat-label{font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.5px}
    .stat-value{font-size:20px;font-weight:700;margin-top:4px}
    table{width:100%;border-collapse:collapse}
    th{text-align:left;padding:6px 8px;background:#f0f0f0;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #ddd}
    @media print{body{margin:10px}.stats{gap:10px}}
    </style></head><body>
    <h1>Rapport des Ventes</h1>
    <p class="meta">${format(from, "dd MMMM yyyy", { locale: fr })} — ${format(to, "dd MMMM yyyy", { locale: fr })}</p>
    <div class="stats">
      <div class="stat"><div class="stat-label">Ventes totales</div><div class="stat-value">${totalSales.toLocaleString()} DA</div></div>
      <div class="stat"><div class="stat-label">Bénéfice</div><div class="stat-value">${totalProfit.toLocaleString()} DA</div></div>
      <div class="stat"><div class="stat-label">Transactions</div><div class="stat-value">${transactions}</div></div>
      <div class="stat"><div class="stat-label">Ticket moyen</div><div class="stat-value">${avgTicket.toFixed(0)} DA</div></div>
    </div>
    <table><thead><tr>
      <th>Date</th><th>Réf</th><th>Articles</th><th>Caissier</th><th>Paiement</th><th style="text-align:right">Total</th>
    </tr></thead><tbody>${salesRows}</tbody></table>
    ${filteredSales.length > 100 ? `<p style="color:#888;font-size:11px;margin-top:8px">... et ${filteredSales.length - 100} autres transactions</p>` : ""}
    <script>setTimeout(()=>window.print(),300)<\/script>
    </body></html>`);
  win.document.close();
}

const Reports = () => {
  const { sales } = useSalesHistory();
  const [dateFrom, setDateFrom] = useState<Date>(startOfDay(subDays(new Date(), 13)));
  const [dateTo, setDateTo] = useState<Date>(endOfDay(new Date()));
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [expandedSale, setExpandedSale] = useState<string | null>(null);

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const t = new Date(s.timestamp);
      if (!isWithinInterval(t, { start: dateFrom, end: dateTo })) return false;
      if (paymentFilter !== "all" && s.paymentMethod !== paymentFilter) return false;
      return true;
    });
  }, [sales, dateFrom, dateTo, paymentFilter]);

  const chartData = useMemo(() => groupSalesByTime(filteredSales, dateFrom, dateTo), [filteredSales, dateFrom, dateTo]);
  const productStats = useMemo(() => getProductStats(filteredSales), [filteredSales]);

  const totalSales = filteredSales.reduce((s, d) => s + d.total, 0);
  const totalProfit = Math.round(totalSales * PROFIT_MARGIN);
  const transactionCount = filteredSales.length;
  const avgTicket = transactionCount > 0 ? totalSales / transactionCount : 0;

  const cashSales = filteredSales.filter(s => s.paymentMethod === "cash");
  const cardSales = filteredSales.filter(s => s.paymentMethod === "card");
  const cashTotal = cashSales.reduce((s, d) => s + d.total, 0);
  const cardTotal = cardSales.reduce((s, d) => s + d.total, 0);

  const pieData = [
    { name: "Espèces", value: cashTotal, count: cashSales.length },
    { name: "Carte", value: cardTotal, count: cardSales.length },
  ].filter(d => d.value > 0);

  const stats = [
    { label: "Ventes totales", value: `${fmt(totalSales)} DA`, icon: DollarSign, color: "text-success" },
    { label: "Bénéfice", value: `${fmt(totalProfit)} DA`, icon: TrendingUp, color: "text-info" },
    { label: "Transactions", value: transactionCount.toString(), icon: ShoppingCart, color: "text-primary" },
    { label: "Ticket moyen", value: `${avgTicket.toFixed(0)} DA`, icon: Receipt, color: "text-warning" },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    const range = preset.fn();
    setDateFrom(range.from);
    setDateTo(range.to);
  };

  const renderReportContent = (id: string) => {
    switch (id) {
      case "transactions":
        return (
          <div>
            <div className="px-4 py-2 bg-muted/50 border-b border-border text-xs text-muted-foreground">
              {filteredSales.length} transaction(s) — {format(dateFrom, "dd/MM/yyyy")} au {format(dateTo, "dd/MM/yyyy")}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase w-6"></th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase">Date</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase">Réf</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase">Articles</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase">Caissier</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase">Paiement</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSales.map((s, i) => (
                  <>
                    <tr
                      key={s.id}
                      className={`cursor-pointer hover:bg-muted/50 transition-colors ${i % 2 === 0 ? "bg-card" : "bg-muted/20"} ${s.fullyRefunded ? "opacity-50 line-through" : ""}`}
                      onClick={() => setExpandedSale(expandedSale === s.id ? null : s.id)}
                    >
                      <td className="px-3 py-2 text-muted-foreground">
                        {expandedSale === s.id ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{format(new Date(s.timestamp), "dd/MM HH:mm")}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{s.id.slice(-8)}</td>
                      <td className="px-3 py-2 text-foreground text-xs">{s.items.length} article(s)</td>
                      <td className="px-3 py-2 text-foreground text-xs">{s.cashierName}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${s.paymentMethod === "cash" ? "bg-success/10 text-success" : "bg-info/10 text-info"}`}>
                          {s.paymentMethod === "cash" ? "Espèces" : "Carte"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-foreground text-xs">{s.total.toLocaleString()} DA</td>
                    </tr>
                    {expandedSale === s.id && (
                      <tr key={`${s.id}-detail`}>
                        <td colSpan={7} className="bg-muted/30 px-6 py-3">
                          <div className="space-y-1">
                            {s.items.map(item => (
                              <div key={item.id} className="flex justify-between text-xs">
                                <span className={`text-foreground ${s.refundedItems?.includes(item.id) ? "line-through opacity-50" : ""}`}>
                                  {item.name} × {item.quantity}
                                </span>
                                <span className="text-muted-foreground font-mono">{(item.quantity * item.price).toLocaleString()} DA</span>
                              </div>
                            ))}
                            {s.discount > 0 && (
                              <div className="flex justify-between text-xs text-warning pt-1 border-t border-border">
                                <span>Remise ({s.discount}%)</span>
                                <span>-{Math.round(s.subtotal * s.discount / 100).toLocaleString()} DA</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
            {filteredSales.length === 0 && (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Aucune transaction pour cette période</div>
            )}
          </div>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {productStats.slice(0, 20).map((p, i) => (
                <tr key={p.name} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-3 py-2 font-bold text-primary">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-foreground">{p.name}</td>
                  <td className="px-3 py-2 text-right text-foreground">{p.qty}</td>
                  <td className="px-3 py-2 text-right font-semibold text-foreground">{p.revenue.toLocaleString()} DA</td>
                </tr>
              ))}
            </tbody>
            {productStats.length === 0 && (
              <tbody><tr><td colSpan={4} className="text-center py-12 text-muted-foreground text-sm">Aucune donnée</td></tr></tbody>
            )}
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
              {productStats.slice(-5).reverse().map((p, i) => (
                <tr key={p.name} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-3 py-2 font-medium text-foreground">{p.name}</td>
                  <td className="px-3 py-2 text-right text-warning font-semibold">{p.qty}</td>
                  <td className="px-3 py-2 text-right text-foreground">{p.revenue.toLocaleString()} DA</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{format(new Date(p.lastSold), "dd/MM/yyyy")}</td>
                </tr>
              ))}
            </tbody>
            {productStats.length === 0 && (
              <tbody><tr><td colSpan={4} className="text-center py-12 text-muted-foreground text-sm">Aucune donnée</td></tr></tbody>
            )}
          </table>
        );

      case "payment_breakdown":
        return (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v.toLocaleString()} DA`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4 flex flex-col justify-center">
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Coins className="h-4 w-4 text-[hsl(24,85%,48%)]" />
                    <span className="text-sm font-semibold text-foreground">Espèces</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{cashTotal.toLocaleString()} DA</p>
                  <p className="text-xs text-muted-foreground">{cashSales.length} transaction(s)</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="h-4 w-4 text-[hsl(172,66%,40%)]" />
                    <span className="text-sm font-semibold text-foreground">Carte</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{cardTotal.toLocaleString()} DA</p>
                  <p className="text-xs text-muted-foreground">{cardSales.length} transaction(s)</p>
                </div>
              </div>
            </div>
          </div>
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
      {/* Header with date range & actions */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Rapports</h2>
            <p className="text-sm text-muted-foreground">Analyse des ventes et bénéfices en temps réel</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportToCSV(filteredSales, dateFrom, dateTo)}>
              <Download className="h-3.5 w-3.5" /> Exporter CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => printReport(filteredSales, chartData, totalSales, totalProfit, transactionCount, avgTicket, dateFrom, dateTo)}>
              <Printer className="h-3.5 w-3.5" /> Imprimer
            </Button>
          </div>
        </div>

        {/* Filters toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          
          {/* Presets */}
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className="px-2.5 py-1 text-[11px] font-medium rounded border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {p.label}
            </button>
          ))}

          <div className="w-px h-6 bg-border mx-1" />

          {/* From date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
                <CalendarIcon className="h-3 w-3" />
                {format(dateFrom, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={(d) => d && setDateFrom(startOfDay(d))} initialFocus />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground">→</span>
          {/* To date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
                <CalendarIcon className="h-3 w-3" />
                {format(dateTo, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={(d) => d && setDateTo(endOfDay(d))} initialFocus />
            </PopoverContent>
          </Popover>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Payment filter */}
          {(["all", "cash", "card"] as PaymentFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setPaymentFilter(f)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors flex items-center gap-1 ${
                paymentFilter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {f === "all" && "Tout"}
              {f === "cash" && <><Coins className="h-3 w-3" /> Espèces</>}
              {f === "card" && <><CreditCard className="h-3 w-3" /> Carte</>}
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
            <h3 className="font-semibold text-foreground">Ventes</h3>
            <span className="text-xs text-muted-foreground ml-auto">{filteredSales.length} vente(s)</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
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
            <h3 className="font-semibold text-foreground">Bénéfice</h3>
            <span className="text-xs text-muted-foreground ml-auto">Marge {(PROFIT_MARGIN * 100).toFixed(0)}%</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
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
      <Dialog open={!!activeReport} onOpenChange={(open) => { if (!open) { setActiveReport(null); setExpandedSale(null); } }}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2">
              {activeReportDef && (
                <>
                  <div className={`p-1.5 rounded-lg bg-muted ${activeReportDef.color}`}>
                    <activeReportDef.icon className="h-4 w-4" />
                  </div>
                  {activeReportDef.title}
                  <span className="text-xs text-muted-foreground font-normal ml-2">
                    {format(dateFrom, "dd/MM/yyyy")} — {format(dateTo, "dd/MM/yyyy")}
                  </span>
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
