import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Minus, Search, Trash2, Trash, Lock, Percent, RotateCcw,
  CreditCard, Pause, Hash, Wallet, DoorOpen, PiggyBank, User,
  Gift, X, Power, Clock, CalendarDays, Barcode,
  Banknote, CreditCard as CardIcon, Settings, LogOut, Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore, STANDARD_CASHIER } from "@/hooks/useUserStore";
import { useSettings, DEFAULT_HOTKEYS } from "@/hooks/useSettings";
import { useCashRegister } from "@/hooks/useCashRegister";
import { useHardware } from "@/hooks/useHardware";
import { generateMockProducts } from "@/utils/mockProducts";
import RegisterSearchBar from "@/components/register/RegisterSearchBar";

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  barcode?: string;
}

const initialCart: CartItem[] = [
  { id: "1", name: "Lait 1L", quantity: 2, price: 100, barcode: "6191234000001" },
  { id: "2", name: "Pain", quantity: 3, price: 50, barcode: "6191234000002" },
  { id: "3", name: "Eau 1.5L", quantity: 6, price: 25, barcode: "6191234000003" },
  { id: "4", name: "Sucre 1kg", quantity: 1, price: 100, barcode: "6191234000004" },
  { id: "5", name: "Fromage (0.5kg)", quantity: 1, price: 400, barcode: "6191234000005" },
];

const shortcuts = [
  { name: "LABAN MAGASIN", color: "bg-register-btn-green", productId: "p14" },
  { name: "Tamalou kord", color: "bg-register-btn-blue", productId: "p15" },
  { name: "Café 250g", color: "bg-register-btn-gold", productId: "p6" },
  { name: "Farine 1kg", color: "bg-register-btn-salmon", productId: "p7" },
  { name: "Sel 1kg", color: "bg-register-btn-olive", productId: "p8" },
  { name: "Beurre 200g", color: "bg-register-btn-yellow", productId: "p9" },
  { name: "Huile 1L", color: "bg-register-btn-teal", productId: "p10" },
  { name: "Chocolat", color: "bg-register-btn-pink", productId: "p11" },
  { name: "Jus 1L", color: "bg-register-btn-purple", productId: "p12" },
  { name: "Yaourt", color: "bg-register-btn-lightblue", productId: "p13" },
];

const shortcutProducts: Record<string, { name: string; price: number }> = {
  p14: { name: "LABAN MAGASIN", price: 60 },
  p15: { name: "Tamalou kord", price: 200 },
  p6: { name: "Café 250g", price: 350 },
  p7: { name: "Farine 1kg", price: 80 },
  p8: { name: "Sel 1kg", price: 30 },
  p9: { name: "Beurre 200g", price: 250 },
  p10: { name: "Huile 1L", price: 300 },
  p11: { name: "Chocolat", price: 150 },
  p12: { name: "Jus 1L", price: 120 },
  p13: { name: "Yaourt", price: 45 },
};

