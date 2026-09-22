import { beforeEach, describe, expect, it, vi } from "vitest";

type DataLayerEntry = unknown[];

function setMeasurementId(id: string) {
  vi.stubEnv("VITE_GA_MEASUREMENT_ID", id);
}

function dataLayer(): DataLayerEntry[] {
  const w = window as unknown as { dataLayer?: DataLayerEntry[] };
  return w.dataLayer ?? [];
}

interface AnalyticsModule {
  initAnalytics: () => void;
  trackPageView: (path: string) => void;
  trackEvent: (name: string, params?: Record<string, string | number | boolean>) => void;
}

async function loadAnalytics(measurementId: string): Promise<AnalyticsModule> {
  setMeasurementId(measurementId);
  const mod = await import("./analytics");
  return mod as AnalyticsModule;
}

beforeEach(() => {
  setMeasurementId("");
  vi.resetModules();
  vi.restoreAllMocks();
  const w = window as unknown as { dataLayer?: DataLayerEntry[] };
  delete w.dataLayer;
  const g = window as unknown as { gtag?: unknown };
  delete g.gtag;
});

describe("analytics service", () => {
  it("pushes a page_view config with only safe fields when a measurement ID is set", async () => {
    const { trackPageView } = await loadAnalytics("G-TEST");
    trackPageView("/privacy");

    const entries = dataLayer();
    const config = entries.find((entry) => entry[0] === "config");
    expect(config).toBeDefined();
    expect(config?.[1]).toBe("G-TEST");
    const params = config?.[2] as Record<string, unknown>;
    expect(params.page_path).toBe("/privacy");
    expect(Object.keys(params)).toEqual(
      expect.arrayContaining(["page_path", "page_location", "page_title"]),
    );
  });

  it("pushes named events with their params", async () => {
    const { trackEvent } = await loadAnalytics("G-TEST");
    trackEvent("strategy_selected", { strategy: "extra" });

    const event = dataLayer().find((entry) => entry[0] === "event");
    expect(event?.[1]).toBe("strategy_selected");
    expect(event?.[2]).toEqual({ strategy: "extra" });
  });

  it("queues events through the dataLayer even before the gtag script loads", async () => {
    const { trackEvent } = await loadAnalytics("G-TEST");
    trackEvent("baseline_calculated");

    expect(
      dataLayer().some(
        (entry) => entry[0] === "event" && entry[1] === "baseline_calculated",
      ),
    ).toBe(true);
  });

  it("injects the official gtag script once", async () => {
    const { initAnalytics } = await loadAnalytics("G-TEST");
    const appendSpy = vi.spyOn(document.head, "appendChild");
    initAnalytics();
    initAnalytics();

    const scripts = appendSpy.mock.calls.filter(
      ([node]) => node instanceof HTMLScriptElement,
    );
    expect(scripts).toHaveLength(1);
    expect((scripts[0][0] as HTMLScriptElement).src).toContain(
      "https://www.googletagmanager.com/gtag/js?id=G-TEST",
    );
  });

  it("stays completely silent when no measurement ID is configured", async () => {
    const { initAnalytics, trackPageView, trackEvent } = await loadAnalytics("");
    const appendSpy = vi.spyOn(document.head, "appendChild");

    trackPageView("/");
    trackEvent("strategy_selected", { strategy: "extra" });
    initAnalytics();

    expect(dataLayer()).toEqual([]);
    expect(appendSpy).not.toHaveBeenCalled();
  });

  it("never records financial keys in page-view parameters", async () => {
    const { trackPageView } = await loadAnalytics("G-TEST");
    trackPageView("/");

    const config = dataLayer().find((entry) => entry[0] === "config");
    const params = Object.keys((config?.[2] ?? {}) as Record<string, unknown>);
    const financeKeys = [
      "balance",
      "rate",
      "tenure",
      "instalment",
      "emi",
      "principal",
      "amount",
      "extra",
      "savings",
    ];
    for (const key of financeKeys) {
      expect(params).not.toContain(key);
    }
  });
});