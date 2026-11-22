function isLovablePreview(hostname: string): boolean {
  const firstLabel = hostname.split(".")[0] ?? "";
  const previewHost = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(firstLabel);
  return previewHost && [".lovable.app", ".gpt-eng.com", ".gptengineer.run"].some((suffix) => hostname.endsWith(suffix));
}

function isDisallowedHost(hostname: string): boolean {
  const projectDev = /^project--[^.]+-dev\.(?:lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(hostname);
  const platformPreview = hostname === "lovableproject.com"
    || hostname.endsWith(".lovableproject.com")
    || hostname === "lovableproject-dev.com"
    || hostname.endsWith(".lovableproject-dev.com")
    || hostname === "beta.lovable.dev"
    || hostname.endsWith(".beta.lovable.dev");
  return isLovablePreview(hostname) || projectDev || platformPreview;
}

async function unregisterAppWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  const appRegistrations = registrations.filter((registration) =>
    [registration.active, registration.waiting, registration.installing].some((worker) => {
      if (!worker) return false;
      try {
        return new URL(worker.scriptURL).pathname === "/sw.js";
      } catch {
        return false;
      }
    }),
  );
  await Promise.all(appRegistrations.map((registration) => registration.unregister()));
}

async function initializePwa(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const hostname = window.location.hostname.toLowerCase();
  const disabledByQuery = new URLSearchParams(window.location.search).get("sw") === "off";
  const refused = !import.meta.env.PROD
    || window.top !== window.self
    || isDisallowedHost(hostname)
    || disabledByQuery;

  if (refused) {
    await unregisterAppWorker();
    return;
  }

  const { registerSW } = await import("virtual:pwa-register");
  await registerSW({ immediate: true });
}

if (typeof window !== "undefined") {
  void initializePwa().catch(() => undefined);
}