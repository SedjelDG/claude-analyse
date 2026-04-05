import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Shield, ShoppingCart, KeyRound, AlertTriangle } from "lucide-react";
import { useUserStore, UserProfile, UserRole } from "@/hooks/useUserStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const anim = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.06, duration: 0.3 },
});

interface UserFormData {
  name: string;
  role: UserRole;
  passkey: string;
}

const Users = () => {
  const { profiles, addProfile, updateProfile, deleteProfile, canDeleteProfile } = useUserStore();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserFormData>({ name: "", role: "cashier", passkey: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const managers = profiles.filter((p) => p.role === "manager");
  const cashiers = profiles.filter((p) => p.role === "cashier");

  const openAdd = () => {
    setFormData({ name: "", role: "cashier", passkey: "" });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (profile: UserProfile) => {
    setFormData({ name: profile.name, role: profile.role, passkey: profile.passkey });
    setEditingId(profile.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.passkey.trim()) {
      toast({ title: "Champs requis", description: "Nom et clé d'accès sont obligatoires.", variant: "destructive" });
      return;
    }

    // Check passkey uniqueness
    const existing = profiles.find((p) => p.passkey === formData.passkey && p.id !== editingId);
    if (existing) {
      toast({ title: "Clé d'accès déjà utilisée", description: `Cette clé est déjà attribuée à ${existing.name}.`, variant: "destructive" });
      return;
    }

    if (editingId) {
      updateProfile(editingId, formData);
      toast({ title: "Profil modifié", description: formData.name });
    } else {
      addProfile(formData);
      toast({ title: "Profil créé", description: formData.name });
    }

    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    deleteProfile(id);
    toast({ title: "Profil supprimé" });
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      <motion.div {...anim(0)} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Utilisateurs</h2>
          <p className="text-sm text-muted-foreground">
            {managers.length} gestionnaire(s), {cashiers.length} caissier(s)
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </motion.div>

      {/* User list */}
      <motion.div {...anim(1)} className="space-y-2">
        {profiles.map((profile, i) => (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="pos-card p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${profile.role === "manager" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent-foreground"}`}>
                {profile.role === "manager" ? <Shield className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-semibold text-foreground">{profile.name}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    profile.role === "manager" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {profile.role === "manager" ? "Gestionnaire" : "Caissier"}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <KeyRound className="h-3 w-3" />
                    {"•".repeat(profile.passkey.length)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => openEdit(profile)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(profile.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ))}

        {profiles.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">Aucun profil configuré.</p>
            <p className="text-xs mt-1">Le système fonctionne en mode ouvert.</p>
          </div>
        )}
      </motion.div>

      {/* Add/Edit Form Dialog */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              className="bg-card p-6 rounded-lg border border-border w-[400px] shadow-xl"
            >
              <h3 className="text-lg font-bold text-foreground mb-4">
                {editingId ? "Modifier le profil" : "Nouveau profil"}
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Nom</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Nom de l'utilisateur"
                    autoFocus
                  />
                </div>
                <div>
                  <Label>Rôle</Label>
                  <Select value={formData.role} onValueChange={(v) => setFormData((f) => ({ ...f, role: v as UserRole }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Gestionnaire</SelectItem>
                      <SelectItem value="cashier">Caissier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Clé d'accès</Label>
                  <Input
                    type="password"
                    value={formData.passkey}
                    onChange={(e) => setFormData((f) => ({ ...f, passkey: e.target.value }))}
                    placeholder="Code d'accès unique"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
                <Button className="flex-1" onClick={handleSave}>
                  {editingId ? "Enregistrer" : "Créer"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              className="bg-card p-6 rounded-lg border border-border w-[380px] shadow-xl"
            >
              {(() => {
                const profile = profiles.find((p) => p.id === deleteConfirm);
                const check = canDeleteProfile(deleteConfirm);
                if (!profile) return null;

                return (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <h3 className="text-lg font-bold text-foreground">Supprimer le profil</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Êtes-vous sûr de vouloir supprimer <strong>{profile.name}</strong> ?
                    </p>
                    {check.warning && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
                        <p className="text-xs text-destructive font-medium flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {check.warning}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>
                        Annuler
                      </Button>
                      <Button variant="destructive" className="flex-1" onClick={() => handleDelete(deleteConfirm)}>
                        Supprimer
                      </Button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users;
