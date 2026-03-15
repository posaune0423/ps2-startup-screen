import assert from "node:assert/strict";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, test } from "vite-plus/test";

import { LanguageProvider, useLanguage } from "../../src/lib/language-context";

function CurrentLabel() {
  const { t } = useLanguage();
  return React.createElement("span", null, t("browser.memoryCardWork"));
}

const originalWindow = globalThis.window;
const originalDocument = globalThis.document;
const originalLocalStorage = globalThis.localStorage;

function setGlobalValue(key: "window" | "document" | "localStorage", value: unknown) {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  setGlobalValue("window", originalWindow);
  setGlobalValue("document", originalDocument);
  setGlobalValue("localStorage", originalLocalStorage);
});

test("LanguageProvider keeps the first client render aligned with SSR even when english is stored", () => {
  setGlobalValue("window", undefined);
  setGlobalValue("document", undefined);
  setGlobalValue("localStorage", undefined);

  const serverMarkup = renderToStaticMarkup(
    React.createElement(LanguageProvider, null, React.createElement(CurrentLabel)),
  );

  const storage = {
    getItem(key: string) {
      return key === "ps2-locale" ? "en" : null;
    },
    setItem() {},
    removeItem() {},
    clear() {},
    key() {
      return null;
    },
    length: 1,
  } satisfies Storage;

  setGlobalValue("window", { localStorage: storage });
  setGlobalValue("localStorage", storage);

  const clientFirstMarkup = renderToStaticMarkup(
    React.createElement(LanguageProvider, null, React.createElement(CurrentLabel)),
  );

  assert.equal(serverMarkup, "<span>メモリーカード (work)</span>");
  assert.equal(clientFirstMarkup, serverMarkup);
});
