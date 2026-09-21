/** Formatting helpers. All amounts are handled as backend-provided decimal strings;
 *  no loan math is ever performed here. */

export function cleanAmount(value: string): string {
  return value.replace(/[₹,\s]/g, "").trim();
}

export function parseAmountFinite(value: string): number {
  const cleaned = cleanAmount(value);
  if (cleaned === "") return NaN;
  return Number(cleaned);
}

export function groupIndian(digits: string): string {
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${grouped},${last3}`;
}

export function formatINR(value: string, _decimals: number = 2): string {
  const cleaned = cleanAmount(value);
  if (cleaned === "" || Number.isNaN(Number(cleaned))) return "₹0";
  const [intPart, decPart = ""] = cleaned.split(".");
  const positive = !cleaned.startsWith("-");
  const absInt = intPart.replace(/^-/, "");
  let result = groupIndian(absInt || "0");
  if (decPart.length > 0) {
    const trimmed = decPart.replace(/0+$/, "");
    if (trimmed.length > 0) result += "." + trimmed;
  }
  return (positive ? "" : "-") + "₹" + result;
}

export function formatINRFixed(value: string): string {
  const cleaned = cleanAmount(value);
  if (cleaned === "") return "₹0";
  const [intPart = "0", decPart = ""] = cleaned.split(".");
  const positive = !cleaned.startsWith("-");
  const absInt = intPart.replace(/^-/, "");
  let out = groupIndian(absInt || "0");
  const dec = (decPart || "00").padEnd(2, "0").slice(0, 2);
  out += "." + dec;
  return (positive ? "" : "-") + "₹" + out;
}

export function formatMonths(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${months} months`;
  if (rest === 0) return `${months} months (${years} yrs)`;
  return `${months} months (${(months / 12).toFixed(1)} yrs)`;
}

export function formatYearsShort(months: number): string {
  const years = months / 12;
  const rounded = Math.round(years * 10) / 10;
  return `${rounded} yrs`;
}

export function formatYears(months: number): string {
  const years = months / 12;
  const rounded = Math.round(years * 10) / 10;
  return `(${rounded} yrs)`;
}

export function compactINR(value: string): string {
  const num = Number(cleanAmount(value));
  if (Number.isNaN(num)) return "₹0";
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(num % 10000000 === 0 ? 0 : 2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(num % 100000 === 0 ? 0 : 1)}L`;
  if (num >= 1000) return `₹${Math.round(num / 1000)}K`;
  return formatINR(String(num), 0);
}