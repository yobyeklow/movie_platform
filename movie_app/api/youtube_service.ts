import { ApiClient } from "./api_service";

interface Video {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    channelId: string;
    channelTitle: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
      standard: { url: string; width: number; height: number };
      maxres: { url: string; width: number; height: number };
    };
  };
  contentDetails: {
    duration: string;
    dimension: string;
    definition: string;
    caption: string;
    licensedContent: boolean;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    dislikeCount: string;
    favoriteCount: string;
    commentCount: string;
  };
}

interface VideoSearchResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: Array<{
    id: {
      kind: string;
      videoId?: string;
    };
    snippet: Video["snippet"];
  }>;
}

interface VideoDetailResponse {
  kind: string;
  etag: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: Video[];
}

class YouTubeService {
  private client: ApiClient;
  private apiKey: string;

  constructor() {

    this.client = new ApiClient({
      baseURL: "https://www.googleapis.com/youtube/v3",
      timeout: 10000,
      enableCache: true,
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
    });

    this.apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "";
  }

  /**
   * Parse YouTube ISO 8601 duration format to seconds
   * Example: "PT1H30M45S" → 5445 seconds
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    const seconds = parseInt(match[3] || "0", 10);

    return hours * 3600 + minutes * 60 + seconds;
  }

  async searchVideos(query: string, maxResults: number = 10): Promise<Video[]> {
    try {
      const response = await this.client.get<VideoSearchResponse>("/search", {
        params: {
          key: this.apiKey,
          part: "snippet",
          q: `${query} movie trailer`,
          type: "video",
          maxResults,
          order: "relevance",
          videoEmbeddable: true,
          videoDuration: "medium",
          videoLicense: "creativeCommon",
        },
        cache: true,
        cacheTTL: ApiClient.CACHE_TTL.LONG, 
      });

      if (response.data?.items) {
        const videoIds = response.data.items
          .map((item) => item.id.videoId)
          .filter(Boolean) as string[];

        if (videoIds.length > 0) {
          const detailedVideos = await this.getVideosByIds(videoIds);
          return detailedVideos;
        }
      }

      return [];
    } catch (error) {
      if (error instanceof Error) {
        console.error("YouTube search error:", error.message);
      }
      return [];
    }
  }


  private async getVideosByIds(videoIds: string[]): Promise<Video[]> {
    try {
      const response = await this.client.get<VideoDetailResponse>("/videos", {
        params: {
          key: this.apiKey,
          part: "snippet,contentDetails,statistics",
          id: videoIds.join(","),
        },
        cache: true,
        cacheTTL: ApiClient.CACHE_TTL.DAY, 
      });

      if (response.data?.items) {
        const videos = response.data.items;
        return videos;
      }

      return [];
    } catch (error) {
      if (error instanceof Error) {
        console.error("YouTube videos fetch error:", error.message);
      }
      return [];
    }
  }


  async getVideoById(videoId: string): Promise<Video | null> {
    try {
      const response = await this.client.get<VideoDetailResponse>("/videos", {
        params: {
          key: this.apiKey,
          part: "snippet,contentDetails,statistics",
          id: videoId,
        },
        cache: true,
        cacheTTL: ApiClient.CACHE_TTL.DAY, 
      });

      if (response.data?.items?.[0]) {
        const video = response.data.items[0];
        return video;
      }

      return null;
    } catch (error) {
      if (error instanceof Error) {
        console.error("YouTube video fetch error:", error.message);
      }
      return null;
    }
  }

  /**
   * Validate a video meets requirements:
   * - Minimum 5 minutes (300 seconds)
   * - Maximum 4 hours (14400 seconds)
   */
  async validateVideo(videoId: string): Promise<boolean> {
    try {
      const video = await this.getVideoById(videoId);

      if (!video) {
        return false;
      }

      const duration = this.parseDuration(video.contentDetails.duration);

      if (duration < 300 || duration > 14400) {
        return false;
      }

      return true;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Video validation error:", error.message);
      }
      return false;
    }
  }


  getEmbedUrl(
    videoId: string,
    options: {
      autoplay?: boolean;
      controls?: boolean;
      showinfo?: boolean;
      modestbranding?: boolean;
      rel?: boolean;
      start?: number;
    } = {}
  ): string {
    const params = new URLSearchParams({
      video_id: videoId,
      enablejsapi: "1",
      autoplay: options.autoplay ? "1" : "0",
      controls: options.controls !== false ? "1" : "0",
      showinfo: options.showinfo !== false ? "1" : "0",
      modestbranding: options.modestbranding !== false ? "1" : "0",
      rel: options.rel !== false ? "1" : "0",
      ...(options.start && { start: options.start.toString() }),
    });

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }


  getThumbnailUrl(
    videoId: string,
    quality: "default" | "medium" | "high" | "standard" | "maxres" = "high"
  ): string {
    const qualityMap = {
      default: "default",
      medium: "mqdefault",
      high: "hqdefault",
      standard: "sddefault",
      maxres: "maxresdefault",
    };

    return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
  }


  async searchTrailers(
    movieTitle: string,
    maxResults: number = 5
  ): Promise<Video[]> {
    const videos = await this.searchVideos(movieTitle, maxResults);

    const filteredVideos = videos.filter((video) => {
      const title = video.snippet.title.toLowerCase();
      return (
        title.includes("trailer") ||
        title.includes("official") ||
        title.includes("movie") ||
        title.includes("film")
      );
    });

    
    const validVideos = await Promise.all(
      filteredVideos.map(async (video) => {
        const isValid = await this.validateVideo(video.id);
        return isValid ? video : null;
      })
    );

    return validVideos.filter(Boolean) as Video[];
  }


  clearCache(): void {
    this.client.clearCache();
  }


  clearCachePattern(pattern: string): number {
    return this.client.invalidateCache(pattern);
  }


  getCacheStats() {
    return this.client.getCacheStats();
  }
}

export default new YouTubeService();
