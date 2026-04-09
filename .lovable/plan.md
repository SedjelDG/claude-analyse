

## Plan: Wizard Refinements — 5 Enhancements

### Changes

**1. Category "Autres" → custom input**
- In `CategoryStep`, when user selects "Autres", morph into a text input for typing a custom category name instead of immediately advancing.

**2. Brand step → searchable list first**
- Replace the plain `SingleInputStep` for brand with a new `BrandStep` that extracts unique brands from the `products` prop, displays them as a selectable list (like categories), and includes a text input at the bottom for typing a new brand. Arrow keys navigate existing brands, typing filters/creates new.

**3. Purchase/Stock mode choice (units vs packs)**
- Before the `PurchaseStep`, add a quick Y/N-style choice: "Achat par colis ou par unités ?" If "units", show a simpler 2-field screen (quantity + unit cost). If "packs", show the current intertwined packs screen (packs bought × units per pack × pack price).

**4. Combined Finance + Stock screen**
- Merge purchase, sale price, weight price (for mixte), and margins into one large panel with all fields visible. Auto-focus walks through them sequentially via Enter: cost fields → sale price → weight price (if mixte) → stock display. The user sees all financial context at once while filling each field.
- Remove the separate `unitPrice`, `weightPrice`, `pricePerKg`, `costPerKg`, and `margins` micro-steps — fold them into this combined step.

**5. Multiple barcodes + multiple pack variants**
- **Barcodes**: After scanning one barcode, show a "+ Ajouter un code-barres" hint (press `+` or `Tab`). Each additional barcode gets its own input row. Enter on the last one advances.
- **Pack variants**: After configuring one pack variant, show "Ajouter un autre pack ?" (O/N). Pressing O resets the pack fields and lets them define another variant (e.g., Pack de 6 AND Pack de 12). All variants are listed as chips above the input.

### Files

- **`src/components/management/ProductCreationWizard.tsx`** — Major edits:
  - `CategoryStep`: add custom input mode when "Autres" selected
  - New `BrandStep` component with product-derived brand list + free text
  - New `StockModeStep` (units vs packs choice)
  - New `CombinedFinanceStep` replacing 4-5 separate price/margin steps
  - `BarcodeStep` replacing single barcode input — supports multiple entries
  - `PackSetupStep` refactored to support adding multiple variants in a loop
  - Update `getStepFlow()` to use new combined steps
  - Pass `products` prop down to `BrandStep`

- **`src/pages/management/ProductManagement.tsx`** — Already passes `products`, no changes needed.

### No new dependencies needed

