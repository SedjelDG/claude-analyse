

## Plan: Rebuild Product Creation Wizard as Dynamic Micro-Step Flow

### Problem
The current wizard has 5 fixed macro-steps that bundle multiple fields together. The user wants a **one-field-at-a-time** flow where each screen shows only the current prompt, the answer dynamically determines what comes next, and answering "yes" to options (packs, wholesale, expiration) immediately morphs into the setup UI for that feature — not just a Y/N badge.

### Architecture: Dynamic Step Queue

Instead of a static `STEPS` array, the wizard builds a **step queue dynamically** based on the chosen sale mode and the user's answers. Each step is a micro-screen showing one focused prompt.

**Standard flow:**
```text
Type → Name → Category/Brand → Barcode → Purchase/Stock → Sale Price → Margin display
→ Q: Packs? → [YES: Pack setup] → Q: Expiration? → [YES: Expiration entry]
→ Q: Wholesale? → [YES: Wholesale setup] → Confirm
```

**Weighed (Pesé) flow:**
```text
Type → Name → Category/Brand → PLU (pre-filled) → Price per KG → Cost per KG
→ Q: Expiration? → [YES: Expiration entry] → Confirm
```

**Mixte flow:**
```text
Type → Name → Category/Brand → Barcode → PLU (pre-filled)
→ Purchase/Stock (intertwined: packs bought × pack price) → Unit Sale Price
→ Weight Sale Price → Margins
→ Q: Packs? → [YES: Pack setup] → Q: Expiration? → [YES: Expiration entry]
→ Q: Wholesale? → [YES: Wholesale setup] → Confirm
```

### Key Changes

**1. Micro-step state machine** — Replace `step` integer + `STEPS` array with a `currentStep` string and a `getNextStep()` function that returns the next logical step based on sale mode and accumulated answers. Each step ID maps to a render function.

**2. Auto-focus every field** — Every micro-step auto-focuses its primary input on mount (via `useEffect` + `ref.focus()`). The user never needs Tab.

**3. Enter advances everything** — Pressing Enter on any field saves its value and calls `getNextStep()` to morph to the next screen. Empty Enter = skip (where allowed).

**4. PLU auto-generation** — When reaching the PLU step, pre-fill with the next available PLU number (scan existing products for the highest PLU, increment by 1). User can accept with Enter or override.

**5. Intertwined Purchase/Stock step** — A single "Achat" micro-step asks:
- Number of packs purchased (e.g., 5)
- Units per pack (e.g., 12)
- Pack buying price (e.g., 600 DA)
- Auto-calculates: total units (60), unit cost (50 DA)
- All fields on one screen, Enter moves between them

**6. Dynamic option expansion** — When user presses O/Y on "Sell by pack?", instead of just recording `true` and moving on, the wizard morphs into a pack configuration screen where they define pack sizes/names/prices. Same for wholesale (min qty + price fields) and expiration (date + quantity entry).

**7. Per-mode step definitions** — Three separate step sequences defined as arrays of step IDs, with conditional insertions based on Y/N answers.

### File changes

**`src/components/management/ProductCreationWizard.tsx`** — Full rewrite (~700 lines):
- Define ~15 micro-step components (type, name, categoryBrand, barcode, plu, purchase, unitPrice, weightPrice, margins, qPacks, packSetup, qExpiration, expirationSetup, qWholesale, wholesaleSetup, confirm)
- State machine: `currentStepId` string, `history` stack for Esc/back
- Each micro-step is a focused `motion.div` with auto-focused input
- PLU auto-generation logic: scan `products` prop for max PLU, increment
- Purchase step: intertwined pack qty / units-per-pack / pack price with live calculation
- Confirmation step shows summary + "Save" (Enter) / "Save + New" (A)

**`src/pages/management/ProductManagement.tsx`** — Pass `products` array to the wizard so it can compute next PLU.

### No new dependencies needed
Uses existing `framer-motion`, `lucide-react`, shadcn components.

