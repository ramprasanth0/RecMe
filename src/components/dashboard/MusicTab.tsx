"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, AlertCircle, ListMusic } from "lucide-react";
import { MoodInput } from "@/components/shared/MoodInput";
import { RecommendationCard } from "@/components/shared/RecommendationCard";
import { PlaylistCreator } from "@/components/shared/PlaylistCreator";
import { PlaylistGenerator } from "@/components/shared/PlaylistGenerator";
import { useRecommendations } from "@/hooks/useRecommendations";
import { AiThinkingLoader } from "@/components/shared/AiThinkingLoader";
import type { MusicItem } from "@/types/recommendations";

const SAMPLE_RECS: MusicItem[] = [
  { title: "Blinding Lights", artist: "The Weeknd", reason: "Cinematic synths that match late-night energy" },
  { title: "Redbone", artist: "Childish Gambino", reason: "Smooth funk with a dreamy, nostalgic pull" },
  { title: "Pink + White", artist: "Frank Ocean", reason: "Warm and reflective — perfect for winding down" },
  { title: "Electric Feel", artist: "MGMT", reason: "Bright indie pop with irresistible groove" },
  { title: "Midnight City", artist: "M83", reason: "Euphoric synth-pop that feels like a night drive" },
  { title: "Do I Wanna Know?", artist: "Arctic Monkeys", reason: "Dark, brooding rock with a magnetic riff" },
  { title: "Nights", artist: "Frank Ocean", reason: "Genre-defying mood piece with a legendary beat switch" },
  { title: "Tadow", artist: "Masego & FKJ", reason: "Jazz-funk fusion that's effortlessly cool" },
];

const TRENDING: MusicItem[] = [
  { title: "Die With A Smile", artist: "Lady Gaga & Bruno Mars", reason: "Chart-topping power ballad" },
  { title: "Birds of a Feather", artist: "Billie Eilish", reason: "Intimate alt-pop at its finest" },
  { title: "Espresso", artist: "Sabrina Carpenter", reason: "Infectious pop earworm" },
  { title: "Good Luck, Babe!", artist: "Chappell Roan", reason: "Anthemic synth-pop breakthrough" },
  { title: "Lunch", artist: "Billie Eilish", reason: "Bold and playful pop energy" },
  { title: "Taste", artist: "Sabrina Carpenter", reason: "Cheeky pop with killer hooks" },
];

export function MusicTab() {
  const { items: aiRecs, isLoading, error, lastMood, fetchRecs } = useRecommendations({
    type: "music",
  });
  const [playlistTracks, setPlaylistTracks] = useState<MusicItem[]>([]);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const displayRecs = (aiRecs.length > 0 ? aiRecs : SAMPLE_RECS) as MusicItem[];

  const handleAddToPlaylist = useCallback((item: MusicItem) => {
    setPlaylistTracks((prev) => {
      if (prev.some((t) => t.title === item.title && t.artist === item.artist)) return prev;
      return [...prev, item];
    });
  }, []);

  return (
    <div className="space-y-10">
      {/* Playlist queue */}
      {playlistTracks.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--music-accent)]/10 border border-[var(--music-accent)]/20">
          <ListMusic className="w-4 h-4 text-[var(--music-accent)] shrink-0" />
          <span className="text-sm flex-1">
            {playlistTracks.length} track{playlistTracks.length > 1 ? "s" : ""} queued
          </span>
          <button
            onClick={() => setPlaylistTracks([])}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => setShowPlaylist(true)}
            className="text-xs px-3 py-1.5 rounded-full bg-[var(--music-accent)] text-black font-medium hover:brightness-110 transition-all"
          >
            Create Playlist
          </button>
        </div>
      )}

      {showPlaylist && (
        <PlaylistCreator
          tracks={playlistTracks}
          onClose={() => {
            setShowPlaylist(false);
            setPlaylistTracks([]);
          }}
        />
      )}

      {/* AI Playlist Generator */}
      <PlaylistGenerator />

      {/* Mood input */}
      <MoodInput activeTab="music" onSubmit={fetchRecs} isLoading={isLoading} />

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 rounded-lg px-4 py-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* AI Recommendations */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-4 h-4 text-music-accent" />
          <h2 className="text-base font-semibold">
            {lastMood ? `Recommendations for "${lastMood}"` : "Picked for you"}
          </h2>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-music-accent/10 text-music-accent ml-auto">
            AI
          </span>
        </div>

        {isLoading ? (
          <AiThinkingLoader type="music" count={10} />
        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          >
            {displayRecs.map((item, i) => (
              <motion.div
                key={`${item.title}-${i}`}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } } }}
              >
                <RecommendationCard type="music" item={item} onAddToPlaylist={handleAddToPlaylist} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Trending */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Trending now</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {TRENDING.map((item, i) => (
            <div key={i} className="shrink-0 w-[160px]">
              <RecommendationCard type="music" item={item} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
