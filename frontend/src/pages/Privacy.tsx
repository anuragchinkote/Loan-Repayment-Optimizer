import { Section, StaticPage, listItem, paragraph } from "../components/StaticPage";
import { usePageMeta } from "../hooks/usePageMeta";

export default function Privacy() {
  usePageMeta(
    "Privacy Policy — LoanPilot",
    "How LoanPilot handles the information you enter on its loan payoff calculator.",
  );

  return (
    <StaticPage
      title="Privacy Policy"
      intro="LoanPilot is a free educational debt-payoff calculator. It has no accounts, no logins, and no tracking of who you are."
    >
      <Section title="What we collect">
        <p className={paragraph}>
          When you use the calculator, the loan details you enter (outstanding balance, interest
          rate, lender-stated remaining tenure, your current monthly instalment, and any extra
          payments or lump sums) are sent over the network to the LoanPilot calculation service so
          it can compute your amortization comparison.
        </p>
        <p className={paragraph}>
          That calculation is performed and returned to you in full; the values you enter are not
          stored, profiled, or shared. There is no account system, so there is nothing to sign in
          with and no personal profile to maintain.
        </p>
      </Section>
      <Section title="Cookies and storage">
        <p className={paragraph}>
          LoanPilot does not set advertising or profiling cookies. Your inputs live only in your
          browser's memory for the duration of your session. Nothing is written to localStorage or
          sent to advertising partners.
        </p>
        <p className={paragraph}>
          Fonts used for display (Inter, Newsreader, and the Material Symbols icon set) are loaded
          from Google Fonts. Loading these delivers your browser's IP address to Google in line
          with their standard font-serving behaviour. See Google's privacy policy for details.
        </p>
      </Section>
      <Section title="Third-party links">
        <p className={paragraph}>
          The “Share” buttons open WhatsApp to let you send a text summary you have chosen to
          share. Opening WhatsApp is controlled by WhatsApp’s own terms and privacy policy.
        </p>
        <ul className="ml-4 mb-4 list-disc">
          <li className={listItem}>WhatsApp is owned by Meta and operates under its own privacy terms.</li>
        </ul>
      </Section>
      <Section title="Changes">
        <p className={paragraph}>
          This page may be updated as LoanPilot evolves. Material changes will be reflected here
          with the current version date.
        </p>
      </Section>
    </StaticPage>
  );
}