import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SpotifyPlayerProvider } from "@/context/SpotifyPlayerContext";
import { MiniPlayer } from "@/components/shared/MiniPlayer";

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
          "font-sans antialiased film-grain"
        )}
      >
        <SpotifyPlayerProvider>
          {children}
          <MiniPlayer />
        </SpotifyPlayerProvider>
      </body>
    </html>
  );
}
