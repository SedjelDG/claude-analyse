import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Package, Scale, Users, ChevronLeft, LucideIcon, Banknote, FileText } from "lucide-react";
import { useState } from "react";
import { useUserStore } from "@/hooks/useUserStore";

interface DockItem {
  to: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
  color: string;
}

const dockItems: DockItem[] = [
  { to: "/management", icon: LayoutDashboard, label: "Dashboard", end: true, color: "hsl(var(--primary))" },
  { to: "/management/products", icon: Package, label: "Articles", color: "hsl(var(--success))" },
  { to: "/management/cash", icon: Banknote, label: "Caisse", color: "hsl(var(--warning))" },
  { to: "/management/reports", icon: FileText, label: "Rapports", color: "hsl(var(--accent))" },
  { to: "/management/scale", icon: Scale, label: "Balance / PLU", color: "hsl(var(--info))" },
  { to: "/management/users", icon: Users, label: "Utilisateurs", color: "hsl(var(--primary))" },
];

const DockIcon = ({ item }: { item: DockItem }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className="relative flex items-center justify-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {({ isActive }) => (
        <>
          <AnimatePresence>
            {hovered && (
              <motion.span
                initial={{ opacity: 0, y: 6, scale: 0.8 }}
                animate={{ opacity: 1, y: -8, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="absolute -top-9 whitespace-nowrap rounded bg-foreground px-2 py-1 text-[11px] font-semibold text-background shadow-lg pointer-events-none"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>

          <motion.div
            whileHover={{ scale: 1.35, y: -10 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-colors duration-150 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
            style={isActive ? { backgroundColor: item.color } : undefined}
          >
            <item.icon className="h-5 w-5" />
            {isActive && (
              <motion.span
                layoutId="dock-dot"
                className="absolute -bottom-2.5 w-1 h-1 rounded-full bg-primary-foreground"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.div>
        </>
      )}
    </NavLink>
  );
};

const FloatingDock = () => {
  const navigate = useNavigate();
  const { logout, isOpenMode } = useUserStore();
  const [backHovered, setBackHovered] = useState(false);

  const handleBack = () => {
    if (!isOpenMode()) logout();
    navigate("/");
  };

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.2 }}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/90 backdrop-blur-xl px-3 py-2 shadow-xl">
        {/* Back button */}
        <motion.button
          onMouseEnter={() => setBackHovered(true)}
          onMouseLeave={() => setBackHovered(false)}
          whileHover={{ scale: 1.35, y: -10 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          onClick={handleBack}
          className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
        >
          <AnimatePresence>
            {backHovered && (
              <motion.span
                initial={{ opacity: 0, y: 6, scale: 0.8 }}
                animate={{ opacity: 1, y: -8, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="absolute -top-9 whitespace-nowrap rounded bg-foreground px-2 py-1 text-[11px] font-semibold text-background shadow-lg pointer-events-none"
              >
                Déconnexion
              </motion.span>
            )}
          </AnimatePresence>
          <ChevronLeft className="h-5 w-5" />
        </motion.button>

        <div className="w-px h-8 bg-border mx-1" />

        {dockItems.map((item) => (
          <DockIcon key={item.to} item={item} />
        ))}
      </div>
    </motion.div>
  );
};

export default FloatingDock;
