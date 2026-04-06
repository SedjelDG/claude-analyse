import { Outlet } from "react-router-dom";
import { Clock, User } from "lucide-react";
import { useEffect, useState } from "react";
import FloatingDock from "./FloatingDock";
import { useUserStore } from "@/hooks/useUserStore";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      <header className="bg-white border-b border-sidebar-border px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight ds-gradient-text">DS</span>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Software</span>
            <span className="text-[9px] text-primary font-bold tracking-tighter">MANAGEMENT</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-slate-500 text-sm">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-primary" />
            <span className="font-bold text-slate-700">{displayName}</span>
          </div>
          <div className="flex items-center gap-3 border-l border-sidebar-border pl-4">
            <div className="flex flex-col items-end leading-none">
              <span className="text-[10px] font-bold text-slate-700">{timeStr}</span>
              <span className="text-[9px] font-medium text-slate-400">{dateStr}</span>
            </div>
            <Clock className="h-4 w-4 text-primary" />
          </div>
        </div>
      </header>

      {/* Content — outer page wrapped in ScrollArea for native routing scrolling */}
      <ScrollArea className="flex-1 bg-background">
        <main className="p-4 sm:p-6 pb-12 min-h-[calc(100vh-60px)]">
          <Outlet />
        </main>
      </ScrollArea>

      {/* Floating dock */}
      <FloatingDock />
    </div>
  );
};

export default ManagementLayout;
