/** Tailwind-friendly class merge: clsx for conditions, tailwind-merge so later classes win over conflicts. */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
