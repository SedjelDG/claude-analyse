import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, ShoppingCart, Package, DollarSign,
  Users, AlertTriangle, BarChart3, ArrowUpRight, Calendar
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

const salesData = [
  { name: "Lun", ventes: 45200 }, { name: "Mar", ventes: 38900 },
  { name: "Mer", ventes: 52100 }, { name: "Jeu", ventes: 41800 },
  { name: "Ven", ventes: 67300 }, { name: "Sam", ventes: 89400 },
  { name: "Dim", ventes: 34200 },
];

const categoryData = [
  { name: "Alimentation", value: 45, color: "hsl(222, 62%, 18%)" },
  { name: "Boissons", value: 25, color: "hsl(0, 78%, 45%)" },
  { name: "Hygiène", value: 15, color: "hsl(217, 91%, 50%)" },
  { name: "Autres", value: 15, color: "hsl(38, 92%, 50%)" },
];

const topProducts = [
  { name: "Lait 1L", qty: 342, revenue: "34,200 DA" },
  { name: "Pain", qty: 289, revenue: "14,450 DA" },
  { name: "Eau 1.5L", qty: 256, revenue: "6,400 DA" },
  { name: "Sucre 1kg", qty: 198, revenue: "19,800 DA" },
  { name: "Huile 1L", qty: 167, revenue: "41,750 DA" },
];

const lowStockItems = [
  { name: "Café 250g", stock: 3, min: 10 },
  { name: "Farine 1kg", stock: 5, min: 15 },
  { name: "Sel 1kg", stock: 2, min: 10 },
  { name: "Beurre 200g", stock: 4, min: 8 },
];

const expiringItems = [
  { name: "Fromage", date: "2026-03-30", daysLeft: 7, quantity: 8 },
  { name: "Lait 1L", date: "2026-04-01", daysLeft: 9, quantity: 25 },
  { name: "Sucre 1kg", date: "2026-04-10", daysLeft: 18, quantity: 3 },
];

const stats = [
  { label: "Ventes du jour", value: "89,400 DA", change: "+12.5%", up: true, icon: DollarSign, color: "text-success" },
  { label: "Transactions", value: "147", change: "+8.2%", up: true, icon: ShoppingCart, color: "text-info" },
  { label: "Produits actifs", value: "1,284", change: "+3", up: true, icon: Package, color: "text-primary" },
  { label: "Stock faible", value: "12", change: "-2", up: false, icon: AlertTriangle, color: "text-warning" },
];

const anim = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.05, duration: 0.3 },
});

const Dashboard = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-foreground">Tableau de bord</h2>
      <p className="text-sm text-muted-foreground">Vue d'ensemble de votre activité</p>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <motion.div key={s.label} {...anim(i)} className="pos-stat-card flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</p>
            <p className="text-2xl font-bold mt-1 text-foreground">{s.value}</p>
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${s.up ? "text-success" : "text-accent"}`}>
              {s.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {s.change}
            </div>
          </div>
          <div className={`p-2.5 rounded-lg bg-muted ${s.color}`}>
            <s.icon className="h-5 w-5" />
          </div>
        </motion.div>
      ))}
    </div>

    {/* Charts row */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <motion.div {...anim(4)} className="pos-card p-4 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Ventes de la semaine
          </h3>
          <span className="text-xs text-muted-foreground">DA</span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={salesData}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(222, 62%, 18%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(222, 62%, 18%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 87%)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
            <Tooltip />
            <Area type="monotone" dataKey="ventes" stroke="hsl(222, 62%, 18%)" fill="url(#salesGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div {...anim(5)} className="pos-card p-4">
        <h3 className="font-semibold text-foreground mb-4">Par catégorie</h3>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" stroke="none">
              {categoryData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-1.5 mt-2">
          {categoryData.map((c) => (
            <div key={c.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-muted-foreground">{c.name}</span>
              </div>
              <span className="font-medium text-foreground">{c.value}%</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>

    {/* Bottom row */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Top products */}
      <motion.div {...anim(6)} className="pos-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Produits les plus vendus</h3>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="divide-y divide-border">
          {topProducts.map((p, i) => (
            <div key={p.name} className="px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-foreground">{p.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-foreground">{p.revenue}</span>
                <span className="text-xs text-muted-foreground ml-2">({p.qty})</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Low stock */}
      <motion.div {...anim(7)} className="pos-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" /> Alertes de stock
          </h3>
        </div>
        <div className="divide-y divide-border">
          {lowStockItems.map((item) => (
            <div key={item.name} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">Min: {item.min} unités</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-accent">{item.stock}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">Critique</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Expiring items */}
      <motion.div {...anim(8)} className="pos-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4 text-warning" /> Expirations proches
          </h3>
        </div>
        <div className="divide-y divide-border">
          {expiringItems.map((item) => (
            <div key={item.name} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.date} — {item.quantity} unités</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                item.daysLeft <= 7 ? "bg-accent/10 text-accent" : "bg-warning/10 text-warning"
              }`}>
                {item.daysLeft}j
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  </div>
);

export default Dashboard;
