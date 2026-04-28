"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, ExternalLink } from "lucide-react";
import { createPortal } from "react-dom";

interface TrailerModalProps {
  tmdbId: number;
  title: string;
  year?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function TrailerModal({ tmdbId, title, year, isOpen, onClose }: TrailerModalProps) {
  const [youtubeKey, setYoutubeKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setYoutubeKey(null);
      setIsLoading(true);
      setError(false);
      return;
    }

    const fetchTrailer = async () => {
      try {
        const res = await fetch(`/api/tmdb/trailer?id=${tmdbId}`);
        if (!res.ok) throw new Error("Failed to fetch trailer");
        const data = await res.json();
        if (data.youtubeKey) {
          setYoutubeKey(data.youtubeKey);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrailer();
  }, [isOpen, tmdbId]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  const tmdbUrl = `https://www.themoviedb.org/movie/${tmdbId}`;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-5xl bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{ maxHeight: "calc(100vh - 2rem)" }}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
              <div className="flex flex-col min-w-0">
                <h2 className="text-lg font-semibold text-white truncate">{title}</h2>
                {year && <p className="text-sm text-muted-foreground">{year}</p>}
              </div>
              <div className="flex items-center gap-2 pl-4">
                <a
                  href={tmdbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
                  title="View on TMDB"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="relative aspect-video w-full bg-black flex-1">
              {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-[var(--movie-accent)] animate-spin" />
                  <p className="text-sm text-muted-foreground font-mono">Loading trailer...</p>
                </div>
              ) : error || !youtubeKey ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <p className="text-muted-foreground">No trailer available for this movie.</p>
                  <a
                    href={tmdbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-full bg-[var(--movie-accent)] text-black font-medium text-sm flex items-center gap-2 hover:brightness-110 transition-all"
                  >
                    View on TMDB <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeKey}?autoplay=1&modestbranding=1&rel=0`}
                  title={`${title} Trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
