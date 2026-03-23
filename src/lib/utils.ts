import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with clsx + tailwind-merge */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Get time-aware greeting */
export function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  let greeting: string;

  if (hour < 12) greeting = "Good morning";
  else if (hour < 17) greeting = "Good afternoon";
  else greeting = "Good evening";

  return name ? `${greeting}, ${name}` : greeting;
}
