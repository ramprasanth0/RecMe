export interface GeniusSong {
  id: number;
  title: string;
  full_title: string;
  url: string;
  header_image_url: string;
  song_art_image_url: string;
  primary_artist: {
    id: number;
    name: string;
    image_url: string;
    url: string;
  };
  producer_artists: Array<{
    id: number;
    name: string;
    image_url: string;
  }>;
  writer_artists: Array<{
    id: number;
    name: string;
    image_url: string;
  }>;
  description: {
    html: string;
  };
  release_date_for_display: string;
  media: Array<{
    provider: string;
    url: string;
    native_uri?: string;
  }>;
}

export interface GeniusHit {
  result: {
    id: number;
    title: string;
    full_title: string;
    url: string;
    header_image_url: string;
    song_art_image_thumbnail_url: string;
    primary_artist: {
      name: string;
    };
  };
}
