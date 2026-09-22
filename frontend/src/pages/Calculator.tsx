import { useEffect, useRef, useState } from "react";
import { usePageMeta } from "../hooks/usePageMeta";
import type {
  FieldErrors,
  LoanInputs,
  LoanPlanRequest,
  LoanPlanResponse,
  LumpSumDraft,
  RepaymentMode as RepaymentModeOption,
} from "../types";
import { ApiError, fetchEmi, fetchLoanPlan, type ApiErrorInfo } from "../services/api";
import { formatINR, formatINRFixed } from "../utils/format";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { LoanForm } from "../components/LoanForm";
import { RepaymentMode } from "../components/RepaymentMode";
import { ExtraPaymentSlider } from "../components/ExtraPaymentSlider";
import { LumpSumEditor } from "../components/LumpSumEditor";
import { TargetTerm } from "../components/TargetTerm";
import {
  CurrentPlanPanel,
  NewPlanPanel,
  ResultsPlaceholder,
  type PlanStatus,
} from "../components/ResultsPanel";
import { HowItWorks } from "../components/HowItWorks";

const DEF_INPUTS: LoanInputs = { balance: "", rate: "", tenure: "", instalment: "" };

const toNum = (value: string): number => Number(value.replace(/[₹,\s]/g, ""));

function computeMonths(inputs: LoanInputs): number {
  const tenure = Number(inputs.tenure);
  return Number.isFinite(tenure) && tenure > 0 ? Math.max(1, Math.round(tenure)) : 0;
}

function inputSignature(inputs: LoanInputs): string {
  return JSON.stringify([inputs.balance, inputs.rate, inputs.tenure, inputs.instalment]);
}

