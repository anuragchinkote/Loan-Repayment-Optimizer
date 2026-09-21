import { Link } from "react-router-dom";
import { CalculatorCta } from "../components/CalculatorCta";
import { Section, StaticPage, listItem, paragraph, strong } from "../components/StaticPage";
import { usePageMeta } from "../hooks/usePageMeta";

export default function LumpSumLoanPrepayment() {
  usePageMeta(
    "Lump-Sum Loan Prepayment: How It Affects Interest and Payoff Time | LoanPilot",
    "Learn how a lump-sum loan prepayment can change interest and payoff time, and use LoanPilot to model different repayment scenarios.",
  );

  return (
    <StaticPage
      title="Lump-Sum Loan Prepayment"
      intro="A lump-sum prepayment is a single additional amount you pay toward the principal at one point during the loan. Because it reduces the balance before subsequent interest is calculated, it can change the remaining interest and payoff time — which is what LoanPilot models when you schedule a lump sum."
    >
      <Section title="What a lump-sum repayment does">
        <p className={paragraph}>
          Loan payments are typically amortized: each instalment covers the month's interest and
          reduces principal. A lump-sum prepayment accelerates that by cutting the principal
          balance directly. In LoanPilot's model, a scheduled lump sum reduces the outstanding
          balance in the month it is scheduled, before that month's interest is calculated, while
          your monthly instalment stays the same.
        </p>
        <p className={paragraph}>
          Because the instalment stays the same but the balance becomes smaller, more of each
          future instalment goes toward principal. The payoff can complete earlier than the
          stated tenure, and the total interest paid can fall. This behaviour matches the
          conventions described on the{" "}
          <Link to="/assumptions" className={strong}>
            assumptions page
          </Link>
          .
        </p>
      </Section>

      <Section title="Lump sum vs extra monthly payment">
        <p className={paragraph}>
          Both are forms of prepayment but they move money differently:
        </p>
        <ul className="ml-4 mb-4 list-disc">
          <li className={listItem}>
            <strong className={strong}>Lump sum</strong> — one larger amount at a single point in
            time, suited to a bonus, gift, or other one-time cash you can apply to the loan.
          </li>
          <li className={listItem}>
            <strong className={strong}>Extra monthly payment</strong> — a fixed recurring amount
            added to each instalment. See{" "}
            <Link to="/extra-monthly-loan-payment" className={strong}>
              extra monthly loan payments
            </Link>
            .
          </li>
        </ul>
        <p className={paragraph}>
          A lump sum reduces the balance immediately, so its effect depends mainly on when it is
          applied; an extra monthly payment spreads the reduction across the remaining tenure.
        </p>
      </Section>

      <Section title="Why timing matters">
        <p className={paragraph}>
          The same lump sum has a larger effect if applied earlier in the loan, because the
          principal it removes would otherwise keep accruing interest for more months. A lump sum
          near the end of the tenure has little interest left to save.
        </p>
        <p className={paragraph}>
          LoanPilot asks for the <strong className={strong}>month</strong> in which you plan to
          apply a lump sum (relative to the remaining tenure) and applies it at that point in the
          schedule, so you can compare placing it now versus later.
        </p>
      </Section>

      <Section title="A simple illustrative example">
        <p className={paragraph}>
          <strong className={strong}>Illustrative numbers only.</strong> On a ₹4,00,000 balance
          at 9% per year with roughly 8 years remaining and a current instalment near ₹5,866, a
          one-time lump sum of ₹1,00,000 applied now would reduce the modelled total interest and
          bring the payoff forward substantially compared with the baseline. These figures are an
          illustration of the mechanism; the real result depends on your rate, balance, remaining
          tenure, and the lender's treatment of the prepayment.
        </p>
        <p className={paragraph}>
          You can enter your own lump-sum amount and month in the{" "}
          <Link to="/" className={strong}>
            LoanPilot repayment planner
          </Link>{" "}
          and see the comparison update.
        </p>
      </Section>

      <Section title="Check lender-specific rules and fees">
        <p className={paragraph}>
          LoanPilot models the mechanics of the prepayment but does not know your lender's
          policy. Before making a lump-sum prepayment, confirm:
        </p>
        <ul className="ml-4 mb-4 list-disc">
          <li className={listItem}>whether prepayment is allowed and any minimums,</li>
          <li className={listItem}>
            whether <strong className={strong}>fees or penalties</strong> apply,
          </li>
          <li className={listItem}>
            whether the prepayment <strong className={strong}>reduces the monthly instalment</strong>{" "}
            or shortens the tenure in their records, and
          </li>
          <li className={listItem}>how partial prepayments are applied to interest and principal.</li>
        </ul>
        <p className={paragraph}>
          A prepayment is not automatically a saving once fees are included. LoanPilot's estimate
          is not guaranteed, and you should confirm the actual treatment with your lender — see
          the{" "}
          <Link to="/disclaimer" className={strong}>
            disclaimers
          </Link>
          .
        </p>
      </Section>

      <CalculatorCta />
    </StaticPage>
  );
}