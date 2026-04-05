import { useCallback } from "react";
import { translations, type Locale } from "@/i18n/translations";
import { useSettings } from "@/hooks/useSettings";

export const useTranslation = () => {
  const { settings } = useSettings();
  const locale: Locale = settings.language === "ar" ? "fr" : settings.language;

  const t = useCallback(
    (key: string): string => {
      return translations[locale]?.[key] ?? translations.fr[key] ?? key;
    },
    [locale]
  );

  return { t, locale };
};
