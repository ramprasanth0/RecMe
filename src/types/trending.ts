export interface TrendingSong {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  albumArt: string | null;
  spotifyUrl: string;
}

export interface TrendingPlaylist {
  id: string;
  name: string;
  imageUrl: string | null;
  spotifyUrl: string;
  trackCount: number;
  description?: string;
}

export interface TrendingMovie {
  tmdbId: number;
  title: string;
  year: number;
  posterPath: string | null;
  rating: number | null;
}
