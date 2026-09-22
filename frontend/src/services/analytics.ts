import { GA_MEASUREMENT_ID } from "../config";

interface AnalyticsWindow extends Window {
  dataLayer?: unknown[][];
  gtag?: (...args: unknown[]) => void;
}

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

export type EventParams = Record<string, string | number | boolean>;

let loaded = false;

// Pushes straight onto the dataLayer (the same queue the real gtag.js processes),
// so events survive while the external script is still loading, and they no-op
// harmlessly on their own.
//
// NOTE: gtag.js only processes entries it recognizes as commands. It checks for a
// real `arguments` object (see `Mb()`: `[object Arguments]` / has `callee`), so we
// must forward `arguments` untouched. A real Array (e.g. from a rest-param spread)
// is left in the dataLayer forever and never converted or dispatched.
function push(..._args: unknown[]) {
  const w = window as AnalyticsWindow;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(arguments as unknown as unknown[]);
}

function gtag(...args: unknown[]) {
  // `arguments` must stay intact for gtag.js to recognize the command.
  push(...args);
}

// Injects the official Google tag script. Wrapped so a blocked or failed script
// can never break the app: if this fails, the fallback gtag still queues events
// into the dataLayer, which GA4 ignores when the script is unavailable.
export function initAnalytics(): void {
  if (!GA_MEASUREMENT_ID) return;
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const w = window as AnalyticsWindow;
  w.dataLayer = w.dataLayer || [];
  w.gtag = w.gtag || gtag;

  if (loaded) return;
  loaded = true;

  // Standard gtag.js init: the `js` command arms the container's destination tag
  // (fires the internal `gtm.js` event) before any `config`/`event` calls, and
  // must be queued before gtag.js processes the dataLayer.
  gtag("js", new Date());

  try {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
    script.setAttribute("type", "text/javascript");
    document.head.appendChild(script);
  } catch {
    loaded = false;
  }
}

export function trackPageView(path: string): void {
  if (!GA_MEASUREMENT_ID) return;
  if (typeof window === "undefined") return;
  initAnalytics();
  try {
    window.gtag?.("config", GA_MEASUREMENT_ID, {
      page_path: path,
      page_location: `${window.location.origin}${path}`,
      page_title: document.title,
    });
  } catch {
    // Analytics must never break the app.
  }
}

export function trackEvent(name: string, params?: EventParams): void {
  if (!GA_MEASUREMENT_ID) return;
  if (typeof window === "undefined") return;
  initAnalytics();
  try {
    window.gtag?.("event", name, params ?? {});
  } catch {
    // Analytics must never break the app.
  }
}