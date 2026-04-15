import { useState, useEffect, useCallback, useRef } from "react";

interface UseResizablePanelOptions {
  minWidth: number;
  maxWidth: number;
  defaultWidth: number;
  storageKey: string;
  side: "left" | "right";
  lockPanels?: boolean;
}

/**
 * useResizablePanel — extracts the complex mouse-tracking and 
 * requestAnimationFrame logic from Register.tsx.
 * 
 * Manages side panel width, persistence to localStorage, and 
 * provides a mouseDown handler for dividers.
 */
export function useResizablePanel({
  minWidth,
  maxWidth,
  defaultWidth,
  storageKey,
  side,
  lockPanels = false,
}: UseResizablePanelOptions) {
  const [width, setWidth] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const n = Number(stored);
        if (n >= minWidth && n <= maxWidth) return n;
      }
    } catch { /* ignore */ }
    return defaultWidth;
  });

  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const rafId = useRef<number>(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (lockPanels) return;
      e.preventDefault();
      isDragging.current = true;
      dragStartX.current = e.clientX;
      dragStartWidth.current = width;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [width, lockPanels]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        // Delta calculation based on side: 
        // dragging right (+delta) grows LEFT panel.
        // dragging left (-delta from x perspective) grows RIGHT panel.
        const delta = side === "left" 
          ? e.clientX - dragStartX.current 
          : dragStartX.current - e.clientX;

        const next = Math.min(maxWidth, Math.max(minWidth, dragStartWidth.current + delta));
        setWidth(next);
      });
    };

    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setWidth((w) => {
        localStorage.setItem(storageKey, String(w));
        return w;
      });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      cancelAnimationFrame(rafId.current);
    };
  }, [minWidth, maxWidth, storageKey, side]);

  return { width, onMouseDown };
}

