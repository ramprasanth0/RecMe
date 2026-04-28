"use client";

import { useSpotifyPlayer } from "@/context/SpotifyPlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, ChevronUp, ChevronDown, RefreshCcw, Music as MusicIcon, Video, Sparkles } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { GeniusDetails } from "./GeniusDetails";
import { getYoutubeId } from "@/lib/utils";

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
    geniusData,
  } = useSpotifyPlayer();

  const [volumeLevel, setVolumeLevel] = useState(0.5);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPosition, setScrubPosition] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mediaType, setMediaType] = useState<"audio" | "video">("audio");
  const [activeTab, setActiveTab] = useState<"queue" | "insights">("queue");
  const videoRef = useRef<HTMLIFrameElement>(null);

  // Pause/Play logic when switching modes
  useEffect(() => {
    if (mediaType === "video") {
      if (isPlaying) togglePlay();
      videoRef.current?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
    } else {
      videoRef.current?.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    }
  }, [mediaType, isPlaying, togglePlay]);

  // Sync effect for <body> class
  useEffect(() => {
    if (isActive) {
      document.body.classList.add("player-active");
    } else {
      document.body.classList.remove("player-active");
    }
    return () => document.body.classList.remove("player-active");
  }, [isActive]);

  if (!isActive || !currentTrack) return null;

  const albumArt = currentTrack.album.images[0]?.url;
  const progressPercent = isScrubbing ? scrubPosition : (position / duration) * 100;
  const displayPosition = isScrubbing ? (scrubPosition / 100) * duration : position;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScrubPosition(parseFloat(e.target.value));
  };

  const handleSeekEnd = () => {
    seek((scrubPosition / 100) * duration);
    setIsScrubbing(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolumeLevel(vol);
    setVolume(vol);
  };

  return (
    <>
      {/* Compact View */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
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

            {/* Center: Controls */}
            <div className="flex flex-col items-center gap-2 max-w-[40%] w-full">
              <div className="flex items-center gap-4 sm:gap-6">
                <button onClick={prev} className="p-2 text-white/60 hover:text-white transition-colors">
                  <SkipBack className="w-5 h-5 fill-current" />
                </button>
                <button 
                  onClick={togglePlay}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                </button>
                <button onClick={next} className="p-2 text-white/60 hover:text-white transition-colors">
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full flex items-center gap-2 px-2">
                <span className="text-[10px] font-mono text-white/40 w-8 text-right">{formatTime(displayPosition)}</span>
                <div className="relative flex-1 h-1 bg-white/10 rounded-full overflow-hidden group">
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
                <span className="text-[10px] font-mono text-white/40 w-8">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-2 sm:gap-4 w-1/3">
              <div className="hidden sm:flex items-center gap-2 group/vol">
                {volumeLevel === 0 ? <VolumeX className="w-4 h-4 text-white/40" /> : <Volume2 className="w-4 h-4 text-white/40" />}
                <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden relative">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volumeLevel}
                    onChange={handleVolumeChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="h-full bg-white/60 group-hover/vol:bg-[var(--music-accent)] transition-colors" style={{ width: `${volumeLevel * 100}%` }} />
                </div>
              </div>
              <button 
                onClick={() => setIsExpanded(true)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Full View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[60] bg-[#0A0A0A] flex flex-col h-screen overflow-hidden"
          >
            {/* Background Glow */}
            <div 
              className="absolute inset-0 opacity-20 blur-[100px] pointer-events-none"
              style={{ background: `radial-gradient(circle at center, var(--music-accent) 0%, transparent 70%)` }}
            />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between p-6 shrink-0">
              <button 
                onClick={() => setIsExpanded(false)}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
              
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2">Now Playing</p>
                <div className="inline-flex items-center bg-white/5 rounded-full p-1 border border-white/10">
                  <button 
                    onClick={() => setMediaType("audio")}
                    className={`flex items-center gap-1.5 px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${mediaType === "audio" ? "bg-white text-black shadow-lg" : "text-muted-foreground hover:text-white"}`}
                  >
                    <MusicIcon className="w-3 h-3" />
                    Audio
                  </button>
                  <button 
                    onClick={() => setMediaType("video")}
                    className={`flex items-center gap-1.5 px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${mediaType === "video" ? "bg-white text-black shadow-lg" : "text-muted-foreground hover:text-white"}`}
                  >
                    <Video className="w-3 h-3" />
                    Video
                  </button>
                </div>
              </div>

              <button 
                onClick={dismiss}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Content Container */}
            <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden scrollbar-none pb-12">
              <div className="w-full max-w-4xl mx-auto flex flex-col items-center px-6 gap-10">
                
                {/* 1. Main Media Area */}
                <motion.div 
                  layoutId="expanded-art"
                  className="relative w-full max-w-[540px] aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-black/80 bg-black group/media"
                >
                  {(() => {
                    const videoUrl = geniusData?.media?.find(m => m.provider === 'youtube')?.url;
                    const videoId = videoUrl ? getYoutubeId(videoUrl) : null;

                    return (
                      <>
                        {/* Video Layer */}
                        {videoId && (
                          <div className={`absolute inset-0 z-20 bg-black transition-opacity duration-500 ${mediaType === "video" ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                            <iframe 
                              ref={videoRef}
                              className="w-full h-full border-0"
                              src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        )}

                        {/* Audio View */}
                        <div className={`absolute inset-0 transition-opacity duration-500 ${mediaType === "audio" ? "opacity-100" : "opacity-0"}`}>
                          {albumArt && (
                            <Image src={albumArt} alt={currentTrack.name} fill className="object-cover opacity-30 blur-2xl scale-125" />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center p-8">
                            <div className="relative w-full h-full max-w-[400px] aspect-square rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10">
                               {albumArt && <Image src={albumArt} alt={currentTrack.name} fill className="object-cover" />}
                            </div>
                          </div>
                        </div>

                        {/* Error State */}
                        {mediaType === "video" && !videoId && (
                          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                            <div className="text-center p-6">
                              <Video className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                              <p className="text-sm font-medium">Video not available</p>
                              <p className="text-xs text-muted-foreground mt-1">We couldn&apos;t find a YouTube version for this track.</p>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </motion.div>

                {/* 2. Track Info & Main Controls */}
                <div className="w-full max-w-[540px] space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{currentTrack.name}</h2>
                    <p className="text-lg text-[var(--music-accent)] font-medium">
                      {currentTrack.artists.map(a => a.name).join(", ")}
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="space-y-3">
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
                    <div className="flex justify-between text-xs font-mono text-white/30">
                      <span>{formatTime(displayPosition)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Playback Controls */}
                  <div className="flex items-center justify-between px-8">
                    <button onClick={prev} className="p-4 text-white/40 hover:text-white transition-all hover:scale-110 active:scale-95">
                      <SkipBack className="w-10 h-10 fill-current" />
                    </button>
                    <button 
                      onClick={togglePlay}
                      className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/10"
                    >
                      {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                    </button>
                    <button onClick={next} className="p-4 text-white/40 hover:text-white transition-all hover:scale-110 active:scale-95">
                      <SkipForward className="w-10 h-10 fill-current" />
                    </button>
                  </div>
                </div>

                {/* 3. Bottom Tabs (Queue / Insight) */}
                <div className="w-full max-w-[540px] bg-white/5 rounded-3xl border border-white/10 p-1 backdrop-blur-md overflow-hidden">
                  <div className="flex p-1">
                    <button 
                      onClick={() => setActiveTab("queue")}
                      className={`flex-1 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "queue" ? "bg-white/10 text-white shadow-xl" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
                    >
                      Queue
                    </button>
                    <button 
                      onClick={() => setActiveTab("insights")}
                      className={`flex-1 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === "insights" ? "bg-white/10 text-white shadow-xl" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
                    >
                      Insights
                      <Sparkles className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="w-full max-w-[540px] min-h-[300px]">
                  <AnimatePresence mode="wait">
                    {activeTab === "queue" ? (
                      <motion.div
                        key="queue"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        {queue.length > 0 ? (
                          queue.map((track, i) => (
                            <div key={`${track.id}-${i}`} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors group">
                              <span className="text-xs font-mono text-muted-foreground w-6">{i + 1}</span>
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-white/5">
                                {track.album.images[0]?.url && <Image src={track.album.images[0].url} alt={track.name} fill className="object-cover" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold truncate group-hover:text-[var(--music-accent)] transition-colors">{track.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{track.artists.map((a: { name: string }) => a.name).join(", ")}</p>
                              </div>
                              <button onClick={refreshQueue} className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-white transition-all">
                                <RefreshCcw className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center py-20 text-center">
                            <MusicIcon className="w-10 h-10 text-white/5 mb-4" />
                            <p className="text-xs text-muted-foreground">Your queue is empty</p>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="insights"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
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
    </>
  );
}
