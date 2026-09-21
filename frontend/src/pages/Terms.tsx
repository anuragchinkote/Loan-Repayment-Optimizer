import { Section, StaticPage, listItem, paragraph } from "../components/StaticPage";
import { usePageMeta } from "../hooks/usePageMeta";

export default function Terms() {
  usePageMeta(
    "Terms of Service — LoanPilot",
    "Terms for using the LoanPilot educational loan payoff calculator.",
  );

  return (
    <StaticPage title="Terms of Service" intro="By using LoanPilot you agree to these simple terms.">
      <Section title="1. An educational tool">
        <p className={paragraph}>
          LoanPilot is an educational and informational tool. It produces a mathematical projection
          of how voluntary extra payments could affect the interest and time remaining on an
          amortizing loan. It is not an offer of credit, a financial plan, or a promise of any
          specific loan outcome.
        </p>
        <p className={paragraph}>
          Your lender's actual servicing may differ because of daily-interest conventions,
          prepayment penalties, fees, rate changes, or payment-timing rules. Always confirm plans
          with your lender before putting money into a loan.
        </p>
      </Section>
      <Section title="2. Your use">
        <ul className="mb-4 ml-4 list-disc">
          <li className={listItem}>Use the tool for lawful, personal, non-commercial purposes.</li>
          <li className={listItem}>Do not attempt to disrupt, overload, or probe the service.</li>
          <li className={listItem}>Do not use outputs to misrepresent what a lender has promised.</li>
        </ul>
      </Section>
      <Section title="3. No warranties">
        <p className={paragraph}>
          LoanPilot is provided “as is”, without warranties of any kind, express or implied,
          including accuracy, fitness for a particular purpose, or uninterrupted availability.
        </p>
      </Section>
      <Section title="4. Limitation of liability">
        <p className={paragraph}>
          To the maximum extent permitted by law, LoanPilot and its maintainers are not liable for
          any loss or damage arising from the use of, or reliance on, its calculations, including
          missed savings estimates or decisions you make based on them.
        </p>
      </Section>
      <Section title="5. Changes">
        <p className={paragraph}>
          We may update these terms from time to time. Continuing to use the service after changes
          take effect means you accept the revised terms.
        </p>
      </Section>
    </StaticPage>
  );
}