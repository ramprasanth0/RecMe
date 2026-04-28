"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import Script from "next/script";

interface TrackToPlay {
  title: string;
  artist: string;
  uri?: string;
}

interface PlayerContextType {
  player: Spotify.Player | null;
  deviceId: string | null;
  isReady: boolean;
  isActive: boolean;
  currentTrack: Spotify.WebPlaybackTrack | null;
  currentContextUri: string | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  playTrack: (track: TrackToPlay) => Promise<void>;
  playQueue: (tracks: TrackToPlay[], startIndex?: number) => Promise<void>;
  playContext: (contextUri: string) => Promise<void>;
  togglePlay: () => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  seek: (ms: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  dismiss: () => Promise<void>;
}

const SpotifyPlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function SpotifyPlayerProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Spotify.WebPlaybackTrack | null>(null);
  const [currentContextUri, setCurrentContextUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [token, setToken] = useState<string | null>(null);

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch token once on mount
  useEffect(() => {
    fetch("/api/spotify/player-token")
      .then((res) => {
        if (!res.ok) throw new Error("No token available");
        return res.json();
      })
      .then((data) => setToken(data.accessToken))
      .catch((err) => console.log("Player token not available (user may not be logged in)", err));
  }, []);

  // Initialize Player when SDK is loaded and we have a token
  useEffect(() => {
    if (!token) return;

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: "RecMe Web Player",
        getOAuthToken: (cb) => {
          cb(token);
        },
        volume: 0.5,
      });

      spotifyPlayer.addListener("ready", ({ device_id }) => {
        console.log("Ready with Device ID", device_id);
        setDeviceId(device_id);
        setIsReady(true);
      });

      spotifyPlayer.addListener("not_ready", ({ device_id }) => {
        console.log("Device ID has gone offline", device_id);
        setIsReady(false);
      });

      spotifyPlayer.addListener("player_state_changed", (state) => {
        if (!state) {
          setIsActive(false);
          return;
        }

        setIsActive(true);
        setCurrentTrack(state.track_window.current_track);
        setCurrentContextUri(state.context?.uri ?? null);
        setIsPlaying(!state.paused);
        setPosition(state.position);
        setDuration(state.duration);
      });

      spotifyPlayer.connect();
      setPlayer(spotifyPlayer);
    };

    // If script is already loaded
    if (window.Spotify && window.Spotify.Player) {
      window.onSpotifyWebPlaybackSDKReady();
    }

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [token]);

  // Sync position periodically while playing
  useEffect(() => {
    if (isPlaying && player) {
      syncIntervalRef.current = setInterval(() => {
        player.getCurrentState().then((state) => {
          if (state && !state.paused) {
            setPosition(state.position);
          }
        });
      }, 500);
    } else if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [isPlaying, player]);

  const fetchUri = useCallback(async (title: string, artist: string) => {
    try {
      const res = await fetch(`/api/spotify/search-track?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
      if (res.ok) {
        const data = await res.json();
        return data.uri;
      }
    } catch (e) {
      console.error("Error fetching URI", e);
    }
    return null;
  }, []);

  const executePlay = useCallback(async (payload: { uris?: string[]; context_uri?: string; offset?: { position: number } }) => {
    if (!deviceId || !token) return;

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  }, [deviceId, token]);

  const playTrack = useCallback(
    async (track: TrackToPlay) => {
      let uri = track.uri;
      if (!uri) {
        uri = await fetchUri(track.title, track.artist);
      }
      if (uri) {
        await executePlay({ uris: [uri] });
      }
    },
    [fetchUri, executePlay]
  );

  const playQueue = useCallback(
    async (tracks: TrackToPlay[], startIndex = 0) => {
      // Resolve URIs in parallel for at least the first few, but it's better to get all if we can.
      // Since it might take long, let's play the first one immediately if possible, then queue.
      // Or just resolve all since it's an API limit thing.
      // For simplicity, we resolve all URIs, filter out nulls, then play.
      const resolvedUris = await Promise.all(
        tracks.map(async (t) => {
          if (t.uri) return t.uri;
          return await fetchUri(t.title, t.artist);
        })
      );

      const validUris = resolvedUris.filter(Boolean) as string[];
      if (validUris.length > 0) {
        // Adjust startIndex if some URIs failed
        // For MVP, just play from the resolved list. If startIndex is specifically requested, it might misalign.
        // Let's just pass all valid URIs.
        if (!deviceId || !token) return;

        await executePlay({
          uris: validUris,
          offset: { position: Math.min(startIndex, validUris.length - 1) },
        });
      }
    },
    [executePlay, fetchUri, deviceId, token]
  );

  const playContext = useCallback(
    async (contextUri: string) => {
      await executePlay({ context_uri: contextUri });
    },
    [executePlay]
  );

  const togglePlay = useCallback(async () => {
    if (player) await player.togglePlay();
  }, [player]);

  const next = useCallback(async () => {
    if (player) await player.nextTrack();
  }, [player]);

  const prev = useCallback(async () => {
    if (player) await player.previousTrack();
  }, [player]);

  const seek = useCallback(
    async (ms: number) => {
      if (player) await player.seek(ms);
    },
    [player]
  );

  const setVolume = useCallback(
    async (volume: number) => {
      if (player) await player.setVolume(volume);
    },
    [player]
  );

  const dismiss = useCallback(async () => {
    if (player) {
      await player.pause();
    }
    setIsActive(false);
    setCurrentTrack(null);
  }, [player]);

  const value = {
    player,
    deviceId,
    isReady,
    isActive,
    currentTrack,
    currentContextUri,
    isPlaying,
    position,
    duration,
    playTrack,
    playQueue,
    playContext,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    dismiss,
  };

  return (
    <SpotifyPlayerContext.Provider value={value}>
      <Script src="https://sdk.scdn.co/spotify-player.js" strategy="afterInteractive" />
      {children}
    </SpotifyPlayerContext.Provider>
  );
}

export function useSpotifyPlayer() {
  const context = useContext(SpotifyPlayerContext);
  if (context === undefined) {
    throw new Error("useSpotifyPlayer must be used within a SpotifyPlayerProvider");
  }
  return context;
}
