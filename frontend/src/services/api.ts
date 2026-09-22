import { API_BASE_URL } from "../config";
import type {
  EmiPayload,
  EmiResponse,
  LoanPlanRequest,
  LoanPlanResponse,
} from "../types/loan";

export type ApiErrorKind = "validation" | "server" | "network";
export type ApiErrorInfo = { kind: ApiErrorKind; message: string; status?: number };

const moneyIdempotent = (value: unknown): string => String(value);

export class ApiError extends Error {
  kind: ApiErrorKind;
  status?: number;

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
  }
}

function extractDetail(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const msg = (item as { msg?: unknown }).msg;
          if (typeof msg === "string") return msg;
        }
        return "";
      })
      .filter(Boolean)
      .join("; ");
  }
  return "";
}

function friendlyValidationMessage(raw: string): string {
  if (raw.includes("extra_forbidden") || raw.toLowerCase().includes("extra inputs are not permitted")) {
    return "The server rejected an unknown field in the request. Please refresh and try again.";
  }
  if (raw.length === 0) {
    return "Please check the values you entered and try again.";
  }
  return raw.replace(/\s+/g, " ").trim();
}

export async function fetchLoanPlan(
  payload: LoanPlanRequest,
  signal?: AbortSignal,
): Promise<LoanPlanResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/v1/loan/plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    throw new ApiError(
      "network",
      "Could not reach the LoanPilot server. Make sure the backend is running and try again.",
    );
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (res.ok) {
    const data = body as LoanPlanResponse;
    if (
      !data ||
      !data.baseline ||
      !data.strategy ||
      !data.comparison ||
      !Array.isArray(data.baseline.schedule) ||
      !Array.isArray(data.strategy.schedule)
    ) {
      throw new ApiError("server", "The server returned an unexpected response.");
    }
    return data;
  }

  const raw = extractDetail(body);
  if (res.status === 422) {
    throw new ApiError("validation", friendlyValidationMessage(raw), res.status);
  }
  if (res.status === 400) {
    throw new ApiError("validation", friendlyValidationMessage(raw), res.status);
  }
  throw new ApiError("server", "The server hit an error. Please try again shortly.", res.status);
}

export { moneyIdempotent };

// ---------------------------------------------------------------------------
// Standalone EMI guidance
// ---------------------------------------------------------------------------

export async function fetchEmi(payload: EmiPayload, signal?: AbortSignal): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/v1/loan/emi`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    throw new ApiError(
      "network",
      "Could not reach the LoanPilot server. Make sure the backend is running and try again.",
    );
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (res.ok) {
    const emi = (body as EmiResponse | null)?.emi;
    if (typeof emi === "string" && emi.length > 0) return emi;
    throw new ApiError("server", "The server returned an unexpected response.");
  }

  const raw = extractDetail(body);
  if (res.status === 422 || res.status === 400) {
    throw new ApiError("validation", friendlyValidationMessage(raw), res.status);
  }
  throw new ApiError("server", "The server hit an error. Please try again shortly.", res.status);
}