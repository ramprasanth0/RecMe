"use client";

import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MoodInputProps {
  activeTab: "music" | "movies";
  onSubmit: (mood: string) => void;
  isLoading?: boolean;
}

export function MoodInput({ activeTab, onSubmit, isLoading }: MoodInputProps) {
  const [value, setValue] = useState("");

  const placeholder =
    activeTab === "music"
      ? "How are you feeling? I'll find the perfect music..."
      : "What kind of movie fits your mood tonight?";

  const accentColor =
    activeTab === "music" ? "var(--music-accent)" : "var(--movie-accent)";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading) return;
    onSubmit(value.trim());
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative flex items-center gap-3 rounded-xl bg-surface border border-border focus-within:border-foreground/20 transition-colors">
        <Sparkles
          className="w-4 h-4 ml-4 shrink-0"
          style={{ color: accentColor }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className={cn(
            "flex-1 bg-transparent py-3.5 text-sm text-foreground placeholder:text-muted-foreground",
            "focus:outline-none disabled:opacity-50"
          )}
        />
        <button
          type="submit"
          disabled={!value.trim() || isLoading}
          className={cn(
            "mr-2 w-11 h-11 rounded-lg flex items-center justify-center transition-all shrink-0",
            "disabled:opacity-30 disabled:cursor-not-allowed",
            value.trim() && !isLoading
              ? "text-black"
              : "text-muted-foreground"
          )}
          style={{
            backgroundColor:
              value.trim() && !isLoading ? accentColor : "transparent",
          }}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
