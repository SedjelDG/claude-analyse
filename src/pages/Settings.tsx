import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSettingsScreen } from "@/hooks/useSettingsScreen";

// Modular Sections
import { LanguageSection } from "@/components/settings/LanguageSection";
import { ThemeSection } from "@/components/settings/ThemeSection";
import { LayoutSection } from "@/components/settings/LayoutSection";
import { ActionButtonsSection } from "@/components/settings/ActionButtonsSection";
import { HotkeysSection } from "@/components/settings/HotkeysSection";
import { HardwareSection } from "@/components/settings/HardwareSection";

const anim = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.06, duration: 0.3 },
});

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    settings,
    updateSettings,
    updateHardware,
    hotkeys,
    capturingKey,
    handleKeyCapture,
    handleKeyCaptureKeyDown,
    handleBlur,
    toggleAction,
    testConnection,
    handleResetHotkeys,
    currentUser,
    isLoggedIn,
    DEFAULT_HOTKEYS
  } = useSettingsScreen();

  const handleBack = () => {
    const from = location.state?.from;
    if (from) navigate(from);
    else navigate("/");
  };

  let sectionIdx = 0;

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="pos-header-gradient px-4 py-2.5 flex items-center gap-3 shrink-0 shadow-sm z-50">
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

      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24 space-y-6">
          <LanguageSection
            language={settings.language}
            onLanguageChange={(l) => updateSettings({ language: l })}
            anim={anim(sectionIdx++)}
          />

          <ThemeSection
            theme={settings.theme}
            onThemeChange={(t) => updateSettings({ theme: t })}
            anim={anim(sectionIdx++)}
          />

          <LayoutSection
            layout={settings.layout}
            lockRegisterPanels={settings.lockRegisterPanels}
            language={settings.language}
            onLayoutChange={(l) => updateSettings({ layout: l })}
            onLockPanelsChange={(lock) => updateSettings({ lockRegisterPanels: lock })}
            anim={anim(sectionIdx++)}
          />

          {isLoggedIn && (
            <>
              <ActionButtonsSection
                hiddenActions={settings.hiddenActions}
                onToggleAction={toggleAction}
                anim={anim(sectionIdx++)}
              />

              <HotkeysSection
                hotkeys={hotkeys}
                defaultHotkeys={DEFAULT_HOTKEYS}
                capturingKey={capturingKey}
                onKeyCapture={handleKeyCapture}
                onKeyKeyDown={handleKeyCaptureKeyDown}
                onBlur={handleBlur}
                onReset={handleResetHotkeys}
                anim={anim(sectionIdx++)}
              />
            </>
          )}

          <HardwareSection
            hardware={settings.hardware}
            onUpdateHardware={updateHardware}
            onTestConnection={testConnection}
            anim={anim(sectionIdx++)}
          />
        </div>
      </ScrollArea>
    </div>
  );
};

export default Settings;
