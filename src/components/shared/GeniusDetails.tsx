"use client";

import { useSpotifyPlayer } from "@/context/SpotifyPlayerContext";
import { motion } from "framer-motion";
import { Info, User, Music, Calendar, ExternalLink, Loader2, Languages } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export function GeniusDetails() {
  const { geniusData, isFetchingGenius } = useSpotifyPlayer();
  const [activeTab, setActiveTab] = useState<"story" | "lyrics" | "credits">("story");
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false);

  useEffect(() => {
    if (geniusData?.url && activeTab === "lyrics" && !lyrics) {
      const fetchLyrics = async () => {
        setIsFetchingLyrics(true);
        try {
          const res = await fetch(`/api/genius/lyrics?url=${encodeURIComponent(geniusData.url)}`);
          if (res.ok) {
            const data = await res.json();
            setLyrics(data.lyrics);
          }
        } catch (err) {
          console.error("Failed to fetch lyrics", err);
        } finally {
          setIsFetchingLyrics(false);
        }
      };
      fetchLyrics();
    }
  }, [geniusData, activeTab, lyrics]);

  // Reset lyrics when track changes
  useEffect(() => {
    setLyrics(null);
    setActiveTab("story");
  }, [geniusData?.id]);

  if (isFetchingGenius) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="w-8 h-8 text-[var(--music-accent)] animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Fetching Genius insights...</p>
      </div>
    );
  }

  if (!geniusData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-6">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Music className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-white mb-1">No Genius data found</p>
        <p className="text-xs text-muted-foreground">We couldn't find detailed insights for this track.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 h-full flex flex-col">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 shrink-0">
        <button 
          onClick={() => setActiveTab("story")}
          className={`pb-2 text-[10px] uppercase font-bold tracking-widest transition-colors relative ${activeTab === "story" ? "text-white" : "text-muted-foreground hover:text-white"}`}
        >
          Insights
          {activeTab === "story" && <motion.div layoutId="geniusTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--music-accent)]" />}
        </button>
        <button 
          onClick={() => setActiveTab("lyrics")}
          className={`pb-2 text-[10px] uppercase font-bold tracking-widest transition-colors relative ${activeTab === "lyrics" ? "text-white" : "text-muted-foreground hover:text-white"}`}
        >
          Lyrics
          {activeTab === "lyrics" && <motion.div layoutId="geniusTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--music-accent)]" />}
        </button>
        <button 
          onClick={() => setActiveTab("credits")}
          className={`pb-2 text-[10px] uppercase font-bold tracking-widest transition-colors relative ${activeTab === "credits" ? "text-white" : "text-muted-foreground hover:text-white"}`}
        >
          Credits
          {activeTab === "credits" && <motion.div layoutId="geniusTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--music-accent)]" />}
        </button>
      </div>

      <motion.div 
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1"
      >
        {activeTab === "story" && (
          <div className="space-y-8">
            <section className="space-y-4">
              <div 
                className="text-sm leading-relaxed text-white/80 font-medium max-w-none
                  [&_p]:mb-4 [&_a]:text-[var(--music-accent)] [&_a]:font-bold [&_a]:underline hover:[&_a]:text-white transition-colors"
                dangerouslySetInnerHTML={{ __html: geniusData.description.html }}
              />
            </section>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">Released</span>
                </div>
                <p className="text-sm font-semibold">{geniusData.release_date_for_display || "Unknown"}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <User className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">Artist</span>
                </div>
                <p className="text-sm font-semibold truncate">{geniusData.primary_artist.name}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "lyrics" && (
          <div className="min-h-[300px]">
            {isFetchingLyrics ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-6 h-6 text-[var(--music-accent)] animate-spin" />
                <p className="text-xs text-muted-foreground">Transcribing lyrics...</p>
              </div>
            ) : lyrics ? (
              <div 
                className="text-lg font-bold leading-relaxed space-y-2 pb-8 lyrics-container
                  [&_br]:block [&_br]:mb-2 [&_i]:text-muted-foreground [&_i]:text-sm [&_i]:block [&_i]:mb-4 [&_i]:font-normal
                  [&_span]:block"
                dangerouslySetInnerHTML={{ __html: lyrics }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <p className="text-sm text-muted-foreground">Lyrics not available for this track yet.</p>
                <a href={geniusData.url} target="_blank" className="text-xs text-[var(--music-accent)] mt-4 underline">View on Genius</a>
              </div>
            )}
          </div>
        )}

        {activeTab === "credits" && (
          <div className="space-y-8">
            {geniusData.producer_artists.length > 0 && (
              <section className="space-y-3">
                <h4 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Producers</h4>
                <div className="flex flex-wrap gap-3">
                  {geniusData.producer_artists.map((artist) => (
                    <div key={artist.id} className="flex items-center gap-2 bg-white/5 rounded-full pl-1 pr-3 py-1 border border-white/5">
                      <div className="relative w-6 h-6 rounded-full overflow-hidden">
                        <Image src={artist.image_url} alt={artist.name} fill className="object-cover" />
                      </div>
                      <span className="text-xs font-medium">{artist.name}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {geniusData.writer_artists.length > 0 && (
              <section className="space-y-3">
                <h4 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Writers</h4>
                <div className="flex flex-wrap gap-3">
                  {geniusData.writer_artists.map((artist) => (
                    <div key={artist.id} className="flex items-center gap-2 bg-white/5 rounded-full pl-1 pr-3 py-1 border border-white/5">
                      <div className="relative w-6 h-6 rounded-full overflow-hidden">
                        <Image src={artist.image_url} alt={artist.name} fill className="object-cover" />
                      </div>
                      <span className="text-xs font-medium">{artist.name}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </motion.div>

      {/* External Link */}
      <a 
        href={geniusData.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-[#ffff64] text-black font-bold text-sm hover:scale-[1.02] transition-transform active:scale-95 shrink-0"
      >
        Read more on Genius
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}
