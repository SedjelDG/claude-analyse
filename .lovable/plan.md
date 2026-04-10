

## Plan: Scale Button Layout Overlay with Drag-and-Drop

### What we're building
A visual overlay on the Scale/PLU page that renders a realistic grid of scale buttons (like a physical scale's keypad). Users can drag products onto buttons, rearrange them by dragging between slots, and remove them — all with spring animations and "plop-in" effects.

### Design

```text
┌─────────────────────────────────────────────────┐
│  [Disposition des touches]  toggle button        │
├─────────────────────────────────────────────────┤
│                                                  │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│   │ 001  │ │ 002  │ │ 003  │ │ 004  │ │ 005  │ │
│   │Pommes│ │Banan.│ │      │ │Olives│ │      │ │
│   │250DA │ │350DA │ │ vide │ │500DA │ │ vide │ │
│   └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│   │ 006  │ │      │ │      │ │      │ │      │ │
│   │Poulet│ │ vide │ │ vide │ │ vide │ │ vide │ │
│   │450DA │ │      │ │      │ │      │ │      │ │
│   └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ │
│                                                  │
│   Unassigned products sidebar (draggable pool)   │
│   ┌────────┐ ┌────────┐ ┌────────┐              │
│   │Fromage │ │V.hachée│ │  ...   │              │
│   └────────┘ └────────┘ └────────┘              │
└─────────────────────────────────────────────────┘
```

### Implementation

**New component: `ScaleButtonLayout.tsx`**
- A grid of button slots (configurable, default 5×4 = 20 keys)
- Each slot is either empty or occupied by a product
- State: `buttonMap: Record<number, string | null>` mapping slot index → product ID
- Uses `framer-motion` `layout`, `layoutId`, and spring animations for:
  - **Plop-in**: `scale: [0, 1.1, 1]` with spring when a product lands on a slot
  - **Drag**: `drag` prop on product chips, `onDragEnd` detects target slot via hit-testing
  - **Remove**: scale-out animation when clearing a slot
- Unassigned products shown in a pool below the grid, also draggable
- Right-click or X button to clear a slot
- Grid size adjustable (rows × cols selector)

**Changes to `ScaleIntegration.tsx`**
- Add a toggle button "Disposition des touches" that shows/hides the `ScaleButtonLayout` overlay
- Pass `products` and `setProducts` to the layout component
- Products dragged onto buttons get their PLU auto-assigned to the slot number

### Drag implementation (no new deps)
Using `framer-motion`'s `drag` + manual hit-testing via `onDragEnd` with `document.elementsFromPoint()` to detect which slot the product was dropped on. This avoids needing `@dnd-kit` or `react-beautiful-dnd`.

### Files
- **Create** `src/components/management/ScaleButtonLayout.tsx` (~350 lines)
- **Edit** `src/pages/management/ScaleIntegration.tsx` — add toggle + render `ScaleButtonLayout`

### No new dependencies

