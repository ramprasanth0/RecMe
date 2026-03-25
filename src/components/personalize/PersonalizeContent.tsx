"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Music2, Mic2, AlertCircle } from "lucide-react";
import { PlaylistGenerator } from "@/components/shared/PlaylistGenerator";
import { cn } from "@/lib/utils";

interface Artist {
  name: string;
  images: { url: string }[];
  genres: string[];
}

interface Track {
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
}

interface PersonalizeContentProps {
  hasSpotify: boolean;
}

export function PersonalizeContent({ hasSpotify }: PersonalizeContentProps) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSpotify) {
      setLoading(false);
      return;
    }
    Promise.all([
      fetch("/api/spotify/top-artists").then((r) => r.json()),
      fetch("/api/spotify/top-tracks").then((r) => r.json()),
    ]).then(([artistData, trackData]) => {
      setArtists(artistData.artists?.slice(0, 12) ?? []);
      setTracks(trackData.tracks?.slice(0, 10) ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [hasSpotify]);

  return (
    <main className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">

        {/* Header */}
        <div className="pt-6 space-y-1">
          <h1 className="font-display text-3xl font-bold tracking-tight">Personalize</h1>
          <p className="text-muted-foreground text-sm">
            Build AI-curated playlists and explore your Spotify taste profile.
          </p>
        </div>

        {/* Top row — playlist generator + top artists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlaylistGenerator />

          {/* Top Artists */}
          <div className="rounded-xl bg-surface border border-border p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Mic2 className="w-4 h-4 text-[var(--music-accent)]" />
              <h2 className="text-sm font-semibold">Your Top Artists</h2>
            </div>

            {!hasSpotify ? (
              <NoSpotify />
            ) : loading ? (
              <ArtistsSkeleton />
            ) : artists.length === 0 ? (
              <Empty text="No artist data yet — listen more on Spotify." />
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {artists.map((artist, i) => (
                  <div key={i} className="group space-y-1.5">
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-surface-light">
                      {artist.images[0]?.url ? (
                        <Image
                          src={artist.images[0].url}
                          alt={artist.name}
                          fill
                          sizes="120px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Mic2 className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium truncate leading-tight">{artist.name}</p>
                    {artist.genres[0] && (
                      <p className="text-[10px] text-muted-foreground truncate">{artist.genres[0]}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Tracks */}
        <div className="rounded-xl bg-surface border border-border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Music2 className="w-4 h-4 text-[var(--music-accent)]" />
            <h2 className="text-sm font-semibold">Your Top Tracks</h2>
          </div>

          {!hasSpotify ? (
            <NoSpotify />
          ) : loading ? (
            <TracksSkeleton />
          ) : tracks.length === 0 ? (
            <Empty text="No track data yet — listen more on Spotify." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {tracks.map((track, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-surface-light",
                  )}
                >
                  <span className="text-xs text-muted-foreground/40 w-5 text-right shrink-0 font-mono">
                    {i + 1}
                  </span>
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-surface-light shrink-0">
                    {track.album.images[0]?.url ? (
                      <Image
                        src={track.album.images[0].url}
                        alt={track.album.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music2 className="w-4 h-4 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{track.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {track.artists.map((a) => a.name).join(", ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function NoSpotify() {
  return (
    <div className="flex items-center gap-3 py-4 text-muted-foreground">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <p className="text-sm">
        Connect Spotify from your{" "}
        <a href="/profile" className="underline underline-offset-2 hover:text-foreground transition-colors">
          profile
        </a>{" "}
        to see your taste data.
      </p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground py-4">{text}</p>;
}

function ArtistsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="aspect-square rounded-xl bg-surface-light" />
          <div className="h-3 w-3/4 rounded bg-surface-light" />
        </div>
      ))}
    </div>
  );
}

function TracksSkeleton() {
  return (
    <div className="space-y-1 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-5 h-3 rounded bg-surface-light shrink-0" />
          <div className="w-10 h-10 rounded-lg bg-surface-light shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-1/2 rounded bg-surface-light" />
            <div className="h-2.5 w-1/3 rounded bg-surface-light" />
          </div>
        </div>
      ))}
    </div>
  );
}
