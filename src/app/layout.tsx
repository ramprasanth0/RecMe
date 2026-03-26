import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rec-me-mu.vercel.app"),
  title: "RecMe",
  description:
    "AI-powered music and movie recommendations based on your Spotify listening history, mood, and preferences.",
  keywords: ["music", "movies", "recommendations", "AI", "Spotify", "TMDB"],
  openGraph: {
    title: "RecMe",
    description:
      "AI-powered music and movie recommendations based on your Spotify listening history, mood, and preferences.",
    url: "https://rec-me-mu.vercel.app",
    siteName: "RecMe",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RecMe",
    description:
      "AI-powered music and movie recommendations based on your Spotify listening history, mood, and preferences.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          inter.variable,
          jetbrains.variable,
          playfair.variable,
          "font-sans antialiased film-grain"
        )}
      >
        {children}
      </body>
    </html>
  );
}
