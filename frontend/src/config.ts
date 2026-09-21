export const APP_NAME = "LoanPilot";

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "http://localhost:8000";

export const PUBLIC_URL: string =
  (import.meta.env.VITE_PUBLIC_URL as string | undefined) ||
  (typeof window !== "undefined" ? window.location.origin : "");