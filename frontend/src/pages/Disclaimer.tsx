import { Section, StaticPage, listItem, paragraph } from "../components/StaticPage";
import { usePageMeta } from "../hooks/usePageMeta";

export default function Disclaimer() {
  usePageMeta(
    "Disclaimer — LoanPilot",
    "The full disclaimer for the LoanPilot educational loan payoff calculator.",
  );

  return (
    <StaticPage
      title="Disclaimer"
      intro="LoanPilot is an educational tool. Please read this before relying on anything it shows you."
    >
      <Section title="Not financial advice">
        <p className={paragraph}>
          Nothing on LoanPilot is personalised financial, investment, legal, or tax advice. The
          calculator produces a mathematical projection based only on the numbers you choose to
          enter. It does not know your lender's policies, your income, or your risk situation, and it
          makes no recommendation about whether you should prepay a loan.
        </p>
        <p className={paragraph}>
          Decisions about prepaying or restructuring a loan can be hard to reverse — for example,
          paying down principal can reduce your liquidity or affect other goals. Consider speaking
          with a qualified adviser before acting.
        </p>
      </Section>

      <Section title="Estimates, not guarantees">
        <p className={paragraph}>
          LoanPilot models a fixed-rate amortizing loan: interest accrues monthly on the outstanding
          balance, and the schedule is driven by the monthly instalment you enter. The lender-stated
          remaining tenure is context; the modelled payoff time can be shorter or longer than that
          tenure.
        </p>
        <p className={paragraph}>
          Real lenders can differ in ways the model cannot account for, including:
        </p>
        <ul className="mb-4 ml-4 list-disc">
          <li className={listItem}>daily or 365/360 day interest conventions instead of monthly compounding,</li>
          <li className={listItem}>prepayment penalties, processing fees, or minimum prepayment amounts,</li>
          <li className={listItem}>floating interest rates that change after you enter them,</li>
          <li className={listItem}>missed or late payments, or payments applied on a different date.</li>
        </ul>
        <p className={paragraph}>
          Because of these, the figures can differ from your lender's own statement. Always confirm
          prepayment amounts and effects with your lender.
        </p>
      </Section>

      <Section title="How the maths works">
        <p className={paragraph}>
          All financial calculations happen in the backend calculation engine using full-precision
          decimal arithmetic. Monetary values are rounded to two decimal places only where a real
          payment would be (the monthly instalment and each month's interest), and the final payment
          is adjusted so the modelled balance reaches exactly zero. Values are returned as strings
          and formatted for display only on your device; the app never recomputes interest.
        </p>
      </Section>

      <Section title="Your data">
        <p className={paragraph}>
          The loan details you enter are sent over the network to the LoanPilot calculation service
          so it can compute the projection. They are not stored, profiled, shared, or linked to any
          account, and LoanPilot has no accounts or logins. See the{" "}
          <a className="text-primary underline underline-offset-4 hover:text-primary-container" href="/privacy">
            Privacy Policy
          </a>{" "}
          for details.
        </p>
      </Section>

      <Section title="Sharing">
        <p className={paragraph}>
          The WhatsApp share buttons compose a plain-text summary of the numbers currently shown on
          your screen. No file is generated or attached. Only the <em>Share calculator</em> message
          plus whatever you choose to forward gives anyone else access to the LoanPilot page.
        </p>
      </Section>

      <Section title="Availability and liability">
        <p className={paragraph}>
          LoanPilot is provided “as is” for lawful, personal, non-commercial use. To the maximum
          extent permitted by law, its maintainers are not liable for any loss or damage arising
          from your use of, or reliance on, its calculations.
        </p>
      </Section>
    </StaticPage>
  );
}