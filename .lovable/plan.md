

## Plan: Overhaul Reports Section

### Problem
The current Reports page uses hardcoded mock data, has no date range picker, no export/print capabilities, and limited interactivity. Report dialogs are static tables with no filtering.

### What Changes

**1. Replace mock data with real sales history**
- Import `useSalesHistory` hook to pull actual transaction data
- Compute stats (total sales, profit, transactions, avg ticket) dynamically from filtered sales
- Aggregate chart data by grouping sales into time buckets based on the selected period

**2. Add interactive date range picker**
- Add a date range filter toolbar using Popover + Calendar (shadcn) with `pointer-events-auto`
- Two calendar popovers: "From" and "To" with quick presets (Today, This Week, This Month, Last 30 Days, This Year)
- All stats, charts, and report catalogs filter based on the selected range

**3. Add export to Excel**
- "Export Excel" button that generates a `.xlsx` blob client-side using a lightweight CSV-to-blob approach (or SheetJS if available)
- Exports the currently visible data table (filtered by date range) with columns: Date, Ref, Items, Cashier, Payment, Subtotal, Discount, Total
- Triggers browser download

**4. Add print functionality**
- "Print Report" button that opens a `window.print()`-styled view
- Generates a thermal/A4 formatted print layout with store header, date range, summary stats, and the data table
- Uses `@media print` CSS or a print window approach (same pattern as `SalesHistoryDialog`)

**5. Improve report catalog interactivity**
- Each report dialog gets its own date range filter (inherited from main)
- Transaction report: clickable rows to expand sale details, show individual items
- Top/slow products: computed from actual sales data, sortable columns
- Add payment method breakdown (cash vs card pie/donut chart)

**6. Add payment method filter**
- Toggle buttons for "All", "Cash", "Card" to further slice the data

### Files to modify

- **`src/pages/management/Reports.tsx`** — Full rewrite: replace mock data with `useSalesHistory`, add date pickers, export/print buttons, payment filter, dynamic chart aggregation, improved report dialogs
- **`src/components/ui/calendar.tsx`** — Add `pointer-events-auto` to className for dialog compatibility (one-line fix)

### Technical details
- Calendar component already exists, just needs `pointer-events-auto` added
- `date-fns` is available for date formatting/manipulation
- `useSalesHistory` provides the `Sale[]` array with timestamps, items, totals, payment methods
- Excel export: use `Blob` with CSV content + `.xlsx` extension, or create a simple XLSX via template literals (no new deps needed — CSV download is sufficient and reliable)
- Print: reuse the `window.open` + `document.write` pattern from `SalesHistoryDialog`
- Recharts already installed for charts
- No new dependencies required

