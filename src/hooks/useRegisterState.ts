import { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore, STANDARD_CASHIER } from "@/hooks/useUserStore";
import { useSettings } from "@/hooks/useSettings";
import { useCashRegister } from "@/hooks/useCashRegister";
import { useRegisterKeyboard } from "@/hooks/useRegisterKeyboard";
import { useSalesHistory } from "@/hooks/useSalesHistory";
import { useContacts } from "@/hooks/useContacts";
import { useInventory } from "@/hooks/useInventory";
import { useResizablePanel } from "@/hooks/useResizablePanel";

import {
  addProductToCartItems,
  applyGiftToCartItem,
  calculateRegisterTotals,
  cycleCartItemPackVariant,
  removeCartItemById,
  removeProductFromCartItems,
  updateCartItemQuantity,
} from "@/services/register/cart";
import { loadRegisterSession, saveRegisterSession } from "@/services/register/sessionPersistence";
import { closeActiveShift, ensureActiveShift } from "@/services/register/shiftPersistence";
import { finalizePersistedRegisterCheckout } from "@/services/sales/historyPersistence";
import {
  ALL_ACTION_BUTTONS,
  getActionTheme,
  computeRegisterLayout,
} from "@/services/register/registerConstants";
import { createRegisterActions } from "@/services/register/registerActions";

import type {
  CartItem,
  RegisterProductInput,
  RegisterSessionState,
  DiscountState,
} from "@/types/register";
import type { RegisterShift } from "@/types/shift";

const REGISTER_ID = "register-main";

/**
 * useRegisterState — The "Brain" of the Register page.
 * Extracts ~600 lines of orchestration, persistence, and state management.
 */
