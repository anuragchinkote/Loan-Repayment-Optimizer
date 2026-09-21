import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleCalculate = () => {
    const isHome = location.pathname === "/";
    const dispatch = () => {
      window.dispatchEvent(new CustomEvent("loanpilot:calculate"));
      window.requestAnimationFrame(() => {
        document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };
    if (!isHome) navigate("/", { replace: true });
    window.setTimeout(dispatch, isHome ? 0 : 80);
  };

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
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          <Link
            to={{ pathname: "/", hash: "workspace" }}
            className="border-b-2 border-primary py-1 font-label-md text-label-md font-bold uppercase tracking-wider text-primary transition-colors duration-150"
          >
            Calculator
          </Link>
          <Link
            to={{ pathname: "/", hash: "how-it-works" }}
            className="py-1 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant transition-colors duration-150 hover:text-primary"
          >
            How It Works
          </Link>
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