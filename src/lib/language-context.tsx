"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo } from "react";

import { useAppStore } from "./app-store";
import type { Locale, TranslationKey } from "./i18n";
import { translate } from "./i18n";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale = useAppStore((state) => state.locale);
  const setLocale = useAppStore((state) => state.setLocale);
  const hydrateSettings = useAppStore((state) => state.hydrateSettings);

  useEffect(() => {
    hydrateSettings();
  }, [hydrateSettings]);

  useEffect(() => {
    document.documentElement.lang = locale === "ja" ? "ja" : "en";
  }, [locale]);

  const t = useCallback((key: TranslationKey) => translate(locale, key), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LanguageContext value={value}>{children}</LanguageContext>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
