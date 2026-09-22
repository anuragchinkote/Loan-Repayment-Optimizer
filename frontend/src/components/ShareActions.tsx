import { useState } from "react";
import type { LoanInputs, LoanPlanResponse, RepaymentMode } from "../types/loan";
import { buildCalculatorShareText, buildResultsShareText } from "../utils/share";
import { Button } from "./ui/button";
import { trackEvent } from "../services/analytics";

interface ShareActionsProps {
  mode: RepaymentMode | null;
  extra: number;
  targetMonths: number;
  inputs: LoanInputs;
  result: LoanPlanResponse;
  disabled?: boolean;
}

export function ShareActions({ inputs, result, disabled }: ShareActionsProps) {
  const [notice, setNotice] = useState<string | null>(null);

  const sendToWhatsApp = (message: string, fallbackNotice: string, kind: "results" | "calculator") => {
    trackEvent("whatsapp_share_clicked", { share_kind: kind });
    const opened = window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
    if (!opened) {
      void navigator.clipboard.writeText(message).then(() => {
        setNotice(fallbackNotice);
        window.setTimeout(() => setNotice(null), 4000);
      });
    }
  };

  const shareResults = () => {
    sendToWhatsApp(
      buildResultsShareText(inputs, result),
      "Results copied to your clipboard — paste it into any chat.",
      "results",
    );
  };

  const shareCalculator = () => {
    sendToWhatsApp(
      buildCalculatorShareText(),
      "Calculator link copied to your clipboard.",
      "calculator",
    );
  };

  return (
    <div className="pt-2">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="cta"
          size="lg"
          className="flex-1 whitespace-normal bg-[#15803d] hover:bg-[#166534] text-white"
          onClick={shareResults}
          disabled={disabled}
        >
          <span className="material-symbols-outlined text-lg">chat</span>
          Share results on WhatsApp
        </Button>
        <Button variant="outline" size="lg" className="flex-1 whitespace-normal" onClick={shareCalculator} disabled={disabled}>
          <span className="material-symbols-outlined text-lg">share</span>
          Share calculator
        </Button>
      </div>
      {notice && (
        <p role="status" className="mt-2 text-center font-body-sm text-body-sm text-primary">
          {notice}
        </p>
      )}
    </div>
  );
}