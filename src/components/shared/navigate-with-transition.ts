interface AppRouter {
  push(href: string): void;
}

export function navigateWithTransition(router: AppRouter, href: string, options?: { external?: boolean }): void {
  if (options?.external) {
    window.open(href, "_blank");
    return;
  }

  if (document.startViewTransition) {
    document.startViewTransition(() => {
      router.push(href);
    });
  } else {
    router.push(href);
  }
}
