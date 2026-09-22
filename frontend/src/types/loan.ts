export type RepaymentMode = "extra" | "target";

export interface LumpSumDraft {
  id: string;
  month: number;
  amount: string;
}

export interface LoanInputs {
  balance: string;
  rate: string;
  tenure: string;
  instalment: string;
}

export interface FieldErrors {
  balance?: string;
  rate?: string;
  tenure?: string;
  instalment?: string;
}

export interface LumpSumEventPayload {
  month: number;
  amount: string;
}

export interface StrategyPayload {
  extra_monthly_payment?: string;
  lump_sum_events?: LumpSumEventPayload[];
  target_months?: number;
}

export interface LoanPlanRequest {
  principal: string;
  annual_interest_rate: string;
  number_of_months: number;
  current_monthly_instalment: string;
  strategy?: StrategyPayload | null;
}

export interface ScheduleRow {
  month: number;
  opening_balance: string;
  payment: string;
  interest: string;
  principal: string;
  lump_sum: string;
  closing_balance: string;
}

export interface LoanResultData {
  monthly_payment: string;
  total_payment: string;
  total_interest: string;
  number_of_months: number;
  schedule: ScheduleRow[];
}

export interface ComparisonData {
  interest_saved: string;
  months_saved: number;
  payment_difference: string;
}

export interface LoanPlanResponse {
  baseline: LoanResultData;
  strategy: LoanResultData;
  comparison: ComparisonData;
  standard_monthly_instalment?: string | null;
}

export interface EmiPayload {
  principal: string;
  annual_interest_rate: string;
  number_of_months: number;
}

export interface EmiResponse {
  emi: string;
}