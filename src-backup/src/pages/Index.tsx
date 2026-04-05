import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, ShoppingCart, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useAnimation } from "framer-motion";
import { useUserStore } from "@/hooks/useUserStore";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { hasProfiles, login, isOpenMode } = useUserStore();
  const { toast } = useToast();
  const [passkey, setPasskey] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const shakeControls = useAnimation();

  const openMode = isOpenMode();

  useEffect(() => {
    if (!openMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [openMode]);

  const handlePasskeySubmit = async () => {
    if (!passkey.trim()) return;
    const user = login(passkey);
    if (user) {
      if (user.role === "manager") {
        navigate("/management");
      } else {
        navigate("/register");
      }
    } else {
      // Shake animation
      await shakeControls.start({
        x: [0, -12, 12, -8, 8, -4, 4, 0],
        transition: { duration: 0.4 },
      });
      toast({ title: "Clé d'accès invalide", description: "Veuillez réessayer.", variant: "destructive" });
      setPasskey("");
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePasskeySubmit();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-6 relative">
      {/* Settings icon in top-right */}
      <button
        onClick={() => navigate("/settings")}
        className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted"
      >
        <Cog className="h-5 w-5" />
      </button>

      {/* Logo */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-1">
          <motion.span
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-5xl font-black tracking-tight text-primary"
          >
            D
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
            className="text-5xl font-black tracking-tight text-primary"
          >
            S
          </motion.span>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-xs tracking-[0.3em] uppercase text-muted-foreground font-semibold"
        >
          Software
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-[10px] tracking-widest uppercase text-muted-foreground mt-1"
        >
          Djaouad & Seddik
        </motion.p>
      </div>

      {openMode ? (
        /* Open mode — old buttons */
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="flex gap-3"
        >
          <Button
            size="lg"
            className="bg-primary text-primary-foreground px-8 py-6 text-base font-bold"
            onClick={() => navigate("/register")}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Caisse
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-primary text-primary px-8 py-6 text-base font-bold"
            onClick={() => navigate("/management")}
          >
            <Settings className="h-5 w-5 mr-2" />
            Gestion
          </Button>
        </motion.div>
      ) : (
        /* Passkey login */
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div animate={shakeControls}>
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Clé d'accès"
              className="w-56 text-center text-lg tracking-[0.5em] px-4 py-3 border-2 border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground placeholder:tracking-normal focus:outline-none focus:border-primary transition-colors"
              autoComplete="off"
            />
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePasskeySubmit}
            className="px-8 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Connexion
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default Index;
