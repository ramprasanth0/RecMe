import Link from "next/link";
import { Sparkles, Crown, ArrowRight } from "lucide-react";
import { ProBadge } from "@/components/shared/ProBadge";

export default function UpgradeSuccessPage() {
  return (
    <main className="min-h-screen pt-32 px-4 sm:px-6 pb-16 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {/* Animated Icon Container */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 bg-[var(--music-accent)]/20 rounded-full animate-ping duration-1000" />
          <div className="relative w-full h-full bg-[var(--music-accent)]/10 rounded-full border border-[var(--music-accent)]/30 flex items-center justify-center backdrop-blur-sm">
            <Crown className="w-10 h-10 text-[var(--music-accent)] animate-pulse" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-bounce" />
          <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 text-yellow-500 animate-bounce delay-150" />
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <h1 className="font-display text-3xl sm:text-4xl font-bold flex items-center justify-center gap-3">
            You are now <ProBadge size="lg" className="shadow-[0_0_15px_rgba(29,185,84,0.3)]" />
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Payment successful! Your account has been upgraded. You now have full access to our powerful AI tools and music features.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <Link
            href="/personalize"
            className="inline-flex w-full sm:w-auto h-12 items-center justify-center gap-2 rounded-full bg-[var(--music-accent)] px-8 text-black font-semibold hover:brightness-110 transition-all hover:scale-105 active:scale-95"
          >
            Try AI Playlists
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {/* Secondary Back Link */}
        <div>
          <Link 
            href="/profile" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Go to Profile
          </Link>
        </div>

      </div>
    </main>
  );
}
