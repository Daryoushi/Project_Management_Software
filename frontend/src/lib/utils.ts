import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getOAuthRedirectUri(): string {
  if (typeof window === "undefined") return "https://taskflow-pm.vercel.app";
  return window.location.origin;
}
