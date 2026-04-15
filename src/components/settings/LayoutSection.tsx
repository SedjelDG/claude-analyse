import React from "react";
import { Monitor, Hand } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { AppSettings } from "@/hooks/useSettings";

interface LayoutSectionProps {
  layout: AppSettings["layout"];
  lockRegisterPanels: boolean;
  language: string;
  onLayoutChange: (l: AppSettings["layout"]) => void;
  onLockPanelsChange: (lock: boolean) => void;
  anim: any;
}

export const LayoutSection: React.FC<LayoutSectionProps> = ({
  layout,
  lockRegisterPanels,
  language,
  onLayoutChange,
  onLockPanelsChange,
  anim,
}) => {
  const layouts = [
    { value: "desktop" as const, label: "Bureau", desc: "Souris et clavier", icon: Monitor },
    { value: "tactile" as const, label: "Tactile", desc: "Écran tactile", icon: Hand },
  ];

  return (
    <div {...anim} className="pos-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Monitor className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Disposition</h3>
            <p className="text-xs text-muted-foreground">Choisir le mode d'affichage adapté à votre écran</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {language === "ar" ? "قفل" : "Lock"}
          </span>
          <Switch checked={lockRegisterPanels} onCheckedChange={onLockPanelsChange} />
        </div>
      </div>
      <div className="flex gap-3">
        {layouts.map((l) => (
          <button
            key={l.value}
            onClick={() => onLayoutChange(l.value)}
            className={`flex flex-col items-center gap-2 px-6 py-4 rounded-lg border-2 transition-all text-sm ${
              layout === l.value
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            <l.icon className="h-6 w-6" />
            <span className="font-medium">{l.label}</span>
            <span className="text-[10px] text-muted-foreground">{l.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
