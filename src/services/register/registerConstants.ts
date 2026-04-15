/**
 * Register UI constants — single source of truth for button grid,
 * action themes, and label maps consumed by Register, Settings, and
 * the keyboard hook.
 */

import type { LucideIcon } from "lucide-react";
import {
  Plus, Minus, Trash, Percent, Power, Lock, RotateCcw, Hash,
  CreditCard, Wallet, DoorOpen, Tag, Printer, History, Barcode,
  Combine, PiggyBank, User, PackageOpen, Gift,
} from "lucide-react";

// ── Button Grid (curated 19-button layout) ──────────────────────────
// Each entry is a register action with its icon. The order here
// determines the visual order in the hotkey panel.

export interface ActionButtonEntry {
  key: string;
  icon: LucideIcon;
}

export const ALL_ACTION_BUTTONS: ActionButtonEntry[] = [
  { key: "action.add", icon: Plus },
  { key: "action.deduct", icon: Minus },
  { key: "action.remove", icon: Trash },
  { key: "action.discount", icon: Percent },
  { key: "action.gift", icon: Gift },
  { key: "action.void", icon: Power },
  { key: "action.lock", icon: Lock },
  { key: "action.return", icon: RotateCcw },
  { key: "action.quantity", icon: Hash },
  { key: "action.payment", icon: CreditCard },
  { key: "action.deposit", icon: Wallet },
  { key: "action.drawer", icon: DoorOpen },
  { key: "action.prixLibre", icon: Tag },
  { key: "action.printDraft", icon: Printer },
  { key: "action.salesHistory", icon: History },
  { key: "action.printLabel", icon: Barcode },
  { key: "action.mergeCarts", icon: Combine },
  { key: "action.treasury", icon: PiggyBank },
  { key: "action.client", icon: User },
  { key: "action.packCycle", icon: PackageOpen },
  { key: "action.stop", icon: Power },
];

// ── Action Themes (module-level, zero per-render cost) ──────────────

interface ActionTheme {
  text: string;
  bg: string;
  border: string;
}

const FALLBACK_THEME: ActionTheme = {
  text: "text-primary",
  bg: "bg-primary",
  border: "border-primary/40",
};

