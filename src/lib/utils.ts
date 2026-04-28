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

/** Extract YouTube ID from URL */
export function getYoutubeId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regex);
  return match ? match[1] : null;
}
