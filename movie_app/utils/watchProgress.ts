/**
 * Watch Progress Utilities
 * Manages watch progress and history for video playback tracking
 */

import type { MovieDetail } from "@/components/movie/types";

// Storage keys
const WATCH_PROGRESS_KEY = "watch_progress";
const WATCH_HISTORY_KEY = "watch_history";
const WATCH_PROGRESS_EXPIRY_DAYS = 30; // Clear progress after 30 days
const WATCH_HISTORY_MAX_ITEMS = 20; // Keep last 20 watched movies

/**
 * Watch progress entry
 */
export interface WatchProgressEntry {
  timestamp: number;
  savedAt: number;
}

/**
 * Watch history item
 */
export interface WatchHistoryItem {
  movieId: number;
  title: string;
  posterPath: string;
  timestamp: number;
}

/**
 * Watch progress storage structure
 */
export interface WatchProgressStorage {
  [movieId: string]: WatchProgressEntry;
}

/**
 * Save watch progress to localStorage
 * @param movieId - The movie ID
 * @param timestamp - Current playback position in seconds
 */
export const saveWatchProgress = (movieId: number, timestamp: number): void => {
  const progress: WatchProgressStorage = JSON.parse(
    localStorage.getItem(WATCH_PROGRESS_KEY) || "{}"
  );

  progress[movieId.toString()] = {
    timestamp,
    savedAt: Date.now(),
  };

  localStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(progress));
};

/**
 * Get watch progress from localStorage
 * @param movieId - The movie ID
 * @returns Playback position in seconds, or 0 if not found or expired
 */
export const getWatchProgress = (movieId: number): number => {
  const progress: WatchProgressStorage = JSON.parse(
    localStorage.getItem(WATCH_PROGRESS_KEY) || "{}"
  );

  const item = progress[movieId.toString()];

  if (!item) {
    return 0;
  }

  // Clear if older than expiry days
  const ageMs = Date.now() - item.savedAt;
  const expiryMs = WATCH_PROGRESS_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

  if (ageMs > expiryMs) {
    delete progress[movieId.toString()];
    localStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(progress));
    return 0;
  }

  return item.timestamp;
};

/**
 * Add movie to watch history
 * @param movie - Movie details to add to history
 */
export const addToWatchHistory = (movie: MovieDetail): void => {
  const history: WatchHistoryItem[] = JSON.parse(
    localStorage.getItem(WATCH_HISTORY_KEY) || "[]"
  );

  const newItem: WatchHistoryItem = {
    movieId: movie.id,
    title: movie.title,
    posterPath: movie.posterPath,
    timestamp: Date.now(),
  };

  // Remove existing entry with same movieId and add new item to front
  const filtered = history.filter((h) => h.movieId !== movie.id);
  const updated = [newItem, ...filtered].slice(0, WATCH_HISTORY_MAX_ITEMS);

  localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(updated));
};

/**
 * Get watch history from localStorage
 * @returns Array of watch history items, sorted by timestamp (newest first)
 */
export const getWatchHistory = (): WatchHistoryItem[] => {
  const history: WatchHistoryItem[] = JSON.parse(
    localStorage.getItem(WATCH_HISTORY_KEY) || "[]"
  );

  // Sort by timestamp descending (newest first)
  return history.sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * Remove movie from watch history
 * @param movieId - The movie ID to remove
 */
export const removeFromWatchHistory = (movieId: number): void => {
  const history: WatchHistoryItem[] = JSON.parse(
    localStorage.getItem(WATCH_HISTORY_KEY) || "[]"
  );

  const filtered = history.filter((h) => h.movieId !== movieId);
  localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(filtered));
};

/**
 * Clear specific movie's watch progress
 * @param movieId - The movie ID to clear progress for
 */
export const clearWatchProgress = (movieId: number): void => {
  const progress: WatchProgressStorage = JSON.parse(
    localStorage.getItem(WATCH_PROGRESS_KEY) || "{}"
  );

  delete progress[movieId.toString()];
  localStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(progress));
};

/**
 * Clear all watch progress data
 */
export const clearAllWatchProgress = (): void => {
  localStorage.removeItem(WATCH_PROGRESS_KEY);
};

/**
 * Clear all watch history data
 */
export const clearWatchHistory = (): void => {
  localStorage.removeItem(WATCH_HISTORY_KEY);
};

/**
 * Get watch progress for all movies
 * @returns Object with movie IDs as keys and timestamps as values
 */
export const getAllWatchProgress = (): WatchProgressStorage => {
  return JSON.parse(localStorage.getItem(WATCH_PROGRESS_KEY) || "{}");
};

/**
 * Clean expired watch progress entries (older than expiry days)
 * @returns Number of entries cleaned
 */
export const cleanExpiredProgress = (): number => {
  const progress: WatchProgressStorage = JSON.parse(
    localStorage.getItem(WATCH_PROGRESS_KEY) || "{}"
  );

  const now = Date.now();
  const expiryMs = WATCH_PROGRESS_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  let cleanedCount = 0;

  for (const [movieId, entry] of Object.entries(progress)) {
    if (now - entry.savedAt > expiryMs) {
      delete progress[movieId];
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    localStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(progress));
  }

  return cleanedCount;
};
