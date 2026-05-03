"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSpotifyPlayer } from "@/context/SpotifyPlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X,
  ExternalLink, ChevronUp, ChevronDown, RefreshCcw, Music as MusicIcon,
  Video, Sparkles, Check, Loader2, Maximize2, Heart
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { GeniusDetails } from "./GeniusDetails";
import { getYoutubeId } from "@/lib/utils";
import { SpotifyTrack } from "@/types/spotify";
import { GeniusSong } from "@/types/genius";


function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function MiniPlayer() {
  const {
    isActive,
    currentTrack,
    isPlaying,
    position,
    duration,
    togglePlay,
    pause,
    next,
    prev,
    seek,
    setVolume,
    dismiss,
    queue,
    refreshQueue,
    playTrack,
    geniusData,
    showQueueToast,
    isSaved,
    toggleSaveTrack,
  } = useSpotifyPlayer();

  const [volumeLevel, setVolumeLevel] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPosition, setScrubPosition] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"queue" | "lyrics" | "insights">("queue");
  
  // Persistence: Track what the user EXPLICITLY selected
  const [userPreferredType, setUserPreferredType] = useState<"audio" | "video">("audio");
  
  // PiP Video Scaling
  const [videoScale, setVideoScale] = useState(1);

  // Load preferences from local storage on mount
  useEffect(() => {
    try {
      const savedScale = localStorage.getItem("recme_video_scale");
      if (savedScale) {
        const parsed = parseFloat(savedScale);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 2) {
          setVideoScale(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save scale to local storage when changed
  useEffect(() => {
    try {
      localStorage.setItem("recme_video_scale", videoScale.toString());
    } catch {
      // ignore
    }
  }, [videoScale]);

  const [lyrics, setLyrics] = useState<string | null>(null);
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const miniVideoRef = useRef<HTMLDivElement>(null);
  const expandedVideoRef = useRef<HTMLDivElement>(null);
  const [videoRect, setVideoRect] = useState<DOMRect | null>(null);

  const videoUrl = geniusData?.media?.find((m: { provider: string }) => m.provider === "youtube")?.url;
  const videoId = videoUrl ? getYoutubeId(videoUrl) : null;

  // Effective media type: user preference, but fallback to audio if no video available
  const mediaType = (userPreferredType === "video" && videoId) ? "video" : "audio";

  // Use refs for callbacks to avoid re-initializing YT.Player too often
  const nextRef = useRef(next);
  const userPreferredTypeRef = useRef(userPreferredType);
  useEffect(() => { nextRef.current = next; }, [next]);
  useEffect(() => { userPreferredTypeRef.current = userPreferredType; }, [userPreferredType]);

  // Initialize YouTube API
  const [isYTReady, setIsYTReady] = useState(false);

  useEffect(() => {
    if ((window as any).YT && (window as any).YT.Player) {
      setIsYTReady(true);
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);

    (window as any).onYouTubeIframeAPIReady = () => {
      setIsYTReady(true);
    };
  }, []);

  // Initialize YouTube Player
  useEffect(() => {
    if (!isYTReady || !videoId || !iframeRef.current) return;

    if (ytPlayerRef.current) return;

    ytPlayerRef.current = new (window as any).YT.Player(iframeRef.current, {
      events: {
        onStateChange: (event: any) => {
          if (event.data === (window as any).YT.PlayerState.ENDED) {
            if (userPreferredTypeRef.current === "video") {
              nextRef.current();
            }
          }
        },
      },
    });

    return () => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // ignore if already destroyed or iframe gone
        }
      }
      ytPlayerRef.current = null;
    };
  }, [videoId, isYTReady]);

  // Track the active video placeholder and update videoRect
  useEffect(() => {
    const updateRect = () => {
      const targetRef = isExpanded ? expandedVideoRef : miniVideoRef;
      if (targetRef.current) {
        setVideoRect(targetRef.current.getBoundingClientRect());
      } else {
        setVideoRect(null);
      }
    };

    updateRect();
    // Use a small timeout to catch layout changes after animations
    const timeout = setTimeout(updateRect, 100);
    const interval = setInterval(updateRect, 1000); // Periodic sync just in case

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [isExpanded, mediaType, isActive, videoId, videoScale]);

  useEffect(() => {
    if (isExpanded) refreshQueue();
  }, [isExpanded, refreshQueue]);

  useEffect(() => {
    if (activeTab === "lyrics" && geniusData?.url && !lyrics) {
      setIsFetchingLyrics(true);
      fetch(`/api/genius/lyrics?url=${encodeURIComponent(geniusData.url)}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data?.lyrics) setLyrics(data.lyrics); })
        .catch(() => {})
        .finally(() => setIsFetchingLyrics(false));
    }
  }, [activeTab, geniusData, lyrics]);

  useEffect(() => {
    setLyrics(null);
  }, [currentTrack?.id]);

  // Pause audio when switching TO video
  useEffect(() => {
    if (mediaType === "video" && isPlaying) {
      pause();
    }
  }, [mediaType, isPlaying, pause]);

  // Synchronize playback states to prevent dual playback
  useEffect(() => {
    if (!isActive || !currentTrack) return;

    if (mediaType === "video") {
      // If in video mode and Spotify starts playing, pause Spotify
      if (isPlaying) {
        pause();
      }
    } else {
      // If in audio mode, ensure YouTube is paused
      if (ytPlayerRef.current?.pauseVideo) {
        ytPlayerRef.current.pauseVideo();
      } else if (iframeRef.current?.contentWindow) {
        // Fallback to postMessage if player not ready
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
          "*"
        );
      }
    }
  }, [currentTrack?.id, mediaType, isPlaying, isActive, pause, currentTrack]);

  useEffect(() => {
    if (isActive) {
      document.body.classList.add("has-player");
    } else {
      document.body.classList.remove("has-player");
    }
    return () => document.body.classList.remove("has-player");
  }, [isActive]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolumeLevel(val);
    setVolume(val);
    if (val > 0) setIsMuted(false);
  }, [setVolume]);

  const toggleMute = useCallback(() => {
    if (isMuted) { setVolume(volumeLevel); setIsMuted(false); }
    else { setVolume(0); setIsMuted(true); }
  }, [isMuted, volumeLevel, setVolume]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setScrubPosition((val / 100) * duration);
  }, [duration]);

  const handleSeekEnd = useCallback(async (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    setIsScrubbing(false);
    const val = parseFloat((e.target as HTMLInputElement).value);
    await seek((val / 100) * duration);
  }, [seek, duration]);

  if (!isActive || !currentTrack) return null;

  const albumArt = currentTrack.album.images[0]?.url;
  const displayPosition = isScrubbing ? scrubPosition : position;
  const progressPercent = duration > 0 ? (displayPosition / duration) * 100 : 0;
  const spotifyUrl = `https://open.spotify.com/track/${currentTrack.id}`;

  const tabProps = {
    activeTab,
    setActiveTab,
    queue,
    refreshQueue,
    playTrack,
    geniusData,
    lyrics,
    isFetchingLyrics,
    isSaved,
    toggleSaveTrack,
  };

  return (
    <>
      <AnimatePresence>
        {/* ── Queue Toast ── */}
        <AnimatePresence>
          {showQueueToast && (
            <motion.div
              key="queue-toast"
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-full bg-[var(--music-accent)] text-black text-xs font-bold flex items-center gap-2 shadow-xl pointer-events-none"
            >
              <Check className="w-3.5 h-3.5" />
              Added to queue
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Mini Bar ── */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 h-20 sm:h-24 bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-between px-4 sm:px-6 gap-4"
        >
          {/* Left: Track Info */}
          <div
            className="flex items-center gap-3 w-1/3 min-w-0 cursor-pointer group/info relative h-full"
            onClick={() => setIsExpanded(true)}
          >
            {mediaType === "video" && videoId ? (
              <>
                {/* Floating PiP Video (Placeholder) */}
                <motion.div 
                  className="absolute bottom-full left-0 mb-4 aspect-video rounded-xl bg-black shadow-[0_10px_50px_rgba(0,0,0,0.5)] border border-white/10 z-[60] transition-colors duration-300 group-hover/info:border-white/30"
                  style={{
                    width: `calc(min(100vw - 32px, max(200px, ${260 * videoScale}px)))`,
                    maxWidth: "calc(100vw - 32px)",
                  }}
                >
                  <div ref={miniVideoRef} className="w-full h-full rounded-xl overflow-hidden pointer-events-none" />
                </motion.div>

                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
                  <ChevronUp className="w-6 h-6 text-white/50 group-hover/info:text-white transition-colors" />
                </div>

                <div className="min-w-0 flex flex-col justify-center">
                  <p className="text-sm font-semibold text-white truncate group-hover/info:text-[var(--music-accent)] transition-colors">{currentTrack.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentTrack.artists.map((a) => a.name).join(", ")}</p>
                </div>
              </>
            ) : (
              <>
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 bg-surface-light group-hover/info:scale-105 transition-transform duration-300">
                  {albumArt && <Image src={albumArt} alt={currentTrack.name} fill className="object-cover" />}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/info:opacity-100 flex items-center justify-center transition-opacity">
                    <ChevronUp className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <p className="text-sm font-semibold text-white truncate group-hover/info:text-[var(--music-accent)] transition-colors">{currentTrack.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentTrack.artists.map((a) => a.name).join(", ")}</p>
                </div>
              </>
            )}
          </div>
          {/* Center: Controls & Progress */}
          <div className="flex flex-col items-center justify-center flex-1 max-w-xl px-4">
            <div className="flex items-center gap-4 sm:gap-6 mb-1.5">
              <button onClick={prev} className="text-muted-foreground hover:text-white transition-colors">
                <SkipBack className="w-5 h-5 fill-current" />
              </button>
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-[var(--music-accent)] flex items-center justify-center text-black hover:scale-105 transition-transform shadow-[0_0_15px_rgba(29,185,84,0.3)]"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
              </button>
              <button onClick={next} className="text-muted-foreground hover:text-white transition-colors">
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
            </div>
            <div className="w-full flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-mono text-muted-foreground">
              <span className="w-10 text-right">{formatTime(displayPosition)}</span>
              <div className="relative flex-1 h-1.5 group flex items-center">
                <input
                  type="range" min="0" max="100" step="0.1" value={progressPercent}
                  onMouseDown={() => setIsScrubbing(true)}
                  onTouchStart={() => setIsScrubbing(true)}
                  onChange={handleSeek}
                  onMouseUp={handleSeekEnd}
                  onTouchEnd={handleSeekEnd}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="absolute inset-0 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-white group-hover:bg-[var(--music-accent)] transition-colors" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
              <span className="w-10 text-left">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Volume & Actions */}
          <div className="flex items-center justify-end gap-4 w-1/3 min-w-0">
            <div className="hidden sm:flex items-center gap-2 w-32 group">
              <button onClick={toggleMute} className="text-muted-foreground hover:text-white transition-colors">
                {isMuted || volumeLevel === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="relative flex-1 h-1.5 flex items-center">
                <input
                  type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volumeLevel}
                  onChange={handleVolumeChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="absolute inset-0 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-white group-hover:bg-[var(--music-accent)] transition-colors" style={{ width: `${(isMuted ? 0 : volumeLevel) * 100}%` }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 border-l border-white/10 pl-4">
              <a href={spotifyUrl} target="_blank" rel="noopener noreferrer"
                className="text-muted-foreground hover:text-[var(--music-accent)] transition-colors" title="Open in Spotify"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button onClick={dismiss} className="text-muted-foreground hover:text-white transition-colors" title="Close player">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Expanded Player Overlay ── */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-0 z-[60] bg-[#0A0A0A] text-white flex flex-col overflow-hidden"
            >
              {/* Background glow (audio only) */}
              {mediaType === "audio" && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full opacity-20 blur-[120px]" style={{ backgroundColor: "var(--music-accent)" }} />
                  <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] rounded-full opacity-10 blur-[100px]" style={{ backgroundColor: "white" }} />
                </div>
              )}

              {/* Header */}
              <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-3 shrink-0 w-full max-w-5xl mx-auto">
                <button onClick={() => setIsExpanded(false)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                  <ChevronDown className="w-6 h-6" />
                </button>

                <div className="text-center">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Now Playing</p>
                  <div className="mt-2 flex items-center bg-white/5 rounded-full p-1 border border-white/10">
                    <button
                      onClick={() => setUserPreferredType("audio")}
                      className={`flex items-center gap-1.5 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${userPreferredType === "audio" ? "bg-white text-black shadow-lg" : "text-muted-foreground hover:text-white"}`}
                    >
                      <MusicIcon className="w-3 h-3" /> Audio
                    </button>
                    <button
                      onClick={() => setUserPreferredType("video")}
                      className={`flex items-center gap-1.5 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${userPreferredType === "video" ? "bg-white text-black shadow-lg" : "text-muted-foreground hover:text-white"}`}
                    >
                      <Video className="w-3 h-3" /> Video
                    </button>
                  </div>
                </div>

                <button onClick={dismiss} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* ── AUDIO MODE ── */}
              <div className={`relative z-10 flex-1 flex flex-col md:flex-row items-stretch overflow-hidden min-h-0 w-full max-w-5xl mx-auto ${mediaType !== "audio" ? "hidden" : ""}`}>
                {/* Artwork */}
                <div className="flex items-center justify-center pt-4 pb-2 px-8 md:p-10 shrink-0 md:w-[45%]">
                  <div className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-full md:h-auto md:max-w-[340px] md:aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
                    {albumArt ? (
                      <>
                        <Image src={albumArt} alt={currentTrack.name} fill className="object-cover opacity-60 blur-sm scale-110" />
                        <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6">
                          <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl">
                            <Image src={albumArt} alt={currentTrack.name} fill className="object-cover" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-surface-light flex items-center justify-center">
                        <MusicIcon className="w-16 h-16 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Controls + Tabs */}
                <div className="flex-1 flex flex-col gap-4 px-6 pb-6 md:py-6 md:pr-10 min-w-0 overflow-hidden">
                  <div className="relative">
                    <div className="space-y-0.5 pr-12">
                      <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight truncate">{currentTrack.name}</h2>
                      <p className="text-sm md:text-base text-[var(--music-accent)] font-medium truncate">
                        {currentTrack.artists.map((a) => a.name).join(", ")}
                      </p>
                    </div>
                    
                    <button
                      onClick={toggleSaveTrack}
                      className="absolute top-1/2 -translate-y-1/2 right-0 p-2 text-muted-foreground hover:text-white transition-colors"
                      title={isSaved ? "Remove from Liked Songs" : "Save to Liked Songs"}
                    >
                      <Heart className={`w-6 h-6 md:w-7 md:h-7 transition-colors ${isSaved ? "fill-[var(--music-accent)] text-[var(--music-accent)]" : "fill-transparent"}`} />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden group">
                      <input
                        type="range" min="0" max="100" step="0.1" value={progressPercent}
                        onMouseDown={() => setIsScrubbing(true)}
                        onChange={handleSeek}
                        onMouseUp={handleSeekEnd}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="h-full bg-[var(--music-accent)] group-hover:bg-white transition-colors" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-white/40">
                      <span>{formatTime(displayPosition)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-8 md:gap-10">
                    <button onClick={prev} className="p-2 text-white/60 hover:text-white transition-colors">
                      <SkipBack className="w-6 h-6 md:w-7 md:h-7 fill-current" />
                    </button>
                    <button
                      onClick={togglePlay}
                      className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[var(--music-accent)] text-black flex items-center justify-center hover:scale-105 transition-transform shadow-xl shadow-[var(--music-accent)]/20"
                    >
                      {isPlaying ? <Pause className="w-6 h-6 md:w-7 md:h-7 fill-current" /> : <Play className="w-6 h-6 md:w-7 md:h-7 fill-current ml-0.5" />}
                    </button>
                    <button onClick={next} className="p-2 text-white/60 hover:text-white transition-colors">
                      <SkipForward className="w-6 h-6 md:w-7 md:h-7 fill-current" />
                    </button>
                  </div>

                  <ExpandedTabs {...tabProps} layoutIdSuffix="-audio" />
                </div>
              </div>

              {/* ── VIDEO MODE ── */}
              <div className={`relative z-10 flex-1 flex flex-col overflow-hidden min-h-0 px-6 pb-6 w-full max-w-5xl mx-auto ${mediaType !== "video" ? "hidden" : ""}`}>
                <div
                  ref={expandedVideoRef}
                  className="w-full rounded-2xl overflow-hidden shrink-0 bg-black mt-1"
                  style={{ aspectRatio: "16/9", maxHeight: "52%" }}
                >
                  {!videoId && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
                      <Video className="w-10 h-10 text-muted-foreground" />
                      <p className="text-sm font-medium">Video not available</p>
                      <p className="text-xs text-muted-foreground">No YouTube video found for this track.</p>
                      <button onClick={() => setUserPreferredType("audio")} className="mt-2 text-xs font-bold uppercase tracking-widest text-[var(--music-accent)]">
                        Back to Audio
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col min-h-0 pt-3 gap-3">
                  <div className="shrink-0 relative flex items-center justify-between gap-4">
                    <div className="min-w-0 pr-12">
                      <p className="text-base font-bold truncate">{currentTrack.name}</p>
                      <p className="text-sm text-[var(--music-accent)] truncate">{currentTrack.artists.map((a) => a.name).join(", ")}</p>
                    </div>
                    
                    <button
                      onClick={toggleSaveTrack}
                      className="absolute top-1/2 -translate-y-1/2 right-0 p-2 text-muted-foreground hover:text-white transition-colors shrink-0"
                      title={isSaved ? "Remove from Liked Songs" : "Save to Liked Songs"}
                    >
                      <Heart className={`w-6 h-6 transition-colors ${isSaved ? "fill-[var(--music-accent)] text-[var(--music-accent)]" : "fill-transparent"}`} />
                    </button>
                  </div>
                  <ExpandedTabs {...tabProps} layoutIdSuffix="-video" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatePresence>

      {/* ── Persistent YouTube Iframe ── */}
      {isActive && videoId && (
        <div
          style={{
            position: "fixed",
            left: videoRect?.left ?? -9999,
            top: videoRect?.top ?? -9999,
            width: videoRect?.width ?? 0,
            height: videoRect?.height ?? 0,
            zIndex: isExpanded ? 65 : 51,
            pointerEvents: (mediaType === "video" && videoRect) ? "auto" : "none",
            opacity: mediaType === "video" && videoRect ? 1 : 0,
            transition: "opacity 0.3s ease, z-index 0s",
          }}
          className="rounded-lg overflow-hidden bg-black shadow-2xl group/yt relative"
        >
          <iframe
            key={videoId}
            ref={iframeRef}
            className="w-full h-full border-0"
            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1${mediaType === "video" ? "&autoplay=1" : ""}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          
          {/* Resize Handle for PiP */}
          {!isExpanded && mediaType === "video" && (
            <motion.div
              onPanStart={() => {
                document.body.style.userSelect = "none";
              }}
              onPan={(e, info) => {
                e.stopPropagation();
                setVideoScale((prev) => {
                  const baseWidth = 260; // Desktop base width assumption
                  const newScale = prev + info.delta.x / baseWidth;
                  return Math.min(Math.max(newScale, 1), 2);
                });
              }}
              onPanEnd={() => {
                document.body.style.userSelect = "";
              }}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-1 right-1 w-8 h-8 flex items-center justify-center cursor-nesw-resize opacity-0 hover:opacity-100 group-hover/yt:opacity-60 transition-opacity z-[70]"
            >
              <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
            </motion.div>
          )}
        </div>
      )}
    </>
  );
}

/* ─── Shared tab bar + content for both audio and video modes ─── */
interface TabsProps {
  activeTab: "queue" | "lyrics" | "insights";
  setActiveTab: (t: "queue" | "lyrics" | "insights") => void;
  queue: SpotifyTrack[];
  refreshQueue: () => void;
  playTrack: (t: { title: string; artist: string; uri?: string }) => void;
  geniusData: GeniusSong | null;
  lyrics: string | null;
  isFetchingLyrics: boolean;
  isSaved: boolean | null;
  toggleSaveTrack: () => Promise<void>;
  layoutIdSuffix?: string;
}

function ExpandedTabs({ activeTab, setActiveTab, queue, refreshQueue, playTrack, geniusData, lyrics, isFetchingLyrics, layoutIdSuffix = "" }: TabsProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-white/10 shrink-0">
        <div className="flex gap-5">
          {(["queue", "lyrics", "insights"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors relative flex items-center gap-1.5 ${
                activeTab === tab ? "text-white" : "text-muted-foreground hover:text-white"
              }`}
            >
              {tab === "insights" && <Sparkles className="w-3 h-3" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeTab === tab && (
                <motion.div layoutId={`expandedActiveTab${layoutIdSuffix}`} className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--music-accent)]" />
              )}
            </button>
          ))}
        </div>
        {activeTab === "queue" && (
          <button onClick={refreshQueue} className="pb-3 text-muted-foreground hover:text-white transition-colors" title="Refresh Queue">
            <RefreshCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 mt-2">
        <AnimatePresence mode="wait">
          {activeTab === "queue" && (
            <motion.div key="queue" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="space-y-1">
              {queue.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-4">Queue is empty</p>
              ) : (
                queue.slice(0, 50).map((track, i) => (
                  <div
                    key={`${track.uri}-${i}`}
                    onClick={() => playTrack({ title: track.name, artist: track.artists[0]?.name, uri: track.uri })}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <div className="relative w-9 h-9 rounded overflow-hidden shrink-0 bg-white/5">
                      {track.album?.images?.[0]?.url && <Image src={track.album.images[0].url} alt="" fill className="object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-[var(--music-accent)] transition-colors">{track.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{track.artists[0]?.name}</p>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === "lyrics" && (
            <motion.div key="lyrics" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
              {isFetchingLyrics ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-6 h-6 text-[var(--music-accent)] animate-spin" />
                  <p className="text-xs text-muted-foreground">Transcribing lyrics...</p>
                </div>
              ) : lyrics ? (
                <div
                  className="text-base font-bold leading-relaxed pb-8
                    [&_br]:block [&_br]:mb-2 [&_i]:text-muted-foreground [&_i]:text-sm [&_i]:block [&_i]:mb-4 [&_i]:font-normal [&_span]:block"
                  dangerouslySetInnerHTML={{ __html: lyrics }}
                />
              ) : geniusData ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4 gap-3">
                  <p className="text-sm text-muted-foreground">Lyrics not available for this track yet.</p>
                  <a href={geniusData.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--music-accent)] underline">View on Genius</a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <p className="text-sm text-muted-foreground">No lyrics data found.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "insights" && (
            <motion.div key="insights" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
              <GeniusDetails />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
