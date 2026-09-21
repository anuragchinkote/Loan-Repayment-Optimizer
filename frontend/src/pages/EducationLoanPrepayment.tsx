import { Link } from "react-router-dom";
import { CalculatorCta } from "../components/CalculatorCta";
import { Section, StaticPage, listItem, paragraph, strong } from "../components/StaticPage";
import { usePageMeta } from "../hooks/usePageMeta";

export default function EducationLoanPrepayment() {
  usePageMeta(
    "Education Loan Prepayment: How It Can Reduce Interest | LoanPilot",
    "Learn how education loan prepayment can affect interest and repayment time, including extra monthly payments and lump-sum repayments.",
  );

  return (
    <StaticPage
      title="Education Loan Prepayment"
      intro="Prepaying an education loan means paying more toward the principal than the scheduled instalment calls for. When that happens, future interest is calculated on a smaller balance — but the actual effect depends on your loan's terms and your lender's rules."
    >
      <Section title="What education loan prepayment means">
        <p className={paragraph}>
          An education loan is repaid over a set tenure with a fixed monthly instalment based on
          a fixed-rate amortization model. "Prepayment" is any amount you pay beyond that
          scheduled instalment, applied toward the outstanding principal.
        </p>
        <p className={paragraph}>
          Reducing the principal earlier changes what happens afterwards: interest on most
          amortizing loans is calculated on the balance remaining, so a smaller balance means
          less interest accrues in later months. LoanPilot models exactly this behaviour — you
          can read the specific conventions on the{" "}
          <Link to="/assumptions" className={strong}>
            assumptions page
          </Link>
          .
        </p>
      </Section>

      <Section title="Three ways to prepay">
        <p className={paragraph}>
          Prepayment generally takes one of three forms, and LoanPilot supports all three as
          strategies:
        </p>
        <ul className="ml-4 mb-4 list-disc">
          <li className={listItem}>
            <strong className={strong}>Increasing your monthly repayment</strong> — paying a
            fixed extra amount on top of your current instalment every month.
          </li>
          <li className={listItem}>
            <strong className={strong}>Making a lump-sum repayment</strong> — applying one
            additional amount to the principal at a point in time.
          </li>
          <li className={listItem}>
            <strong className={strong}>Targeting a shorter payoff period</strong> — choosing the
            term you want and letting the calculation find the payment that clears the loan in
            that time.
          </li>
        </ul>
        <p className={paragraph}>
          These are not interchangeable. An extra monthly amount steadily reduces the balance
          each month; a lump sum makes a single large reduction; a target term works backwards
          from the payoff date to the required payment. Which one helps depends on your cash
          flow and when you have money available.
        </p>
      </Section>

      <Section title="Why the effect depends on your details">
        <p className={paragraph}>
          The same prepayment can change a schedule by a lot or by very little. The size of the
          effect depends on:
        </p>
        <ul className="ml-4 mb-4 list-disc">
          <li className={listItem}>the outstanding balance,</li>
          <li className={listItem}>the interest rate,</li>
          <li className={listItem}>the remaining tenure, and</li>
          <li className={listItem}>the amount and timing of the prepayment.</li>
        </ul>
        <p className={paragraph}>
          A higher rate and a longer remaining term mean more interest is still outstanding, so a
          prepayment tends to have a larger effect. A loan near its final months has almost no
          interest left to save.
        </p>
      </Section>

      <Section title="A simple illustrative example">
        <p className={paragraph}>
          <strong className={strong}>Illustrative numbers only.</strong> Suppose an outstanding
          balance of ₹4,00,000 at 9% per year, a lender-stated remaining tenure of 8 years, and
          a current monthly instalment of around ₹5,866. Paying an extra ₹2,000 every month
          would reduce the simulated interest paid and shorten the modeled payoff time compared
          with the baseline. The exact figures would depend on the rate, balance, tenure, and
          repayment behaviour — this is an illustration of how the effect works, not a
          prediction.
        </p>
        <p className={paragraph}>
          You can enter your own numbers and see the baseline-versus-new-plan comparison in the{" "}
          <Link to="/" className={strong}>
            LoanPilot calculator
          </Link>
          .
        </p>
      </Section>

      <Section title="Check your lender's prepayment rules">
        <p className={paragraph}>
          LoanPilot models the repayment mechanics only. It does <em>not</em> know your lender's
          specific policies. Before prepaying, check:
        </p>
        <ul className="ml-4 mb-4 list-disc">
          <li className={listItem}>
            whether your lender <strong className={strong}>allows</strong> prepayment and any
            minimum amounts,
          </li>
          <li className={listItem}>
            whether <strong className={strong}>fees or penalties</strong> apply (some loans carry
            prepayment charges),
          </li>
          <li className={listItem}>
            how the lender <strong className={strong}>applies</strong> partial prepayments, and
          </li>
          <li className={listItem}>
            whether <strong className={strong}>your monthly instalment changes</strong> or the
            tenure shortens after a prepayment.
          </li>
        </ul>
        <p className={paragraph}>
          Prepayment is not always beneficial after fees, and LoanPilot's estimate is not a
          guarantee — confirm the actual treatment with your lender. See the{" "}
          <Link to="/disclaimer" className={strong}>
            disclaimers
          </Link>{" "}
          for the limits of these calculations.
        </p>
      </Section>

      <CalculatorCta />
    </StaticPage>
  );
}