import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RecMe — Your taste. Amplified.",
  description:
    "AI-powered music and movie recommendations based on your Spotify listening history, mood, and preferences.",
  keywords: ["music", "movies", "recommendations", "AI", "Spotify", "TMDB"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          playfair.variable,
          dmSans.variable,
          jetbrains.variable,
          "font-body antialiased film-grain"
        )}
      >
        {children}
      </body>
    </html>
  );
}