export function useRegisterState() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { currentUser, logout, isOpenMode } = useUserStore();
  const activeUser = currentUser || STANDARD_CASHIER;
  const { settings, getHotkeys } = useSettings(activeUser.id);
  const { balance: cashBalance, addMovement } = useCashRegister();
  const { sales, refundSale, refundItems, injectSale } = useSalesHistory();
  const { addCredit } = useContacts();
  const { products: allProducts } = useInventory();

  // ── Core State ──
  const [clientStates, setClientStates] = useState<Record<number, { items: CartItem[]; selectedItemId: string | null }>>(() => {
    return Object.fromEntries([1, 2, 3, 4, 5, 6].map((k) => [k, { items: [], selectedItemId: null }]));
  });
  const [activeClient, setActiveClient] = useState(1);
  const [discount, setDiscount] = useState<DiscountState>({ type: "percent", value: 0 });
  const [activeShift, setActiveShift] = useState<RegisterShift | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockPassword, setLockPassword] = useState("");
  const [now, setNow] = useState(new Date());

  // ── Dialog State ──
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState("");
  const [quantityValue, setQuantityValue] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [prixLibreValue, setPrixLibreValue] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [cashNote, setCashNote] = useState("");

  const [quantityDialog, setQuantityDialog] = useState(false);
  const [discountDialog, setDiscountDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [cashDialog, setCashDialog] = useState<"add" | "remove" | null>(null);
  const [salesHistoryOpen, setSalesHistoryOpen] = useState(false);
  const [prixLibreDialog, setPrixLibreDialog] = useState(false);

  // ── Lovable Integration State ──
  const [treasuryOpen, setTreasuryOpen] = useState(false);
  const [cartsManagerOpen, setCartsManagerOpen] = useState(false);
  const [clientAssocOpen, setClientAssocOpen] = useState(false);
  const [labelPreviewOpen, setLabelPreviewOpen] = useState(false);
  const [shakingItemId, setShakingItemId] = useState<string | null>(null);

  const [assignedClients, setAssignedClients] = useState<Record<number, any>>({
    1: null, 2: null, 3: null, 4: null, 5: null, 6: null
  });

  // ── Refs ──
  const persistTimeoutRef = useRef<number | null>(null);
  const cartScrollRef = useRef<HTMLDivElement>(null);
  const selectedRowRef = useRef<HTMLTableRowElement>(null);
  const actionsProxy = useMemo(() => ({} as Record<string, () => void>), []);

  // ── Derivations ──
  const activeState = clientStates[activeClient] || { items: [], selectedItemId: null };
  const { items: cart, selectedItemId } = activeState;
  const { subtotal, discountAmount, total: totalTTC } = calculateRegisterTotals(cart, discount);

  const updateActiveClientState = useCallback((updater: (prev: { items: CartItem[]; selectedItemId: string | null }) => { items: CartItem[]; selectedItemId: string | null }) => {
    setClientStates((prev) => ({
      ...prev,
      [activeClient]: updater(prev[activeClient] || { items: [], selectedItemId: null }),
    }));
  }, [activeClient]);

  const updateCart = useCallback((updater: (prev: CartItem[]) => CartItem[]) => {
    updateActiveClientState((prev) => ({ ...prev, items: updater(prev.items) }));
  }, [updateActiveClientState]);

  const setSelectedItemId = useCallback((id: string | null) => {
    updateActiveClientState((prev) => ({ ...prev, selectedItemId: id }));
  }, [updateActiveClientState]);

  // ── Layout Control ──
  const { width: leftPanelWidth, onMouseDown: handleLeftDividerMouseDown } = useResizablePanel({
    minWidth: 160, maxWidth: 400, defaultWidth: 240, storageKey: "register_left_panel_width", side: "left", lockPanels: settings.lockRegisterPanels
  });
  const { width: panelWidth, onMouseDown: handleDividerMouseDown } = useResizablePanel({
    minWidth: 320, maxWidth: 600, defaultWidth: 340, storageKey: "register_hotkey_panel_width", side: "right", lockPanels: settings.lockRegisterPanels
  });

  const layout = useMemo(() => computeRegisterLayout(panelWidth, leftPanelWidth), [panelWidth, leftPanelWidth]);

  // ── Keyboard Wrapper ──
  const userHotkeys = useMemo(() => getHotkeys(), [getHotkeys]);
  const { multiplier, multiplierDisplay, resetMultiplier } = useRegisterKeyboard({
    actions: actionsProxy,
    hotkeys: userHotkeys,
    isLocked,
    openDialogs: {
      search: searchOpen, quantity: quantityDialog, discount: discountDialog,
      prixLibre: prixLibreDialog, salesHistory: salesHistoryOpen,
      payment: paymentDialog, cash: !!cashDialog
    },
    cartLength: cart.length,
    selectedItemId,
    onNavigateCart: (dir) => {
      const idx = cart.findIndex(i => i.id === selectedItemId);
      if (idx === -1) { if (cart.length) setSelectedItemId(cart[0].id); }
      else { const next = (idx + (dir === "up" ? -1 : 1) + cart.length) % cart.length; setSelectedItemId(cart[next].id); }
    },
    onSwitchClient: (dir) => setActiveClient(p => (dir === "left" ? (p === 1 ? 6 : p - 1) : (p === 6 ? 1 : p + 1))),
    onTriggerSearch: (char) => { setSearchInitialQuery(char); setSearchOpen(true); },
    onDismissTopDialog: () => {
      if (searchOpen) setSearchOpen(false);
      else if (quantityDialog) setQuantityDialog(false);
      else if (discountDialog) setDiscountDialog(false);
      else if (prixLibreDialog) setPrixLibreDialog(false);
      else if (salesHistoryOpen) setSalesHistoryOpen(false);
      else if (paymentDialog) setPaymentDialog(false);
      else if (cashDialog) setCashDialog(null);
      else if (treasuryOpen) setTreasuryOpen(false);
      else if (cartsManagerOpen) setCartsManagerOpen(false);
      else if (clientAssocOpen) setClientAssocOpen(false);
      else if (labelPreviewOpen) setLabelPreviewOpen(false);
      else if (multiplier > 1 || multiplierDisplay.pending !== "") resetMultiplier();
      else if (selectedItemId) setSelectedItemId(null);
    },
    onDeselectItem: () => setSelectedItemId(null),
    onBarcodeScanned: (code) => {
      const p = allProducts.find(v => v.barcode === code || (v.barcodes && v.barcodes.includes(code)));
      if (p) addProductToCart(p as any);
      else addProductToCart({ name: `Article ${code}`, price: 0, barcode: code } as any);
    },
    onScaleBarcodeScanned: (plu, weight) => {
      const p = allProducts.find(v => v.plu === plu || v.barcode === plu);
      if (p) addProductToCart({ ...p, quantity: weight } as any);
    },
    barcodeScaleSettings: settings.hardware?.barcodeScale,
  });

  const triggerShake = useCallback((id: string) => {
    setShakingItemId(id);
    setTimeout(() => setShakingItemId(null), 500);
  }, []);

  // ── Actions & Handlers ──
  const addProductToCart = useCallback((product: RegisterProductInput) => {
    const qty = multiplier > 1 ? multiplier : (product.quantity || 1);
    const resolvedId = product.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    updateCart((prev) => addProductToCartItems(prev, { ...product, id: resolvedId, quantity: qty }));
    setSelectedItemId(resolvedId);
    resetMultiplier();
    toast({ title: product.name, description: t("toast.itemAdded") });
  }, [updateCart, t, toast, multiplier, resetMultiplier, setSelectedItemId]);

  const removeProductFromCart = useCallback((productId: string) => {
    updateCart((prev) => {
      const idx = prev.findIndex(i => i.id === productId);
      const nextItems = removeProductFromCartItems(prev, productId);
      if (productId === selectedItemId) {
        if (nextItems.length === 0) setSelectedItemId(null);
        else {
          const nextId = nextItems[idx]?.id || nextItems[idx - 1]?.id || null;
          setSelectedItemId(nextId);
        }
      }
      return nextItems;
    });
  }, [updateCart, selectedItemId, setSelectedItemId]);

  const processPayment = async (method: "cash" | "card" | "credit") => {
    if (cart.length === 0) return;
    const assignedClient = assignedClients[activeClient];
    if (method === "credit" && !assignedClient) {
      setCartsManagerOpen(false); // Close if open
      setPaymentDialog(false); // Close if open
      setClientAssocOpen(true);
      return;
    }
    try {
      const saleDraft = {
        items: cart.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price, barcode: i.barcode })),
        subtotal,
        discount: discount.value,
        discountType: discount.type,
        total: totalTTC,
        paymentMethod: method,
        clientNumber: activeClient,
        clientName: assignedClient?.name,
        cashierName: activeUser.name,
        cashierId: activeUser.id,
      };
      const savedSale = await finalizePersistedRegisterCheckout({
        sale: saleDraft,
        session: {
          registerId: REGISTER_ID, activeClient, discount: 0, discountType: "percent",
          clientCarts: Object.fromEntries(
            Object.entries(clientStates).map(([k, v]) => [Number(k), Number(k) === activeClient ? [] : v.items])
          ),
          assignedClients,
          updatedAt: new Date().toISOString()
        }
      });
      if (savedSale) injectSale(savedSale);
      if (method === "cash") await addMovement({ type: "sale", amount: totalTTC, note: `Vente Client N°${activeClient}`, userId: activeUser.id, userName: activeUser.name });
      if (method === "credit" && assignedClient) {
        addCredit(assignedClient.id, -totalTTC);
      }
      updateCart(() => []);
      setSelectedItemId(null);
      setDiscount({ type: "percent", value: 0 });
      setPaymentDialog(false);
      toast({ title: t("toast.paymentProcessed") });
    } catch (e) { console.error(e); }
  };

  const actionCallbacks = {
    onAddSelected: () => { const item = cart.find(i => i.id === selectedItemId); if (item) addProductToCart(item); },
    onDeductSelected: () => { if (selectedItemId) removeProductFromCart(selectedItemId); },
    onRemoveSelected: () => {
      if (!selectedItemId) return;
      const idx = cart.findIndex(i => i.id === selectedItemId);
      updateCart(prev => removeCartItemById(prev, selectedItemId));

      const newItems = cart.filter(i => i.id !== selectedItemId);
      if (newItems.length === 0) {
        setSelectedItemId(null);
      } else {
        // Priority: Neighbor above, else neighbor below
        const nextId = newItems[idx - 1]?.id || newItems[idx]?.id || null;
        setSelectedItemId(nextId);
      }
    },
    onVoidTransaction: () => { updateCart(() => []); setSelectedItemId(null); setDiscount({ type: "percent", value: 0 }); },
    onGift: () => { if (selectedItemId) updateCart(prev => applyGiftToCartItem(prev, selectedItemId)); },
    onPackCycle: () => {
      if (!selectedItemId) return;
      
      const cartItem = cart.find(i => i.id === selectedItemId);
      if (!cartItem) return;

      const product = allProducts.find(p => p.name === cartItem.originalName || p.name === cartItem.name || p.barcode === cartItem.barcode);
      const variants = product?.packVariants || [];

      if (variants.length === 0) {
        triggerShake(selectedItemId);
        return;
      }

      // Always cycle through variants sequentially
      const variantMap = { [cartItem.originalName || cartItem.name]: variants };
      const res = cycleCartItemPackVariant(cart, selectedItemId, variantMap as any);
      if (res.changed) updateCart(() => res.items);
    },
    onOpenQuantityDialog: () => {
      const item = cart.find(i => i.id === selectedItemId);
      if (item) {
        setQuantityValue(item.quantity.toString());
        setQuantityDialog(true);
      }
    },
    onOpenDiscountDialog: () => { setDiscountValue(""); setDiscountType(discount.type); setDiscountDialog(true); },
    onOpenPaymentDialog: () => setPaymentDialog(true),
    onOpenPrixLibre: () => { setPrixLibreValue(""); setPrixLibreDialog(true); },
    onOpenSalesHistory: () => setSalesHistoryOpen(true),
    onOpenCartsManager: () => setCartsManagerOpen(true),
    onOpenCashDialog: (type: "add" | "remove") => setCashDialog(type),
    onReturn: () => {
      if (selectedItemId) { updateCart(prev => removeCartItemById(prev, selectedItemId)); setSelectedItemId(null); toast({ title: t("toast.returnProcessed") }); }
      else toast({ title: t("toast.noItemSelected") });
    },
    onPrintDraft: () => toast({ title: t("action.printDraft") }),
    onPrintLabel: () => {
      const item = cart.find(i => i.id === selectedItemId) || cart[cart.length - 1];
      if (item) {
        if (item.id !== selectedItemId) setSelectedItemId(item.id);
        setLabelPreviewOpen(true);
      } else {
        toast({ title: t("toast.error"), description: "Aucun article dans le panier", variant: "destructive" });
      }
    },
    onLock: () => setIsLocked(true),
    onCloseShift: async () => {
      if (cart.length > 0) return;
      if (activeShift) {
        await closeActiveShift({ registerId: REGISTER_ID, userId: activeUser.id, userName: activeUser.name, closingBalance: cashBalance });
        setActiveShift(null);
      }
      if (!isOpenMode()) logout();
      navigate("/");
    },
    onTreasuryInfo: () => setTreasuryOpen(true),
    onClientInfo: () => setClientAssocOpen(true),
  };

  const actions = createRegisterActions(actionCallbacks);
  Object.assign(actionsProxy, actions);



  // ── Persistence Effects ──
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadSession = async () => {
      try {
        const persisted = await loadRegisterSession(REGISTER_ID);
        if (cancelled || !persisted) { setSessionReady(true); return; }
        setClientStates(Object.fromEntries(
          Object.entries(persisted.clientCarts || {}).map(([k, items]) => [Number(k), { items, selectedItemId: null }])
        ));
        setDiscount({ type: persisted.discountType || "percent", value: persisted.discount || 0 });
        setActiveClient(persisted.activeClient || 1);
        setAssignedClients(persisted.assignedClients || {});
        setSessionReady(true);
      } catch (e) { setSessionReady(true); }
    };
    loadSession();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    if (persistTimeoutRef.current) window.clearTimeout(persistTimeoutRef.current);
    persistTimeoutRef.current = window.setTimeout(() => {
      const session: RegisterSessionState = {
        registerId: REGISTER_ID,
        activeClient,
        discount: discount.value,
        discountType: discount.type,
        clientCarts: Object.fromEntries(Object.entries(clientStates).map(([k, v]) => [Number(k), v.items])),
        assignedClients,
        updatedAt: new Date().toISOString()
      };
      saveRegisterSession(session);
    }, 1000);
  }, [activeClient, clientStates, discount, sessionReady, assignedClients]);

  useEffect(() => {
    ensureActiveShift({ registerId: REGISTER_ID, userId: activeUser.id, userName: activeUser.name, openingFloat: 0 }).then(setActiveShift);
  }, [activeUser.id]);

  useLayoutEffect(() => {
    if (selectedItemId && selectedRowRef.current) selectedRowRef.current.scrollIntoView({ block: "nearest" });
  }, [selectedItemId]);

  // ── Final Handlers ──
  const handleUnlock = () => {
    if (lockPassword === "1234" || lockPassword === "0000") { setIsLocked(false); setLockPassword(""); }
    else toast({ title: t("dialog.lock.error"), variant: "destructive" });
  };

  const confirmQuantity = () => {
    const val = parseFloat(quantityValue);
    if (!isNaN(val) && val > 0 && selectedItemId) {
      updateCart(prev => updateCartItemQuantity(prev, selectedItemId, val));
      setQuantityDialog(false);
    }
  };

  const confirmDiscount = () => {
    const val = parseFloat(discountValue);
    if (!isNaN(val) && val >= 0) {
      if (selectedItemId) updateCart(prev => prev.map(i => i.id === selectedItemId ? { ...i, price: discountType === "percent" ? i.originalPrice * (1 - val / 100) : Math.max(0, i.originalPrice - val) } : i));
      else setDiscount({ type: discountType, value: val });
      setDiscountDialog(false);
    }
  };

  const confirmPrixLibre = () => {
    const val = parseFloat(prixLibreValue);
    if (!isNaN(val) && val > 0) {
      addProductToCart({ id: `misc-${Date.now()}`, name: t("label.misc") || "DIVERS", price: val, quantity: 1, barcode: "0000" });
      setPrixLibreDialog(false);
    }
  };

  const confirmCash = async () => {
    const val = parseFloat(cashAmount);
    if (isNaN(val) || val <= 0 || !cashDialog) return;

    if (cashDialog === "remove" && val > cashBalance) {
      toast({
        title: t("dialog.cash.error.insufficient"),
        description: t("dialog.cash.error.insufficient_desc"),
        variant: "destructive"
      });
      return;
    }

    await addMovement({ type: cashDialog === "add" ? "add" : "remove", amount: val, note: cashNote || "Mouvement", userId: activeUser.id, userName: activeUser.name });
    setCashDialog(null); setCashAmount(""); setCashNote(""); toast({ title: t("toast.cashMovementRecorded") });
  };


  const performMoveItems = (sourceCart: number, targetCart: number, itemIds: string[]) => {
    setClientStates(prev => {
      const source = [...(prev[sourceCart]?.items || [])];
      const target = [...(prev[targetCart]?.items || [])];
      
      const movedItems: CartItem[] = [];
      const remainingItems = source.filter(item => {
        if (itemIds.includes(item.id)) {
          movedItems.push(item);
          return false;
        }
        return true;
      });

      movedItems.forEach(item => {
        const existing = target.find(i => i.name === item.name && i.price === item.price && !i.isReturn);
        if (existing) existing.quantity += item.quantity;
        else target.push({ ...item, id: `${item.id}-m${Date.now()}` });
      });

      return {
        ...prev,
        [sourceCart]: { ...prev[sourceCart], items: remainingItems, selectedItemId: itemIds.includes(prev[sourceCart].selectedItemId || "") ? null : prev[sourceCart].selectedItemId },
        [targetCart]: { ...prev[targetCart], items: target }
      };
    });
  };

  const performSplitItem = (sourceCart: number, targetCart: number, itemId: string, quantity: number) => {
    setClientStates(prev => {
      const source = [...(prev[sourceCart]?.items || [])];
      const target = [...(prev[targetCart]?.items || [])];
      const itemIdx = source.findIndex(i => i.id === itemId);
      
      if (itemIdx === -1) return prev;
      
      const item = { ...source[itemIdx] };
      if (item.quantity <= quantity) return prev; // Should use move instead

      item.quantity -= quantity;
      source[itemIdx] = item;
      
      const splitPart = { ...item, id: `${item.id}-s${Date.now()}`, quantity };
      const existing = target.find(i => i.name === item.name && i.price === item.price && !i.isReturn);
      if (existing) existing.quantity += quantity;
      else target.push(splitPart);

      return {
        ...prev,
        [sourceCart]: { ...prev[sourceCart], items: source },
        [targetCart]: { ...prev[targetCart], items: target }
      };
    });
  };

  const performMergeCarts = (sourceCart: number, targetCart: number) => {
    if (sourceCart === targetCart) return;
    setClientStates(prev => {
      const source = prev[sourceCart]?.items || [];
      const target = [...(prev[targetCart]?.items || [])];
      
      source.forEach(item => {
        const existing = target.find(i => i.name === item.name && i.price === item.price && !i.isReturn);
        if (existing) existing.quantity += item.quantity;
        else target.push({ ...item, id: `${item.id}-c${Date.now()}` });
      });

      return {
        ...prev,
        [sourceCart]: { ...prev[sourceCart], items: [], selectedItemId: null },
        [targetCart]: { ...prev[targetCart], items: target }
      };
    });
  };

  const hiddenActions = settings.hiddenActions || [];
  const visibleButtons = ALL_ACTION_BUTTONS.filter(btn => !hiddenActions.includes(btn.key));

  return {
    state: {
      activeUser, clientStates, activeClient, cart, selectedItemId, discount,
      isLocked, lockPassword, allProducts, now, multiplier, multiplierDisplay,
      visibleButtons,
      dialogs: {
        searchOpen, searchInitialQuery, quantityDialog, quantityValue,
        discountDialog, discountValue, discountType, paymentDialog,
        cashDialog, cashAmount, cashNote, salesHistoryOpen,
        prixLibreDialog, prixLibreValue,
        treasuryOpen, cartsManagerOpen, clientAssocOpen,
        labelPreviewOpen,
        shakingItemId,
      },
      assignedClients,
    },
    totals: { subtotal, discountAmount, totalTTC },
    layout: {
      ...layout, leftPanelWidth, panelWidth, handleLeftDividerMouseDown, handleDividerMouseDown
    },
    actions: {
      ...actionCallbacks,
      setActiveClient, setSearchOpen, setSearchInitialQuery, setQuantityDialog,
      setQuantityValue, setDiscountDialog, setDiscountValue, setDiscountType,
      setPaymentDialog, setCashDialog, setCashAmount, setCashNote,
      setSalesHistoryOpen, setPrixLibreDialog, setPrixLibreValue,
      setLockPassword, handleUnlock, confirmQuantity, confirmDiscount,
      confirmPrixLibre, confirmCash, processPayment,
      performMoveItems, performSplitItem, performMergeCarts,
      addProductToCart, refundSale, refundItems, setSelectedItemId,
      setTreasuryOpen, setCartsManagerOpen, setClientAssocOpen,
      setLabelPreviewOpen,
      setAssignedClients,
      isOpenMode, logout, settings, sales, cashBalance, userHotkeys,
      fullActions: actionsProxy
    },
    refs: { cartScrollRef, selectedRowRef }
  };
};
