import React from "react";
import { Wifi, WifiOff, Printer, ScanBarcode, Scale, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppSettings } from "@/hooks/useSettings";

interface HardwareSectionProps {
  hardware: AppSettings["hardware"];
  onUpdateHardware: (device: keyof AppSettings["hardware"], patch: any) => void;
  onTestConnection: (device: string) => void;
  anim: any;
}

export const HardwareSection: React.FC<HardwareSectionProps> = ({
  hardware,
  onUpdateHardware,
  onTestConnection,
  anim,
}) => {
  return (
    <div {...anim} className="pos-card p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Wifi className="h-5 w-5" />
        </div>
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
              <div>
                <p className="text-sm font-medium text-foreground">Imprimante ticket</p>
                <p className="text-xs text-muted-foreground">Impression des reçus</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hardware.printer.enabled ? (
                <span className="text-xs text-success flex items-center gap-1">
                  <Wifi className="h-3 w-3" /> Activée
                </span>
              ) : (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <WifiOff className="h-3 w-3" /> Désactivée
                </span>
              )}
              <Switch
                checked={hardware.printer.enabled}
                onCheckedChange={(c) => onUpdateHardware("printer", { enabled: c })}
              />
            </div>
          </div>
          {hardware.printer.enabled && (
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
              <div>
                <Label className="text-xs">Type</Label>
                <Select
                  value={hardware.printer.type}
                  onValueChange={(v) => onUpdateHardware("printer", { type: v })}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thermal">Thermique</SelectItem>
                    <SelectItem value="dot">Matricielle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Port / IP</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="COM3 ou 192.168.1.100"
                  value={hardware.printer.port}
                  onChange={(e) => onUpdateHardware("printer", { port: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => onTestConnection("Imprimante")}
                >
                  <TestTube className="h-3 w-3 mr-1" /> Tester
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Scanner */}
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <ScanBarcode className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Scanner code-barres</p>
                <p className="text-xs text-muted-foreground">Lecture des codes-barres</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hardware.scanner.enabled ? (
                <span className="text-xs text-success flex items-center gap-1">
                  <Wifi className="h-3 w-3" /> Activé
                </span>
              ) : (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <WifiOff className="h-3 w-3" /> Désactivé
                </span>
              )}
              <Switch
                checked={hardware.scanner.enabled}
                onCheckedChange={(c) => onUpdateHardware("scanner", { enabled: c })}
              />
            </div>
          </div>
          {hardware.scanner.enabled && (
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
              <div>
                <Label className="text-xs">Type</Label>
                <Select
                  value={hardware.scanner.type}
                  onValueChange={(v) => onUpdateHardware("scanner", { type: v })}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usb">USB (HID)</SelectItem>
                    <SelectItem value="serial">Série (COM)</SelectItem>
                    <SelectItem value="bluetooth">Bluetooth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Port</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="Auto-détecté"
                  value={hardware.scanner.port}
                  onChange={(e) => onUpdateHardware("scanner", { port: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => onTestConnection("Scanner")}
                >
                  <TestTube className="h-3 w-3 mr-1" /> Tester
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Scale */}
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Scale className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Balance électronique</p>
                <p className="text-xs text-muted-foreground">Pesée et étiquetage</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hardware.scale.enabled ? (
                <span className="text-xs text-success flex items-center gap-1">
                  <Wifi className="h-3 w-3" /> Activée
                </span>
              ) : (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <WifiOff className="h-3 w-3" /> Désactivée
                </span>
              )}
              <Switch
                checked={hardware.scale.enabled}
                onCheckedChange={(c) => onUpdateHardware("scale", { enabled: c })}
              />
            </div>
          </div>
          {hardware.scale.enabled && (
            <div className="grid grid-cols-4 gap-3 pt-2 border-t border-border">
              <div>
                <Label className="text-xs">Marque</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="Ex: CAS, Mettler"
                  value={hardware.scale.brand}
                  onChange={(e) => onUpdateHardware("scale", { brand: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select
                  value={hardware.scale.type}
                  onValueChange={(v) => onUpdateHardware("scale", { type: v })}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="serial">Série (COM)</SelectItem>
                    <SelectItem value="tcp">TCP/IP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Port / IP</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="COM1 ou 192.168.1.50"
                  value={hardware.scale.port}
                  onChange={(e) => onUpdateHardware("scale", { port: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => onTestConnection("Balance")}
                >
                  <TestTube className="h-3 w-3 mr-1" /> Tester
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Scale Barcode Parser */}
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <ScanBarcode className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Code-barres Balance (Ex: Rongta)</p>
                <p className="text-xs text-muted-foreground">Analyse auto. du Poids via le code-barres imprimé</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hardware.barcodeScale?.enabled ? (
                <span className="text-xs text-success flex items-center gap-1">Activé</span>
              ) : (
                <span className="text-xs text-muted-foreground flex items-center gap-1">Désactivé</span>
              )}
              <Switch
                checked={hardware.barcodeScale?.enabled ?? false}
                onCheckedChange={(c) => onUpdateHardware("barcodeScale", { enabled: c })}
              />
            </div>
          </div>
          {hardware.barcodeScale?.enabled && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              <div>
                <Label className="text-xs">Préfixe code-barres (2 ou 3 chiffres)</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="Ex: 20 ou 21"
                  value={hardware.barcodeScale.prefix}
                  onChange={(e) => onUpdateHardware("barcodeScale", { prefix: e.target.value })}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Ex: 20 0004 01500 3 (Préfixe 20, PLU 0004, Poids 1.500kg)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
