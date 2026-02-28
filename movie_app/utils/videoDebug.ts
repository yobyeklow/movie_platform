/**
 * Video Debug Utilities
 * Helper functions to debug video playback issues
 */

import type { Video } from "@/components/movie/types";

/**
 * Validate if a YouTube video ID is properly formatted
 * YouTube video IDs are typically 11 characters (alphanumeric, dash, underscore)
 */
export const isValidYouTubeVideoId = (videoId: string | undefined | null): boolean => {
  if (!videoId) return false;
  // YouTube video IDs are usually 11 characters, but can vary
  // Pattern: alphanumeric with possible dashes and underscores
  const pattern = /^[a-zA-Z0-9_-]{10,12}$/;
  return pattern.test(videoId);
};

/**
 * Get a YouTube embed URL for testing
 */
export const getYouTubeEmbedUrl = (videoId: string, startTime = 0): string => {
  return `https://www.youtube.com/embed/${videoId}?start=${startTime}&autoplay=0&rel=0&modestbranding=1`;
};

/**
 * Get a YouTube watch URL (regular page) for testing
 */
export const getYouTubeWatchUrl = (videoId: string): string => {
  return `https://www.youtube.com/watch?v=${videoId}`;
};

/**
 * Debug video data from TMDb
 */
export const debugVideoData = (videos: Video[] | undefined): void => {
  if (!videos || videos.length === 0) {
    console.log("No videos available");
    return;
  }

  console.log(`=== Video Data Debug ===`);
  console.log(`Total videos: ${videos.length}`);
  console.log(`YouTube videos: ${videos.filter((v) => v.site === "YouTube").length}`);
  console.log(`Official videos: ${videos.filter((v) => v.official).length}`);
  console.log(`Trailer videos: ${videos.filter((v) => v.type === "Trailer").length}`);

  console.log("\n--- All Videos ---");
  videos.forEach((video, index) => {
    console.log(`${index + 1}. ${video.name}`);
    console.log(`   Site: ${video.site}`);
    console.log(`   Type: ${video.type}`);
    console.log(`   Official: ${video.official}`);
    console.log(`   Key (Video ID): ${video.key}`);
    console.log(`   Valid ID: ${isValidYouTubeVideoId(video.key) ? "✓" : "✗"}`);
    console.log(`   Embed URL: ${getYouTubeEmbedUrl(video.key)}`);
    console.log(`   Watch URL: ${getYouTubeWatchUrl(video.key)}`);
  });

  console.log("\n--- Recommended (Official Trailers) ---");
  const officialTrailers = videos
    .filter((v) => v.site === "YouTube" && v.type === "Trailer" && v.official)
    .slice(0, 3);

  if (officialTrailers.length === 0) {
    console.log("No official trailers found");
  } else {
    officialTrailers.forEach((video, index) => {
      console.log(`${index + 1}. ${video.name}`);
      console.log(`   Video ID: ${video.key}`);
      console.log(`   URL: ${getYouTubeWatchUrl(video.key)}`);
    });
  }

  console.log("=====================\n");
};

/**
 * Test if a YouTube video is embeddable
 * Note: This can only be fully verified by actually trying to embed it,
 * as YouTube doesn't provide a public API to check embed permission before loading.
 */
export const isVideoEmbeddable = async (videoId: string): Promise<boolean> => {
  // YouTube doesn't provide a direct API to check embed permission
  // The player will throw error code 101 or 150 if not embeddable
  // This is a placeholder for future implementation
  console.log(`Checking embeddability for video ID: ${videoId}`);
  console.log("Note: Embed permission can only be verified by actually loading the video");
  return true;
};

/**
 * Get a test video ID that is known to work
 */
export const getTestVideoId = (): string => {
  // Rick Astley - Never Gonna Give You Up (official, embeddable)
  return "dQw4w9WgXcQ";
};

/**
 * Test if the YouTube IFrame API is loaded
 */
export const isYouTubeApiLoaded = (): boolean => {
  return typeof window !== "undefined" && (window as any).YT !== undefined;
};

/**
 * Wait for YouTube API to load (with timeout)
 */
export const waitForYouTubeApi = (timeoutMs = 10000): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isYouTubeApiLoaded()) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      reject(new Error("YouTube API failed to load within timeout"));
    }, timeoutMs);

    const checkInterval = setInterval(() => {
      if (isYouTubeApiLoaded()) {
        clearTimeout(timeout);
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);
  });
};
