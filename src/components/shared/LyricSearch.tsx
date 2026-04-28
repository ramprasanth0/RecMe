"use client";

import { useState } from "react";
import { Search, Music, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpotifyPlayer } from "@/context/SpotifyPlayerContext";
import Image from "next/image";
import type { GeniusHit } from "@/types/genius";

export function LyricSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeniusHit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { playTrack } = useSpotifyPlayer();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/genius/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.hits || []);
      }
    } catch (err) {
      console.error("Lyrics search failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-[#ffff64]" />
        <h2 className="text-lg font-semibold">Find by Lyrics</h2>
      </div>

      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-[var(--music-accent)] transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Type a line from a song... (e.g. 'I'm feeling like a star')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-surface-light border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--music-accent)]/50 focus:border-[var(--music-accent)] transition-all placeholder:text-muted-foreground/50"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-4 flex items-center">
            <Loader2 className="w-5 h-5 text-[var(--music-accent)] animate-spin" />
          </div>
        )}
      </form>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {results.slice(0, 4).map((hit) => (
              <button
                key={hit.result.id}
                onClick={() => playTrack({ title: hit.result.title, artist: hit.result.primary_artist.name })}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-left group"
              >
                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-surface-light">
                  <Image 
                    src={hit.result.song_art_image_thumbnail_url} 
                    alt={hit.result.title} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate group-hover:text-[var(--music-accent)] transition-colors">
                    {hit.result.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {hit.result.primary_artist.name}
                  </p>
                </div>
                <Music className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-[var(--music-accent)] opacity-0 group-hover:opacity-100 transition-all" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
