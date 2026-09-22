import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Header } from "./Header";

describe("Header navigation", () => {
  it("renders section tabs as buttons with no hash URLs", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Header />
      </MemoryRouter>,
    );

    const calc = screen.getByRole("button", { name: /^calculator$/i });
    const how = screen.getByRole("button", { name: /^how it works$/i });
    expect(calc).toHaveAttribute("aria-current", "true");
    expect(how).not.toHaveAttribute("aria-current");

    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav.querySelectorAll('a[href*="#"]').length).toBe(0);
  });

  it("moves the active underline to How It Works on click", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Header />
      </MemoryRouter>,
    );

    const how = screen.getByRole("button", { name: /^how it works$/i });
    await user.click(how);

    expect(how).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: /^calculator$/i })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("re-syncs the active tab from the URL hash", () => {
    render(
      <MemoryRouter initialEntries={["/#how-it-works"]}>
        <Header />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: /^how it works$/i }),
    ).toHaveAttribute("aria-current", "true");
  });
});