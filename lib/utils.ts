import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format bytes into a human-readable string (e.g. "12.5 MB", "1.2 GB").
 * Uses 1024-based units.
 */
export function formatBytes(bytes: number): string {
  const safeBytes = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  if (safeBytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const rawIndex = Math.floor(Math.log(safeBytes) / Math.log(1024));
  const i = Math.min(Math.max(rawIndex, 0), units.length - 1);
  const value = safeBytes / 1024 ** i;
  const decimals = i >= 2 ? 1 : 0;
  return `${value.toFixed(decimals)} ${units[i]}`;
}

/**
 * Extract domain from URL, removing www. prefix
 */
export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}
