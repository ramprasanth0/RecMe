
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Music2, Mic2, AlertCircle, Play, ChevronDown, ChevronUp, Disc3 } from "lucide-react";
import { PlaylistGenerator } from "@/components/shared/PlaylistGenerator";
import { ProFeatureGate } from "@/components/shared/ProFeatureGate";
import { CardCarousel } from "@/components/shared/CardCarousel";
import { TrendingPlaylistCard } from "@/components/shared/TrendingPlaylistCard";
import { cn } from "@/lib/utils";
import type { TrendingPlaylist } from "@/types/trending";
import { useSpotifyPlayer } from "@/context/SpotifyPlayerContext";

interface Artist {
  name: string;
  images: { url: string }[];
  genres: string[];
  external_urls?: { spotify?: string };
  uri: string;
}

interface Track {
  name: string;
  artists: { name: string; uri?: string }[];
  album: { name: string; images: { url: string }[]; uri?: string };
  external_urls?: { spotify?: string };
  uri: string;
}

interface PersonalizeContentProps {
  hasSpotify: boolean;
  isPro: boolean;
}

export function PersonalizeContent({ hasSpotify, isPro }: PersonalizeContentProps) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  const [userPlaylists, setUserPlaylists] = useState<TrendingPlaylist[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(true);

  const { playTrack, playContext, currentTrack, currentContextUri, isPlaying } = useSpotifyPlayer();

  useEffect(() => {
    if (!hasSpotify) {
      setLoading(false);
      setPlaylistsLoading(false);
      return;
    }
    fetch("/api/spotify/top-data")
      .then((r) => r.json())
      .then((data) => {
        setArtists(data.artists?.slice(0, 10) ?? []);
        setTracks(data.tracks?.slice(0, 10) ?? []);
        setRecentTracks(data.recentTracks?.slice(0, 20) ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    Promise.all([
      fetch("/api/spotify/user-playlists").then((r) => r.json()).catch(() => ({ playlists: [] })),
    ]).then(([userPl]) => {
      setUserPlaylists(userPl.playlists ?? []);
      setPlaylistsLoading(false);
    });
  }, [hasSpotify]);

  // Derive recent albums and artists from recentTracks
  const recentAlbums = Array.from(new Map(recentTracks.filter(t => t.album?.uri).map(t => [t.album.uri, t.album])).values()).slice(0, 5);
  const recentArtists = Array.from(new Map(recentTracks.flatMap(t => t.artists).filter(a => a.uri).map(a => [a.uri, a])).values()).slice(0, 5);

  return (
    <main className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">

        {/* Header */}
        <div className="pt-6 space-y-1">
          <h1 className="font-display text-4xl font-bold tracking-tight">Personalize</h1>
          <p className="text-muted-foreground text-sm">
            Build AI-curated playlists and explore your Spotify taste profile.
          </p>
        </div>

        {/* AI Playlist Generator */}
        <div className="max-w-xl">
          <ProFeatureGate featureId="ai_playlist" isPro={isPro}>
            <PlaylistGenerator />
          </ProFeatureGate>
        </div>

        {/* CURRENT SECTION */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold font-display tracking-tight border-b border-border pb-2">Recent Activity</h2>

          {/* Recently Played Overview */}
          {hasSpotify && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Recent Tracks */}
              <div className="rounded-xl bg-surface border border-border p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Music2 className="w-4 h-4 text-[var(--music-accent)]" />
                  <h3 className="text-sm font-semibold">Recently Played Tracks</h3>
                </div>
                {recentTracks.length === 0 ? <Empty text="No recent tracks found. If you recently connected, try playing some music or reconnect your account from your Profile to grant history permissions." /> : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {recentTracks.slice(0, 8).map((track, i) => {
                      const isCurrent = currentTrack?.uri === track.uri;
                      return (
                        <div
                          key={i}
                          className={cn(
                            "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-surface-light relative"
                          )}
                        >
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-surface-light shrink-0 cursor-pointer" onClick={() => playTrack({ title: track.name, artist: track.artists[0]?.name ?? "", uri: track.uri })}>
                            {track.album?.images?.[0]?.url ? (
                              <Image src={track.album.images[0].url} alt={track.album.name} fill sizes="40px" className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Music2 className="w-4 h-4 text-muted-foreground/30" /></div>
                            )}
                            <div className={cn(
                              "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
                              isCurrent && isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )}>
                              <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <a href={track.external_urls?.spotify ?? `https://open.spotify.com/search/${encodeURIComponent(track.name)}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              <p className={cn("text-sm font-medium truncate", isCurrent && isPlaying && "text-[var(--music-accent)]")}>{track.name}</p>
                            </a>
                            <p className="text-xs text-muted-foreground truncate">{track.artists.map((a) => a.name).join(", ")}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent Artists & Albums */}
              <div className="space-y-6">
                <div className="rounded-xl bg-surface border border-border p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Mic2 className="w-4 h-4 text-[var(--music-accent)]" />
                    <h3 className="text-sm font-semibold">Recent Artists</h3>
                  </div>
                  {recentArtists.length === 0 ? <Empty text="No recent artists found. Try reconnecting your Spotify profile." /> : (
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                      {recentArtists.map((artist, i) => {
                        const isCurrentArtist = currentContextUri === artist.uri;
                        return (
                          <div key={i} className="group w-24 flex-shrink-0 space-y-1.5 relative">
                            <div className="relative aspect-square rounded-full overflow-hidden bg-surface-light cursor-pointer" onClick={() => artist.uri && playContext(artist.uri)}>
                              {artist.images?.[0]?.url ? (
                                <Image src={artist.images[0].url} alt={artist.name} fill sizes="96px" className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-surface-light">
                                  <Mic2 className="w-8 h-8 text-muted-foreground/30" />
                                </div>
                              )}
                              <div className={cn(
                                "absolute inset-0 transition-opacity flex items-center justify-center bg-black/40 rounded-full",
                                isCurrentArtist && isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                              )}>
                                <button className="w-10 h-10 rounded-full bg-[var(--music-accent)] text-black flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                                  <Play className="w-5 h-5 ml-1 fill-current" />
                                </button>
                              </div>
                            </div>
                            <p className={cn("text-xs font-medium text-center truncate leading-tight", isCurrentArtist && isPlaying && "text-[var(--music-accent)]")}>{artist.name}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-xl bg-surface border border-border p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Disc3 className="w-4 h-4 text-[var(--music-accent)]" />
                    <h3 className="text-sm font-semibold">Recent Albums</h3>
                  </div>
                  {recentAlbums.length === 0 ? <Empty text="No recent albums found. Try reconnecting your Spotify profile." /> : (
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                      {recentAlbums.map((album, i) => {
                        const isCurrentAlbum = currentContextUri === album.uri;
                        return (
                          <div key={i} className="group w-24 flex-shrink-0 space-y-1.5 relative">
                            <div className="relative aspect-square rounded-xl overflow-hidden bg-surface-light cursor-pointer" onClick={() => album.uri && playContext(album.uri)}>
                              {album.images?.[0]?.url ? (
                                <Image src={album.images[0].url} alt={album.name} fill sizes="96px" className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Disc3 className="w-8 h-8 text-muted-foreground/30" /></div>
                              )}
                              <div className={cn(
                                "absolute inset-0 transition-opacity flex items-center justify-center bg-black/40",
                                isCurrentAlbum && isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                              )}>
                                <button className="w-10 h-10 rounded-full bg-[var(--music-accent)] text-black flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                                  <Play className="w-5 h-5 ml-1 fill-current" />
                                </button>
                              </div>
                            </div>
                            <p className={cn("text-xs font-medium text-center truncate leading-tight", isCurrentAlbum && isPlaying && "text-[var(--music-accent)]")}>{album.name}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Your Playlists */}
          {hasSpotify && (
            <div className="rounded-xl bg-surface border border-border p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Music2 className="w-4 h-4 text-[var(--music-accent)]" />
                <h3 className="text-sm font-semibold">Your Playlists</h3>
              </div>
              {playlistsLoading ? (
                <PlaylistsSkeleton />
              ) : userPlaylists.length === 0 ? (
                <Empty text="No playlists found on your Spotify account." />
              ) : (
                <CardCarousel>
                  {userPlaylists.map((pl) => (
                    <TrendingPlaylistCard
                      key={pl.id}
                      {...pl}
                      onPlay={() => playContext(`spotify:playlist:${pl.id}`)}
                      isPlaying={currentContextUri === `spotify:playlist:${pl.id}` && isPlaying}
                    />
                  ))}
                </CardCarousel>
              )}
            </div>
          )}
        </div>

        {/* STATS SECTION (Togglable) */}
        <StatsAccordion 
          hasSpotify={hasSpotify} 
          loading={loading} 
          artists={artists} 
          tracks={tracks} 
          currentTrack={currentTrack} 
          currentContextUri={currentContextUri} 
          isPlaying={isPlaying} 
          playContext={playContext} 
          playTrack={playTrack} 
        />

      </div>
    </main>
  );
}

interface StatsAccordionProps {
  hasSpotify: boolean;
  loading: boolean;
  artists: Artist[];
  tracks: Track[];
  currentTrack: { uri?: string } | null;
  currentContextUri: string | null;
  isPlaying: boolean;
  playContext: (uri: string) => void;
  playTrack: (track: { title: string; artist: string; uri?: string }) => void;
}

function StatsAccordion({ hasSpotify, loading, artists, tracks, currentTrack, currentContextUri, isPlaying, playContext, playTrack }: StatsAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Derive top albums from top tracks
  const topAlbums = Array.from(new Map(tracks.filter((t) => t.album?.uri).map((t) => [t.album.uri, t.album])).values()).slice(0, 10);

  return (
    <div className="space-y-6 pt-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between group py-2 border-b border-border"
      >
        <div className="text-left space-y-1">
          <h2 className="text-2xl font-bold font-display tracking-tight group-hover:text-[var(--music-accent)] transition-colors">Stats</h2>
          <p className="text-sm text-muted-foreground">All time Top 10 Artists, Albums, and Songs</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-surface-light flex items-center justify-center group-hover:bg-[var(--music-accent)] group-hover:text-black transition-colors">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {isOpen && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
          {/* Top Artists */}
          <div className="rounded-xl bg-surface border border-border p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Mic2 className="w-4 h-4 text-[var(--music-accent)]" />
              <h2 className="text-sm font-semibold">All-Time Top Artists</h2>
            </div>
            {!hasSpotify ? <NoSpotify /> : loading ? <ArtistsSkeleton /> : artists.length === 0 ? <Empty text="No data" /> : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {artists.map((artist, i) => {
                  const isCurrentArtist = currentContextUri === artist.uri;
                  return (
                    <div key={i} className="group space-y-1.5 relative">
                      <div className="relative aspect-square rounded-full overflow-hidden bg-surface-light">
                        {artist.images?.[0]?.url ? (
                          <Image src={artist.images[0].url} alt={artist.name} fill sizes="120px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Mic2 className="w-6 h-6 text-muted-foreground/30" /></div>
                        )}
                        <div className={cn(
                          "absolute inset-0 transition-opacity flex items-center justify-center bg-black/40 rounded-full",
                          isCurrentArtist && isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}>
                          <button onClick={() => playContext(artist.uri)} className="w-10 h-10 rounded-full bg-[var(--music-accent)] text-black flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                            <Play className="w-5 h-5 ml-1 fill-current" />
                          </button>
                        </div>
                      </div>
                      <a href={artist.external_urls?.spotify ?? `https://open.spotify.com/search/${encodeURIComponent(artist.name)}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        <p className={cn("text-xs font-medium text-center truncate leading-tight", isCurrentArtist && isPlaying && "text-[var(--music-accent)]")}>{artist.name}</p>
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Top Tracks */}
            <div className="rounded-xl bg-surface border border-border p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Music2 className="w-4 h-4 text-[var(--music-accent)]" />
                <h2 className="text-sm font-semibold">All-Time Top Tracks</h2>
              </div>
              {!hasSpotify ? <NoSpotify /> : loading ? <TracksSkeleton /> : tracks.length === 0 ? <Empty text="No data" /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {tracks.map((track, i) => {
                    const isCurrent = currentTrack?.uri === track.uri;
                    return (
                      <div key={i} className={cn("group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-surface-light relative")}>
                        <span className="text-xs text-muted-foreground/40 w-5 text-right shrink-0 font-mono">{i + 1}</span>
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-surface-light shrink-0 cursor-pointer" onClick={() => playTrack({ title: track.name, artist: track.artists[0]?.name ?? "", uri: track.uri })}>
                          {track.album?.images?.[0]?.url ? (
                            <Image src={track.album.images[0].url} alt={track.album.name} fill sizes="40px" className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Music2 className="w-4 h-4 text-muted-foreground/30" /></div>
                          )}
                          <div className={cn("absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity", isCurrent && isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                            <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <a href={track.external_urls?.spotify ?? `https://open.spotify.com/search/${encodeURIComponent(track.name)}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            <p className={cn("text-sm font-medium truncate", isCurrent && isPlaying && "text-[var(--music-accent)]")}>{track.name}</p>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top Albums */}
            <div className="rounded-xl bg-surface border border-border p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Disc3 className="w-4 h-4 text-[var(--music-accent)]" />
                <h2 className="text-sm font-semibold">All-Time Top Albums</h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {topAlbums.map((album, i) => {
                  const isCurrentAlbum = currentContextUri === album.uri;
                  return (
                    <div key={i} className="group w-24 flex-shrink-0 space-y-1.5 relative">
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-surface-light cursor-pointer" onClick={() => album.uri && playContext(album.uri)}>
                        {album.images?.[0]?.url ? (
                          <Image src={album.images[0].url} alt={album.name} fill sizes="96px" className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Disc3 className="w-8 h-8 text-muted-foreground/30" /></div>
                        )}
                        <div className={cn("absolute inset-0 transition-opacity flex items-center justify-center bg-black/40", isCurrentAlbum && isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                          <button className="w-10 h-10 rounded-full bg-[var(--music-accent)] text-black flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                            <Play className="w-5 h-5 ml-1 fill-current" />
                          </button>
                        </div>
                      </div>
                      <p className={cn("text-xs font-medium text-center truncate leading-tight", isCurrentAlbum && isPlaying && "text-[var(--music-accent)]")}>{album.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NoSpotify() {
  return (
    <div className="flex items-center gap-3 py-4 text-muted-foreground">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <p className="text-sm">
        Connect Spotify from your <a href="/profile" className="underline underline-offset-2 hover:text-foreground transition-colors">profile</a> to see your taste data.
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
          <div className="aspect-square rounded-full bg-surface-light" />
          <div className="h-3 w-3/4 rounded mx-auto bg-surface-light" />
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

function PlaylistsSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="w-36 flex-shrink-0 space-y-2">
          <div className="aspect-square rounded-xl bg-surface-light" />
          <div className="h-3 w-3/4 rounded bg-surface-light" />
          <div className="h-2.5 w-1/2 rounded bg-surface-light" />
        </div>
      ))}
    </div>
  );
}
