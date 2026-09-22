import type { RepaymentMode } from "../types/loan";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

type SelectedMode = RepaymentMode | null;

interface RepaymentModeProps {
  mode: SelectedMode;
  onModeChange: (mode: RepaymentMode) => void;
  guide?: boolean;
}

export function RepaymentMode({ mode, onModeChange, guide }: RepaymentModeProps) {
  return (
    <div className="border-b border-outline-variant pb-8 mb-8">
      <h2 className="font-headline-md text-headline-md mb-2 tracking-tight text-primary">
        How do you want to repay?
      </h2>
      <p className="mb-4 font-body-md text-body-md text-on-surface-variant">
        <b>Choose a strategy</b>  and adjust the controls below. Nothing is pre-filled — your comparison
        appears once you press “Calculate Savings”.
      </p>
      <Tabs
        value={mode ?? ""}
        onValueChange={(v) => onModeChange(v as RepaymentMode)}
      >
        <TabsList className="mb-6 grid grid-cols-2 gap-1 border border-outline-variant bg-surface-container-low p-1">
          <TabsTrigger value="extra" className={guide ? "guide-pulse" : undefined}>Extra monthly + lump sums</TabsTrigger>
          <TabsTrigger value="target">Target payoff term</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}