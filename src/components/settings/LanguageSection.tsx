import React from "react";
import { Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppSettings } from "@/hooks/useSettings";

interface LanguageSectionProps {
  language: AppSettings["language"];
  onLanguageChange: (lang: AppSettings["language"]) => void;
  anim: any;
}

export const LanguageSection: React.FC<LanguageSectionProps> = ({ language, onLanguageChange, anim }) => {
  return (
    <div {...anim} className="pos-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Globe className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Langue</h3>
          <p className="text-xs text-muted-foreground">Choisir la langue de l'interface</p>
        </div>
      </div>
      <Select value={language} onValueChange={(v) => onLanguageChange(v as any)}>
        <SelectTrigger className="w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fr">🇫🇷 Français</SelectItem>
          <SelectItem value="ar">🇩🇿 العربية</SelectItem>
          <SelectItem value="en">🇬🇧 English</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
