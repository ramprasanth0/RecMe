"use client";

import { useSpotifyPlayer } from "@/context/SpotifyPlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, ExternalLink, ChevronUp, ChevronDown, ListMusic, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { GeniusDetails } from "./GeniusDetails";
import { Sparkles } from "lucide-react";

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
    next,
    prev,
    seek,
    setVolume,
    dismiss,
    queue,
    refreshQueue,
  } = useSpotifyPlayer();

  const [volumeLevel, setVolumeLevel] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPosition, setScrubPosition] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"queue" | "insights">("queue");

  // Sync effect for <body> class
  useEffect(() => {
    if (isActive) {
      document.body.classList.add("has-player");
    } else {
      document.body.classList.remove("has-player");
    }
    return () => document.body.classList.remove("has-player");
  }, [isActive]);

  if (!isActive || !currentTrack) return null;

  const albumArt = currentTrack.album.images[0]?.url;
  const displayPosition = isScrubbing ? scrubPosition : position;
  const progressPercent = duration > 0 ? (displayPosition / duration) * 100 : 0;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolumeLevel(val);
    setVolume(val);
    if (val > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(volumeLevel);
      setIsMuted(false);
    } else {
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const newPos = (val / 100) * duration;
    setScrubPosition(newPos);
  };

  const handleSeekEnd = async (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    setIsScrubbing(false);
    const target = e.target as HTMLInputElement;
    const val = parseFloat(target.value);
    const newPos = (val / 100) * duration;
    await seek(newPos);
  };

  const spotifyUrl = `https://open.spotify.com/track/${currentTrack.id}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 z-50 h-20 sm:h-24 bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-between px-4 sm:px-6 gap-4"
      >
        {/* Left: Track Info */}
        <div 
          className="flex items-center gap-3 w-1/3 min-w-0 cursor-pointer group/info"
          onClick={() => setIsExpanded(true)}
        >
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 bg-surface-light group-hover/info:scale-105 transition-transform duration-300">
            {albumArt && (
              <Image src={albumArt} alt={currentTrack.name} fill className="object-cover" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/info:opacity-100 flex items-center justify-center transition-opacity">
              <ChevronUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <p className="text-sm font-semibold text-white truncate group-hover/info:text-[var(--music-accent)] transition-colors">{currentTrack.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {currentTrack.artists.map((a) => a.name).join(", ")}
            </p>
          </div>
        </div>

        {/* Center: Controls & Progress */}
        <div className="flex flex-col items-center justify-center flex-1 max-w-xl px-4">
          <div className="flex items-center gap-4 sm:gap-6 mb-1.5">
            <button
              onClick={prev}
              className="text-muted-foreground hover:text-white transition-colors"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-[var(--music-accent)] flex items-center justify-center text-black hover:scale-105 transition-transform shadow-[0_0_15px_rgba(29,185,84,0.3)]"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-1" />
              )}
            </button>
            <button
              onClick={next}
              className="text-muted-foreground hover:text-white transition-colors"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>
          <div className="w-full flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-mono text-muted-foreground">
            <span className="w-10 text-right">{formatTime(displayPosition)}</span>
            <div className="relative flex-1 h-1.5 group flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={progressPercent}
                onMouseDown={() => setIsScrubbing(true)}
                onTouchStart={() => setIsScrubbing(true)}
                onChange={handleSeek}
                onMouseUp={handleSeekEnd}
                onTouchEnd={handleSeekEnd}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="absolute inset-0 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white group-hover:bg-[var(--music-accent)] transition-colors"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <span className="w-10 text-left">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Volume & Actions */}
        <div className="flex items-center justify-end gap-4 w-1/3 min-w-0">
          <div className="hidden sm:flex items-center gap-2 w-32 group">
            <button onClick={toggleMute} className="text-muted-foreground hover:text-white transition-colors">
              {isMuted || volumeLevel === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <div className="relative flex-1 h-1.5 flex items-center">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volumeLevel}
                onChange={handleVolumeChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="absolute inset-0 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white group-hover:bg-[var(--music-accent)] transition-colors"
                  style={{ width: `${(isMuted ? 0 : volumeLevel) * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 border-l border-white/10 pl-4">
            <a
              href={spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-[var(--music-accent)] transition-colors"
              title="Open in Spotify"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={dismiss}
              className="text-muted-foreground hover:text-white transition-colors"
              title="Close player"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Expanded Player Overlay */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[60] bg-[#0A0A0A] text-white flex flex-col"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div 
                className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full opacity-20 blur-[120px]" 
                style={{ backgroundColor: 'var(--music-accent)' }}
              />
              <div 
                className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] rounded-full opacity-10 blur-[100px]" 
                style={{ backgroundColor: 'white' }}
              />
            </div>

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between p-6">
              <button 
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Now Playing</p>
                <p className="text-xs font-medium">{currentTrack.album.name}</p>
              </div>
              <button 
                onClick={dismiss}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center px-6 lg:px-12 gap-12 lg:gap-24 overflow-hidden py-8">
              
              {/* Left: Artwork Large */}
              <motion.div 
                layoutId="expanded-art"
                className="relative w-full max-w-[320px] lg:max-w-[480px] aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
              >
                {albumArt && (
                  <Image src={albumArt} alt={currentTrack.name} fill className="object-cover" />
                )}
              </motion.div>

              {/* Right: Info, Controls & Queue */}
              <div className="w-full max-w-md flex flex-col gap-8 h-full">
                
                {/* Track Info */}
                <div className="space-y-2">
                  <motion.h2 className="text-3xl lg:text-4xl font-bold tracking-tight">{currentTrack.name}</motion.h2>
                  <p className="text-lg text-[var(--music-accent)] font-medium">
                    {currentTrack.artists.map(a => a.name).join(", ")}
                  </p>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="relative h-2 bg-white/10 rounded-full overflow-hidden group">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.1"
                      value={progressPercent}
                      onMouseDown={() => setIsScrubbing(true)}
                      onChange={handleSeek}
                      onMouseUp={handleSeekEnd}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div
                      className="h-full bg-[var(--music-accent)] group-hover:bg-white transition-colors"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-mono text-white/40">
                    <span>{formatTime(displayPosition)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Main Controls */}
                <div className="flex items-center justify-between px-4">
                  <button onClick={prev} className="p-3 text-white/60 hover:text-white transition-colors">
                    <SkipBack className="w-8 h-8 fill-current" />
                  </button>
                  <button onClick={togglePlay}
                    className="w-20 h-20 rounded-full bg-[var(--music-accent)] text-black flex items-center justify-center hover:scale-105 transition-transform shadow-xl shadow-[var(--music-accent)]/20"
                  >
                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                  </button>
                  <button onClick={next} className="p-3 text-white/60 hover:text-white transition-colors">
                    <SkipForward className="w-8 h-8 fill-current" />
                  </button>
                </div>

                {/* Queue Section */}
                  <div className="flex items-center justify-between border-b border-white/10">
                    <div className="flex gap-6">
                      <button 
                        onClick={() => setActiveTab("queue")}
                        className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors relative ${activeTab === "queue" ? "text-white" : "text-muted-foreground hover:text-white"}`}
                      >
                        Queue
                        {activeTab === "queue" && (
                          <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--music-accent)]" />
                        )}
                      </button>
                      <button 
                        onClick={() => setActiveTab("insights")}
                        className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors relative flex items-center gap-2 ${activeTab === "insights" ? "text-white" : "text-muted-foreground hover:text-white"}`}
                      >
                        Insights
                        <Sparkles className="w-3 h-3" />
                        {activeTab === "insights" && (
                          <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--music-accent)]" />
                        )}
                      </button>
                    </div>
                    {activeTab === "queue" && (
                      <button 
                        onClick={refreshQueue}
                        className="pb-3 rounded-full text-muted-foreground hover:text-white transition-colors"
                        title="Refresh Queue"
                      >
                        <RefreshCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                    <AnimatePresence mode="wait">
                      {activeTab === "queue" ? (
                        <motion.div
                          key="queue"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="space-y-1"
                        >
                          {queue.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic py-4">Queue is empty</p>
                          ) : (
                            queue.slice(0, 10).map((track, i) => (
                              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group">
                                <div className="relative w-10 h-10 rounded overflow-hidden shrink-0 bg-white/5">
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
                      ) : (
                        <motion.div
                          key="insights"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                        >
                          <GeniusDetails />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
