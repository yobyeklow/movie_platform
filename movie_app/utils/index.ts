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

export {connection} from "./connection"