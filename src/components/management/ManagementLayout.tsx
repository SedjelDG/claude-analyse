import { Outlet } from "react-router-dom";
import { Clock, User } from "lucide-react";
import { useEffect, useState } from "react";
import FloatingDock from "./FloatingDock";
import { useUserStore } from "@/hooks/useUserStore";

const ManagementLayout = () => {
  const [now, setNow] = useState(new Date());
  const { currentUser, isOpenMode } = useUserStore();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const dateStr = now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const displayName = currentUser?.name || (isOpenMode() ? "Mode ouvert" : "ADMIN");

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top bar */}
      <header className="pos-header-gradient px-5 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black tracking-tight text-primary-foreground">DS</span>
          <div>
            <span className="text-[10px] font-bold tracking-widest text-primary-foreground/80 uppercase">Software</span>
            <span className="text-[8px] text-primary-foreground/50 tracking-wider ml-2">MANAGEMENT</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-primary-foreground/80 text-sm">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span className="font-medium text-primary-foreground">{displayName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{dateStr}</span>
            <span>{timeStr}</span>
          </div>
        </div>
      </header>

      {/* Content — extra bottom padding for dock clearance */}
      <main className="flex-1 overflow-auto p-6 pb-24">
        <Outlet />
      </main>

      {/* Floating dock */}
      <FloatingDock />
    </div>
  );
};

export default ManagementLayout;
