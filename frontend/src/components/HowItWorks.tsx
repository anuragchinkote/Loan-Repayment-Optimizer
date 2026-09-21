export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-t border-outline-variant pb-12 pt-8">
      <div className="mb-8">
        <span className="mb-1 block font-label-sm text-label-sm font-semibold uppercase tracking-widest text-primary">
          Methodology
        </span>
        <h2 className="font-headline-lg text-headline-lg tracking-tight text-primary">
          How LoanPilot works
        </h2>
        <p className="mt-1 max-w-2xl font-body-md text-body-md text-on-surface-variant">
          A transparent, educational mathematical projection designed to show the tangible impact of
          voluntary principal curtailment.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="border border-outline-variant bg-surface-container-lowest p-6">
          <span className="mb-3 block font-headline-lg text-headline-lg font-serif text-primary-container">
            01
          </span>
          <h3 className="mb-2 font-headline-md text-headline-md text-on-surface">Enter your loan</h3>
          <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
            Add your outstanding balance, interest rate, lender-stated remaining tenure, and the
            monthly instalment you actually pay. Your current loan projection is modelled from that
            instalment.
          </p>
        </div>
        <div className="border border-outline-variant bg-surface-container-lowest p-6">
          <span className="mb-3 block font-headline-lg text-headline-lg font-serif text-primary-container">
            02
          </span>
          <h3 className="mb-2 font-headline-md text-headline-md text-on-surface">
            Try a repayment plan
          </h3>
          <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
            Move the slider, add one-time payments, or choose a target payoff term to model principal
            reductions.
          </p>
        </div>
        <div className="border border-outline-variant bg-surface-container-lowest p-6">
          <span className="mb-3 block font-headline-lg text-headline-lg font-serif text-primary-container">
            03
          </span>
          <h3 className="mb-2 font-headline-md text-headline-md text-on-surface">
            Compare the difference
          </h3>
          <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
            See estimated interest, payoff time, and total cash paid under each plan side-by-side
            with complete clarity.
          </p>
        </div>
      </div>

      <div className="mt-8 border border-outline-variant bg-surface-container-lowest">
        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-surface-container-low">
            <span className="font-label-md text-label-md font-bold uppercase tracking-wider text-primary">
              Assumptions &amp; Calculation Rules
            </span>
            <span className="material-symbols-outlined text-primary transition-transform group-open:rotate-180">
              expand_more
            </span>
          </summary>
          <div className="space-y-2 border-t border-outline-variant p-4 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
            <p>
              <strong>Fixed Interest Rate:</strong> Calculations assume the annual interest rate
              remains constant across the entire amortization lifespan.
            </p>
            <p>
              <strong>Immediate Principal Application:</strong> Extra monthly allocations and
              lump-sum additions are assumed to be credited directly toward principal reduction on
              the payment date without prepayment penalty fees.
            </p>
            <p>
              <strong>Educational Nature:</strong> Real-world bank servicing may vary slightly due to
              daily interest accrual conventions (e.g., 365 vs. 360 day basis), processing delays, or
              specific lender prepayment terms.
            </p>
          </div>
        </details>
      </div>
    </section>
  );
}