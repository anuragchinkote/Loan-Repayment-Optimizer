export const APP_NAME = "LoanPilot";

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "http://localhost:8000";

export const PUBLIC_URL: string =
  (import.meta.env.VITE_PUBLIC_URL as string | undefined) ||
  (typeof window !== "undefined" ? window.location.origin : "");

// Public, client-side Google Analytics Measurement ID (e.g. "G-XXXXXXX").
// It is embedded in the browser bundle and is not a secret. When unset,
// analytics is disabled entirely.
export const GA_MEASUREMENT_ID: string =
  (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) || "";