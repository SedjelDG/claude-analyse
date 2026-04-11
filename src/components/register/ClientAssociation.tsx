import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Search, Plus, Phone, Check } from "lucide-react";
import { useContacts, Contact } from "@/hooks/useContacts";

interface ClientAssociationProps {
  open: boolean;
  onClose: () => void;
  onAssign: (client: Contact | null) => void;
  currentClient: Contact | null;
}

const ClientAssociation = ({ open, onClose, onAssign, currentClient }: ClientAssociationProps) => {
  const { clients, addContact } = useContacts();
  const [search, setSearch] = useState("");
  const [quickCreate, setQuickCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearch("");
      setQuickCreate(false);
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [open]);

  if (!open) return null;

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const handleQuickCreate = () => {
    if (!newName.trim()) return;
    const created = addContact({
      type: "client",
      name: newName.trim(),
      phone: newPhone.trim(),
      email: "",
      address: "",
      notes: "",
      balance: 0,
    });
    onAssign(created);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="bg-card border border-border rounded-lg shadow-2xl w-[420px] max-h-[70vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Association Client</h2>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>

          {/* Current client */}
          {currentClient && (
            <div className="px-4 py-2 bg-primary/5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground">{currentClient.name}</span>
                {currentClient.phone && <span className="text-xs text-muted-foreground">{currentClient.phone}</span>}
              </div>
              <button
                onClick={() => { onAssign(null); onClose(); }}
                className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase"
              >
                Retirer
              </button>
            </div>
          )}

          {/* Search */}
          <div className="px-4 py-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom ou téléphone..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-input bg-background text-foreground rounded-md outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Client list */}
          <div className="flex-1 overflow-y-auto max-h-[300px]">
            {filtered.map((client) => (
              <button
                key={client.id}
                onClick={() => { onAssign(client); onClose(); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 border-b border-border hover:bg-muted/50 transition-colors text-left ${
                  currentClient?.id === client.id ? "bg-primary/10" : ""
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{client.name}</p>
                  {client.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {client.phone}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-bold ${client.balance >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {client.balance.toLocaleString()} DA
                </span>
              </button>
            ))}
            {filtered.length === 0 && !quickCreate && (
              <p className="text-center text-muted-foreground text-sm py-6">Aucun client trouvé</p>
            )}
          </div>

          {/* Quick create */}
          <div className="border-t border-border">
            {!quickCreate ? (
              <button
                onClick={() => setQuickCreate(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-primary hover:bg-primary/5 transition-colors"
              >
                <Plus className="h-4 w-4" /> Créer un nouveau client
              </button>
            ) : (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="p-3 space-y-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nom du client *"
                  className="w-full px-3 py-2 text-sm border border-input bg-background text-foreground rounded-md outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleQuickCreate()}
                />
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Téléphone (optionnel)"
                  className="w-full px-3 py-2 text-sm border border-input bg-background text-foreground rounded-md outline-none focus:ring-2 focus:ring-primary"
                  onKeyDown={(e) => e.key === "Enter" && handleQuickCreate()}
                />
                <div className="flex gap-2">
                  <button onClick={() => setQuickCreate(false)} className="flex-1 py-2 text-xs font-bold bg-muted text-foreground rounded-md">
                    Annuler
                  </button>
                  <button onClick={handleQuickCreate} className="flex-1 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-md">
                    Créer & Assigner
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ClientAssociation;
