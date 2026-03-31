"use client";

import Link from "next/link";
import { Check, X, Sparkles, Crown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProBadge } from "@/components/shared/ProBadge";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface UpgradeContentProps {
  isPro: boolean;
  isAuthenticated: boolean;
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayErrorResponse {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
      order_id: string;
      payment_id: string;
    };
  };
}


const STANDARD_FEATURES = [
  { label: "AI Music & Movie Recommendations", included: true },
  { label: "Trending Charts (US & India)", included: true },
  { label: "Save Recommendations", included: true },
  { label: "Genre Preferences", included: true },
  { label: "Spotify Integration", included: true },
  { label: "AI Playlist Generator", included: false },
];

const PRO_FEATURES_LIST = [
  { label: "AI Music & Movie Recommendations", included: true },
  { label: "Trending Charts (US & India)", included: true },
  { label: "Save Recommendations", included: true },
  { label: "Genre Preferences", included: true },
  { label: "Spotify Integration", included: true },
  { label: "AI Playlist Generator", included: true, highlight: true },
];

export function UpgradeContent({ isPro, isAuthenticated }: UpgradeContentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handlePayment = async () => {
    try {
      if (!isAuthenticated) {
        window.location.href = "/signin";
        return;
      }

      setIsLoading(true);

      // Dynamically load Razorpay SDK
      const loadScript = () => {
        return new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const isScriptLoaded = await loadScript();
      if (!isScriptLoaded) {
        alert("Payment gateway failed to load. Please check your internet connection.");
        setIsLoading(false);
        return;
      }

      // Hit our backend to create a razorpay order
      const res = await fetch("/api/razorpay/create-order", { method: "POST" });
      const data = await res.json();

      if (!data.orderId || !data.key) {
        alert("Failed to initialize order. Please try again.");
        setIsLoading(false);
        return;
      }

      // Initialize Checkout
      const options = {
        key: data.key, 
        amount: "29900", // 299.00 in paise
        currency: "INR",
        name: "RecMe",
        description: "RecMe Pro Tier Upgrade",
        order_id: data.orderId,
        handler: async function (response: RazorpaySuccessResponse) {
          try {
            // Verify payment
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            
            const verifyData = await verifyRes.json();
            
            if (verifyData.success) {
              router.push("/upgrade/success");
            } else {
              alert("Payment verification failed! Please contact support.");
            }
          } catch (err) {
            console.error(err);
            alert("Error verifying payment.");
          }
        },
        theme: {
          color: "#1db954", // Music accent color
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paymentObject = new (window as any).Razorpay(options);
      
      paymentObject.on("payment.failed", function (response: RazorpayErrorResponse) {
        console.error(response.error);
        alert("Payment failed: " + response.error.description);
      });

      paymentObject.open();

    } catch (error) {
      console.error(error);
      alert("Something went wrong processing your request.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-24 px-4 sm:px-6 pb-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            Unlock powerful AI features to supercharge your music experience.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Standard */}
          <div className="rounded-2xl bg-surface border border-border p-6 sm:p-8 flex flex-col">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-1">Standard</h2>
              <p className="text-sm text-muted-foreground">
                Everything you need to discover great content
              </p>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold">Free</span>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {STANDARD_FEATURES.map(({ label, included }) => (
                <li key={label} className="flex items-center gap-2.5 text-sm">
                  {included ? (
                    <Check className="w-4 h-4 text-[var(--music-accent)] shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className={cn(!included && "text-muted-foreground/50 line-through")}>
                    {label}
                  </span>
                </li>
              ))}
            </ul>

            <div
              className="text-center text-sm py-3 rounded-lg bg-surface-light border border-border text-muted-foreground"
            >
              {isPro ? "Your previous plan" : "Current plan"}
            </div>
          </div>

          {/* Pro */}
          <div className="rounded-2xl bg-surface border-2 border-[var(--music-accent)] p-6 sm:p-8 flex flex-col relative overflow-hidden">
            {/* Recommended badge */}
            <div className="absolute top-0 right-0">
              <div className="bg-[var(--music-accent)] text-black text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                RECOMMENDED
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold">Pro</h2>
                <ProBadge size="sm" />
              </div>
              <p className="text-sm text-muted-foreground">
                Unlock AI-powered music creation tools
              </p>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold">₹299</span>
              <span className="text-sm text-muted-foreground ml-1">one-time</span>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {PRO_FEATURES_LIST.map(({ label, highlight }) => (
                <li key={label} className="flex items-center gap-2.5 text-sm">
                  <Check
                    className={cn(
                      "w-4 h-4 shrink-0",
                      highlight ? "text-[var(--music-accent)]" : "text-[var(--music-accent)]"
                    )}
                  />
                  <span className={cn(highlight && "font-medium text-[var(--music-accent)]")}>
                    {label}
                  </span>
                  {highlight && (
                    <Sparkles className="w-3 h-3 text-[var(--music-accent)] ml-auto shrink-0" />
                  )}
                </li>
              ))}
            </ul>

            {isPro ? (
              <div className="text-center text-sm py-3 rounded-lg bg-[var(--music-accent)]/10 border border-[var(--music-accent)]/20 text-[var(--music-accent)] font-medium flex items-center justify-center gap-2">
                <Crown className="w-4 h-4" />
                You&apos;re on Pro
              </div>
            ) : (
              <button
                onClick={handlePayment}
                disabled={isLoading}
                className="w-full py-3 rounded-lg text-sm font-semibold bg-[var(--music-accent)] text-black hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Upgrade Now
                  </>
                )}
              </button>
            )}

            {!isPro && (
              <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
                Secured by Razorpay • One-time payment
              </p>
            )}
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-10">
          <Link
            href={isAuthenticated ? "/personalize" : "/"}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to {isAuthenticated ? "Personalize" : "Home"}
          </Link>
        </div>
      </div>
    </main>
  );
}