export const ACTION_THEMES: Record<string, ActionTheme> = {
  "action.add": { text: "text-[#10b981]", bg: "bg-[#10b981]", border: "border-[#10b981]/40" },
  "action.deduct": { text: "text-[#ef4444]", bg: "bg-[#ef4444]", border: "border-[#ef4444]/40" },
  "action.remove": { text: "text-[#991b1b]", bg: "bg-[#991b1b]", border: "border-[#991b1b]/40" },
  "action.discount": { text: "text-[#f97316]", bg: "bg-[#f97316]", border: "border-[#f97316]/40" },
  "action.gift": { text: "text-[#d97706]", bg: "bg-[#d97706]", border: "border-[#d97706]/40" },
  "action.void": { text: "text-[#991b1b]", bg: "bg-[#991b1b]", border: "border-[#991b1b]/40" },
  "action.lock": { text: "text-[#4b5563]", bg: "bg-[#4b5563]", border: "border-[#4b5563]/40" },
  "action.return": { text: "text-[#f43f5e]", bg: "bg-[#f43f5e]", border: "border-[#f43f5e]/40" },
  "action.quantity": { text: "text-[#0d9488]", bg: "bg-[#0d9488]", border: "border-[#0d9488]/40" },
  "action.payment": { text: "text-[#eab308]", bg: "bg-[#eab308]", border: "border-[#eab308]/40" },
  "action.deposit": { text: "text-[#1e40af]", bg: "bg-[#1e40af]", border: "border-[#1e40af]/40" },
  "action.drawer": { text: "text-[#7e22ce]", bg: "bg-[#7e22ce]", border: "border-[#7e22ce]/40" },
  "action.prixLibre": { text: "text-[#0ea5e9]", bg: "bg-[#0ea5e9]", border: "border-[#0ea5e9]/40" },
  "action.printDraft": { text: "text-[#475569]", bg: "bg-[#475569]", border: "border-[#475569]/40" },
  "action.salesHistory": { text: "text-[#06b6d4]", bg: "bg-[#06b6d4]", border: "border-[#06b6d4]/40" },
  "action.printLabel": { text: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]", border: "border-[#8b5cf6]/40" },
  "action.mergeCarts": { text: "text-[#f59e0b]", bg: "bg-[#f59e0b]", border: "border-[#f59e0b]/40" },
  "action.treasury": { text: "text-[#1e293b]", bg: "bg-[#1e293b]", border: "border-[#1e293b]/40" },
  "action.client": { text: "text-[#3730a3]", bg: "bg-[#3730a3]", border: "border-[#3730a3]/40" },
  "action.packCycle": { text: "text-[#dc2626]", bg: "bg-[#dc2626]", border: "border-[#dc2626]/40" },
  "action.stop": { text: "text-[#991b1b]", bg: "bg-[#991b1b]", border: "border-[#991b1b]/40" },
};

export function getActionTheme(actionKey: string): ActionTheme {
  return ACTION_THEMES[actionKey] ?? FALLBACK_THEME;
}

// ── Action Labels (single source for Settings + Hotkey UI) ──────────

export interface ActionLabelEntry {
  key: string;
  label: string;
}

export const ACTION_LABELS: ActionLabelEntry[] = [
  { key: "action.add", label: "Ajouter" },
  { key: "action.deduct", label: "Déduire" },
  { key: "action.remove", label: "Enlever" },
  { key: "action.discount", label: "Remise" },
  { key: "action.gift", label: "Offert" },
  { key: "action.void", label: "Annuler" },
  { key: "action.lock", label: "Verrouiller" },
  { key: "action.return", label: "Retour" },
  { key: "action.quantity", label: "Quantité" },
  { key: "action.payment", label: "Paiement" },
  { key: "action.deposit", label: "Versement" },
  { key: "action.drawer", label: "Tiroir" },
  { key: "action.prixLibre", label: "Prix libre" },
  { key: "action.printDraft", label: "Imprimer brouillon" },
  { key: "action.salesHistory", label: "Journal des ventes" },
  { key: "action.printLabel", label: "Imprimer étiquette" },
  { key: "action.mergeCarts", label: "Gestion Paniers" },
  { key: "action.treasury", label: "Trésorerie" },
  { key: "action.client", label: "Client" },
  { key: "action.packCycle", label: "Vente par Pack" },
  { key: "action.stop", label: "Fermer session" },
];

/** Quick lookup by key → label */
export const ACTION_LABEL_MAP: Record<string, string> = Object.fromEntries(
  ACTION_LABELS.map((entry) => [entry.key, entry.label]),
);

export const getBadgeColor = (index: number) => {
  const col = index % 3;
  return col === 0
    ? "bg-accent text-accent-foreground"
    : col === 1
      ? "bg-success text-success-foreground"
      : "bg-info text-info-foreground";
};

export function computeRegisterLayout(panelWidth: number, leftPanelWidth: number) {
  let cols: number;
  if (panelWidth < 210) cols = 1;
  else if (panelWidth < 300) cols = 2;
  else if (panelWidth < 550) cols = 3;
  else if (panelWidth < 700) cols = 4;
  else cols = 5;

  // Baseline: 260px / 3 cols = ~87px per button = scale 1.0
  const btnW = panelWidth / cols;
  const bs = Math.min(1.45, Math.max(0.75, btnW / 87));

  // Damped header scale: even more conservative
  const hs = Math.min(1.25, Math.max(0.85, 1 + (bs - 1) * 0.35));

  // Left panel scale: baseline 240px
  const lps = Math.min(1.3, Math.max(0.85, 1 + (leftPanelWidth / 240 - 1) * 0.4));

  return { panelCols: cols, btnScale: bs, headerScale: hs, leftPanelScale: lps };
}

