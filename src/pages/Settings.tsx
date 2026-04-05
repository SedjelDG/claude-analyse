import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft, Globe, Sun, Moon, Monitor, Hand, Printer, ScanBarcode,
  Scale, Wifi, WifiOff, TestTube, Keyboard, RotateCcw, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings, DEFAULT_HOTKEYS } from "@/hooks/useSettings";
import { useUserStore } from "@/hooks/useUserStore";
import { useToast } from "@/hooks/use-toast";

const anim = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.06, duration: 0.3 },
});

const HOTKEY_LABELS: Record<string, string> = {
  "action.add": "Ajouter",
  "action.deduct": "Déduire",
  "action.search": "Recherche",
  "action.remove": "Enlever",
  "action.removeAll": "Enlever tous",
  "action.lock": "Verrouiller",
  "action.discount": "Remise",
  "action.return": "Retour",
  "action.payment": "Paiement",
  "action.hold": "Attente",
  "action.quantity": "Quantité",
  "action.deposit": "Versement",
  "action.drawer": "Tiroir",
  "action.treasury": "Trésorerie",
  "action.client": "Client",
  "action.gift": "Offert",
  "action.close": "Fermer",
  "action.packCycle": "Vente par Pack",
};

const ALL_TOGGLE_ACTIONS: { key: string; label: string }[] = [
  { key: "action.add", label: "Ajouter" },
  { key: "action.deduct", label: "Déduire" },
  { key: "action.search", label: "Recherche" },
  { key: "action.discount", label: "Remise" },
  { key: "action.removeAll", label: "Enlever tous" },
  { key: "action.lock", label: "Verrouiller" },
  { key: "action.return", label: "Retour" },
  { key: "action.quantity", label: "Quantité" },
  { key: "action.payment", label: "Paiement" },
  { key: "action.hold", label: "Attente" },
  { key: "action.deposit", label: "Versement" },
  { key: "action.drawer", label: "Tiroir" },
  { key: "action.gift", label: "Offert" },
  { key: "action.close", label: "Fermer" },
  { key: "action.stop", label: "Arrêter" },
  { key: "action.lang", label: "Langue" },
  { key: "action.treasury", label: "Trésorerie" },
  { key: "action.client", label: "Client" },
  { key: "action.packCycle", label: "Vente par Pack" },
];

