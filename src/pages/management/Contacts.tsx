import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Truck, Plus, Search, Edit2, Trash2, Save, X, Phone, Mail, MapPin, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type ContactType = "supplier" | "client";

interface Contact {
  id: string;
  type: ContactType;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  balance: number;
}

const mockContacts: Contact[] = [
  { id: "s1", type: "supplier", name: "Fournisseur A", phone: "0555 11 22 33", email: "a@fournisseur.dz", address: "Alger", notes: "Livraison rapide", balance: 0 },
  { id: "s2", type: "supplier", name: "Fournisseur B", phone: "0555 44 55 66", email: "b@fournisseur.dz", address: "Oran", notes: "", balance: -15000 },
  { id: "s3", type: "supplier", name: "Fournisseur C", phone: "0555 77 88 99", email: "", address: "Constantine", notes: "Fruits et légumes", balance: 0 },
  { id: "c1", type: "client", name: "Client Gros A", phone: "0666 11 22 33", email: "client.a@mail.dz", address: "Alger", notes: "Paiement mensuel", balance: 25000 },
  { id: "c2", type: "client", name: "Client Gros B", phone: "0666 44 55 66", email: "", address: "Blida", notes: "", balance: -5000 },
];

const emptyContact: Omit<Contact, "id"> = {
  type: "supplier", name: "", phone: "", email: "", address: "", notes: "", balance: 0,
};

const Contacts = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState<ContactType>("supplier");
  const [contacts, setContacts] = useState(mockContacts);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<(Omit<Contact, "id"> & { id?: string })>(emptyContact);

  const filtered = contacts
    .filter((c) => c.type === tab)
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || c.email.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => {
    setEditing({ ...emptyContact, type: tab });
    setShowDialog(true);
  };

  const openEdit = (c: Contact) => {
    setEditing({ ...c });
    setShowDialog(true);
  };

  const save = () => {
    if (editing.id) {
      setContacts((prev) => prev.map((c) => c.id === editing.id ? { ...editing, id: c.id } as Contact : c));
      toast({ title: "Contact modifié" });
    } else {
      setContacts((prev) => [...prev, { ...editing, id: `${tab[0]}${Date.now()}` } as Contact]);
      toast({ title: "Contact ajouté" });
    }
    setShowDialog(false);
  };

  const remove = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    toast({ title: "Contact supprimé" });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Contacts</h2>
        <p className="text-sm text-muted-foreground">Gestion des fournisseurs et clients</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {([
          { id: "supplier" as const, label: "Fournisseurs", icon: Truck },
          { id: "client" as const, label: "Clients", icon: Users },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" /> {tab === "supplier" ? "Nouveau fournisseur" : "Nouveau client"}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="pos-stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
        </div>
        <div className="pos-stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{tab === "supplier" ? "Dettes" : "Créances"}</p>
          <p className="text-2xl font-bold text-accent">
            {Math.abs(filtered.filter((c) => c.balance < 0).reduce((s, c) => s + c.balance, 0)).toLocaleString()} DA
          </p>
        </div>
        <div className="pos-stat-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{tab === "supplier" ? "Avances" : "Soldes positifs"}</p>
          <p className="text-2xl font-bold text-success">
            {filtered.filter((c) => c.balance > 0).reduce((s, c) => s + c.balance, 0).toLocaleString()} DA
          </p>
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pos-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="pos-table-header">
              <th className="px-3 py-2.5 text-left text-xs font-semibold">Nom</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold">Téléphone</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold">Email</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold">Adresse</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold">Solde (DA)</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-3 py-2 font-medium text-foreground">{c.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{c.phone}</td>
                <td className="px-3 py-2 text-muted-foreground">{c.email || "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{c.address || "—"}</td>
                <td className={`px-3 py-2 text-right font-semibold ${c.balance > 0 ? "text-success" : c.balance < 0 ? "text-accent" : "text-foreground"}`}>
                  {c.balance.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => remove(c.id)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
          {filtered.length} contact(s)
        </div>
      </motion.div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {tab === "supplier" ? <Truck className="h-5 w-5 text-primary" /> : <Users className="h-5 w-5 text-primary" />}
              {editing.id ? "Modifier" : "Nouveau"} {tab === "supplier" ? "fournisseur" : "client"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nom</Label>
              <Input value={editing.name} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} className="mt-1" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Téléphone</Label>
                <Input value={editing.phone} onChange={(e) => setEditing((p) => ({ ...p, phone: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input value={editing.email} onChange={(e) => setEditing((p) => ({ ...p, email: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Adresse</Label>
              <Input value={editing.address} onChange={(e) => setEditing((p) => ({ ...p, address: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Input value={editing.notes} onChange={(e) => setEditing((p) => ({ ...p, notes: e.target.value }))} className="mt-1" placeholder="Optionnel" />
            </div>
            <div>
              <Label className="text-xs">Solde (DA)</Label>
              <Input type="number" value={editing.balance || ""} onChange={(e) => setEditing((p) => ({ ...p, balance: +e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowDialog(false)}>Annuler</Button>
            <Button size="sm" onClick={save} className="bg-primary text-primary-foreground">
              <Save className="h-3.5 w-3.5 mr-1" /> Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contacts;
