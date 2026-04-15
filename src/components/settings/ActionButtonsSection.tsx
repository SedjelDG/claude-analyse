import React from "react";
import { Eye } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ACTION_LABELS } from "@/services/register/registerConstants";

interface ActionButtonsSectionProps {
  hiddenActions: string[];
  onToggleAction: (key: string, visible: boolean, total: number) => void;
  anim: any;
}

export const ActionButtonsSection: React.FC<ActionButtonsSectionProps> = ({
  hiddenActions,
  onToggleAction,
  anim,
}) => {
  return (
    <div {...anim} className="pos-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Eye className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Boutons d'action</h3>
          <p className="text-xs text-muted-foreground">Afficher/masquer les boutons de la caisse</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {ACTION_LABELS.map(({ key, label }) => {
          const isVisible = !hiddenActions.includes(key);
          return (
            <div key={key} className="flex items-center justify-between p-2 rounded-lg border border-border">
              <span className="text-xs font-medium text-foreground">{label}</span>
              <Switch
                checked={isVisible}
                onCheckedChange={(checked) => onToggleAction(key, checked, ACTION_LABELS.length)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
