import React from "react";
import { Keyboard, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACTION_LABEL_MAP } from "@/services/register/registerConstants";

interface HotkeysSectionProps {
  hotkeys: Record<string, string>;
  defaultHotkeys: Record<string, string>;
  capturingKey: string | null;
  onKeyCapture: (actionKey: string) => void;
  onKeyKeyDown: (e: React.KeyboardEvent, actionKey: string) => void;
  onBlur: () => void;
  onReset: () => void;
  anim: any;
}

export const HotkeysSection: React.FC<HotkeysSectionProps> = ({
  hotkeys,
  defaultHotkeys,
  capturingKey,
  onKeyCapture,
  onKeyKeyDown,
  onBlur,
  onReset,
  anim,
}) => {
  return (
    <div {...anim} className="pos-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Keyboard className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Raccourcis clavier</h3>
            <p className="text-xs text-muted-foreground">Personnaliser les raccourcis de la caisse</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onReset} className="gap-1 text-xs">
          <RotateCcw className="h-3 w-3" />
          Réinitialiser
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(ACTION_LABEL_MAP).map(([actionKey, label]) => (
          <div key={actionKey} className="flex items-center justify-between p-2 rounded-lg border border-border">
            <span className="text-xs font-medium text-foreground">{label}</span>
            <button
              onClick={() => onKeyCapture(actionKey)}
              onKeyDown={(e) => capturingKey === actionKey && onKeyKeyDown(e, actionKey)}
              onBlur={onBlur}
              className={`text-xs font-mono px-2 py-1 rounded border min-w-[80px] text-center transition-colors ${
                capturingKey === actionKey
                  ? "border-primary bg-primary/10 text-primary animate-pulse"
                  : hotkeys[actionKey] !== defaultHotkeys[actionKey]
                  ? "border-accent bg-accent/10 text-accent-foreground"
                  : "border-border bg-muted text-muted-foreground"
              }`}
            >
              {capturingKey === actionKey ? "Appuyer..." : hotkeys[actionKey] || "—"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
