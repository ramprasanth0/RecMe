declare namespace Spotify {
  interface PlayerInit {
    name: string;
    getOAuthToken: (cb: (token: string) => void) => void;
    volume?: number;
  }

  interface Player {
    connect(): Promise<boolean>;
    disconnect(): void;
    addListener(event: "ready" | "not_ready", cb: (state: { device_id: string }) => void): void;
    addListener(event: "player_state_changed", cb: (state: WebPlaybackState | null) => void): void;
    addListener(event: "initialization_error" | "authentication_error" | "account_error" | "playback_error", cb: (err: { message: string }) => void): void;
    removeListener(event: string, cb?: (...args: unknown[]) => void): void;
    getCurrentState(): Promise<WebPlaybackState | null>;
    setName(name: string): Promise<void>;
    getVolume(): Promise<number>;
    setVolume(volume: number): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    togglePlay(): Promise<void>;
    seek(position_ms: number): Promise<void>;
    previousTrack(): Promise<void>;
    nextTrack(): Promise<void>;
    activateElement(): Promise<void>;
  }

  interface WebPlaybackState {
    context: {
      uri: string | null;
      metadata: Record<string, unknown> | null;
    };
    disallows: {
      resuming?: boolean;
      skipping_prev?: boolean;
      peeking_prev?: boolean;
      skipping_next?: boolean;
      peeking_next?: boolean;
      toggling_repeat_context?: boolean;
      toggling_repeat_track?: boolean;
      toggling_shuffle?: boolean;
      seeking?: boolean;
    };
    paused: boolean;
    position: number;
    duration: number;
    track_window: {
      current_track: WebPlaybackTrack;
      previous_tracks: WebPlaybackTrack[];
      next_tracks: WebPlaybackTrack[];
    };
  }

  interface WebPlaybackTrack {
    uri: string;
    id: string | null;
    type: "track" | "episode" | "ad";
    media_type: "audio" | "video";
    name: string;
    is_playable: boolean;
    album: {
      uri: string;
      name: string;
      images: { url: string; width: number; height: number }[];
    };
    artists: { uri: string; name: string }[];
  }
}

interface Window {
  onSpotifyWebPlaybackSDKReady: () => void;
  Spotify: {
    Player: new (options: Spotify.PlayerInit) => Spotify.Player;
  };
}
