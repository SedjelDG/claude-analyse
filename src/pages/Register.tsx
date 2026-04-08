import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Minus, Search, Trash2, Trash, Lock, Percent, RotateCcw,
  CreditCard, Pause, Hash, Wallet, DoorOpen, PiggyBank, User,
  Gift, X, Power, Clock, CalendarDays, Barcode,
  Banknote, CreditCard as CardIcon, Settings, LogOut, Globe,
  PackageOpen, Shield, Play, Receipt
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore, STANDARD_CASHIER } from "@/hooks/useUserStore";
import { useSettings, DEFAULT_HOTKEYS } from "@/hooks/useSettings";
import { useCashRegister } from "@/hooks/useCashRegister";
import RegisterSearchBar from "@/components/register/RegisterSearchBar";
import SalesHistoryDialog from "@/components/register/SalesHistoryDialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  barcode?: string;
  packVariantIndex?: number; // -1 = unit, 0+ = pack variant index
  packSize: number;
  originalName?: string;
  originalPrice?: number;
}

const initialCart: CartItem[] = [
  { id: "1", name: "Lait 1L", quantity: 2, price: 100, barcode: "6191234000001", packSize: 1 },
  { id: "2", name: "Pain", quantity: 3, price: 50, barcode: "6191234000002", packSize: 1 },
  { id: "3", name: "Eau 1.5L", quantity: 6, price: 25, barcode: "6191234000003", packSize: 1 },
  { id: "4", name: "Sucre 1kg", quantity: 1, price: 100, barcode: "6191234000004", packSize: 1 },
  { id: "5", name: "Fromage (0.5kg)", quantity: 1, price: 400, barcode: "6191234000005", packSize: 1 },
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
  { key: "action.packCycle", icon: PackageOpen },
  { key: "action.salesHistory", icon: Receipt },
];

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { currentUser, logout, isOpenMode } = useUserStore();
  const activeUser = currentUser || STANDARD_CASHIER;
  const { settings, getHotkeys, updateSettings } = useSettings(activeUser.id);
  const { balance: cashBalance, addMovement } = useCashRegister();

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
  const [salesHistoryOpen, setSalesHistoryOpen] = useState(false);

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

  const addProductToCart = useCallback((product: { id?: string; name: string; price: number; barcode?: string; quantity?: number }) => {
    updateCart((prev) => {
      const existing = prev.find((item) => item.id === product.id && item.id !== "custom_misc");
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + (product.quantity || 1) } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id || String(Date.now()),
          name: product.name,
          price: product.price,
          quantity: product.quantity || 1,
          originalPrice: product.price, // Store the base price for discounts
          originalName: product.name,
          packVariantIndex: -1,
          packSize: 1,
          barcode: product.barcode,
        },
      ];
    });
    toast({ title: product.name, description: t("toast.itemAdded") });
  }, [updateCart, t]);

  const removeProductFromCart = useCallback((productId: string) => {
    updateCart((prev) => {
      const existing = prev.find((item) => item.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) => (item.id === productId ? { ...item, quantity: item.quantity - 1 } : item));
      }
      return prev.filter((item) => item.id !== productId);
    });
  }, [updateCart]);

  const actions: Record<string, () => void> = {
    "action.add": () => {
      if (!selectedItemId) { toast({ title: t("toast.noItemSelected"), description: t("toast.selectItem") }); return; }
      const item = cart.find((i) => i.id === selectedItemId);
      if (item) {
        addProductToCart(item);
        toast({ title: t("toast.updated"), description: item.name });
      }
    },
    "action.deduct": () => {
      if (!selectedItemId) { toast({ title: t("toast.noItemSelected"), description: t("toast.selectItem") }); return; }
      removeProductFromCart(selectedItemId);
    },
    "action.search": () => setSearchOpen(true),
    "action.remove": () => {
      if (!selectedItemId) { toast({ title: t("toast.noItemSelected"), description: t("toast.selectItem") }); return; }
      updateCart((prev) => prev.filter((i) => i.id !== selectedItemId));
      setSelectedItemId(null);
    },
    "action.removeAll": () => {
      updateCart(() => []);
      setSelectedItemId(null);
      setDiscount(0);
      toast({ title: t("action.removeAll") });
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
    "action.payment": () => setPaymentDialog(true),
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
      const newLang = settings.language === "fr" ? "en" : "fr";
      updateSettings({ language: newLang });
      toast({ title: newLang === "fr" ? "Français" : "English" });
    },
    "action.packCycle": () => {
      if (!selectedItemId) { toast({ title: t("toast.noItemSelected"), description: t("toast.selectItem") }); return; }
      const item = cart.find((i) => i.id === selectedItemId);
      if (!item) return;
      // Look up pack variants from mock data (in production this would come from a product DB)
      const mockPackVariants: Record<string, { size: number; name: string; price: number }[]> = {
        "Lait 1L": [{ size: 6, name: "Pack 6", price: 550 }, { size: 12, name: "Carton 12", price: 1050 }],
        "Eau 1.5L": [{ size: 6, name: "Pack 6", price: 140 }],
      };
      const baseName = item.originalName || item.name;
      const variants = mockPackVariants[baseName];
      if (!variants || variants.length === 0) { toast({ title: "Pas de variantes", description: baseName }); return; }
      const currentIdx = item.packVariantIndex ?? -1;
      const nextIdx = currentIdx + 1 >= variants.length ? -1 : currentIdx + 1;
      const currentTotalUnits = item.quantity * (item.packSize || 1);
      
      if (nextIdx === -1) {
        // Back to unit
        const newQty = currentTotalUnits; 
        updateCart((prev) => prev.map((i) => i.id === selectedItemId ? { ...i, name: baseName, quantity: newQty, price: item.originalPrice || item.price, packVariantIndex: -1, packSize: 1, originalName: baseName } : i));
        toast({ title: t("action.packCycle"), description: `${baseName} (${newQty} unités)` });
      } else {
        const v = variants[nextIdx];
        const origPrice = item.originalPrice || item.price;
        const newQty = Math.max(1, Math.floor(currentTotalUnits / v.size));
        updateCart((prev) => prev.map((i) => i.id === selectedItemId ? { ...i, name: `${baseName} (${v.name})`, quantity: newQty, price: v.price, packVariantIndex: nextIdx, packSize: v.size, originalName: baseName, originalPrice: origPrice } : i));
        toast({ title: t("action.packCycle"), description: `${v.name} (Qté: ${newQty})` });
      }
    },
  };

  const userHotkeys = getHotkeys();
  const hiddenActions = settings.hiddenActions || [];
  const visibleButtons = ALL_ACTION_BUTTONS.filter((btn) => !hiddenActions.includes(btn.key));

  // ── Barcode Interceptor ────────────────────────────────────────────────
  const barcodeBuffer = useRef("");
  const lastKeyTime = useRef(0);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const now = Date.now();
      const isFast = now - lastKeyTime.current < 50;

      if (e.key === "Enter") {
        if (barcodeBuffer.current.length >= 5 && isFast) {
          const code = barcodeBuffer.current;
          let handled = false;

          // ── Smart Barcode Parser (Scale Interceptor) ──
          const scaleSettings = settings.hardware?.barcodeScale;
          if (scaleSettings?.enabled && code.length === 13 && code.startsWith(scaleSettings.prefix || "20")) {
            const plu = code.substring(2, 6); // 4-digit PLU
            const weightPrm = code.substring(6, 11); // 5-digit weight (01500 = 1.500kg)
            const weight = parseInt(weightPrm, 10) / 1000;
            
            // Mocking PLU lookup until Database is active
            const foundNode = Object.values(shortcutProducts).find((p: any) => p.barcode === code || p.id === plu);
            const found = foundNode || { name: `Article Pesé (PLU: ${plu})`, price: 450, barcode: code }; // 450 DA/kg mock
              
            // In a real POS, if the scale embeds WEIGHT, total = price * weight
            // Here we pass the precise parsed weight directly into the quantity field
            addProductToCart({ ...found, quantity: weight });
            handled = true;
          }

          if (!handled) {
            // Standard Barcode Lookup
            const foundNode = Object.values(shortcutProducts).find((p: any) => p.barcode === code || p.name.includes(code));
            const found = foundNode || { name: `Article ${code}`, price: Math.floor(Math.random() * 500) + 50, barcode: code };
            addProductToCart(found);
          }
          
          e.preventDefault();
          e.stopPropagation();
        }
        barcodeBuffer.current = "";
      } else if (e.key.length === 1 && /[0-9a-zA-Z]/.test(e.key)) {
        if (isFast || barcodeBuffer.current === "") {
          barcodeBuffer.current += e.key;
        } else {
          barcodeBuffer.current = e.key;
        }
      }
      lastKeyTime.current = now;
    };
    window.addEventListener("keydown", handleGlobalKeyDown, true);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown, true);
  }, [addProductToCart]);

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
      // Fix: Check the duration BEFORE the current key was processed by the interceptor
      // If the buffer has content and we just got a key, the interceptor just updated lastKeyTime.
      // So we check if the PREVIOUS gap was fast.
      const isActuallyScanning = barcodeBuffer.current.length > 0;
      
      if (!searchOpen && !quantityDialog && !discountDialog && !paymentDialog && !cashDialog &&
        e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key) && !e.ctrlKey && !e.altKey && !isActuallyScanning) {
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

  const getActionTheme = (actionKey: string) => {
    const themes: Record<string, { text: string; bg: string; border: string }> = {
      "action.add": { text: "text-[#10b981]", bg: "bg-[#10b981]", border: "border-[#10b981]/40" },
      "action.deduct": { text: "text-[#ef4444]", bg: "bg-[#ef4444]", border: "border-[#ef4444]/40" },
      "action.search": { text: "text-[#ec4899]", bg: "bg-[#ec4899]", border: "border-[#ec4899]/40" },
      "action.removeAll": { text: "text-[#991b1b]", bg: "bg-[#991b1b]", border: "border-[#991b1b]/40" },
      "action.lock": { text: "text-[#4b5563]", bg: "bg-[#4b5563]", border: "border-[#4b5563]/40" },
      "action.return": { text: "text-[#f43f5e]", bg: "bg-[#f43f5e]", border: "border-[#f43f5e]/40" },
      "action.discount": { text: "text-[#f97316]", bg: "bg-[#f97316]", border: "border-[#f97316]/40" },
      "action.quantity": { text: "text-[#0d9488]", bg: "bg-[#0d9488]", border: "border-[#0d9488]/40" },
      "action.payment": { text: "text-[#eab308]", bg: "bg-[#eab308]", border: "border-[#eab308]/40" },
      "action.hold": { text: "text-[#3b82f6]", bg: "bg-[#3b82f6]", border: "border-[#3b82f6]/40" },
      "action.deposit": { text: "text-[#1e40af]", bg: "bg-[#1e40af]", border: "border-[#1e40af]/40" },
      "action.drawer": { text: "text-[#7e22ce]", bg: "bg-[#7e22ce]", border: "border-[#7e22ce]/40" },
      "action.treasury": { text: "text-[#1e293b]", bg: "bg-[#1e293b]", border: "border-[#1e293b]/40" },
      "action.client": { text: "text-[#3730a3]", bg: "bg-[#3730a3]", border: "border-[#3730a3]/40" },
      "action.gift": { text: "text-[#0ea5e9]", bg: "bg-[#0ea5e9]", border: "border-[#0ea5e9]/40" },
      "action.close": { text: "text-[#b91c1c]", bg: "bg-[#b91c1c]", border: "border-[#b91c1c]/40" },
      "action.stop": { text: "text-[#000000]", bg: "bg-[#000000]", border: "border-[#000000]/40" },
      "action.packCycle": { text: "text-[#dc2626]", bg: "bg-[#dc2626]", border: "border-[#dc2626]/40" },
    };
    return themes[actionKey] || { text: "text-primary", bg: "bg-primary", border: "border-primary/40" };
  };

  const getBadgeColor = (index: number) => {
    const col = index % 3;
    return col === 0 ? "bg-accent text-accent-foreground" : col === 1 ? "bg-success text-success-foreground" : "bg-info text-info-foreground";
  };

  // ── Resizable left panel ────────────────────────────────────────────────
  const LEFT_PANEL_MIN = 160;
  const LEFT_PANEL_MAX = 400;
  const LEFT_PANEL_DEFAULT = 240;
  const LEFT_PANEL_STORAGE_KEY = "register_left_panel_width";

  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(LEFT_PANEL_STORAGE_KEY);
      if (stored) {
        const n = Number(stored);
        if (n >= LEFT_PANEL_MIN && n <= LEFT_PANEL_MAX) return n;
      }
    } catch { /* ignore */ }
    return LEFT_PANEL_DEFAULT;
  });

  // ── Resizable right panel ────────────────────────────────────────────────
  const PANEL_MIN = 320;
  const PANEL_MAX = 600;
  const PANEL_DEFAULT = 340;
  const PANEL_STORAGE_KEY = "register_hotkey_panel_width";

  const [panelWidth, setPanelWidth] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(PANEL_STORAGE_KEY);
      if (stored) {
        const n = Number(stored);
        if (n >= PANEL_MIN && n <= PANEL_MAX) return n;
      }
    } catch { /* ignore */ }
    return PANEL_DEFAULT;
  });

  const isDragging = useRef<"left" | "right" | null>(null);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const rafId = useRef<number>(0);

  const handleLeftDividerMouseDown = useCallback((e: React.MouseEvent) => {
    if (settings.lockRegisterPanels) return;
    e.preventDefault();
    isDragging.current = "left";
    dragStartX.current = e.clientX;
    dragStartWidth.current = leftPanelWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [leftPanelWidth, settings.lockRegisterPanels]);

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    if (settings.lockRegisterPanels) return;
    e.preventDefault();
    isDragging.current = "right";
    dragStartX.current = e.clientX;
    dragStartWidth.current = panelWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [panelWidth, settings.lockRegisterPanels]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        if (isDragging.current === "right") {
          // dragging left = right panel grows
          const delta = dragStartX.current - e.clientX;
          const next = Math.min(PANEL_MAX, Math.max(PANEL_MIN, dragStartWidth.current + delta));
          setPanelWidth(next);
        } else if (isDragging.current === "left") {
          // dragging right = left panel grows
          const delta = e.clientX - dragStartX.current;
          const next = Math.min(LEFT_PANEL_MAX, Math.max(LEFT_PANEL_MIN, dragStartWidth.current + delta));
          setLeftPanelWidth(next);
        }
      });
    };
    const onUp = () => {
      if (!isDragging.current) return;
      const type = isDragging.current;
      isDragging.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (type === "right") {
        setPanelWidth(w => { localStorage.setItem(PANEL_STORAGE_KEY, String(w)); return w; });
      } else {
        setLeftPanelWidth(w => { localStorage.setItem(LEFT_PANEL_STORAGE_KEY, String(w)); return w; });
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Derive columns and scale from panel width — fully memoized
  const { panelCols, btnScale, headerScale, leftPanelScale } = useMemo(() => {
    let cols: number;
    if (panelWidth < 210) cols = 1;
    else if (panelWidth < 300) cols = 2;
    else if (panelWidth < 550) cols = 3;
    else if (panelWidth < 700) cols = 4;
    else cols = 5;
    // Baseline: 260px / 3 cols = ~87px per button = scale 1.0
    const btnW = panelWidth / cols;
    const bs = Math.min(1.45, Math.max(0.75, btnW / 87));

    // Damped header scale: even more conservative now
    const hs = Math.min(1.25, Math.max(0.85, 1 + (bs - 1) * 0.35));

    // Left panel scale: baseline 240px
    const lps = Math.min(1.3, Math.max(0.85, 1 + (leftPanelWidth / 240 - 1) * 0.4));

    return { panelCols: cols, btnScale: bs, headerScale: hs, leftPanelScale: lps };
  }, [panelWidth, leftPanelWidth]);

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
      <div
        className="flex flex-col border-r border-register-border bg-card overflow-hidden flex-shrink-0"
        style={{ width: leftPanelWidth }}
      >
        <div
          className="flex flex-col items-center border-b border-register-border bg-slate-50/50 flex-shrink-0 relative overflow-hidden"
          style={{ paddingTop: Math.round(18 * leftPanelScale), paddingBottom: Math.round(18 * leftPanelScale) }}
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <motion.div
            className="flex flex-col items-center leading-none"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="flex items-center" style={{ gap: Math.round(2 * leftPanelScale) }}>
              <motion.span
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="font-black tracking-tighter"
                style={{ 
                  fontSize: Math.round(48 * leftPanelScale),
                  background: 'var(--gradient-primary)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                D
              </motion.span>
              <motion.span
                initial={{ x: 10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="font-black tracking-tighter"
                style={{ 
                  fontSize: Math.round(48 * leftPanelScale),
                  background: 'var(--gradient-primary)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                S
              </motion.span>
            </div>
            <div className="text-center px-1 overflow-hidden mt-1 px-4">
              <p
                className="font-bold tracking-[0.45em] uppercase"
                style={{ 
                  fontSize: Math.round(10.5 * leftPanelScale),
                  background: 'var(--gradient-primary)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                SOFTWARE
              </p>
            </div>
          </motion.div>
        </div>

        <div
          className="border-b border-register-border bg-slate-100 flex-shrink-0 overflow-hidden"
          style={{
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: Math.round(12 * leftPanelScale),
            paddingBottom: Math.round(12 * leftPanelScale),
          }}
        >
          <p
            className="font-black ds-gradient-text uppercase tracking-widest text-center truncate"
            style={{ fontSize: Math.round(11 * leftPanelScale) }}
          >
            SUPÉRETTE ERRAHMA
          </p>
        </div>

        <div className="px-4 py-2 border-b border-register-border bg-white flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-orange-500 fill-orange-500/5" />
          <span className="text-[10.5px] font-black ds-gradient-text uppercase tracking-widest">{t("label.shortcuts")}</span>
        </div>

        <ScrollArea className="flex-1 bg-background border-b border-register-border pr-2.5">
          {shortcuts.map((s, i) => (
            <button key={i} onClick={() => handleShortcutClick(s.productId)} className="flex items-center gap-2 w-full px-3 py-2 border-b border-register-border hover:bg-muted/60 transition-colors text-left active:scale-[0.98]">
              <span className={`w-3 h-3 rounded-full ${s.color} shrink-0`} />
              <span className="text-[11px] font-medium text-foreground truncate">{s.name}</span>
            </button>
          ))}
        </ScrollArea>

        <div className="border-t border-register-border flex flex-shrink-0 overflow-hidden">
          <button onClick={() => navigate("/settings", { state: { from: "/register" } })} className="flex items-center gap-2 justify-center flex-1 px-1 py-2 text-[11px] font-medium text-muted-foreground hover:bg-muted transition-colors border-r border-register-border min-w-0">
            <Settings className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{t("label.settings")}</span>
          </button>
          <button onClick={() => { if (!isOpenMode()) logout(); navigate("/"); }} className="flex items-center gap-2 justify-center flex-1 px-1 py-2 text-[11px] font-medium text-accent hover:bg-muted transition-colors min-w-0">
            <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{t("label.back")}</span>
          </button>
        </div>
      </div>

      {/* LEFT RESIZE DIVIDER */}
      <div
        onMouseDown={handleLeftDividerMouseDown}
        className={`w-[5px] flex-shrink-0 relative group z-10 ${settings.lockRegisterPanels ? "cursor-default" : "cursor-col-resize"}`}
        style={{ background: "transparent" }}
      >
        <div
          className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-[3px] transition-all duration-150
            bg-register-border ${!settings.lockRegisterPanels ? "group-hover:bg-primary group-hover:w-[4px] group-active:bg-primary" : "opacity-30"}`}
        />
      </div>

      {/* CENTER PANEL */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-card border-b border-register-border px-4 py-8 flex items-center justify-center">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }} className="text-center">
            <motion.span key={totalTTC} initial={{ scale: 1.05, opacity: 0.7 }} animate={{ scale: 1, opacity: 1 }} className="text-8xl font-black text-primary tracking-tighter font-digital">
              {totalTTC.toFixed(2)}
            </motion.span>
            <span className="text-3xl font-black text-primary/40 ml-3">DA</span>
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
                <p className="text-[11px] font-bold font-digital">{s.value}</p>
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
              className={`flex-1 text-[10px] font-bold uppercase transition-all border-r border-register-border last:border-r-0 relative ${activeClient === n ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/80"
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
        <ScrollArea className="flex-1 bg-background relative pr-2.5">
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
                    className={`cursor-pointer transition-colors border-b border-register-border ${item.id === selectedItemId ? "bg-primary/10 border-l-2 border-l-primary" : i % 2 === 0 ? "bg-card hover:bg-muted/40" : "bg-muted/20 hover:bg-muted/40"
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
                      <div className="flex flex-col items-center gap-0.5">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedItemId(item.id); setTimeout(() => setQuantityDialog(true), 0); }} className="inline-block min-w-[28px] px-1 py-0.5 bg-muted text-foreground font-bold font-digital hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer rounded-sm active:scale-95 shadow-sm">
                          {item.quantity}
                        </button>
                        {item.packSize && item.packSize > 1 && (
                          <span className="text-[9px] font-black text-primary/70 bg-primary/5 px-1 rounded border border-primary/10">
                            x{item.packSize}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground text-[14px] font-digital">{item.price.toFixed(2)} DA</td>
                    <td className="px-3 py-2.5 text-right font-bold text-foreground text-[14px] font-digital">{(item.quantity * item.price).toFixed(2)} DA</td>
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
        </ScrollArea>

        {/* Bottom bar */}
        <div className="px-3 py-1.5 border-t border-register-border bg-muted flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{cart.length} {t("label.articles")}</span>
          <span>{t("label.totalQty")}: {cart.reduce((s, i) => s + i.quantity, 0)}</span>
          <span>{t("label.cashBalance")}: {cashBalance.toFixed(2)} DA</span>
        </div>
      </div>

      {/* RIGHT RESIZE DIVIDER */}
      <div
        onMouseDown={handleDividerMouseDown}
        className={`w-[5px] flex-shrink-0 relative group z-10 ${settings.lockRegisterPanels ? "cursor-default" : "cursor-col-resize"}`}
        style={{ background: "transparent" }}
      >
        <div
          className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-[3px] transition-all duration-150
            bg-register-border ${!settings.lockRegisterPanels ? "group-hover:bg-primary group-hover:w-[4px] group-active:bg-primary" : "opacity-30"}`}
        />
      </div>

      {/* RIGHT PANEL — resizable hotkey buttons */}
      <div
        className="flex flex-col border-l border-register-border bg-card overflow-hidden flex-shrink-0"
        style={{ width: panelWidth }}
      >
        <div className="flex flex-col bg-white border-b border-register-border flex-shrink-0 items-center justify-center relative overflow-hidden" style={{ padding: Math.round(12 * headerScale) }}>
          {/* Subtle background glow */}
          <div className="absolute top-0 left-0 w-24 h-24 bg-orange-500/5 blur-3xl rounded-full -translate-y-1/2 -translate-x-1/2" />

          <div className="flex flex-col items-center mb-2">
            <div
              className="rounded-full border-2 border-primary flex items-center justify-center text-primary mb-1 bg-white shadow-sm"
              style={{ 
                width: Math.round(42 * headerScale), 
                height: Math.round(42 * headerScale) 
              }}
            >
              <User style={{ width: Math.round(22 * headerScale), height: Math.round(22 * headerScale) }} />
            </div>
            <span
              className="font-black uppercase ds-gradient-text tracking-tight"
              style={{ fontSize: Math.round(18 * headerScale) }}
            >
              {activeUser.name}
            </span>
          </div>
          <div className="flex items-center justify-center" style={{ gap: Math.round(16 * headerScale) }}>
            <div className="flex items-center" style={{ gap: Math.round(6 * headerScale) }}>
              <div
                className="rounded-full border border-primary/30 flex items-center justify-center text-primary"
                style={{ padding: Math.round(3.5 * headerScale) }}
              >
                <CalendarDays style={{ width: Math.round(10 * headerScale), height: Math.round(10 * headerScale) }} />
              </div>
              <span className="font-bold text-slate-600" style={{ fontSize: Math.round(12 * headerScale) }}>{dateStr}</span>
            </div>
            <div className="flex items-center" style={{ gap: Math.round(6 * headerScale) }}>
              <div
                className="rounded-full border border-primary/30 flex items-center justify-center text-primary"
                style={{ padding: Math.round(3.5 * headerScale) }}
              >
                <Clock style={{ width: Math.round(10 * headerScale), height: Math.round(10 * headerScale) }} />
              </div>
              <span className="font-bold text-slate-600" style={{ fontSize: Math.round(12 * headerScale) }}>{timeStr}</span>
            </div>
          </div>
        </div>

        {/* Button grid — reflows instantly as panelWidth changes */}
        <ScrollArea className="flex-1 p-1.5 pr-2.5">
          {(() => {
            // Build rows so the last row can be centered if it's partial
            const rows: typeof visibleButtons[] = [];
            for (let i = 0; i < visibleButtons.length; i += panelCols) {
              rows.push(visibleButtons.slice(i, i + panelCols));
            }
            return rows.map((row, rowIdx) => {
              const isFull = row.length === panelCols;
              // Calculate explicit width for each button to ensure orphans don't expand
              // 12px for p-1.5 (6px each side), 4px for gap-1
              const totalGapWidth = (panelCols - 1) * 4;
              const btnWidth = Math.floor((panelWidth - 12 - totalGapWidth) / panelCols);

              return (
                <div
                  key={rowIdx}
                  className="flex gap-1 mb-1"
                  style={{ justifyContent: isFull ? "stretch" : "center" }}
                >
                  {row.map((btn) => {
                    const shortcut = userHotkeys[btn.key] || "";
                    const theme = getActionTheme(btn.key);
                    const iconSize = Math.round(16 * btnScale);
                    const labelSize = Math.round(7.5 * btnScale);
                    const badgeSize = Math.round(8 * btnScale);
                    const btnHeight = Math.round(85 * Math.min(btnScale, 1.25));

                    return (
                      <button
                        key={btn.key}
                        onClick={() => actions[btn.key]?.()}
                        className="flex flex-col bg-white border border-gray-100
                          transition-all duration-75 active:scale-95 overflow-hidden flex-shrink-0 relative group shadow-sm hover:shadow-md"
                        style={{ height: btnHeight, width: btnWidth }}
                      >
                        {/* Notch indicator */}
                        <div className="absolute top-0 right-0 w-5 h-5 overflow-hidden">
                          <div className={`absolute top-0 right-0 w-7 h-7 ${theme.bg} rotate-45 transform origin-bottom-left translate-x-[40%] -translate-y-[40%] shadow-sm`} />
                        </div>

                        {/* Content: Centered Icon + Label */}
                        <div className="flex flex-col items-center justify-center flex-1 w-full px-1 py-1">
                          <div
                            className={`rounded-full border flex items-center justify-center mb-1.5 transition-transform group-hover:scale-110 ${theme.text} ${theme.border}`}
                            style={{
                              padding: Math.round(5 * btnScale),
                              borderWidth: Math.max(1, Math.round(1 * btnScale)),
                            }}
                          >
                            <btn.icon style={{ width: iconSize, height: iconSize }} />
                          </div>
                          <span
                            className="font-black uppercase leading-none text-center text-slate-700"
                            style={{
                              fontSize: labelSize,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              lineHeight: "1.1",
                            }}
                          >
                            {t(btn.key)}
                          </span>
                        </div>

                        {/* Floating Hotkey label */}
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-sm bg-gray-50/80 backdrop-blur-sm border border-gray-100 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                          <span className="font-black text-slate-500" style={{ fontSize: badgeSize * 0.9 }}>
                            {shortcut || "—"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            });
          })()}
        </ScrollArea>
      </div>
    </div>
  );
};

export default Register;
