import React from "react";
import { Sun, Moon } from "lucide-react";
import { AppSettings } from "@/hooks/useSettings";

interface ThemeSectionProps {
  theme: AppSettings["theme"];
  onThemeChange: (theme: AppSettings["theme"]) => void;
  anim: any;
}

export const ThemeSection: React.FC<ThemeSectionProps> = ({ theme, onThemeChange, anim }) => {
  const themes = [
    { value: "light" as const, label: "Clair", icon: Sun },
    { value: "dark" as const, label: "Sombre", icon: Moon },
  ];

  return (
    <div {...anim} className="pos-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Thème</h3>
          <p className="text-xs text-muted-foreground">Apparence de l'interface</p>
        </div>
      </div>
      <div className="flex gap-3">
        {themes.map((t) => (
          <button
            key={t.value}
            onClick={() => onThemeChange(t.value)}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
              theme === t.value
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
};
