import { Link } from "react-router-dom";
import { buttonVariants } from "./ui/button";
import { cn } from "../lib/utils";

export function CalculatorCta() {
  return (
    <div className="mt-6 rounded-lg border border-outline-variant bg-surface-container-low p-4 sm:p-5">
      <h2 className="mb-2 font-headline-md text-headline-md tracking-tight text-primary">
        Explore LoanPilot
      </h2>
      <p className="mb-4 font-body-md text-body-md leading-relaxed text-on-surface-variant">
        Open the LoanPilot repayment planner to model your own outstanding balance, interest
        rate, remaining tenure, and current monthly instalment — then compare options side by
        side.
      </p>
      <Link
        to="/"
        className={cn(buttonVariants({ variant: "cta", size: "lg" }), "whitespace-normal")}
      >
        Try the LoanPilot repayment planner
      </Link>
    </div>
  );
}