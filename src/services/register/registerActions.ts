/**
 * Register action dispatch factory.
 *
 * Builds the `Record<string, () => void>` action map from a set of
 * UI-agnostic callbacks. No React, no hooks, no state — pure wiring.
 */

export interface RegisterActionCallbacks {
  // Cart item operations
  onAddSelected: () => void;
  onDeductSelected: () => void;
  onRemoveSelected: () => void;
  onVoidTransaction: () => void;
  onGift: () => void;
  onReturn: () => void;
  onPackCycle: () => void;

  // Dialog openers
  onOpenQuantityDialog: () => void;
  onOpenDiscountDialog: () => void;
  onOpenPaymentDialog: () => void;
  onOpenPrixLibre: () => void;
  onOpenSalesHistory: () => void;
  onOpenCartsManager: () => void;
  onOpenCashDialog: (type: "add" | "remove") => void;

  // Direct actions
  onLock: () => void;
  onPrintDraft: () => void;
  onPrintLabel: () => void;
  onCloseShift: () => void;
  onTreasuryInfo: () => void;
  onClientInfo: () => void;
}

/**
 * Creates a flat action dispatch map that the keyboard hook and
 * button grid both consume.
 */
export function createRegisterActions(
  cb: RegisterActionCallbacks,
): Record<string, () => void> {
  return {
    "action.add": cb.onAddSelected,
    "action.deduct": cb.onDeductSelected,
    "action.remove": cb.onRemoveSelected,
    "action.void": cb.onVoidTransaction,
    "action.gift": cb.onGift,
    "action.return": cb.onReturn,
    "action.packCycle": cb.onPackCycle,

    "action.quantity": cb.onOpenQuantityDialog,
    "action.discount": cb.onOpenDiscountDialog,
    "action.payment": cb.onOpenPaymentDialog,
    "action.prixLibre": cb.onOpenPrixLibre,
    "action.salesHistory": cb.onOpenSalesHistory,
    "action.mergeCarts": cb.onOpenCartsManager,
    "action.deposit": () => cb.onOpenCashDialog("add"),
    "action.drawer": () => cb.onOpenCashDialog("remove"),

    "action.lock": cb.onLock,
    "action.printDraft": cb.onPrintDraft,
    "action.printLabel": cb.onPrintLabel,
    "action.stop": cb.onCloseShift,
    "action.treasury": cb.onTreasuryInfo,
    "action.client": cb.onClientInfo,
  };
}
