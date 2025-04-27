/**
 * utils.ts
 *
 * Utility function: `cn(...)`
 * 
 * Combines class names using:
 * - `clsx`: handles conditional class names and filters falsy values
 * - `twMerge`: merges Tailwind CSS classes intelligently (e.g., avoids duplicates like `p-2 p-4`)
 * 
 * This is useful for writing cleaner, dynamic Tailwind-based class strings in components.
 *
 * Example:
 *   cn("p-4", condition && "bg-blue-500", "text-white")
 *   → outputs: "p-4 bg-blue-500 text-white" if condition is true
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
