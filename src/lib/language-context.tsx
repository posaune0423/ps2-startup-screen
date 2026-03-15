"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { Locale, TranslationKey } from "./i18n";
import { translate } from "./i18n";

const STORAGE_KEY = "ps2-locale";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "ja" || stored === "en") return stored;
  return null;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  useEffect(() => {
    const storedLocale = getStoredLocale();
    if (storedLocale && storedLocale !== locale) {
      setLocaleState(storedLocale);
      return;
    }
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
