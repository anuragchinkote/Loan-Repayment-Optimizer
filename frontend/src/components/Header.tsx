import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

type NavTab = "calculator" | "how";

const NAV_TABS: { tab: NavTab; label: string; targetId: string }[] = [
  { tab: "calculator", label: "Calculator", targetId: "workspace" },
  { tab: "how", label: "How It Works", targetId: "how-it-works" },
];

const hashToTab = (hash: string): NavTab => (hash === "#how-it-works" ? "how" : "calculator");

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState<NavTab>(() => hashToTab(location.hash));
  const [navHashSnapshot, setNavHashSnapshot] = useState(() =>
    location.pathname === "/" ? location.hash : "",
  );

  // Keep the active tab in sync with the browser location (e.g. back/forward),
  // adjusting state during render rather than from an effect.
  if (navHashSnapshot !== (location.pathname === "/" ? location.hash : "")) {
    setNavHashSnapshot(location.pathname === "/" ? location.hash : "");
    setActiveNav(location.pathname === "/" ? hashToTab(location.hash) : "calculator");
  }

  // Scroll-spy: the nav underline follows the section the reader is actually
  // looking at. Clicking a tab scrolls there (goTo); scrolling away from the
  // How-It-Works section flips the underline back to Calculator, and scrolling
  // back into it moves it to How It Works again.
  useEffect(() => {
    if (location.pathname !== "/") return;
    const howEl = document.getElementById("how-it-works");
    if (!howEl) return;

    let rafId = 0;
    let lastTab: NavTab | null = null;

    const update = () => {
      const threshold = window.innerHeight * 0.35;
      const nextTab: NavTab =
        howEl.getBoundingClientRect().top <= threshold ? "how" : "calculator";
      if (nextTab !== lastTab) {
        lastTab = nextTab;
        setActiveNav(nextTab);
      }
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        update();
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [location.pathname]);

  const reducedMotion = () =>
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const wrapRaf = (fn: () => void) => {
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(fn);
    } else {
      window.setTimeout(fn, 16);
    }
  };

  const scrollToStableId = (id: string) => {
    wrapRaf(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
    });
  };

  const goTo = (tab: NavTab, targetId: string) => {
    setActiveNav(tab);
    if (location.pathname !== "/") {
      navigate("/", { replace: true });
      window.setTimeout(() => scrollToStableId(targetId), 80);
    } else {
      scrollToStableId(targetId);
    }
  };

  const handleCalculate = () => {
    const isHome = location.pathname === "/";
    setActiveNav("calculator");
    const dispatch = () => {
      window.dispatchEvent(new CustomEvent("loanpilot:calculate"));
      wrapRaf(() => {
        document
          .getElementById("workspace")
          ?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
      });
    };
    if (!isHome) navigate("/", { replace: true });
    window.setTimeout(dispatch, isHome ? 0 : 80);
  };

  const activeIndex = NAV_TABS.findIndex((item) => item.tab === activeNav);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-outline-variant bg-surface-container-lowest">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 md:px-12">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="font-headline-md text-headline-md font-bold tracking-tight text-primary"
            aria-label="LoanPilot home"
          >
            LoanPilot
          </Link>
          <span className="hidden font-light text-body-md text-outline-variant sm:inline">/</span>
          <span className="hidden font-label-md text-label-md uppercase tracking-wider text-on-surface-variant sm:inline">
            Loan payoff planner
          </span>
        </div>
        <nav className="hidden items-center md:flex" aria-label="Main">
          <div className="relative flex">
            {NAV_TABS.map((item) => {
              const active = activeNav === item.tab;
              return (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => goTo(item.tab, item.targetId)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "w-32 cursor-pointer py-1 text-center font-label-md text-label-md uppercase tracking-wider transition-colors duration-150 hover:text-primary",
                    active ? "font-bold text-primary" : "text-on-surface-variant",
                  )}
                >
                  {item.label}
                </button>
              );
            })}
            <span
              aria-hidden="true"
              className="absolute bottom-0 left-0 h-[2px] bg-primary transition-transform duration-200 ease-out"
              style={{ width: "50%", transform: `translateX(${activeIndex * 100}%)` }}
            />
          </div>
        </nav>
        <div>
          <Button
            variant="primary"
            size="default"
            className="hidden sm:inline-flex"
            onClick={handleCalculate}
          >
            Calculate
          </Button>
        </div>
      </div>
    </header>
  );
}
