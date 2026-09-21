import { Link } from "react-router-dom";

const links: { to: string; label: string }[] = [
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms of Service" },
  { to: "/assumptions", label: "Assumptions & Methodology" },
  { to: "/disclaimer", label: "Disclaimers" },
];

const resourceLinks: { to: string; label: string }[] = [
  { to: "/extra-monthly-loan-payment", label: "Extra monthly payments" },
  { to: "/lump-sum-loan-prepayment", label: "Lump-sum prepayment" },
  { to: "/education-loan-prepayment", label: "Education loan prepayment" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-outline-variant bg-surface-container-low">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:px-6 md:flex-row md:px-12">
        <div>
          <div className="font-headline-md text-headline-md font-bold tracking-tight text-primary">
            LoanPilot
          </div>
          <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
            © {new Date().getFullYear()} LoanPilot. Built for educational loan transparency. Not
            financial advice.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 font-label-sm text-label-sm uppercase tracking-wider" role="navigation" aria-label="Footer">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-on-surface-variant transition-colors duration-150 hover:text-primary hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="mx-auto w-full max-w-7xl px-4 pb-7 sm:px-6 md:px-12">
        <div className="border-t border-outline-variant pt-4" role="navigation" aria-label="Resources">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary">
            Resources
          </span>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 font-label-sm text-label-sm uppercase tracking-wider">
            {resourceLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="text-on-surface-variant transition-colors duration-150 hover:text-primary hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}