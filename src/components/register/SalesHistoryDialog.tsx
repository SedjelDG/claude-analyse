import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Calendar, Clock, Search, Printer, RotateCcw, ChevronDown, ChevronUp,
  CreditCard, Banknote, CheckSquare, Square, Filter, Receipt
} from "lucide-react";
import { Sale } from "@/hooks/useSalesHistory";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  open: boolean;
  onClose: () => void;
  sales: Sale[];
  refundSale: (id: string) => void;
  refundItems: (id: string, itemIds: string[]) => void;
}

const SalesHistoryDialog = ({ open, onClose, sales, refundSale, refundItems }: Props) => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [selectedRefundItems, setSelectedRefundItems] = useState<Record<string, string[]>>({});
  const [confirmRefund, setConfirmRefund] = useState<{ saleId: string; type: "full" | "partial" } | null>(null);

  const filtered = useMemo(() => {
    let result = sales;
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter((s) => new Date(s.timestamp) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((s) => new Date(s.timestamp) <= to);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.items.some((it) => it.name.toLowerCase().includes(q)) ||
          s.cashierName.toLowerCase().includes(q)
      );
    }
    return result;
  }, [sales, dateFrom, dateTo, searchQuery]);

  const totalRevenue = filtered.reduce((s, sale) => s + (sale.fullyRefunded ? 0 : sale.total), 0);
  const totalSales = filtered.length;

  const toggleItemSelection = (saleId: string, itemId: string) => {
    setSelectedRefundItems((prev) => {
      const current = prev[saleId] || [];
      const exists = current.includes(itemId);
      return { ...prev, [saleId]: exists ? current.filter((id) => id !== itemId) : [...current, itemId] };
    });
  };

  const handleRefundConfirm = () => {
    if (!confirmRefund) return;
    if (confirmRefund.type === "full") {
      refundSale(confirmRefund.saleId);
    } else {
      const items = selectedRefundItems[confirmRefund.saleId] || [];
      if (items.length > 0) refundItems(confirmRefund.saleId, items);
    }
    setConfirmRefund(null);
    setSelectedRefundItems((prev) => ({ ...prev, [confirmRefund.saleId]: [] }));
  };

  const handlePrint = (sale: Sale) => {
    const w = window.open("", "_blank", "width=400,height=600");
    if (!w) return;
    const itemsHtml = sale.items
      .map(
        (it) =>
          `<tr><td>${it.name}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">${(it.quantity * it.price).toFixed(2)}</td></tr>`
      )
      .join("");
    w.document.write(`<!DOCTYPE html><html><head><title>Ticket #${sale.id.slice(-6)}</title>
      <style>body{font-family:monospace;padding:20px;max-width:350px;margin:0 auto}
      table{width:100%;border-collapse:collapse}td,th{padding:4px 2px;font-size:12px}
      th{border-bottom:1px dashed #000;text-align:left}.total{border-top:1px dashed #000;font-weight:bold;font-size:14px}
      h2{text-align:center;margin:0 0 4px}p{margin:2px 0;font-size:11px;text-align:center}</style></head>
      <body><h2>DS Software</h2><p>Ticket #${sale.id.slice(-6)}</p>
      <p>${new Date(sale.timestamp).toLocaleString("fr-FR")}</p>
      <p>Caissier: ${sale.cashierName} | ${sale.clientName ? `Client: ${sale.clientName}` : `Client N°${sale.clientNumber}`}</p><hr/>
      <table><thead><tr><th>Article</th><th style="text-align:center">Qté</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${itemsHtml}</tbody></table><br/>
      <table><tr class="total"><td>TOTAL</td><td style="text-align:right">${sale.total.toFixed(2)} DA</td></tr>
      ${sale.discount > 0 ? `<tr><td>Remise</td><td style="text-align:right">${sale.discountType === 'percent' ? sale.discount + '%' : sale.discount.toFixed(2) + ' DA'}</td></tr>` : ""}
      <tr><td>Paiement</td><td style="text-align:right">${sale.paymentMethod === "cash" ? "Espèces" : "Carte"}</td></tr></table>
      <p style="margin-top:16px">Merci pour votre visite!</p>
      <script>window.print();setTimeout(()=>window.close(),1000)</script></body></html>`);
    w.document.close();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-card border border-register-border shadow-2xl w-[95vw] max-w-[1100px] h-[90vh] max-h-[800px] flex flex-col overflow-hidden rounded-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-register-border bg-primary text-primary-foreground">
            <div className="flex items-center gap-3">
              <Receipt className="h-5 w-5" />
              <h2 className="text-lg font-black uppercase tracking-wide">Historique des Ventes</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-xs">
                <span className="opacity-70">{totalSales} vente(s)</span>
                <span className="mx-2">•</span>
                <span className="font-bold">{totalRevenue.toFixed(2)} DA</span>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-5 py-3 border-b border-register-border bg-muted flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Du</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-xs px-2 py-1.5 border border-register-border bg-card rounded text-foreground"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Au</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-xs px-2 py-1.5 border border-register-border bg-card rounded text-foreground"
              />
            </div>
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher par article, ticket, caissier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-register-border bg-card rounded text-foreground placeholder:text-muted-foreground"
              />
            </div>
            {(dateFrom || dateTo || searchQuery) && (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); setSearchQuery(""); }}
                className="text-xs text-accent hover:underline font-bold"
              >
                Réinitialiser
              </button>
            )}
          </div>

          {/* Sales list */}
          <ScrollArea className="flex-1">
            <div className="divide-y divide-register-border">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Receipt className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Aucune vente trouvée</p>
                  <p className="text-xs mt-1">Essayez d'ajuster les filtres</p>
                </div>
              ) : (
                filtered.map((sale) => {
                  const isExpanded = expandedSaleId === sale.id;
                  const refunded = sale.fullyRefunded;
                  const saleSelectedItems = selectedRefundItems[sale.id] || [];

                  return (
                    <div key={sale.id} className={`${refunded ? "opacity-50" : ""}`}>
                      {/* Sale row */}
                      <div
                        className={`flex items-center gap-4 px-5 py-3 cursor-pointer transition-colors ${isExpanded ? "bg-primary/5" : "hover:bg-muted/50"
                          }`}
                        onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                      >
                        <div className="flex items-center gap-2 min-w-[140px]">
                          <div className={`p-1.5 rounded ${sale.paymentMethod === "cash" ? "bg-success/10 text-success" : "bg-info/10 text-info"}`}>
                            {sale.paymentMethod === "cash" ? <Banknote className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">#{sale.id.slice(-6)}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {sale.clientName || `Client N°${sale.clientNumber}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 min-w-[160px]">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(sale.timestamp).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                          </span>
                          <Clock className="h-3 w-3 text-muted-foreground ml-1" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(sale.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                        </div>

                        <div className="flex-1 text-xs text-muted-foreground truncate">
                          {sale.items.length} article(s) • {sale.cashierName}
                          {sale.discount > 0 && <span className="ml-1 text-accent font-bold">-{sale.discountType === 'percent' ? `${sale.discount}%` : `${sale.discount} DA`}</span>}
                        </div>

                        <div className="flex items-center gap-3">
                          {refunded && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-destructive/10 text-destructive rounded">
                              Remboursé
                            </span>
                          )}
                          <span className="text-sm font-bold font-digital text-foreground min-w-[90px] text-right">
                            {sale.total.toFixed(2)} DA
                          </span>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>

                      {/* Expanded detail */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-4 bg-muted/30">
                              {/* Items table */}
                              <table className="w-full text-xs mt-2">
                                <thead>
                                  <tr className="border-b border-register-border">
                                    <th className="text-left py-1.5 px-2 font-bold text-muted-foreground uppercase text-[10px] w-8"></th>
                                    <th className="text-left py-1.5 px-2 font-bold text-muted-foreground uppercase text-[10px]">Article</th>
                                    <th className="text-center py-1.5 px-2 font-bold text-muted-foreground uppercase text-[10px]">Qté</th>
                                    <th className="text-right py-1.5 px-2 font-bold text-muted-foreground uppercase text-[10px]">P.U.</th>
                                    <th className="text-right py-1.5 px-2 font-bold text-muted-foreground uppercase text-[10px]">Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sale.items.map((item) => {
                                    const isRefundedItem = sale.refundedItems?.includes(item.id);
                                    const isSelected = saleSelectedItems.includes(item.id);
                                    return (
                                      <tr
                                        key={item.id}
                                        className={`border-b border-register-border/50 ${isRefundedItem ? "opacity-40 line-through" : ""}`}
                                      >
                                        <td className="py-1.5 px-2">
                                          {!refunded && !isRefundedItem && (
                                            <button
                                              onClick={() => toggleItemSelection(sale.id, item.id)}
                                              className="text-muted-foreground hover:text-primary transition-colors"
                                            >
                                              {isSelected ? <CheckSquare className="h-3.5 w-3.5 text-primary" /> : <Square className="h-3.5 w-3.5" />}
                                            </button>
                                          )}
                                        </td>
                                        <td className="py-1.5 px-2 font-medium text-foreground">{item.name}</td>
                                        <td className="py-1.5 px-2 text-center text-muted-foreground">{item.quantity}</td>
                                        <td className="py-1.5 px-2 text-right text-muted-foreground font-digital">{item.price.toFixed(2)}</td>
                                        <td className="py-1.5 px-2 text-right font-bold text-foreground font-digital">{(item.quantity * item.price).toFixed(2)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>

                              {/* Summary row */}
                              <div className="flex items-center justify-between mt-3 pt-2 border-t border-register-border">
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>Sous-total: {sale.subtotal.toFixed(2)} DA</span>
                                  {sale.discount > 0 && <span className="text-accent">Remise: -{sale.discountType === 'percent' ? `${sale.discount}%` : `${sale.discount} DA`}</span>}
                                  <span className="font-bold text-foreground">Total: {sale.total.toFixed(2)} DA</span>
                                </div>
                              </div>

                              {/* Actions */}
                              {!refunded && (
                                <div className="flex items-center gap-2 mt-3">
                                  <button
                                    onClick={() => handlePrint(sale)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded"
                                  >
                                    <Printer className="h-3.5 w-3.5" /> Imprimer le ticket
                                  </button>
                                  <button
                                    onClick={() => setConfirmRefund({ saleId: sale.id, type: "full" })}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors rounded"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" /> Rembourser tout
                                  </button>
                                  {saleSelectedItems.length > 0 && (
                                    <button
                                      onClick={() => setConfirmRefund({ saleId: sale.id, type: "partial" })}
                                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-accent text-accent-foreground hover:bg-accent/90 transition-colors rounded"
                                    >
                                      <RotateCcw className="h-3.5 w-3.5" /> Rembourser sélection ({saleSelectedItems.length})
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="px-5 py-2.5 border-t border-register-border bg-muted flex items-center justify-between text-xs text-muted-foreground">
            <span>{filtered.length} vente(s) affichée(s)</span>
            <span className="font-bold text-foreground">Chiffre d'affaires: {totalRevenue.toFixed(2)} DA</span>
          </div>
        </motion.div>

        {/* Refund confirmation overlay */}
        <AnimatePresence>
          {confirmRefund && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
              onClick={() => setConfirmRefund(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-card border border-register-border p-6 rounded-lg shadow-xl max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-foreground mb-2">Confirmer le remboursement</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {confirmRefund.type === "full"
                    ? "Voulez-vous rembourser la totalité de cette vente ?"
                    : `Voulez-vous rembourser ${selectedRefundItems[confirmRefund.saleId]?.length || 0} article(s) sélectionné(s) ?`}
                </p>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => setConfirmRefund(null)}
                    className="px-4 py-2 text-sm font-bold text-muted-foreground border border-register-border rounded hover:bg-muted transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleRefundConfirm}
                    className="px-4 py-2 text-sm font-bold bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                  >
                    Confirmer
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default SalesHistoryDialog;
