import { z } from "zod/v4";

export const MusicItemSchema = z.object({
  title: z.string(),
  artist: z.string(),
  spotifyUri: z.string().optional(),
  reason: z.string(),
  albumArt: z.string().url().optional(),
});

export const MovieItemSchema = z.object({
  title: z.string(),
  year: z.number(),
  tmdbId: z.number(),
  genres: z.array(z.string()),
  reason: z.string(),
  posterPath: z.string().optional(),
  rating: z.number().optional(),
  synopsis: z.string().optional(),
});

export const MusicRecommendationSchema = z.object({
  type: z.literal("music"),
  items: z.array(MusicItemSchema),
});

export const MovieRecommendationSchema = z.object({
  type: z.literal("movie"),
  items: z.array(MovieItemSchema),
});

export const RecommendationSchema = z.discriminatedUnion("type", [
  MusicRecommendationSchema,
  MovieRecommendationSchema,
]);

export type MusicItem = z.infer<typeof MusicItemSchema>;
export type MovieItem = z.infer<typeof MovieItemSchema>;
export type MusicRecommendation = z.infer<typeof MusicRecommendationSchema>;
export type MovieRecommendation = z.infer<typeof MovieRecommendationSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;