const ALL_ACTION_BUTTONS = [
  { key: "action.add", icon: Plus },
  { key: "action.deduct", icon: Minus },
  { key: "action.search", icon: Search },
  { key: "action.discount", icon: Percent },
  { key: "action.removeAll", icon: Trash },
  { key: "action.lock", icon: Lock },
  { key: "action.return", icon: RotateCcw },
  { key: "action.quantity", icon: Hash },
  { key: "action.payment", icon: CreditCard },
  { key: "action.hold", icon: Pause },
  { key: "action.deposit", icon: Wallet },
  { key: "action.drawer", icon: DoorOpen },
  { key: "action.gift", icon: Gift },
  { key: "action.close", icon: X },
  { key: "action.stop", icon: Power },
  { key: "action.lang", icon: Globe },
  { key: "action.treasury", icon: PiggyBank },
  { key: "action.client", icon: User },
];

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { currentUser, logout, isOpenMode } = useUserStore();
  const activeUser = currentUser || STANDARD_CASHIER;
  const { settings, getHotkeys, updateSettings } = useSettings(activeUser.id);
  const { balance: cashBalance, addMovement } = useCashRegister();

  const allProducts = generateMockProducts(20000);

  // Multi-client carts
  const [clientCarts, setClientCarts] = useState<Record<number, CartItem[]>>({
    1: [...initialCart], 2: [], 3: [], 4: [], 5: [], 6: [],
  });
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeClient, setActiveClient] = useState(1);
  const [now, setNow] = useState(new Date());
  const [searchOpen, setSearchOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockPassword, setLockPassword] = useState("");
  const [discount, setDiscount] = useState(0);

  // Dialogs
  const [quantityDialog, setQuantityDialog] = useState(false);
  const [quantityValue, setQuantityValue] = useState("");
  const [discountDialog, setDiscountDialog] = useState(false);
  const [discountValue, setDiscountValue] = useState("");
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [cashDialog, setCashDialog] = useState<"add" | "remove" | null>(null);
  const [cashAmount, setCashAmount] = useState("");
  const [cashNote, setCashNote] = useState("");

  const cart = clientCarts[activeClient] || [];
  const updateCart = useCallback((updater: (prev: CartItem[]) => CartItem[]) => {
    setClientCarts((prev) => ({
      ...prev,
      [activeClient]: updater(prev[activeClient] || []),
    }));
  }, [activeClient]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const total = cart.reduce((s, i) => s + i.quantity * i.price, 0);
  const discountAmount = total * (discount / 100);
  const totalTTC = total - discountAmount;
  const dateStr = now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const addProductToCart = useCallback((product: { id?: string; name: string; price: number; barcode?: string }) => {
    updateCart((prev) => {
      const existing = prev.find((i) => i.name === product.name);
      if (existing) return prev.map((i) => i.name === product.name ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: `cart-${Date.now()}`, name: product.name, quantity: 1, price: product.price, barcode: product.barcode }];
    });
    toast({ title: t("toast.itemAdded"), description: product.name });
  }, [updateCart, toast, t]);

  // Connect Barcode Scanner
  const handleScan = useCallback((barcode: string) => {
    const product = allProducts.find((p) => p.barcode === barcode);
    if (product) {
      addProductToCart(product);
    }
  }, [allProducts, addProductToCart]);
  
  const { isPrinting, printReceipt } = useHardware({ onScan: handleScan });

  const actions: Record<string, () => void> = {
    "action.add": () => setSearchOpen(true),
    "action.deduct": () => {
      if (!selectedItemId) { toast({ title: t("toast.noItemSelected"), description: t("toast.selectItem") }); return; }
      updateCart((prev) => prev.map((i) => i.id === selectedItemId ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i));
      toast({ title: t("toast.quantityUpdated") });
    },
    "action.search": () => setSearchOpen((o) => !o),
    "action.remove": () => {
      if (!selectedItemId) { toast({ title: t("toast.noItemSelected"), description: t("toast.selectItem") }); return; }
      updateCart((prev) => prev.filter((i) => i.id !== selectedItemId));
      setSelectedItemId(null);
      toast({ title: t("toast.itemRemoved") });
    },
    "action.removeAll": () => {
      updateCart(() => []);
      setSelectedItemId(null);
      toast({ title: t("toast.cartCleared") });
    },
    "action.lock": () => { setIsLocked(true); toast({ title: t("toast.locked") }); },
    "action.discount": () => setDiscountDialog(true),
    "action.return": () => {
      if (!selectedItemId) { toast({ title: t("toast.noItemSelected"), description: t("toast.selectItem") }); return; }
      const item = cart.find((i) => i.id === selectedItemId);
      if (item) {
        updateCart((prev) => prev.filter((i) => i.id !== selectedItemId));
        setSelectedItemId(null);
        toast({ title: t("toast.returnProcessed"), description: item.name });
      }
    },
    "action.payment": () => {
      // Simulate Thermal Printer
      printReceipt({ cart, totalTTC }).then(() => setPaymentDialog(true));
    },
    "action.hold": () => { toast({ title: t("toast.transactionHeld"), description: `Client N°${activeClient}` }); },
    "action.quantity": () => {
      if (!selectedItemId) { toast({ title: t("toast.noItemSelected"), description: t("toast.selectItem") }); return; }
      setQuantityDialog(true);
    },
    "action.deposit": () => setCashDialog("add"),
    "action.drawer": () => setCashDialog("remove"),
    "action.treasury": () => { toast({ title: t("action.treasury"), description: "..." }); },
    "action.client": () => { toast({ title: t("action.client"), description: `Client N°${activeClient}` }); },
    "action.gift": () => {
      if (!selectedItemId) { toast({ title: t("toast.noItemSelected"), description: t("toast.selectItem") }); return; }
      const item = cart.find((i) => i.id === selectedItemId);
      if (item) {
        updateCart((prev) => prev.map((i) => i.id === selectedItemId ? { ...i, price: 0 } : i));
        toast({ title: t("toast.giftApplied"), description: item.name });
      }
    },
    "action.close": () => {
      updateCart(() => []);
      setSelectedItemId(null);
      setDiscount(0);
      toast({ title: t("action.close") });
    },
    "action.stop": () => {
      if (!isOpenMode()) logout();
      navigate("/");
    },
    "action.lang": () => {
      const newLang = settings.language === "fr" ? "ar" : settings.language === "ar" ? "en" : "fr";
      updateSettings({ language: newLang });
      toast({ title: newLang === "fr" ? "Français" : newLang === "ar" ? "العربية" : "English" });
    },
  };

  const userHotkeys = getHotkeys();
  const hiddenActions = settings.hiddenActions || [];
  const visibleButtons = ALL_ACTION_BUTTONS.filter((btn) => !hiddenActions.includes(btn.key));

  // Keyboard shortcuts
  useEffect(() => {
    const shortcutMap: Record<string, string> = {};
    ALL_ACTION_BUTTONS.forEach((btn) => {
      const hk = userHotkeys[btn.key];
      if (hk) shortcutMap[hk.toLowerCase()] = btn.key;
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked) return;
      if (e.key.startsWith("F") && !e.ctrlKey) {
        e.preventDefault();
        const key = shortcutMap[e.key.toLowerCase()];
        if (key && actions[key]) actions[key]();
        return;
      }
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        const combo = `ctrl+${e.key.toLowerCase()}`;
        const key = shortcutMap[combo];
        if (key && actions[key]) { e.preventDefault(); actions[key](); return; }
      }
      if (!searchOpen && !quantityDialog && !discountDialog && !paymentDialog && !cashDialog &&
          e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key) && !e.ctrlKey && !e.altKey) {
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const handleShortcutClick = (productId: string) => {
    const product = shortcutProducts[productId];
    if (product) addProductToCart(product);
  };

  const confirmQuantity = () => {
    const qty = parseInt(quantityValue);
    if (qty > 0 && selectedItemId) {
      updateCart((prev) => prev.map((i) => i.id === selectedItemId ? { ...i, quantity: qty } : i));
      toast({ title: t("toast.quantityUpdated") });
    }
    setQuantityDialog(false);
    setQuantityValue("");
  };

  const confirmDiscount = () => {
    const val = parseFloat(discountValue);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      setDiscount(val);
      toast({ title: t("toast.discountApplied"), description: `${val}%` });
    }
    setDiscountDialog(false);
    setDiscountValue("");
  };

  const processPayment = (method: "cash" | "card") => {
    if (method === "cash") {
      addMovement({ type: "sale", amount: totalTTC, note: `Vente Client N°${activeClient}`, userId: activeUser.id, userName: activeUser.name });
    }
    toast({ title: t("toast.paymentProcessed"), description: `${totalTTC.toFixed(2)} DA — ${method === "cash" ? t("dialog.payment.cash") : t("dialog.payment.card")}` });
    updateCart(() => []);
    setSelectedItemId(null);
    setDiscount(0);
    setPaymentDialog(false);
  };

  const confirmCash = () => {
    const amount = parseFloat(cashAmount);
    if (isNaN(amount) || amount <= 0) return;
    addMovement({
      type: cashDialog === "add" ? "add" : "remove",
      amount,
      note: cashNote || (cashDialog === "add" ? t("toast.cashAdded") : t("toast.cashRemoved")),
      userId: activeUser.id,
      userName: activeUser.name,
    });
    toast({ title: cashDialog === "add" ? t("toast.cashAdded") : t("toast.cashRemoved"), description: `${amount.toFixed(2)} DA` });
    setCashDialog(null);
    setCashAmount("");
    setCashNote("");
  };

  const handleUnlock = () => {
    if (lockPassword === "1234" || lockPassword === "") {
      setIsLocked(false);
      setLockPassword("");
      toast({ title: t("toast.unlocked") });
    }
  };

  const getBadgeColor = (index: number) => {
    const col = index % 3;
    return col === 0 ? "bg-accent text-accent-foreground" : col === 1 ? "bg-success text-success-foreground" : "bg-info text-info-foreground";
  };

  return (
    <div className="h-screen flex bg-register-bg overflow-hidden select-none">
      {/* LOCK OVERLAY */}
      <AnimatePresence>
        {isLocked && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-primary/95 flex items-center justify-center">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-card p-6 w-[300px] border border-register-border">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-5 w-5 text-primary" />
                <h2 className="text-sm font-bold text-foreground">{t("dialog.lock.title")}</h2>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">{t("dialog.lock.message")}</p>
              <input type="password" value={lockPassword} onChange={(e) => setLockPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleUnlock()} placeholder={t("dialog.lock.password")} className="w-full px-3 py-2 text-sm border border-input bg-background text-foreground outline-none mb-3" autoFocus />
              <button onClick={handleUnlock} className="w-full py-2 bg-primary text-primary-foreground text-[11px] font-bold uppercase hover:bg-primary/90 transition-colors">{t("dialog.lock.unlock")}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRINTER OVERLAY */}
      <AnimatePresence>
         {isPrinting && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center">
                <svg className="w-16 h-16 text-primary mb-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                <h2 className="text-xl font-black text-slate-800 tracking-tight text-center whitespace-nowrap">Impression du Ticket...</h2>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-2">Veuillez patienter...</p>
             </motion.div>
           </motion.div>
         )}
      </AnimatePresence>

      {/* QUANTITY DIALOG */}
      <AnimatePresence>
        {quantityDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center">
            <motion.div initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 10 }} className="bg-card p-5 w-[280px] border border-register-border">
              <h3 className="text-sm font-bold text-foreground mb-3">{t("dialog.quantity.title")}</h3>
              <input type="number" min="1" value={quantityValue} onChange={(e) => setQuantityValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirmQuantity()} placeholder={t("dialog.quantity.placeholder")} className="w-full px-3 py-2 text-sm border border-input bg-background text-foreground outline-none mb-3" autoFocus />
              <div className="flex gap-2">
                <button onClick={() => setQuantityDialog(false)} className="flex-1 py-2 bg-muted text-foreground text-[10px] font-bold uppercase">{t("dialog.cancel")}</button>
                <button onClick={confirmQuantity} className="flex-1 py-2 bg-primary text-primary-foreground text-[10px] font-bold uppercase">{t("dialog.confirm")}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DISCOUNT DIALOG */}
      <AnimatePresence>
        {discountDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center">
            <motion.div initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 10 }} className="bg-card p-5 w-[280px] border border-register-border">
              <h3 className="text-sm font-bold text-foreground mb-3">{t("dialog.discount.title")}</h3>
              <input type="number" min="0" max="100" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirmDiscount()} placeholder={t("dialog.discount.placeholder")} className="w-full px-3 py-2 text-sm border border-input bg-background text-foreground outline-none mb-3" autoFocus />
              <div className="flex gap-2">
                <button onClick={() => setDiscountDialog(false)} className="flex-1 py-2 bg-muted text-foreground text-[10px] font-bold uppercase">{t("dialog.cancel")}</button>
                <button onClick={confirmDiscount} className="flex-1 py-2 bg-primary text-primary-foreground text-[10px] font-bold uppercase">{t("dialog.confirm")}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAYMENT DIALOG */}
      <AnimatePresence>
        {paymentDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center">
            <motion.div initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 10 }} className="bg-card p-5 w-[320px] border border-register-border">
              <h3 className="text-sm font-bold text-foreground mb-1">{t("dialog.payment.title")}</h3>
              <p className="text-[11px] text-muted-foreground mb-4">{t("dialog.payment.total")}: <span className="font-bold text-foreground">{totalTTC.toFixed(2)} DA</span></p>
              <div className="flex gap-2 mb-3">
                <button onClick={() => processPayment("cash")} className="flex-1 flex flex-col items-center gap-1 py-4 bg-success text-success-foreground hover:brightness-110 transition-all active:scale-95">
                  <Banknote className="h-6 w-6" />
                  <span className="text-[10px] font-bold uppercase">{t("dialog.payment.cash")}</span>
                </button>
                <button onClick={() => processPayment("card")} className="flex-1 flex flex-col items-center gap-1 py-4 bg-info text-info-foreground hover:brightness-110 transition-all active:scale-95">
                  <CreditCard className="h-6 w-6" />
                  <span className="text-[10px] font-bold uppercase">{t("dialog.payment.card")}</span>
                </button>
              </div>
              <button onClick={() => setPaymentDialog(false)} className="w-full py-2 bg-muted text-foreground text-[10px] font-bold uppercase">{t("dialog.cancel")}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CASH ADD/REMOVE DIALOG */}
      <AnimatePresence>
        {cashDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center">
            <motion.div initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 10 }} className="bg-card p-5 w-[320px] border border-register-border">
              <h3 className="text-sm font-bold text-foreground mb-1">
                {cashDialog === "add" ? t("dialog.cash.addTitle") : t("dialog.cash.removeTitle")}
              </h3>
              <p className="text-[11px] text-muted-foreground mb-3">
                {t("label.cashBalance")}: <span className="font-bold text-foreground">{cashBalance.toFixed(2)} DA</span>
              </p>
              <input type="number" min="0" step="0.01" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} placeholder={t("dialog.cash.amount")} className="w-full px-3 py-2 text-sm border border-input bg-background text-foreground outline-none mb-2" autoFocus />
              <input type="text" value={cashNote} onChange={(e) => setCashNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirmCash()} placeholder={t("dialog.cash.note")} className="w-full px-3 py-2 text-sm border border-input bg-background text-foreground outline-none mb-3" />
              <div className="flex gap-2">
                <button onClick={() => { setCashDialog(null); setCashAmount(""); setCashNote(""); }} className="flex-1 py-2 bg-muted text-foreground text-[10px] font-bold uppercase">{t("dialog.cancel")}</button>
                <button onClick={confirmCash} className={`flex-1 py-2 text-[10px] font-bold uppercase ${cashDialog === "add" ? "bg-success text-success-foreground" : "bg-accent text-accent-foreground"}`}>{t("dialog.confirm")}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT PANEL */}
      <div className="w-[240px] flex flex-col border-r border-register-border bg-card">
        <div className="flex flex-col items-center py-3 border-b border-register-border bg-primary">
          <motion.div className="flex items-center gap-0.5" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}>
            <motion.span initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-3xl font-black text-primary-foreground tracking-tight">D</motion.span>
            <motion.span initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.25 }} className="text-3xl font-black text-primary-foreground tracking-tight">S</motion.span>
          </motion.div>
          <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-primary-foreground/80">{t("label.software")}</p>
          <p className="text-[7px] tracking-[0.15em] uppercase text-primary-foreground/50">{t("label.managementSoftware")}</p>
        </div>

        <div className="px-3 py-2 border-b border-register-border bg-muted">
          <p className="text-[10px] font-bold text-foreground uppercase tracking-wide text-center">SUPÉRETTE ERRAHMA</p>
        </div>

        <div className="px-3 py-1.5 border-b border-register-border bg-primary">
          <span className="text-[10px] font-bold text-primary-foreground uppercase tracking-wider">{t("label.shortcuts")}</span>
        </div>

        <div className="flex-1 overflow-auto">
          {shortcuts.map((s, i) => (
            <button key={i} onClick={() => handleShortcutClick(s.productId)} className="flex items-center gap-2 w-full px-3 py-2 border-b border-register-border hover:bg-muted/60 transition-colors text-left active:scale-[0.98]">
              <span className={`w-3 h-3 rounded-full ${s.color} shrink-0`} />
              <span className="text-[11px] font-medium text-foreground truncate">{s.name}</span>
            </button>
          ))}
        </div>

        <div className="border-t border-register-border flex">
          <button onClick={() => navigate("/settings", { state: { from: "/register" } })} className="flex items-center gap-2 flex-1 px-3 py-2 text-[11px] font-medium text-muted-foreground hover:bg-muted transition-colors border-r border-register-border">
            <Settings className="h-3.5 w-3.5" />
            {t("label.settings")}
          </button>
          <button onClick={() => { if (!isOpenMode()) logout(); navigate("/"); }} className="flex items-center gap-2 flex-1 px-3 py-2 text-[11px] font-medium text-accent hover:bg-muted transition-colors">
            <LogOut className="h-3.5 w-3.5" />
            {t("label.back")}
          </button>
        </div>
      </div>

      {/* CENTER PANEL */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-card border-b border-register-border px-4 py-3 flex items-center justify-center">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }} className="text-center">
            <motion.span key={totalTTC} initial={{ scale: 1.05, opacity: 0.7 }} animate={{ scale: 1, opacity: 1 }} className="text-5xl font-black text-primary tracking-tight">
              {totalTTC.toFixed(2).replace(".", ",")}
            </motion.span>
            <span className="text-2xl font-black text-primary ml-2">DA</span>
          </motion.div>
        </div>

        <div className="grid grid-cols-4 gap-0 border-b border-register-border">
          {[
            { label: t("label.totalHT"), value: `${total.toFixed(2)} DA` },
            { label: t("label.totalTVA"), value: `${(total * 0).toFixed(2)} DA` },
            { label: t("label.discount"), value: discount > 0 ? `-${discountAmount.toFixed(2)} DA (${discount}%)` : "0,00 DA" },
            { label: t("label.totalTTC"), value: `${totalTTC.toFixed(2)} DA` },
          ].map((s, i) => (
            <div key={i} className={`text-center py-1.5 px-2 ${i < 3 ? "border-r border-register-border" : ""}`}>
              <div className="bg-primary text-primary-foreground px-2 py-1">
                <p className="text-[9px] font-bold uppercase tracking-wider">{s.label}</p>
                <p className="text-[11px] font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Client Tabs */}
        <motion.div animate={{ height: searchOpen ? 28 : 34 }} transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }} className="flex border-b border-register-border bg-muted overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => { setActiveClient(n); setSelectedItemId(null); }}
              className={`flex-1 text-[10px] font-bold uppercase transition-all border-r border-register-border last:border-r-0 relative ${
                activeClient === n ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t("label.client")}{n}
              {(clientCarts[n]?.length || 0) > 0 && activeClient !== n && (
                <span className="absolute top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-accent" />
              )}
            </button>
          ))}
        </motion.div>

        <RegisterSearchBar isOpen={searchOpen} onClose={() => setSearchOpen(false)} onSelectProduct={(p) => addProductToCart(p)} t={t} />

        {/* Items Table */}
        <div className="flex-1 overflow-auto bg-background relative">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted border-b-2 border-primary">
                <th className="px-3 py-2 text-left text-[10px] font-bold text-foreground uppercase tracking-wider">{t("label.product")}</th>
                <th className="px-3 py-2 text-center text-[10px] font-bold text-foreground uppercase tracking-wider">{t("label.qty")}</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold text-foreground uppercase tracking-wider">{t("label.unitPrice")}</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold text-foreground uppercase tracking-wider">{t("label.total")}</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {cart.map((item, i) => (
                  <motion.tr key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10, height: 0 }} transition={{ duration: 0.2, delay: i * 0.03 }}
                    onClick={() => setSelectedItemId(item.id === selectedItemId ? null : item.id)}
                    className={`cursor-pointer transition-colors border-b border-register-border ${
                      item.id === selectedItemId ? "bg-primary/10 border-l-2 border-l-primary" : i % 2 === 0 ? "bg-card hover:bg-muted/40" : "bg-muted/20 hover:bg-muted/40"
                    }`}
                  >
                    <td className="px-3 py-2.5 text-[12px] font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <motion.div animate={{ scale: item.id === selectedItemId ? 1.15 : 1 }} className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.id === selectedItemId ? "bg-primary" : "bg-muted-foreground/30"}`} />
                        {item.name}
                        {item.price === 0 && <span className="text-[8px] px-1 py-0.5 bg-success text-success-foreground font-bold uppercase">{t("action.gift")}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center text-[12px]">
                      <span className="inline-block min-w-[24px] py-0.5 bg-muted text-foreground font-bold">{item.quantity}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground text-[12px]">{item.price.toFixed(2)} DA</td>
                    <td className="px-3 py-2.5 text-right font-bold text-foreground text-[12px]">{(item.quantity * item.price).toFixed(2)} DA</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {cart.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              {t("label.registerReady")}
            </motion.div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="px-3 py-1.5 border-t border-register-border bg-muted flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{cart.length} {t("label.articles")}</span>
          <span>{t("label.totalQty")}: {cart.reduce((s, i) => s + i.quantity, 0)}</span>
          <span>{t("label.cashBalance")}: {cashBalance.toFixed(2)} DA</span>
        </div>
      </div>

      {/* RIGHT PANEL — Redesigned buttons */}
      <div className="w-[260px] flex flex-col border-l border-register-border bg-card">
        <div className="px-3 py-2 border-b border-register-border bg-primary text-primary-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              <span className="text-[11px] font-bold uppercase">{activeUser.name}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{dateStr}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeStr}</span>
            </div>
          </div>
          <p className="text-[9px] text-primary-foreground/60 mt-0.5">{t("label.registerReady")}</p>
        </div>

        <div className="flex-1 overflow-auto p-1.5">
          <div className="grid grid-cols-3 gap-1">
            {visibleButtons.map((btn, i) => {
              const shortcut = userHotkeys[btn.key] || "";
              return (
                <button
                  key={btn.key}
                  onClick={() => actions[btn.key]?.()}
                  className="flex flex-col items-center justify-between bg-card border border-register-border transition-all active:scale-95 hover:bg-muted/50 min-h-[72px] overflow-hidden"
                >
                  <div className="flex flex-col items-center justify-center gap-0.5 flex-1 p-1.5">
                    <btn.icon className="h-4 w-4 text-foreground" />
                    <span className="text-[7px] font-bold uppercase leading-tight text-center text-foreground">
                      {t(btn.key)}
                    </span>
                  </div>
                  {shortcut ? (
                    <span className={`text-[7px] font-bold py-0.5 w-full text-center ${getBadgeColor(i)}`}>
                      {shortcut}
                    </span>
                  ) : (
                    <span className="text-[7px] font-bold py-0.5 w-full text-center bg-muted text-muted-foreground">
                      —
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
