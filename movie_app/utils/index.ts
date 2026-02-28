/**
 * Utils Index
 * Central export point for all utility functions
 */

// Watch progress utilities
export {
  saveWatchProgress,
  getWatchProgress,
  addToWatchHistory,
  getWatchHistory,
  removeFromWatchHistory,
  clearWatchProgress,
  clearAllWatchProgress,
  clearWatchHistory,
  getAllWatchProgress,
  cleanExpiredProgress,
  type WatchProgressEntry,
  type WatchHistoryItem,
  type WatchProgressStorage,
} from "./watchProgress";

// Video debug utilities
export {
  isValidYouTubeVideoId,
  getYouTubeEmbedUrl,
  getYouTubeWatchUrl,
  debugVideoData,
  isVideoEmbeddable,
  getTestVideoId,
  isYouTubeApiLoaded,
  waitForYouTubeApi,
} from "./videoDebug";
