import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getOAuthRedirectUri(): string {
  if (typeof window === "undefined") return "https://project-management-software.vercel.app";
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return window.location.origin;
  }
  return "https://project-management-software.vercel.app";
}
