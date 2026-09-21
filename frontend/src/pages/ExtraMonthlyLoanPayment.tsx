import { Link } from "react-router-dom";
import { CalculatorCta } from "../components/CalculatorCta";
import { Section, StaticPage, listItem, paragraph, strong } from "../components/StaticPage";
import { usePageMeta } from "../hooks/usePageMeta";

export default function ExtraMonthlyLoanPayment() {
  usePageMeta(
    "Extra Monthly Loan Payments: See How Much You Could Save | LoanPilot",
    "See how paying extra toward your loan each month can affect interest and payoff time with LoanPilot's repayment planner.",
  );

  return (
    <StaticPage
      title="Extra Monthly Loan Payments"
      intro="An extra monthly payment is a fixed additional amount you pay on top of your current instalment every month. Because it reduces the principal balance sooner, less interest accrues in later months — which is what LoanPilot models when you add extra monthly payments."
    >
      <Section title="How an extra monthly payment works">
        <p className={paragraph}>
          Most education, home, and personal loans are modelled as fixed-rate amortizing loans:
          each month you pay the scheduled instalment, a portion covers that month's interest and
          the rest reduces the principal. If you pay an <strong className={strong}>extra amount
          each month</strong>, the principal falls faster, so future interest is computed on a
          smaller balance.
        </p>
        <p className={paragraph}>
          The relationship is compounding in reverse: less interest each month means more of each
          instalment goes to principal, which further reduces the next month's interest. Over the
          remaining tenure this can shorten the payoff time or reduce the total interest paid —
          often both.
        </p>
      </Section>

      <Section title="Why even a small amount can matter">
        <p className={paragraph}>
          A relatively small additional monthly payment can visibly change the simulated
          schedule when the remaining tenure is long and the balance is large, because each
          extra rupee reduces principal that would otherwise keep accruing interest every month
          for years. The size of the effect grows with the rate and the remaining term, and
          shrinks as the loan nears its end.
        </p>
        <p className={paragraph}>
          This is exactly what the comparison view in the calculator shows — the{" "}
          <Link to="/" className={strong}>
            current plan versus the new plan
          </Link>
          .
        </p>
      </Section>

      <Section title="Extra monthly payment vs lump sum">
        <p className={paragraph}>
          The two common prepayment approaches differ:
        </p>
        <ul className="ml-4 mb-4 list-disc">
          <li className={listItem}>
            <strong className={strong}>Extra monthly payment</strong> — a recurring, predictable
            addition to each instalment, spread across the whole remaining tenure.
          </li>
          <li className={listItem}>
            <strong className={strong}>Lump-sum prepayment</strong> — a single, larger amount
            applied at one point in time. See{" "}
            <Link to="/lump-sum-loan-prepayment" className={strong}>
              lump-sum loan prepayment
            </Link>
            .
          </li>
        </ul>
        <p className={paragraph}>
          An extra monthly amount fits a steady surplus in monthly cash flow; a lump sum fits a
          one-time windfall such as a bonus. LoanPilot can model both, either on their own or
          combined.
        </p>
      </Section>

      <Section title="What the calculation needs from you">
        <p className={paragraph}>
          In the LoanPilot calculator, the extra-monthly-payment strategy needs:
        </p>
        <ul className="ml-4 mb-4 list-disc">
          <li className={listItem}>the outstanding balance,</li>
          <li className={listItem}>the annual interest rate,</li>
          <li className={listItem}>the lender-stated remaining tenure,</li>
          <li className={listItem}>your current monthly instalment, and</li>
          <li className={listItem}>the additional monthly amount.</li>
        </ul>
        <p className={paragraph}>
          The engine simulates paying your current instalment <em>plus</em> the extra amount each
          month and reports the resulting interest, total paid, and payoff duration against the
          baseline. The underlying conventions are documented on the{" "}
          <Link to="/assumptions" className={strong}>
            assumptions page
          </Link>
          .
        </p>
      </Section>

      <Section title="A simple illustrative example">
        <p className={paragraph}>
          <strong className={strong}>Illustrative numbers only.</strong> On a ₹4,00,000 balance
          at 9% per year with about 8 years remaining and a current instalment near ₹5,866, an
          additional ₹1,500 per month would reduce the modelled interest paid and bring the
          payoff date forward compared with the baseline. The exact result depends on your rate,
          balance, tenure, and how consistently the extra amount is paid — these figures are an
          illustration of the mechanism, not a promise of savings.
        </p>
        <p className={paragraph}>
          You can change the extra amount in the planner and watch the comparison update — no
          amount is claimed to be guaranteed.
        </p>
      </Section>

      <CalculatorCta />
    </StaticPage>
  );
}