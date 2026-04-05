# Register.tsx — Resizable Hotkey Panel: Full Change Instructions

Apply **three targeted edits** to `src/pages/Register.tsx`. No new files, no new dependencies.

---

## CHANGE 1 — Line 1: Add `useRef` and `useMemo` to the React import

**Find this exact line (line 1):**
```ts
import { useState, useEffect, useCallback } from "react";
```

**Replace it with:**
```ts
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
```

---

## CHANGE 2 — After `getBadgeColor`: Insert the entire resize logic block

**Find this exact block** (around line 328):
```ts
  const getBadgeColor = (index: number) => {
    const col = index % 3;
    return col === 0 ? "bg-accent text-accent-foreground" : col === 1 ? "bg-success text-success-foreground" : "bg-info text-info-foreground";
  };
```

**Replace it with** (keep `getBadgeColor` exactly, add everything below it):
```ts
  const getBadgeColor = (index: number) => {
    const col = index % 3;
    return col === 0 ? "bg-accent text-accent-foreground" : col === 1 ? "bg-success text-success-foreground" : "bg-info text-info-foreground";
  };

  // ── Resizable right panel ────────────────────────────────────────────────
  const PANEL_MIN = 160;
  const PANEL_MAX = 560;
  const PANEL_DEFAULT = 260;
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

  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const rafId = useRef<number>(0);

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = panelWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [panelWidth]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        // dragging left = panel grows
        const delta = dragStartX.current - e.clientX;
        const next = Math.min(PANEL_MAX, Math.max(PANEL_MIN, dragStartWidth.current + delta));
        setPanelWidth(next);
      });
    };
    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setPanelWidth(w => { localStorage.setItem(PANEL_STORAGE_KEY, String(w)); return w; });
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
  const { panelCols, btnScale } = useMemo(() => {
    let cols: number;
    if (panelWidth < 210) cols = 1;
    else if (panelWidth < 300) cols = 2;
    else if (panelWidth < 430) cols = 3;
    else cols = 4;
    // Baseline: 260px / 3 cols = ~87px per button = scale 1.0
    const btnW = panelWidth / cols;
    const scale = Math.min(1.5, Math.max(0.7, btnW / 87));
    return { panelCols: cols, btnScale: scale };
  }, [panelWidth]);
```

---

## CHANGE 3 — Replace the entire RIGHT PANEL JSX block

**Find this exact JSX block** (starts with the comment `{/* RIGHT PANEL — Redesigned buttons */}`):

```tsx
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
```

**Replace it with:**

```tsx
      {/* RESIZE DIVIDER */}
      <div
        onMouseDown={handleDividerMouseDown}
        className="w-[5px] flex-shrink-0 cursor-col-resize relative group z-10"
        style={{ background: "transparent" }}
      >
        {/* Visible track — widens on hover/drag for easy grabbing */}
        <div
          className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[3px] transition-all duration-150
            bg-register-border group-hover:bg-primary group-hover:w-[4px] group-active:bg-primary"
        />
      </div>

      {/* RIGHT PANEL — resizable hotkey buttons */}
      <div
        className="flex flex-col border-l border-register-border bg-card overflow-hidden flex-shrink-0"
        style={{ width: panelWidth }}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-register-border bg-primary text-primary-foreground flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <User className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-[11px] font-bold uppercase truncate">{activeUser.name}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] flex-shrink-0 ml-2">
              <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{dateStr}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeStr}</span>
            </div>
          </div>
          <p className="text-[9px] text-primary-foreground/60 mt-0.5">{t("label.registerReady")}</p>
        </div>

        {/* Button grid — reflows instantly as panelWidth changes */}
        <div className="flex-1 overflow-auto p-1.5">
          {(() => {
            // Build rows so the last row can be centered if it's partial
            const rows: typeof visibleButtons[] = [];
            for (let i = 0; i < visibleButtons.length; i += panelCols) {
              rows.push(visibleButtons.slice(i, i + panelCols));
            }
            return rows.map((row, rowIdx) => {
              const isFull = row.length === panelCols;
              return (
                <div
                  key={rowIdx}
                  className="flex gap-1 mb-1"
                  style={{ justifyContent: isFull ? "stretch" : "center" }}
                >
                  {row.map((btn, i) => {
                    const globalIdx = rowIdx * panelCols + i;
                    const shortcut = userHotkeys[btn.key] || "";
                    // Icon and text scale with panel width for a premium feel
                    const iconSize = Math.round(14 * btnScale);
                    const labelSize = Math.round(7 * btnScale);
                    const badgeSize = Math.round(7 * btnScale);
                    const btnHeight = Math.round(72 * Math.min(btnScale, 1.2));
                    return (
                      <button
                        key={btn.key}
                        onClick={() => actions[btn.key]?.()}
                        className="flex flex-col items-center justify-between bg-card border border-register-border
                          transition-all duration-75 active:scale-95 hover:bg-muted/50 overflow-hidden flex-1"
                        style={{ minHeight: btnHeight, maxWidth: Math.round(130 * btnScale) }}
                      >
                        <div className="flex flex-col items-center justify-center gap-0.5 flex-1 px-1 py-1.5 w-full">
                          <btn.icon style={{ width: iconSize, height: iconSize }} className="text-foreground flex-shrink-0" />
                          <span
                            className="font-bold uppercase leading-tight text-center text-foreground w-full overflow-hidden"
                            style={{
                              fontSize: labelSize,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {t(btn.key)}
                          </span>
                        </div>
                        {shortcut ? (
                          <span
                            className={`font-bold py-0.5 w-full text-center flex-shrink-0 ${getBadgeColor(globalIdx)}`}
                            style={{ fontSize: badgeSize }}
                          >
                            {shortcut}
                          </span>
                        ) : (
                          <span
                            className="font-bold py-0.5 w-full text-center bg-muted text-muted-foreground flex-shrink-0"
                            style={{ fontSize: badgeSize }}
                          >
                            —
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            });
          })()}
        </div>
      </div>
```

---

## Summary of what each change does

| Change | What it does |
|---|---|
| **1** — Import | Adds `useRef` (for drag state refs) and `useMemo` (for derived layout values) |
| **2** — Resize logic | Adds `panelWidth` state (persisted to `localStorage`), `requestAnimationFrame`-throttled mouse drag handlers on `window`, and `useMemo`-derived `panelCols` + `btnScale` that recompute instantly on every pixel of movement |
| **3** — JSX | Adds the 5px invisible grab handle between the center panel and right panel, removes the fixed `w-[260px]` and hardcoded `grid-cols-3`, and replaces it with a dynamic width + row-based layout that centers partial last rows and scales icons/text proportionally |

## No other files need to be touched.
