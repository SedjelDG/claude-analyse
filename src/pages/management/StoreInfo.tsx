import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Store, Save, MapPin, Phone, Mail, FileText, Clock, DollarSign, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface StoreData {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  nif: string;
  nis: string;
  rc: string;
  ai: string;
  logoUrl: string;
  openingHours: string;
  currency: string;
}

const defaultStore: StoreData = {
  name: "", address: "", city: "", phone: "", email: "",
  nif: "", nis: "", rc: "", ai: "", logoUrl: "",
  openingHours: "", currency: "DA",
};

const anim = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.06, duration: 0.3 },
});

const StoreInfo = () => {
  const { toast } = useToast();
  const [store, setStore] = useState<StoreData>(() => {
    try {
      const stored = localStorage.getItem("ds-store-info");
      if (stored) return { ...defaultStore, ...JSON.parse(stored) };
    } catch {}
    return defaultStore;
  });

  const update = (field: keyof StoreData, value: string) => {
    setStore((s) => ({ ...s, [field]: value }));
  };

  const save = () => {
    localStorage.setItem("ds-store-info", JSON.stringify(store));
    toast({ title: "Informations enregistrées", description: "Les données du magasin ont été sauvegardées." });
  };

  let idx = 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Informations du magasin</h2>
          <p className="text-sm text-muted-foreground">Coordonnées, fiscalité et paramètres généraux</p>
        </div>
        <Button onClick={save} className="bg-primary text-primary-foreground">
          <Save className="h-4 w-4 mr-1" /> Enregistrer
        </Button>
      </div>

      {/* General */}
      <motion.div {...anim(idx++)} className="pos-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary"><Store className="h-5 w-5" /></div>
          <div>
            <h3 className="font-semibold text-foreground">Identité</h3>
            <p className="text-xs text-muted-foreground">Nom et logo du magasin</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label className="text-xs">Nom du magasin</Label>
            <Input value={store.name} onChange={(e) => update("name", e.target.value)} placeholder="Ex: Supérette Errahma" className="mt-1" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">URL du logo</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input value={store.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} placeholder="https://..." className="flex-1" />
              {store.logoUrl && (
                <div className="w-10 h-10 rounded border border-border overflow-hidden shrink-0">
                  <img src={store.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Address */}
      <motion.div {...anim(idx++)} className="pos-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary"><MapPin className="h-5 w-5" /></div>
          <div>
            <h3 className="font-semibold text-foreground">Adresse</h3>
            <p className="text-xs text-muted-foreground">Localisation du magasin</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label className="text-xs">Adresse</Label>
            <Input value={store.address} onChange={(e) => update("address", e.target.value)} placeholder="Rue, numéro..." className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Ville / Wilaya</Label>
            <Input value={store.city} onChange={(e) => update("city", e.target.value)} placeholder="Ex: Alger" className="mt-1" />
          </div>
        </div>
      </motion.div>

      {/* Contact */}
      <motion.div {...anim(idx++)} className="pos-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary"><Phone className="h-5 w-5" /></div>
          <div>
            <h3 className="font-semibold text-foreground">Contact</h3>
            <p className="text-xs text-muted-foreground">Téléphone et email</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Téléphone</Label>
            <Input value={store.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Ex: 0555 12 34 56" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input value={store.email} onChange={(e) => update("email", e.target.value)} placeholder="contact@magasin.dz" className="mt-1" />
          </div>
        </div>
      </motion.div>

      {/* Tax IDs */}
      <motion.div {...anim(idx++)} className="pos-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary"><FileText className="h-5 w-5" /></div>
          <div>
            <h3 className="font-semibold text-foreground">Fiscalité</h3>
            <p className="text-xs text-muted-foreground">Numéros d'identification fiscale</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">NIF (Numéro d'Identification Fiscale)</Label>
            <Input value={store.nif} onChange={(e) => update("nif", e.target.value)} className="mt-1 font-mono" />
          </div>
          <div>
            <Label className="text-xs">NIS (Numéro d'Identification Statistique)</Label>
            <Input value={store.nis} onChange={(e) => update("nis", e.target.value)} className="mt-1 font-mono" />
          </div>
          <div>
            <Label className="text-xs">RC (Registre de Commerce)</Label>
            <Input value={store.rc} onChange={(e) => update("rc", e.target.value)} className="mt-1 font-mono" />
          </div>
          <div>
            <Label className="text-xs">AI (Article d'Imposition)</Label>
            <Input value={store.ai} onChange={(e) => update("ai", e.target.value)} className="mt-1 font-mono" />
          </div>
        </div>
      </motion.div>

      {/* Operations */}
      <motion.div {...anim(idx++)} className="pos-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary"><Clock className="h-5 w-5" /></div>
          <div>
            <h3 className="font-semibold text-foreground">Opérations</h3>
            <p className="text-xs text-muted-foreground">Horaires et devise</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Horaires d'ouverture</Label>
            <Input value={store.openingHours} onChange={(e) => update("openingHours", e.target.value)} placeholder="Ex: 08:00 - 22:00" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Devise</Label>
            <Input value={store.currency} onChange={(e) => update("currency", e.target.value)} placeholder="DA" className="mt-1" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StoreInfo;
