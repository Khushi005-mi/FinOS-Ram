import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple Tailwind CSS class names and resolves conflicting utilities.
 * Example: cn("px-2 py-1", "bg-blue-500", isDisabled && "opacity-50")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}