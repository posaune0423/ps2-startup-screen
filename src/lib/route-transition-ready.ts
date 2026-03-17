"use client";

const ROUTE_READY_EVENT = "app:route-ready";
const ROUTE_READY_TIMEOUT_MS = 1500;
const READY_GATED_ROUTES = new Set(["/browser", "/memory/work", "/memory/sns"]);
const readyRoutes = new Set<string>();

function isRouteReadyGated(pathname: string) {
  return READY_GATED_ROUTES.has(pathname);
}

export function resetRouteReady(pathname: string) {
  readyRoutes.delete(pathname);
}

export function markRouteReady(pathname: string) {
  readyRoutes.add(pathname);

  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<string>(ROUTE_READY_EVENT, { detail: pathname }));
}

export async function waitForRouteReady(pathname: string): Promise<void> {
  if (typeof window === "undefined" || !isRouteReadyGated(pathname) || readyRoutes.has(pathname)) {
    return;
  }

  await new Promise<void>((resolve) => {
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      window.removeEventListener(ROUTE_READY_EVENT, handleReady as EventListener);
      resolve();
    };

    const handleReady = (event: Event) => {
      if (!(event instanceof CustomEvent) || event.detail !== pathname) return;
      finish();
    };

    const timeoutId = window.setTimeout(finish, ROUTE_READY_TIMEOUT_MS);
    window.addEventListener(ROUTE_READY_EVENT, handleReady as EventListener);
  });
}
