import axios from "axios";

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
  private instance = axios.create({
    baseURL: "https://www.googleapis.com/youtube/v3",
    timeout: 10000,
    headers: {
      Accept: "application/json",
    },
  });

  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 3600000;

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    const seconds = parseInt(match[3] || "0", 10);

    return hours * 3600 + minutes * 60 + seconds;
  }

  async searchVideos(query: string, maxResults: number = 10): Promise<Video[]> {
    const cacheKey = `search:${query}:${maxResults}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const res = await this.instance.get<VideoSearchResponse>("/search", {
        params: {
          key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
          part: "snippet",
          q: `${query} movie trailer`,
          type: "video",
          maxResults,
          order: "relevance",
          videoEmbeddable: true,
          videoDuration: "medium",
          videoLicense: "creativeCommon",
        },
      });

      if (res.status === 200 && res.data?.items) {
        const videoIds = res.data.items
          .map((item) => item.id.videoId)
          .filter(Boolean) as string[];

        if (videoIds.length > 0) {
          const detailedVideos = await this.getVideosByIds(videoIds);
          this.setCache(cacheKey, detailedVideos);
          return detailedVideos;
        }
      }

      return [];
    } catch (error: any) {
      console.error(
        "YouTube search error:",
        error.response?.data?.error?.message || error.message
      );
      return [];
    }
  }

  private async getVideosByIds(videoIds: string[]): Promise<Video[]> {
    const cacheKey = `videos:${videoIds.join(",")}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const res = await this.instance.get<VideoDetailResponse>("/videos", {
        params: {
          key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
          part: "snippet,contentDetails,statistics",
          id: videoIds.join(","),
        },
      });

      if (res.status === 200 && res.data?.items) {
        const videos = res.data.items;
        this.setCache(cacheKey, videos);
        return videos;
      }

      return [];
    } catch (error: any) {
      console.error(
        "YouTube videos fetch error:",
        error.response?.data?.error?.message || error.message
      );
      return [];
    }
  }

  async getVideoById(videoId: string): Promise<Video | null> {
    const cacheKey = `video:${videoId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const res = await this.instance.get<VideoDetailResponse>("/videos", {
        params: {
          key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
          part: "snippet,contentDetails,statistics",
          id: videoId,
        },
      });

      if (res.status === 200 && res.data?.items?.[0]) {
        const video = res.data.items[0];
        this.setCache(cacheKey, video);
        return video;
      }

      return null;
    } catch (error: any) {
      console.error(
        "YouTube video fetch error:",
        error.response?.data?.error?.message || error.message
      );
      return null;
    }
  }

  async validateVideo(videoId: string): Promise<boolean> {
    try {
      const video = await this.getVideoById(videoId);

      if (!video) {
        return false;
      }

      const duration = this.parseDuration(video.contentDetails.duration);

      if (duration < 300) {
        return false;
      }

      if (duration > 14400) {
        return false;
      }

      return true;
    } catch (error: any) {
      console.error("Video validation error:", error.message);
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
    this.cache.clear();
  }

  clearCachePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export default new YouTubeService();
