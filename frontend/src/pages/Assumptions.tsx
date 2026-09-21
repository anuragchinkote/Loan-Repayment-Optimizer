import { Section, StaticPage, paragraph } from "../components/StaticPage";
import { usePageMeta } from "../hooks/usePageMeta";

export default function Assumptions() {
  usePageMeta(
    "Assumptions & Methodology — LoanPilot",
    "The calculation rules LoanPilot uses to project interest, payoff time, and total cash paid.",
  );

  return (
    <StaticPage
      title="Assumptions & Methodology"
      intro="LoanPilot builds standard amortization schedules and compares them. These are the rules that every projection follows."
    >
      <Section title="Base loan model">
        <p className={paragraph}>
          Your loan is modelled as a fixed-rate amortizing loan. The baseline schedule is driven by
          the current monthly instalment you actually enter: each month the interest portion is
          computed on the opening balance, the rest of the payment reduces principal, and the new
          balance becomes the opening balance of the following month. The schedule runs until the
          balance reaches zero.
        </p>
        <p className={paragraph}>
          The lender-stated remaining tenure is treated as context, not as the assumed payoff
          horizon. If your instalment is above the standard instalment for that tenure, the model
          projects an earlier payoff; if it is below, the model projects a longer one, and you will
          see a non-blocking notice about that difference. The monthly rate is the annual rate
          divided by twelve, compounded monthly, the standard convention for Indian home and
          personal loans.
        </p>
      </Section>
      <Section title="Extra monthly payments">
        <p className={paragraph}>
          An extra monthly payment is added on top of your current monthly instalment every month.
          The full amount is applied directly to the outstanding principal on the payment date, so
          interest in later months is computed on a smaller balance.
        </p>
      </Section>
      <Section title="One-time lump sums">
        <p className={paragraph}>
          A lump sum reduces the outstanding balance in the month it is scheduled, before that
          month's interest is calculated. The monthly instalment stays the same, which means more of
          each subsequent payment frees the loan sooner.
        </p>
      </Section>
      <Section title="Target payoff term">
        <p className={paragraph}>
          When you choose a target term, LoanPilot computes the monthly payment the engine says is
          needed to reduce the balance to zero within that many months at the current rate. That
          payment can be higher or lower than your current instalment, and the resulting plan is
          compared honestly against continuing to pay as you do today — even when that means it
          saves nothing.
        </p>
      </Section>
      <Section title="Rounding and formatting">
        <p className={paragraph}>
          All money is carried at full decimal precision by the calculation engine and rounded only
          for display. Small differences of a few paise can therefore appear between the last
          schedule row and the monthly payment shown on screen.
        </p>
      </Section>

      <Section title="Disclaimers" id="disclaimers">
        <p className={paragraph}>
          <strong>Not financial advice.</strong> Nothing on LoanPilot is personalised advice for
          your situation. A prepayment that reduces interest can also reduce your flexibility, and
          some loans carry prepayment penalties or require minimum prepayment amounts.
        </p>
        <p className={paragraph}>
          <strong>Estimates only.</strong> Lenders may use 365/360 day bases, round differently, or
          apply payments at different times of the day, which can shift results by a small amount.
          Read the full{" "}
          <a className="text-primary underline underline-offset-4 hover:text-primary-container" href="/disclaimer">
            disclaimer
          </a>
          .
        </p>
        <p className={paragraph}>
          <strong>Fixed rate assumed.</strong> If your rate changes (floating loans), or you miss
          payments, the real outcome will differ from the projection.
        </p>
      </Section>
    </StaticPage>
  );
}