const MIN_VISIBLE_ACTIONS = 6;

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useUserStore();
  const { settings, updateSettings, updateHardware, getHotkeys, updateHotkey, resetHotkeys } = useSettings(currentUser?.id);
  const { toast } = useToast();
  const [capturingKey, setCapturingKey] = useState<string | null>(null);

  const testConnection = (device: string) => {
    toast({ title: `Test de ${device}`, description: "Connexion en cours... (simulation)" });
    setTimeout(() => toast({ title: device, description: "Connexion réussie ✓" }), 1500);
  };

  const handleBack = () => {
    const from = location.state?.from;
    if (from) navigate(from);
    else navigate("/");
  };

  const hotkeys = getHotkeys();
  const hiddenActions = settings.hiddenActions || [];
  const visibleCount = ALL_TOGGLE_ACTIONS.length - hiddenActions.length;

  const handleKeyCapture = (actionKey: string) => setCapturingKey(actionKey);

  const handleKeyCaptureKeyDown = (e: React.KeyboardEvent, actionKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    let combo = "";
    if (e.ctrlKey) combo += "Ctrl+";
    if (e.altKey) combo += "Alt+";
    if (e.shiftKey) combo += "Shift+";
    const key = e.key;
    if (["Control", "Alt", "Shift", "Meta"].includes(key)) return;
    combo += key.startsWith("F") && key.length > 1 ? key : key.toUpperCase();
    updateHotkey(actionKey, combo);
    setCapturingKey(null);
    toast({ title: "Raccourci modifié", description: `${HOTKEY_LABELS[actionKey]}: ${combo}` });
  };

  const toggleAction = (actionKey: string, visible: boolean) => {
    if (!visible && visibleCount <= MIN_VISIBLE_ACTIONS) {
      toast({ title: "Minimum 6 boutons requis", description: "Vous devez garder au moins 6 boutons actifs." });
      return;
    }
    updateSettings({
      hiddenActions: visible
        ? hiddenActions.filter((a) => a !== actionKey)
        : [...hiddenActions, actionKey],
    });
  };

  const isLoggedIn = !!currentUser;
  let sectionIdx = 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="pos-header-gradient px-4 py-2.5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleBack} className="text-primary-foreground hover:bg-primary-foreground/10">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-primary-foreground">Paramètres</h1>
          <p className="text-xs text-primary-foreground/60">
            {currentUser ? `Configuration — ${currentUser.name}` : "Configuration générale du logiciel"}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Language */}
        <motion.div {...anim(sectionIdx++)} className="pos-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary"><Globe className="h-5 w-5" /></div>
            <div>
              <h3 className="font-semibold text-foreground">Langue</h3>
              <p className="text-xs text-muted-foreground">Choisir la langue de l'interface</p>
            </div>
          </div>
          <Select value={settings.language} onValueChange={(v) => updateSettings({ language: v as any })}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">🇫🇷 Français</SelectItem>
              <SelectItem value="ar">🇩🇿 العربية</SelectItem>
              <SelectItem value="en">🇬🇧 English</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Theme */}
        <motion.div {...anim(sectionIdx++)} className="pos-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {settings.theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Thème</h3>
              <p className="text-xs text-muted-foreground">Apparence de l'interface</p>
            </div>
          </div>
          <div className="flex gap-3">
            {([{ value: "light" as const, label: "Clair", icon: Sun }, { value: "dark" as const, label: "Sombre", icon: Moon }]).map((t) => (
              <button key={t.value} onClick={() => updateSettings({ theme: t.value })} className={`flex items-center gap-2 px-5 py-3 rounded-lg border-2 transition-all text-sm font-medium ${settings.theme === t.value ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                <t.icon className="h-4 w-4" />{t.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Layout */}
        <motion.div {...anim(sectionIdx++)} className="pos-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary"><Monitor className="h-5 w-5" /></div>
            <div>
              <h3 className="font-semibold text-foreground">Disposition</h3>
              <p className="text-xs text-muted-foreground">Choisir le mode d'affichage adapté à votre écran</p>
            </div>
          </div>
          <div className="flex gap-3">
            {([{ value: "desktop" as const, label: "Bureau", desc: "Souris et clavier", icon: Monitor }, { value: "tactile" as const, label: "Tactile", desc: "Écran tactile", icon: Hand }]).map((l) => (
              <button key={l.value} onClick={() => updateSettings({ layout: l.value })} className={`flex flex-col items-center gap-2 px-6 py-4 rounded-lg border-2 transition-all text-sm ${settings.layout === l.value ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                <l.icon className="h-6 w-6" /><span className="font-medium">{l.label}</span><span className="text-[10px] text-muted-foreground">{l.desc}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Action Button Visibility — only when logged in */}
        {isLoggedIn && (
          <motion.div {...anim(sectionIdx++)} className="pos-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary"><Eye className="h-5 w-5" /></div>
              <div>
                <h3 className="font-semibold text-foreground">Boutons d'action</h3>
                <p className="text-xs text-muted-foreground">Afficher/masquer les boutons de la caisse (minimum {MIN_VISIBLE_ACTIONS})</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ALL_TOGGLE_ACTIONS.map(({ key, label }) => {
                const isVisible = !hiddenActions.includes(key);
                return (
                  <div key={key} className="flex items-center justify-between p-2 rounded-lg border border-border">
                    <span className="text-xs font-medium text-foreground">{label}</span>
                    <Switch checked={isVisible} onCheckedChange={(checked) => toggleAction(key, checked)} />
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Hotkey Customization — only when logged in */}
        {isLoggedIn && (
          <motion.div {...anim(sectionIdx++)} className="pos-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary"><Keyboard className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-semibold text-foreground">Raccourcis clavier</h3>
                  <p className="text-xs text-muted-foreground">Personnaliser les raccourcis de la caisse</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => { resetHotkeys(); toast({ title: "Raccourcis réinitialisés" }); }} className="gap-1 text-xs">
                <RotateCcw className="h-3 w-3" />Réinitialiser
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(HOTKEY_LABELS).map(([actionKey, label]) => (
                <div key={actionKey} className="flex items-center justify-between p-2 rounded-lg border border-border">
                  <span className="text-xs font-medium text-foreground">{label}</span>
                  <button
                    onClick={() => handleKeyCapture(actionKey)}
                    onKeyDown={(e) => capturingKey === actionKey && handleKeyCaptureKeyDown(e, actionKey)}
                    onBlur={() => setCapturingKey(null)}
                    className={`text-xs font-mono px-2 py-1 rounded border min-w-[80px] text-center transition-colors ${
                      capturingKey === actionKey
                        ? "border-primary bg-primary/10 text-primary animate-pulse"
                        : hotkeys[actionKey] !== DEFAULT_HOTKEYS[actionKey]
                          ? "border-accent bg-accent/10 text-accent-foreground"
                          : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {capturingKey === actionKey ? "Appuyer..." : hotkeys[actionKey] || "—"}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Hardware Connections */}
        <motion.div {...anim(sectionIdx++)} className="pos-card p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary"><Wifi className="h-5 w-5" /></div>
            <div>
              <h3 className="font-semibold text-foreground">Connexions matérielles</h3>
              <p className="text-xs text-muted-foreground">Configurer les périphériques connectés</p>
            </div>
          </div>
          <div className="space-y-4">
            {/* Printer */}
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Printer className="h-5 w-5 text-muted-foreground" />
                  <div><p className="text-sm font-medium text-foreground">Imprimante ticket</p><p className="text-xs text-muted-foreground">Impression des reçus</p></div>
                </div>
                <div className="flex items-center gap-3">
                  {settings.hardware.printer.enabled ? <span className="text-xs text-success flex items-center gap-1"><Wifi className="h-3 w-3" /> Activée</span> : <span className="text-xs text-muted-foreground flex items-center gap-1"><WifiOff className="h-3 w-3" /> Désactivée</span>}
                  <Switch checked={settings.hardware.printer.enabled} onCheckedChange={(c) => updateHardware("printer", { enabled: c })} />
                </div>
              </div>
              {settings.hardware.printer.enabled && (
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select value={settings.hardware.printer.type} onValueChange={(v) => updateHardware("printer", { type: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="thermal">Thermique</SelectItem><SelectItem value="dot">Matricielle</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Port / IP</Label>
                    <Input className="h-8 text-xs" placeholder="COM3 ou 192.168.1.100" value={settings.hardware.printer.port} onChange={(e) => updateHardware("printer", { port: e.target.value })} />
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => testConnection("Imprimante")}><TestTube className="h-3 w-3 mr-1" /> Tester</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Scanner */}
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <ScanBarcode className="h-5 w-5 text-muted-foreground" />
                  <div><p className="text-sm font-medium text-foreground">Scanner code-barres</p><p className="text-xs text-muted-foreground">Lecture des codes-barres</p></div>
                </div>
                <div className="flex items-center gap-3">
                  {settings.hardware.scanner.enabled ? <span className="text-xs text-success flex items-center gap-1"><Wifi className="h-3 w-3" /> Activé</span> : <span className="text-xs text-muted-foreground flex items-center gap-1"><WifiOff className="h-3 w-3" /> Désactivé</span>}
                  <Switch checked={settings.hardware.scanner.enabled} onCheckedChange={(c) => updateHardware("scanner", { enabled: c })} />
                </div>
              </div>
              {settings.hardware.scanner.enabled && (
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select value={settings.hardware.scanner.type} onValueChange={(v) => updateHardware("scanner", { type: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="usb">USB (HID)</SelectItem><SelectItem value="serial">Série (COM)</SelectItem><SelectItem value="bluetooth">Bluetooth</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Port</Label>
                    <Input className="h-8 text-xs" placeholder="Auto-détecté" value={settings.hardware.scanner.port} onChange={(e) => updateHardware("scanner", { port: e.target.value })} />
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => testConnection("Scanner")}><TestTube className="h-3 w-3 mr-1" /> Tester</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Scale */}
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Scale className="h-5 w-5 text-muted-foreground" />
                  <div><p className="text-sm font-medium text-foreground">Balance électronique</p><p className="text-xs text-muted-foreground">Pesée et étiquetage</p></div>
                </div>
                <div className="flex items-center gap-3">
                  {settings.hardware.scale.enabled ? <span className="text-xs text-success flex items-center gap-1"><Wifi className="h-3 w-3" /> Activée</span> : <span className="text-xs text-muted-foreground flex items-center gap-1"><WifiOff className="h-3 w-3" /> Désactivée</span>}
                  <Switch checked={settings.hardware.scale.enabled} onCheckedChange={(c) => updateHardware("scale", { enabled: c })} />
                </div>
              </div>
              {settings.hardware.scale.enabled && (
                <div className="grid grid-cols-4 gap-3 pt-2 border-t border-border">
                  <div>
                    <Label className="text-xs">Marque</Label>
                    <Input className="h-8 text-xs" placeholder="Ex: CAS, Mettler" value={settings.hardware.scale.brand} onChange={(e) => updateHardware("scale", { brand: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select value={settings.hardware.scale.type} onValueChange={(v) => updateHardware("scale", { type: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="serial">Série (COM)</SelectItem><SelectItem value="tcp">TCP/IP</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Port / IP</Label>
                    <Input className="h-8 text-xs" placeholder="COM1 ou 192.168.1.50" value={settings.hardware.scale.port} onChange={(e) => updateHardware("scale", { port: e.target.value })} />
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => testConnection("Balance")}><TestTube className="h-3 w-3 mr-1" /> Tester</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
