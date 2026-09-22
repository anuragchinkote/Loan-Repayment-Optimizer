import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { trackPageView } from "./services/analytics";

vi.mock("./services/analytics", () => ({
  initAnalytics: vi.fn(),
  trackEvent: vi.fn(),
  trackPageView: vi.fn(),
}));

const trackPageViewMock = vi.mocked(trackPageView);

const ROUTES = [
  "/",
  "/privacy",
  "/terms",
  "/assumptions",
  "/disclaimer",
  "/education-loan-prepayment",
  "/extra-monthly-loan-payment",
  "/lump-sum-loan-prepayment",
];

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GA4 page-view tracking", () => {
  it("records a page view for every route", () => {
    for (const route of ROUTES) {
      trackPageViewMock.mockClear();
      renderAt(route);
      expect(trackPageViewMock).toHaveBeenCalledWith(route);
    }
  });

  it("tracks an SPA navigation as a fresh page view", async () => {
    const user = userEvent.setup();
    renderAt("/");

    trackPageViewMock.mockClear();
    await user.click(screen.getByRole("link", { name: "Privacy Policy" }));

    expect(trackPageViewMock).toHaveBeenCalledWith("/privacy");
  });

  it("tracks the unknown-route redirect back to the calculator", () => {
    renderAt("/does-not-exist");
    expect(trackPageViewMock).toHaveBeenCalledWith("/");
  });

  it("passes only the pathname — never query strings or user data", () => {
    trackPageViewMock.mockClear();
    renderAt("/");
    expect(trackPageViewMock).toHaveBeenCalledWith("/");
    expect(
      trackPageViewMock.mock.calls.every(
        (call) => typeof call[0] === "string" && !call[0].includes("?"),
      ),
    ).toBe(true);
  });
});