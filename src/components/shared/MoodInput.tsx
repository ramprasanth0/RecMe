"use client";

import { useState } from "react";
import { Send, Sparkles, Music, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export type SearchMode = "mood" | "lyrics";

interface MoodInputProps {
  activeTab: "music" | "movies";
  onSubmit: (query: string, mode: SearchMode) => void;
  isLoading?: boolean;
}

export function MoodInput({ activeTab, onSubmit, isLoading }: MoodInputProps) {
  const [value, setValue] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("mood");

  const placeholders = {
    mood: activeTab === "music"
      ? "How are you feeling? I'll find the perfect music..."
      : "What kind of movie fits your mood tonight?",
    lyrics: "Type a line from a song... (e.g. 'I'm feeling like a star')"
  };

  const accentColor =
    activeTab === "music" ? "var(--music-accent)" : "var(--movie-accent)";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading) return;
    onSubmit(value.trim(), searchMode);
    setValue("");
  };

  return (
    <div className="space-y-4">
      {/* Search Mode Toggle (Only for Music) */}
      {activeTab === "music" && (
        <div className="flex justify-center">
          <div className="inline-flex items-center bg-white/5 rounded-full p-1 border border-white/5 shadow-inner">
            <button
              onClick={() => setSearchMode("mood")}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                searchMode === "mood" ? "bg-white text-black shadow-lg" : "text-muted-foreground hover:text-white"
              )}
            >
              <Sparkles className="w-3 h-3" />
              AI Mood
            </button>
            <button
              onClick={() => setSearchMode("lyrics")}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                searchMode === "lyrics" ? "bg-[#ffff64] text-black shadow-lg" : "text-muted-foreground hover:text-white"
              )}
            >
              <Music className="w-3 h-3" />
              Lyrics
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div className={cn(
          "relative flex items-center gap-3 rounded-2xl bg-surface border transition-all duration-300",
          searchMode === "lyrics" ? "border-[#ffff64]/30 focus-within:border-[#ffff64]" : "border-border focus-within:border-foreground/20"
        )}>
          {searchMode === "mood" ? (
            <Sparkles
              className="w-4 h-4 ml-4 shrink-0 transition-colors"
              style={{ color: accentColor }}
            />
          ) : (
            <Search
              className="w-4 h-4 ml-4 shrink-0 text-[#ffff64]"
            />
          )}
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholders[searchMode]}
            disabled={isLoading}
            className={cn(
              "flex-1 bg-transparent py-4 text-sm text-foreground placeholder:text-muted-foreground",
              "focus:outline-none disabled:opacity-50"
            )}
          />
          <button
            type="submit"
            disabled={!value.trim() || isLoading}
            className={cn(
              "mr-2 w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0",
              "disabled:opacity-30 disabled:cursor-not-allowed",
              value.trim() && !isLoading
                ? "text-black scale-100"
                : "text-muted-foreground scale-95"
            )}
            style={{
              backgroundColor:
                value.trim() && !isLoading 
                  ? (searchMode === "lyrics" ? "#ffff64" : accentColor) 
                  : "transparent",
            }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
