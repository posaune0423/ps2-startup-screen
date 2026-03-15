export type Locale = "ja" | "en";

const translations = {
  ja: {
    "menu.browser": "ブラウザ",
    "menu.systemConfiguration": "本体設定",
    "browser.memoryCardWork": "メモリーカード (work)",
    "browser.memoryCardSns": "メモリーカード (sns)",
    "browser.audioCd": "Audio CD",
    "system.title": "本体設定",
    "system.language": "言語設定",
    "system.language.ja": "日本語",
    "system.language.en": "English",
    "system.sound": "音声",
    "system.sound.on": "入",
    "system.sound.off": "切",
  },
  en: {
    "menu.browser": "Browser",
    "menu.systemConfiguration": "System Configuration",
    "browser.memoryCardWork": "Memory Card (work)",
    "browser.memoryCardSns": "Memory Card (sns)",
    "browser.audioCd": "Audio CD",
    "system.title": "System Configuration",
    "system.language": "Language",
    "system.language.ja": "Japanese",
    "system.language.en": "English",
    "system.sound": "Sound",
    "system.sound.on": "On",
    "system.sound.off": "Off",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["ja"];

export function translate(locale: Locale, key: TranslationKey): string {
  return translations[locale][key];
}