// The standard EMI depends only on balance, rate, and tenure — never on the
// instalment the borrower entered. Staleness of the EMI hint must therefore be
// tracked separately from the full-input signature.
function emiInputSignature(inputs: LoanInputs): string {
  return JSON.stringify([inputs.balance, inputs.rate, inputs.tenure]);
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export default function Calculator() {
  usePageMeta(
    "LoanPilot - Loan Payoff Planner",
    "See what paying extra toward your loan could change: estimated interest saved, time saved, and a full repayment schedule.",
  );

  const [inputs, setInputs] = useState<LoanInputs>(DEF_INPUTS);
  const [mode, setMode] = useState<RepaymentModeOption | null>(null);
  const [extra, setExtra] = useState(0);
  const [lumps, setLumps] = useState<LumpSumDraft[]>([]);
  const [targetMonths, setTargetMonths] = useState(0);

  const [result, setResult] = useState<LoanPlanResponse | null>(null);
  const [planSignature, setPlanSignature] = useState<string | null>(null);
  const [planEmiSignature, setPlanEmiSignature] = useState<string | null>(null);
  const [strategyActive, setStrategyActive] = useState(false);
  const [strategyRevealed, setStrategyRevealed] = useState(false);
  const [status, setStatus] = useState<PlanStatus>("idle");
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);
  const [badgeFlash, setBadgeFlash] = useState(false);
  const [emiHint, setEmiHint] = useState<string | null>(null);
  const [emiHintSignature, setEmiHintSignature] = useState<string | null>(null);
  const [pullSlider, setPullSlider] = useState(false);

  const months = computeMonths(inputs);

  // The backend-computed EMI is reused as guidance and as the minimum valid
  // instalment. It is only shown when it still matches the current balance,
  // rate, and tenure, so it never feels stale or misleading.
  const effectiveEmi = (() => {
    const raw = result?.standard_monthly_instalment;
    if (!raw || planEmiSignature === null) return null;
    if (planEmiSignature !== emiInputSignature(inputs)) return null;
    return raw;
  })();

  // Falls back to the standalone EMI hint (fetched before any plan exists so
  // the instalment field has guidance from the first Calculate press).
  const guideEmi = (() => {
    if (effectiveEmi) return effectiveEmi;
    if (emiHint === null || emiHintSignature === null) return null;
    if (emiHintSignature !== emiInputSignature(inputs)) return null;
    return emiHint;
  })();

  const latest = useRef({
    inputs,
    mode,
    extra,
    lumps,
    targetMonths,
    months,
    emi: null as string | null,
  });
  useEffect(() => {
    latest.current = { inputs, mode, extra, lumps, targetMonths, months, emi: effectiveEmi };
  });

  const seqRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const hasResultRef = useRef(false);
  const calculateHandlerRef = useRef<() => void>(() => {});
  const scrollTargetRef = useRef<string | null>(null);
  const [scrollTick, setScrollTick] = useState(0);

  // Scroll requests are one-shot: the tick bumps when a target is queued (from
  // an event handler, never from within an effect), and the effect below
  // consumes it once.
  const requestScroll = (target: string) => {
    scrollTargetRef.current = target;
    setScrollTick((tick) => tick + 1);
  };

  useEffect(() => {
    if (scrollTick === 0) return;
    const target = scrollTargetRef.current;
    scrollTargetRef.current = null;
    if (!target) return;
    const el = document.getElementById(target);
    if (!el) return;
    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [scrollTick]);

  function buildPayload(
    includeStrategy: boolean,
  ): {
    ok: boolean;
    payload?: LoanPlanRequest;
    message?: string;
    errors?: FieldErrors;
  } {
    const cur = latest.current;
    const errs: FieldErrors = {};

    const balanceClean = cur.inputs.balance.replace(/[₹,\s]/g, "");
    const balanceNum = toNum(cur.inputs.balance);
    if (!balanceClean || !balanceNum) errs.balance = "Enter your outstanding balance.";
    else if (!Number.isFinite(balanceNum) || balanceNum <= 0)
      errs.balance = "Balance must be greater than ₹0.";

    const rateClean = cur.inputs.rate.trim();
    const rateNum = Number(rateClean);
    if (!rateClean) errs.rate = "Enter your annual interest rate.";
    else if (!Number.isFinite(rateNum) || rateNum < 0)
      errs.rate = "Enter a valid annual interest rate.";

    const tenureClean = cur.inputs.tenure.trim();
    const tenureNum = Number(tenureClean);
    if (!tenureClean) errs.tenure = "Enter your remaining tenure.";
    else if (!Number.isFinite(tenureNum) || tenureNum <= 0)
      errs.tenure = "Tenure must be greater than 0 months.";

    const curMonths = computeMonths(cur.inputs);
    if (curMonths < 1 && !errs.tenure) errs.tenure = "Tenure must be at least 1 month.";

    const instalmentClean = cur.inputs.instalment.replace(/[₹,\s]/g, "");
    const instalmentNum = toNum(cur.inputs.instalment);
    if (!instalmentClean || !instalmentNum) {
      errs.instalment = "Enter your current monthly instalment.";
    } else if (!Number.isFinite(instalmentNum) || instalmentNum <= 0) {
      errs.instalment = "Instalment must be greater than ₹0.";
    }

    const emiRaw = cur.emi;
    if (emiRaw != null && !errs.instalment) {
      const emiNum = Number(emiRaw);
      if (Number.isFinite(emiNum) && instalmentNum < emiNum) {
        errs.instalment = `Instalment must be at least the EMI of ${formatINRFixed(emiRaw)} for this loan.`;
      }
    }

    if (Object.keys(errs).length > 0) {
      return { ok: false, errors: errs, message: "Check the highlighted fields and try again." };
    }

    const base = {
      principal: balanceClean,
      annual_interest_rate: rateClean,
      number_of_months: curMonths,
      current_monthly_instalment: instalmentClean,
    };

    if (!includeStrategy) {
      return { ok: true, payload: { ...base, strategy: null } };
    }

    if (cur.mode === "target") {
      return {
        ok: true,
        payload: {
          ...base,
          strategy: {
            target_months: clamp(Math.round(cur.targetMonths) || 1, 1, curMonths),
          },
        },
      };
    }

    const lumpsClean = cur.lumps.map((l) => ({ id: l.id, month: l.month, amount: toNum(l.amount) }));
    if (cur.lumps.length > 0) {
      const lumpInvalid = lumpsClean.some(
        (l) => !Number.isFinite(l.amount) || l.amount <= 0 || l.month < 1 || l.month > curMonths,
      );
      if (lumpInvalid) {
        return {
          ok: false,
          message:
            "One of the lump sums is outside the loan term or has an invalid amount. Fix it or remove it before continuing.",
        };
      }
    }

    return {
      ok: true,
      payload: {
        ...base,
        strategy: {
          extra_monthly_payment: String(cur.extra),
          lump_sum_events: lumpsClean.map((l) => ({ month: l.month, amount: String(l.amount) })),
        },
      },
    };
  }

  function hasConfiguredStrategy(payload?: LoanPlanRequest): boolean {
    if (!payload?.strategy) return false;
    const cur = latest.current;
    if (cur.mode === "target") return true;
    return cur.extra > 0 || cur.lumps.length > 0;
  }

  // Best-effort guidance fetch: surfaces the standard EMI before any plan
  // exists (e.g. Calculate pressed with the instalment field empty). Never
  // surfaces errors — it is a hint, not a blocker.
  const requestEmiHint = () => {
    const cur = latest.current;
    const sig = emiInputSignature(cur.inputs);
    const balanceNum = toNum(cur.inputs.balance);
    const rateNum = Number(cur.inputs.rate.trim());
    const curMonths = computeMonths(cur.inputs);
    if (!Number.isFinite(balanceNum) || balanceNum <= 0) return;
    if (!Number.isFinite(rateNum) || rateNum < 0) return;
    if (curMonths < 1) return;
    void fetchEmi({
      principal: cur.inputs.balance.replace(/[₹,\s]/g, ""),
      annual_interest_rate: cur.inputs.rate.trim(),
      number_of_months: curMonths,
    })
      .then((emi) => {
        setEmiHint(emi);
        setEmiHintSignature(sig);
      })
      .catch(() => {
        // Ignore: guidance is hidden when unavailable.
      });
  };

  async function runPlan(force: boolean, scrollTarget?: string) {
    abortRef.current?.abort();
    const seq = ++seqRef.current;
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const built = buildPayload(!force);
    if (!built.ok) {
      if (force) {
        setFieldErrors(built.errors ?? null);
        setError(built.message ? { kind: "validation", message: built.message } : null);
        setStatus("idle");
        const cur = latest.current;
        const instalmentClean = cur.inputs.instalment.replace(/[₹,\s]/g, "");
        if (!instalmentClean && !cur.emi) {
          requestEmiHint();
        }
      }
      return;
    }

    setFieldErrors(null);
    if (force) setError(null);
    setStatus(hasResultRef.current ? "updating" : "loading");

    try {
      const res = await fetchLoanPlan(built.payload!, ctrl.signal);
      if (seq !== seqRef.current) return;
      const firstBaseline = force && !hasResultRef.current;
      hasResultRef.current = true;
      setResult(res);
      setPlanSignature(inputSignature(latest.current.inputs));
      setPlanEmiSignature(emiInputSignature(latest.current.inputs));
      setError(null);
      setStatus("idle");
      if (force) {
        // Recalculate refreshes the whole planner: no inherited strategy values.
        if (firstBaseline) requestScroll("current-plan-card");
        setMode(null);
        setExtra(0);
        setLumps([]);
        setTargetMonths(res.baseline.number_of_months || months);
        setStrategyActive(false);
        setStrategyRevealed(false);
        setBadgeFlash(true);
        window.setTimeout(() => setBadgeFlash(false), 500);
      } else {
        setStrategyActive(hasConfiguredStrategy(built.payload));
        if (scrollTarget) requestScroll(scrollTarget);
      }
    } catch (err) {
      if (seq !== seqRef.current) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      const apiError = err as ApiError;
      setError({ kind: apiError.kind, message: apiError.message, status: apiError.status });
      setStatus("idle");
    }
  }

  const schedulePlan = (opts: { force?: boolean; debounce?: number; scroll?: string } = {}) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(
      () => void runPlan(opts.force ?? false, opts.scroll),
      opts.debounce ?? 0,
    );
  };

  useEffect(() => {
    calculateHandlerRef.current = () => schedulePlan({ force: true, debounce: 0 });
  });

  useEffect(() => {
    const handler = () => calculateHandlerRef.current();
    window.addEventListener("loanpilot:calculate", handler);
    return () => window.removeEventListener("loanpilot:calculate", handler);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      abortRef.current?.abort();
    },
    [],
  );

  const handleInputsChange = (next: LoanInputs) => {
    setInputs(next);
    setFieldErrors(null);
  };

  const handleModeChange = (next: RepaymentModeOption) => {
    if (next === mode) return;
    setMode(next);
    // Selecting a strategy never fabricates a comparison: values stay neutral and
    // results appear only once the user presses "Calculate Savings".
    setStrategyActive(false);
    setStrategyRevealed(false);
    if (next === "target") {
      const basis = result?.baseline.number_of_months ?? months;
      setTargetMonths(clamp(basis, 1, months || 1));
    }
  };

  const handleExtraChange = (value: number) => {
    setExtra(value);
    setPullSlider(false);
    if (strategyRevealed) schedulePlan({ debounce: 300 });
  };

  const handleTargetChange = (value: number) => {
    setTargetMonths(value);
    if (strategyRevealed) schedulePlan({ debounce: 300 });
  };

  const handleLumpUpsert = (lump: LumpSumDraft) => {
    setLumps((prev) => {
      const idx = prev.findIndex((l) => l.id === lump.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = lump;
        return copy;
      }
      return [...prev, lump];
    });
    if (strategyRevealed) schedulePlan({ debounce: 250 });
  };

  const handleLumpRemove = (id: string) => {
    setLumps((prev) => prev.filter((l) => l.id !== id));
    if (strategyRevealed) schedulePlan({ debounce: 250 });
  };

  const onCalculate = () => schedulePlan({ force: true, debounce: 0 });

  const calculateSavings = () => {
    const cur = latest.current;
    const emptyExtra =
      cur.mode === "extra" && cur.extra === 0 && cur.lumps.length === 0;
    if (emptyExtra) {
      // Guide instead of revealing an empty comparison: keep the button in
      // place, nudge the slider into view, and animate its thumb so the user
      // knows where to act next.
      setPullSlider(true);
      requestScroll("extra-slider");
      return;
    }
    if (!strategyRevealed) setStrategyRevealed(true);
    schedulePlan({ debounce: 0, scroll: "plan-card" });
  };

  const stale =
    result !== null && planSignature !== null && planSignature !== inputSignature(inputs);

  const badgeText = (() => {
    if (!result) return "Enter your loan details";
    if (!strategyActive) return "Current plan calculated";
    if (mode === "extra") {
      if (extra > 0) return `Updated with ${formatINR(String(extra), 0)}/mo extra`;
      if (lumps.length > 0)
        return `Updated with ${lumps.length} lump sum${lumps.length > 1 ? "s" : ""}`;
      return "Plan matches your current loan";
    }
    return `Target payoff: ${targetMonths} months`;
  })();

  const maxMonth = months || 180;
  const clampedTarget = clamp(Math.round(targetMonths) || 1, 1, maxMonth);
  const currentPayoff = result?.baseline.number_of_months ?? null;

  return (
    <main className="mx-auto w-full max-w-[1200px] flex-grow px-4 py-8 md:px-8 md:py-12">
      <section className="mb-12 max-w-3xl">
        <div className="mb-4 inline-flex items-center gap-2 border border-outline-variant bg-surface-container-low px-2.5 py-1">
          <span className="h-1.5 w-1.5 bg-primary-container" aria-hidden="true" />
          <span className="font-label-sm text-label-sm font-semibold uppercase tracking-widest text-primary">
            Loan payoff planner
          </span>
        </div>
        <h1 className="mb-4 font-display-hero text-display-hero tracking-tight text-primary">
          See what paying extra could change.
        </h1>
        <p className="mb-3 font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
          Adjust your monthly payment and see how it could reduce your interest and help you finish
          your loan sooner.
        </p>
        <div className="border-l-2 border-primary-container py-0.5 pl-4">
          <p className="font-body-md text-body-md italic text-tertiary">
            Even a small extra payment can change the balance that interest is calculated on over
            time.
          </p>
        </div>
      </section>

      <div id="workspace" className="mb-16 grid grid-cols-1 items-start gap-8 scroll-mt-24 lg:grid-cols-12">
        <section className="border border-outline-variant bg-surface-container-lowest p-6 md:p-8 lg:col-span-6">
          <LoanForm inputs={inputs} errors={fieldErrors} emi={guideEmi} onChange={handleInputsChange} />

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <Button
              variant="primary"
              size="lg"
              className={cn("tracking-widest", !result && "guide-pulse")}
              id="calc-btn"
              onClick={onCalculate}
            >
              Calculate
            </Button>
            <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-base text-primary-container">bolt</span>
              <span>Your current loan summary appears on the right.</span>
            </div>
          </div>
        </section>

        {!result ? (
          <section className="lg:col-span-6">
            <ResultsPlaceholder
              status={status}
              error={error}
              badgeText={badgeText}
              badgeFlash={badgeFlash}
            />
          </section>
        ) : (
          <section className="space-y-6 lg:col-span-6">
            <CurrentPlanPanel result={result} tenureMonths={months} stale={stale} />
          </section>
        )}

        {result && (
          <section
            id="strategy-section"
            className="border border-outline-variant bg-surface-container-lowest p-6 md:p-8 lg:col-span-6"
          >
            <h2 className="font-headline-md text-headline-md tracking-tight text-primary">
              Make a plan to save money and time
            </h2>
            <p className="mb-4 font-body-md text-body-md text-on-surface-variant">
              Now that you have seen your current loan, choose a repayment strategy below. Your
              comparison appears once you adjust the controls and press “Calculate Savings”.
            </p>

            <RepaymentMode mode={mode} onModeChange={handleModeChange} />

            {mode === null && (
              <div className="guide-pulse mb-6 border-2 border-dashed border-outline-variant bg-surface-container-low p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-primary-container">
                    lightbulb
                  </span>
                  <h3 className="font-label-md text-label-md font-semibold uppercase tracking-wide text-primary">
                    Make a Plan
                  </h3>
                </div>
                <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
                  <b>Pick one of the two tabs above</b> to begin: pay extra each month and/or add one-time
                  lump sums, or aim for a specific payoff month. Your comparison only appears once
                  you press “Calculate Savings”.
                </p>
              </div>
            )}

            {mode === "extra" ? (
              <ExtraPaymentSlider
                value={extra}
                baseInstalment={result.baseline.monthly_payment}
                onChange={handleExtraChange}
                guide={pullSlider}
              />
            ) : null}
            {mode === "extra" && (
              <LumpSumEditor
                lumps={lumps}
                maxMonth={maxMonth}
                onUpsert={handleLumpUpsert}
                onRemove={handleLumpRemove}
              />
            )}
            {mode === "target" && (
              <TargetTerm
                value={clampedTarget}
                maxMonth={maxMonth}
                currentPayoff={currentPayoff}
                onChange={handleTargetChange}
              />
            )}

            {mode !== null && !strategyRevealed && (
              <div>
                <Button
                  variant="primary"
                  size="lg"
                  className="tracking-widest"
                  id="calc-plan-btn"
                  onClick={calculateSavings}
                >
                  Calculate Savings
                </Button>
                <div className="mt-3 flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary-container">bolt</span>
                  <span>Press “Calculate Savings” to build your New Plan comparison.</span>
                </div>
              </div>
            )}

            {mode !== null && strategyRevealed && (
              <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-base text-primary-container">sync</span>
                <span>Slider updates your plan in real time.</span>
              </div>
            )}
          </section>
        )}

        {result && (
          <section className="space-y-6 lg:col-span-6">
            <NewPlanPanel
              result={result}
              status={status}
              error={error}
              badgeText={badgeText}
              badgeFlash={badgeFlash}
              mode={mode}
              extra={extra}
              targetMonths={clampedTarget}
              inputs={inputs}
              hasLumps={lumps.length > 0}
              strategyActive={strategyActive}
            />
          </section>
        )}
      </div>

      <HowItWorks />
    </main>
  );
}