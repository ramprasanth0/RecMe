"use client";

import { useSpotifyPlayer } from "@/context/SpotifyPlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import { User, Music, Calendar, ExternalLink, Loader2, Sparkles, ChevronDown, Play } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

interface TrackAnalysis {
  mood: string;
  tags: string[];
  analysis: string;
}

interface SimilarSong {
  id: string;
  title: string;
  artist: string;
  albumArt: string | null;
  spotifyUrl: string | null;
  uri: string;
}

export function GeniusDetails() {
  const { geniusData, isFetchingGenius, currentTrack, playTrack } = useSpotifyPlayer();
  const [activeTab, setActiveTab] = useState<"story" | "credits">("story");

  // Track analysis state
  const [trackAnalysis, setTrackAnalysis] = useState<TrackAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const lastAnalyzedTrack = useRef<string | null>(null);

  // Similar songs state
  const [similarSongs, setSimilarSongs] = useState<SimilarSong[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [showSimilar, setShowSimilar] = useState(false);
  const similarFetched = useRef<string | null>(null);

  // Fetch AI analysis when track changes
  useEffect(() => {
    if (!currentTrack) {
      setTrackAnalysis(null);
      lastAnalyzedTrack.current = null;
      return;
    }
    if (currentTrack.id === lastAnalyzedTrack.current) return;

    lastAnalyzedTrack.current = currentTrack.id;
    setTrackAnalysis(null);
    setAnalysisLoading(true);

    fetch("/api/gemini/track-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        track_name: currentTrack.name,
        artist: currentTrack.artists[0]?.name,
        genius_description: geniusData?.description?.html ?? "",
        release_date: geniusData?.release_date_for_display ?? "",
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data && !data.error) setTrackAnalysis(data); })
      .catch(() => {})
      .finally(() => setAnalysisLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  // Fetch similar songs when accordion opens
  useEffect(() => {
    if (!showSimilar || !currentTrack) return;
    if (similarFetched.current === currentTrack.id) return;

    similarFetched.current = currentTrack.id;
    setSimilarLoading(true);
    setSimilarSongs([]);

    fetch(`/api/spotify/similar-songs?track_id=${currentTrack.id}&limit=6`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.songs) setSimilarSongs(data.songs); })
      .catch(() => {})
      .finally(() => setSimilarLoading(false));
  }, [showSimilar, currentTrack]);

  // Reset similar songs cache when track changes
  useEffect(() => {
    setSimilarSongs([]);
    setSimilarLoading(false);
    similarFetched.current = null;
    setShowSimilar(false);
  }, [currentTrack?.id]);

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
      <div className="space-y-4 pb-4">
        {/* Still show AI analysis even without Genius data */}
        <AnalysisCard analysis={trackAnalysis} isLoading={analysisLoading} />
        <SimilarSongsSection
          showSimilar={showSimilar}
          setShowSimilar={setShowSimilar}
          similarSongs={similarSongs}
          similarLoading={similarLoading}
          onPlay={playTrack}
        />
        {!currentTrack && (
          <div className="flex flex-col items-center justify-center py-8 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Music className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-white mb-1">No Genius data found</p>
            <p className="text-xs text-muted-foreground">We couldn&apos;t find detailed insights for this track.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 h-full flex flex-col">
      {/* AI Analysis Card */}
      <AnalysisCard analysis={trackAnalysis} isLoading={analysisLoading} />

      {/* Genius Sub-tabs */}
      <div className="flex gap-4 border-b border-white/10 shrink-0">
        <button
          onClick={() => setActiveTab("story")}
          className={`pb-2 text-[10px] uppercase font-bold tracking-widest transition-colors relative ${activeTab === "story" ? "text-white" : "text-muted-foreground hover:text-white"}`}
        >
          Insights
          {activeTab === "story" && <motion.div layoutId="geniusTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--music-accent)]" />}
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
          <div className="space-y-6">
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

            {/* Similar Songs */}
            <SimilarSongsSection
              showSimilar={showSimilar}
              setShowSimilar={setShowSimilar}
              similarSongs={similarSongs}
              similarLoading={similarLoading}
              onPlay={playTrack}
            />
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

/* ── Now Playing Analysis Card ── */
function AnalysisCard({ analysis, isLoading }: { analysis: TrackAnalysis | null; isLoading: boolean }) {
  if (!isLoading && !analysis) return null;

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[var(--music-accent)]" />
        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Now Playing Analysis</span>
      </div>

      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-5 w-36 bg-white/10 rounded-full" />
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-5 w-16 bg-white/5 rounded-full" />)}
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-white/5 rounded" />
            <div className="h-3 w-5/6 bg-white/5 rounded" />
            <div className="h-3 w-4/6 bg-white/5 rounded" />
          </div>
        </div>
      ) : analysis ? (
        <div className="space-y-3">
          <p className="text-lg font-bold tracking-tight">{analysis.mood}</p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.tags.map((tag) => (
              <span key={tag} className="px-2.5 py-0.5 rounded-full bg-[var(--music-accent)]/10 text-[var(--music-accent)] text-[10px] font-bold uppercase tracking-wider border border-[var(--music-accent)]/20">
                {tag}
              </span>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-white/70">{analysis.analysis}</p>
        </div>
      ) : null}
    </div>
  );
}

/* ── Similar Songs Accordion ── */
interface SimilarSongsSectionProps {
  showSimilar: boolean;
  setShowSimilar: (v: boolean) => void;
  similarSongs: SimilarSong[];
  similarLoading: boolean;
  onPlay: (track: { title: string; artist: string; uri?: string }) => void;
}

function SimilarSongsSection({ showSimilar, setShowSimilar, similarSongs, similarLoading, onPlay }: SimilarSongsSectionProps) {
  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setShowSimilar(!showSimilar)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/8 transition-colors"
      >
        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Similar Songs</span>
        <motion.div animate={{ rotate: showSimilar ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {showSimilar && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-2">
              {similarLoading ? (
                <div className="flex items-center justify-center py-6 gap-2">
                  <Loader2 className="w-4 h-4 text-[var(--music-accent)] animate-spin" />
                  <span className="text-xs text-muted-foreground">Finding similar songs...</span>
                </div>
              ) : similarSongs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No similar songs found.</p>
              ) : (
                <div className="space-y-0.5">
                  {similarSongs.map((song) => (
                    <button
                      key={song.id}
                      onClick={() => onPlay({ title: song.title, artist: song.artist, uri: song.uri })}
                      className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group text-left"
                    >
                      <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-white/5">
                        {song.albumArt && <Image src={song.albumArt} alt="" fill className="object-cover" />}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Play className="w-3.5 h-3.5 text-white fill-current" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-[var(--music-accent)] transition-colors">{song.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{song.artist}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
