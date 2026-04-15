import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getActionTheme } from "@/services/register/registerConstants";
import type { ActionButtonEntry } from "@/services/register/registerConstants";

interface ActionButtonGridProps {
  visibleButtons: ActionButtonEntry[];
  panelCols: number;
  panelWidth: number;
  btnScale: number;
  actions: Record<string, () => void>;
  hotkeys: Record<string, string>;
  t: (key: string) => string;
}

/**
 * ActionButtonGrid — extracts the complex 80-line button grid 
 * rendering logic from Register.tsx.
 */
export const ActionButtonGrid: React.FC<ActionButtonGridProps> = ({
  visibleButtons,
  panelCols,
  panelWidth,
  btnScale,
  actions,
  hotkeys,
  t,
}) => {
  // Build rows so the last row can be centered if it's partial
  const rows: ActionButtonEntry[][] = [];
  for (let i = 0; i < visibleButtons.length; i += panelCols) {
    rows.push(visibleButtons.slice(i, i + panelCols));
  }

  return (
    <ScrollArea className="flex-1 p-1.5 pr-2.5">
      {rows.map((row, rowIdx) => {
        const isFull = row.length === panelCols;
        // Calculate explicit width for each button to ensure orphans don't expand
        // 12px for p-1.5 (6px each side), 4px for gap-1
        const totalGapWidth = (panelCols - 1) * 4;
        const btnWidth = Math.floor((panelWidth - 12 - totalGapWidth) / panelCols);

        return (
          <div
            key={rowIdx}
            className="flex gap-1 mb-1"
            style={{ justifyContent: isFull ? "stretch" : "center" }}
          >
            {row.map((btn) => {
              const shortcut = hotkeys[btn.key] || "";
              const theme = getActionTheme(btn.key);
              const iconSize = Math.round(16 * btnScale);
              const labelSize = Math.round(7.5 * btnScale);
              const badgeSize = Math.round(8 * btnScale);
              const btnHeight = Math.round(85 * Math.min(btnScale, 1.25));

              return (
                <button
                  key={btn.key}
                  onClick={() => actions[btn.key]?.()}
                  className="flex flex-col bg-white border border-gray-100 outline-none focus:ring-0 focus-visible:ring-0
                    transition-all duration-75 active:scale-95 overflow-hidden flex-shrink-0 relative group shadow-sm hover:shadow-md"
                  style={{ height: btnHeight, width: btnWidth }}
                >
                  {/* Notch indicator */}
                  <div className="absolute top-0 right-0 w-5 h-5 overflow-hidden">
                    <div className={`absolute top-0 right-0 w-7 h-7 ${theme.bg} rotate-45 transform origin-bottom-left translate-x-[40%] -translate-y-[40%] shadow-sm`} />
                  </div>

                  {/* Content: Centered Icon + Label */}
                  <div className="flex flex-col items-center justify-center flex-1 w-full px-1 py-1">
                    <div
                      className={`rounded-full border flex items-center justify-center mb-1.5 transition-transform group-hover:scale-110 ${theme.text} ${theme.border}`}
                      style={{
                        padding: Math.round(5 * btnScale),
                        borderWidth: Math.max(1, Math.round(1 * btnScale)),
                      }}
                    >
                      <btn.icon style={{ width: iconSize, height: iconSize }} />
                    </div>
                    <span
                      className="font-black uppercase leading-none text-center text-slate-700"
                      style={{
                        fontSize: labelSize,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: "1.1",
                      }}
                    >
                      {t(btn.key)}
                    </span>
                  </div>

                  {/* Floating Hotkey label */}
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-sm bg-gray-50/80 backdrop-blur-sm border border-gray-100 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="font-black text-slate-500" style={{ fontSize: badgeSize * 0.9 }}>
                      {shortcut || "—"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        );
      })}
    </ScrollArea>
  );
};
