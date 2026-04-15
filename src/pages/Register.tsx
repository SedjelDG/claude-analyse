import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { useRegisterState } from "@/hooks/useRegisterState";
import {
  Lock, CreditCard, Clock, CalendarDays,
  Banknote, Settings, LogOut, Shield, User,
  Hash, Combine,
} from "lucide-react";

import RegisterSearchBar from "@/components/register/RegisterSearchBar";
import SalesHistoryDialog from "@/components/register/SalesHistoryDialog";
import { ActionButtonGrid } from "@/components/register/ActionButtonGrid";
import { CartItemRow } from "@/components/register/CartItemRow";

// Lovable Components
import TreasuryHub from "@/components/register/TreasuryHub";
import CartsManager from "@/components/register/CartsManager";
import ClientAssociation from "@/components/register/ClientAssociation";
import LabelPreview from "@/components/register/LabelPreview";
import PackCyclePopover from "@/components/register/PackCyclePopover";

// Dialog Components
import { LockOverlay } from "@/components/register/dialogs/LockOverlay";
import { QuantityDialog } from "@/components/register/dialogs/QuantityDialog";
import { DiscountDialog } from "@/components/register/dialogs/DiscountDialog";
import { PrixLibreDialog } from "@/components/register/dialogs/PrixLibreDialog";
import { PaymentDialog } from "@/components/register/dialogs/PaymentDialog";
import { CashMovementDialog } from "@/components/register/dialogs/CashMovementDialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const REGISTER_ID = "register-main";

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ── Register Brain Hook ──
  const {
    state: {
      activeUser, clientStates, activeClient, cart, selectedItemId, discount,
      isLocked, lockPassword, allProducts, now, multiplier, multiplierDisplay,
      visibleButtons,
      dialogs: {
        searchOpen, searchInitialQuery, quantityDialog, quantityValue,
        discountDialog, discountValue, discountType, paymentDialog,
        cashDialog, cashAmount, cashNote, salesHistoryOpen,
        prixLibreDialog, prixLibreValue, mergeDialogOpen,
        treasuryOpen, cartsManagerOpen, clientAssocOpen,
        labelPreviewOpen, packCycleOpen, packCycleAnchor,
        shakingItemId,
      },
      assignedClients,
    },
    totals: { subtotal, discountAmount, totalTTC },
    layout: {
      panelCols, btnScale, headerScale, leftPanelScale,
      leftPanelWidth, panelWidth, handleLeftDividerMouseDown, handleDividerMouseDown
    },
    actions: {
      onAddSelected, onDeductSelected, onRemoveSelected, onVoidTransaction,
      onGift, onPackCycle, onPackSelect, onOpenQuantityDialog, onOpenDiscountDialog,
      onOpenPaymentDialog, onOpenPrixLibre, onOpenSalesHistory, onOpenMergeCarts,
      onOpenCashDialog, onLock, onCloseShift,
      setActiveClient, setSearchOpen, setSearchInitialQuery, setQuantityDialog,
      setQuantityValue, setDiscountDialog, setDiscountValue, setDiscountType,
      setPaymentDialog, setCashDialog, setCashAmount, setCashNote,
      setSalesHistoryOpen, setPrixLibreDialog, setPrixLibreValue, setMergeDialogOpen,
      setLockPassword, handleUnlock, confirmQuantity, confirmDiscount,
      confirmPrixLibre, confirmCash, performMerge, processPayment,
      performMoveItems, performSplitItem, performMergeCarts,
      addProductToCart, refundSale, refundItems,
      setTreasuryOpen, setCartsManagerOpen, setClientAssocOpen,
      setLabelPreviewOpen, setPackCycleOpen, setAssignedClients, setPackCycleAnchor,
      isOpenMode, logout, settings, sales, cashBalance,
      onReturn, onPrintDraft, onPrintLabel,
      onTreasuryInfo, onClientInfo, onOpenCartsManager,
      userHotkeys, fullActions, setSelectedItemId
    },
    refs: { cartScrollRef, selectedRowRef }
  } = useRegisterState() as any; // Cast for now until hook types are perfected

  // Dynamic shortcuts
  const shortcutsData = (allProducts || []).filter(p => p.isActive).slice(0, 10).map(p => ({
    name: p.shortLabel || p.name,
    color: p.buttonColor || "bg-primary/10",
    productId: p.id,
  }));

  const dateStr = now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const handleShortcutClick = (id: string) => {
    const p = allProducts.find(x => x.id === id);
    if (p) addProductToCart(p as any);
  };

  // Map action callbacks to useable handlers (internal registry)
  const actionHandlers: Record<string, () => void> = {
    "action.add": onAddSelected,
    "action.deduct": onDeductSelected,
    "action.remove": onRemoveSelected,
    "action.void": onVoidTransaction,
    "action.gift": onGift,
    "action.return": onReturn,
    "action.pack": onPackCycle,
    "action.qty": onOpenQuantityDialog,
    "action.discount": onOpenDiscountDialog,
    "action.pay": onOpenPaymentDialog,
    "action.misc": onOpenPrixLibre,
    "action.history": onOpenSalesHistory,
    "action.cashAdd": () => onOpenCashDialog("add"),
    "action.cashRemove": () => onOpenCashDialog("remove"),
    "action.lock": onLock,
    "action.close": onCloseShift,
    "action.printDraft": onPrintDraft,
    "action.printLabel": onPrintLabel,
    "action.deposit": onTreasuryInfo, // Treasury Hub acts as the hub
    "action.drawer": onTreasuryInfo,
    "action.client": onClientInfo,
    "action.paniers": onOpenCartsManager, // Carts Manager hub
  };

  return (
    <div className="h-screen flex bg-register-bg overflow-hidden select-none">
      <LockOverlay
        isLocked={isLocked}
        lockPassword={lockPassword}
        setLockPassword={setLockPassword}
        handleUnlock={handleUnlock}
        t={t}
      />

      <QuantityDialog
        isOpen={quantityDialog}
        value={quantityValue}
        onChange={setQuantityValue}
        onConfirm={confirmQuantity}
        onClose={() => setQuantityDialog(false)}
        t={t}
      />

      <DiscountDialog
        isOpen={discountDialog}
        value={discountValue}
        type={discountType}
        isItemScoped={!!selectedItemId}
        onChange={setDiscountValue}
        onTypeChange={setDiscountType}
        onConfirm={confirmDiscount}
        onClose={() => setDiscountDialog(false)}
        t={t}
      />

      <SalesHistoryDialog
        open={salesHistoryOpen}
        onClose={() => setSalesHistoryOpen(false)}
        sales={sales}
        refundSale={refundSale}
        refundItems={refundItems}
      />


      <PrixLibreDialog
        isOpen={prixLibreDialog}
        value={prixLibreValue}
        onChange={setPrixLibreValue}
        onConfirm={confirmPrixLibre}
        onClose={() => setPrixLibreDialog(false)}
        t={t}
      />

      <PaymentDialog
        isOpen={paymentDialog}
        totalTTC={totalTTC}
        onPay={processPayment}
        onClose={() => setPaymentDialog(false)}
        t={t}
        hasAssignedClient={!!assignedClients[activeClient]}
      />

      <CashMovementDialog
        type={cashDialog}
        cashBalance={cashBalance}
        amount={cashAmount}
        note={cashNote}
        onAmountChange={setCashAmount}
        onNoteChange={setCashNote}
        onConfirm={confirmCash}
        onClose={() => {
          setCashDialog(null);
          setCashAmount("");
          setCashNote("");
        }}
        t={t}
      />

      <TreasuryHub
        open={treasuryOpen}
        onClose={() => setTreasuryOpen(false)}
        userId={activeUser.id}
        userName={activeUser.name}
      />

      <CartsManager
        open={cartsManagerOpen}
        onClose={() => setCartsManagerOpen(false)}
        clientCarts={Object.fromEntries(Object.entries(clientStates).map(([k, v]: any) => [k, v.items]))}
        onMoveItems={performMoveItems}
        onSplitItem={performSplitItem}
        onMergeCarts={performMergeCarts}
        activeClient={activeClient}
        assignedClients={assignedClients}
      />

      <ClientAssociation 
        open={clientAssocOpen}
        onClose={() => setClientAssocOpen(false)}
        onAssign={(client) => {
          setAssignedClients((prev: any) => ({ ...prev, [activeClient]: client }));
          setClientAssocOpen(false);
        }}
        currentClient={assignedClients[activeClient]}
      />

      <LabelPreview
        open={labelPreviewOpen}
        onClose={() => setLabelPreviewOpen(false)}
        product={cart.find((i: any) => i.id === selectedItemId)}
      />


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
          <div className="flex justify-between items-center px-4 pt-1 mb-2">
            <span className="text-[12px] font-bold text-muted-foreground uppercase">{t("label.discount")}:</span>
            <span className={`text-[12px] font-black font-digital ${discount.value > 0 ? "text-primary" : "text-foreground"}`}>
              {discount.value > 0 ? (discount.type === "percent" ? `${discount.value}%` : `${discount.value.toFixed(2)} DA`) : "0.00"}
            </span>
          </div>
          {shortcutsData.map((s, i) => (
            <button key={i} onClick={() => handleShortcutClick(s.productId)} className="flex items-center gap-2 w-full px-3 py-2 border-b border-register-border hover:bg-muted/60 transition-colors text-left active:scale-[0.98] focus:outline-none focus:ring-0 focus-visible:outline-none outline-none ring-0">
              <span className={`w-3 h-3 rounded-full ${s.color} shrink-0`} />
              <span className="text-[11px] font-medium text-foreground truncate">{s.name}</span>
            </button>
          ))}
        </ScrollArea>

        <div className="border-t border-register-border flex flex-shrink-0 overflow-hidden">
          <button onClick={() => navigate("/settings", { state: { from: "/register" } })} className="flex items-center gap-2 justify-center flex-1 px-1 py-2 text-[11px] font-medium text-muted-foreground hover:bg-muted transition-colors border-r border-register-border min-w-0 focus:outline-none focus:ring-0 focus-visible:outline-none outline-none ring-0">
            <Settings className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{t("label.settings")}</span>
          </button>
          <button onClick={() => { if (!isOpenMode()) logout(); navigate("/"); }} className="flex items-center gap-2 justify-center flex-1 px-1 py-2 text-[11px] font-medium text-accent hover:bg-muted transition-colors min-w-0 focus:outline-none focus:ring-0 focus-visible:outline-none outline-none ring-0">
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
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <AnimatePresence>
          {(multiplierDisplay.pending !== "" || multiplierDisplay.locked !== null) && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: -20, x: "-50%" }}
              animate={{ scale: 1, opacity: 1, y: 0, x: "-50%" }}
              exit={{ scale: 0.8, opacity: 0, y: -20, x: "-50%" }}
              className="absolute top-6 left-1/2 z-50 bg-primary text-primary-foreground px-6 py-2 rounded-full shadow-2xl border-4 border-background flex items-center gap-3 drop-shadow-xl"
            >
              <Hash className="w-5 h-5 opacity-50" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-70">
                  {multiplierDisplay.locked !== null ? "Multiplicateur" : "Quantité"}
                </span>
                <span className="text-3xl font-black font-digital tracking-tighter leading-none">
                  {multiplierDisplay.locked !== null ? multiplierDisplay.locked : multiplierDisplay.pending}<span className="text-xl ml-1 text-primary-foreground/50 text-shadow-none">x</span>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
            { label: t("label.totalHT"), value: `${subtotal.toFixed(2)} DA` },
            { label: t("label.totalTVA"), value: `${(subtotal * 0).toFixed(2)} DA` },
            { label: t("label.discount"), value: discount.value > 0 ? `-${discountAmount.toFixed(2)} DA (${discount.type === "percent" ? discount.value + "%" : "Fixe"})` : "0,00 DA" },
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
              onClick={() => setActiveClient(n)}
              className={`flex-1 text-[10px] font-bold uppercase transition-all border-r border-register-border last:border-r-0 relative outline-none ring-0 focus:ring-0 focus:outline-none focus-visible:ring-0 ${activeClient === n ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/80"
                }`}
            >
              {assignedClients[n]?.name || `${t("label.client")}${n}`}
              {(clientStates[n]?.items?.length || 0) > 0 && activeClient !== n && (
                <span className="absolute top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-accent" />
              )}
            </button>
          ))}
        </motion.div>

        <RegisterSearchBar
          isOpen={searchOpen}
          onClose={() => { setSearchOpen(false); setSearchInitialQuery(""); }}
          onSelectProduct={(p) => addProductToCart(p)}
          t={t}
          initialQuery={searchInitialQuery}
          products={allProducts}
        />

        {/* Items Table */}
        {/* We push the vertical scrollbar down by 38px so it clears the 2px orange border of the sticky header perfectly */}
        <ScrollArea scrollHideDelay={1500} ref={cartScrollRef} type="scroll" className="flex-1 bg-background relative [&_[data-orientation=vertical]]:mt-[38px]">
          <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
            <thead className="sticky top-0 z-10 w-full">
              <tr className="bg-muted border-b-2 border-primary">
                <th className="px-3 py-2 text-left text-[10px] font-bold text-foreground uppercase tracking-wider w-[45%]">{t("label.product")}</th>
                <th className="px-3 py-2 text-center text-[10px] font-bold text-foreground uppercase tracking-wider w-[15%]">{t("label.qty")}</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold text-foreground uppercase tracking-wider w-[20%]">{t("label.unitPrice")}</th>
                <th className="pl-3 pr-[18px] py-2 text-right text-[10px] font-bold text-foreground uppercase tracking-wider w-[20%]">{t("label.total")}</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, i) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  index={i}
                  isSelected={item.id === selectedItemId}
                  isShaking={item.id === shakingItemId}
                  onSelect={(id) => setSelectedItemId(id === selectedItemId ? null : id)}
                  onOpenQuantityDialog={(id) => {
                    const item = cart.find(i => i.id === id);
                    setSelectedItemId(id);
                    setQuantityValue(item ? item.quantity.toString() : "1");
                    setTimeout(() => setQuantityDialog(true), 0);
                  }}
                  t={t}
                  rowRef={selectedRowRef}
                />
              ))}
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
        <ActionButtonGrid
          visibleButtons={visibleButtons}
          panelCols={panelCols}
          panelWidth={panelWidth}
          btnScale={btnScale}
          actions={fullActions}
          hotkeys={userHotkeys}
          t={t}
        />
      </div>
    </div>
  );
};

export default Register;
