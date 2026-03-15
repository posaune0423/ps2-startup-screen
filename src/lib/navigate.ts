export function navigate(href: string) {
  window.dispatchEvent(new CustomEvent("app:navigate", { detail: href }));
}
