

## Plan: 6 Register Features — Treasury Hub, Cart Manager, Client Association, Labels, Refunds, Pack Cycling

### Overview

All 6 features are register-side enhancements. They will be implemented as new dialog/overlay components triggered from existing action buttons in `Register.tsx`, plus logic changes to the cart and payment systems.

### Feature Breakdown & Locations

---

**1. Treasury Hub (Pilotage)**
Replaces the simple cash-in/cash-out dialogs with a full-screen overlay.

- **New file**: `src/components/register/TreasuryHub.tsx` (~250 lines)
- **UI**: Tabbed overlay with 3 sections:
  - **Cash-In/Cash-Out**: Amount + reason input, category presets (float, deposit, petty cash), physical drawer-open pulse button
  - **Z-Report**: Auto-generated daily summary (total sales, total cash in/out, expected drawer amount vs actual count — with variance display)
  - **Shift Summary**: Per-user breakdown of movements for the current session
- **Integration in `Register.tsx`**: `action.treasury` and `action.deposit` and `action.drawer` all open this hub on different default tabs. Reuses `useCashRegister` hook for data.

---

**2. Carts Manager (The Manipulator)**
A slide-out panel showing all 6 client carts side-by-side for item manipulation.

- **New file**: `src/components/register/CartsManager.tsx` (~300 lines)
- **UI**: Full-width overlay with 6 columns (one per client cart). Each column shows its line items. The user can:
  - **Transfer**: Drag or click-to-select items, then click a target cart column to move them
  - **Split**: Select an item, choose quantity to split off, pick destination cart
  - **Merge**: Select all items from one cart into another
  - Visual indicators: colored headers per cart, item count badges, total per cart
- **Integration in `Register.tsx`**: New action button `action.carts` added to `ALL_ACTION_BUTTONS`. State sync uses the existing `clientCarts` + `setClientCarts` setState — passed as props.

---

**3. Client Association & Credit Logger**
Friction-free client assignment to the active sale + credit payment method.

- **New file**: `src/components/register/ClientAssociation.tsx` (~200 lines)
- **UI**: When `action.client` is pressed, an overlay appears with:
  - Search bar filtering existing clients from the Contacts store (reuses `Contact` type from `Contacts.tsx`)
  - Quick-create inline form (name + phone only — 2 fields, Enter to confirm)
  - Currently assigned client shown as a chip in the register's bottom bar
- **Credit payment**: Add a third payment method ("Crédit") to the payment dialog. When chosen, the sale total is logged against the assigned client's `balance` field. If no client is assigned, prompt to assign one first.
- **New hook**: `src/hooks/useContacts.ts` (~50 lines) — localStorage-based contact store shared between Register and Contacts page
- **Changes**: `Register.tsx` — add `assignedClient` state per cart, modify payment dialog, update bottom bar

---

**4. Shelf-Ready Label Formatting**
Thermal label preview for customer-facing shelf tags.

- **New file**: `src/components/register/LabelPreview.tsx` (~150 lines)
- **UI**: Triggered from a new "Print Label" context action when a cart item is selected. Shows a 58mm-wide thermal label preview:
  - **Price**: Oversized, bold, centered (takes ~60% of label height)
  - **Product name**: Below price, truncated to 2 lines
  - **Barcode**: Small EAN-13 rendered via CSS/canvas at bottom
  - **Unit**: "DA/kg" or "DA/pcs" suffix
  - Print button triggers `window.print()` with a print-specific CSS stylesheet
- **Integration**: Add to right-click or long-press context on selected cart item, or as a sub-action of the item row

---

**5. Refund / Return Logic**
Full implementation replacing the current stub that just removes the item.

- **Changes to `Register.tsx`**:
  - `action.return` now flips the selected item into a **refund line**: negative quantity display, price shown as deduction, distinct visual styling (red strikethrough background, "RETOUR" badge, negative total)
  - Cart item gets a new `isReturn: boolean` field on `CartItem` interface
  - Refund items subtract from the total naturally (quantity * price becomes negative in the sum)
  - When processing payment with refund items, the cash movement is recorded as type `"return"` for those amounts
  - Visual: refund rows get a red-tinted background with diagonal stripe pattern, a "RETOUR" badge, and the total shown as `-XX.XX DA`

---

**6. Dynamic Pack Cycling Enhancement**
Upgrade the existing pack cycling logic with real product data and user feedback.

- **Changes to `Register.tsx`**:
  - Replace the hardcoded `mockPackVariants` with lookup from the actual product's `packVariants` array (from `mockProducts`)
  - When no variants exist: show a brief toast "Aucune variante" with a subtle shake animation on the selected row
  - When variants exist: show a quick radial menu / popover near the item showing all available sizes (Unit, Pack 6, Carton 12, etc.) with prices — user clicks or presses 1/2/3 to select
- **New file**: `src/components/register/PackCyclePopover.tsx` (~100 lines) — small popover component showing variant options with keyboard support

---

### File Summary

| File | Action | Feature |
|------|--------|---------|
| `src/components/register/TreasuryHub.tsx` | Create | Treasury Hub |
| `src/components/register/CartsManager.tsx` | Create | Carts Manager |
| `src/components/register/ClientAssociation.tsx` | Create | Client Association |
| `src/hooks/useContacts.ts` | Create | Shared contacts store |
| `src/components/register/LabelPreview.tsx` | Create | Label Formatting |
| `src/components/register/PackCyclePopover.tsx` | Create | Pack Cycling |
| `src/pages/Register.tsx` | Edit | All 6 features (wire up dialogs, refund logic, cart item interface, payment methods, assigned client state) |
| `src/pages/management/Contacts.tsx` | Edit | Migrate to shared `useContacts` hook |

### No new dependencies needed
Uses existing `framer-motion`, `lucide-react`, shadcn components.

