import { ApiClient } from "./api_service";

interface Movie {
  adult: Boolean;
  backdrop_path: String;
  genre_ids: Number[];
  id: Number;
  original_language: String;
  original_title: String;
  overview: String;
  popularity: Number;
  poster_path: String;
  release_date: String;
  title: String;
  video: Boolean;
  vote_average: Number;
  vote_count: Number;
}

interface MovieDetail {
  adult: boolean;
  backdrop_path: string;
  belongs_to_collection: any;
  budget: number;
  genres: Genre[];
  homepage: string;
  id: number;
  imdb_id: string;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string;
  production_companies: ProductionCompany[];
  production_countries: ProductionCountry[];
  release_date: string;
  revenue: number;
  runtime: number;
  spoken_languages: SpokenLanguage[];
  status: string;
  tagline: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

interface Genre {
  id: number;
  name: string;
}

interface ProductionCompany {
  id: number;
  logo_path?: string;
  name: string;
  origin_country: string;
}

interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

interface SpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

interface Video {
  iso_639_1: string;
  iso_3166_1: string;
  name: string;
  key: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
  id: string;
}

class TMDBService {
  private client: ApiClient;

  constructor() {
    this.client = new ApiClient({
      baseURL: "https://api.themoviedb.org/3",
      timeout: 10000,
      enableCache: true,
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
    });

    this.client.setAuthToken(
      process.env.NEXT_PUBLIC_TMDB_API_KEY || "",
      "Bearer"
    );
  }

  async getPopularMovies(page: number): Promise<Movie[]> {
    const response = await this.client.get<any>(`/discover/movie`, {
      params: {
        include_adult: false,
        include_video: false,
        language: "en-US",
        page,
        sort_by: "popularity.desc",
      },
      cache: true,
      cacheTTL: ApiClient.CACHE_TTL.MEDIUM, 
    });

    if (response.data?.results) {
      return response.data.results;
    }

    if (response.error) {
      console.error(`TMDB Error: ${response.error.message}`);
    }

    return [];
  }

  async getMoviesByGenre(genreId: number, page: number): Promise<Movie[]> {
    const response = await this.client.get<any>(`/movie/${genreId}/similar`, {
      params: {
        language: "en-US",
        page,
      },
      cache: true,
      cacheTTL: ApiClient.CACHE_TTL.MEDIUM,
    });

    if (response.data?.results) {
      return response.data.results;
    }

    if (response.error) {
      console.error(`TMDB Error: ${response.error.message}`);
    }

    return [];
  }

  async searchMovies(query: string, page: number): Promise<Movie[]> {
    const response = await this.client.get<any>(`/search/movie`, {
      params: {
        query,
        page,
      },
      cache: true,
      cacheTTL: ApiClient.CACHE_TTL.SHORT, 
    });

    if (response.data?.results) {
      return response.data.results;
    }

    if (response.error) {
      console.error(`TMDB Error: ${response.error.message}`);
    }

    return [];
  }

  async getMovieDetails(id: number): Promise<MovieDetail | undefined> {
    const response = await this.client.get<MovieDetail>(`/movie/${id}`, {
      cache: true,
      cacheTTL: ApiClient.CACHE_TTL.VERY_LONG, 
    });

    if (response.data) {
      return response.data;
    }

    if (response.error) {
      console.error(`TMDB Error: ${response.error.message}`);
    }

    return undefined;
  }

  async getMovieVideos(id: number): Promise<Video[]> {
    const response = await this.client.get<any>(`/movie/${id}/videos`, {
      cache: true,
      cacheTTL: ApiClient.CACHE_TTL.LONG, 
    });

    if (response.data?.results) {
      return response.data.results;
    }

    if (response.error) {
      console.error(`TMDB Error: ${response.error.message}`);
    }

    return [];
  }

  async getGenres(): Promise<Genre[]> {
    const response = await this.client.get<any>(`/genre/movie/list`, {
      cache: true,
      cacheTTL: ApiClient.CACHE_TTL.DAY, 
    });

    if (response.data?.genres) {
      return response.data.genres;
    }

    if (response.error) {
      console.error(`TMDB Error: ${response.error.message}`);
    }

    return [];
  }


  clearCache(): void {
    this.client.clearCache();
  }


  invalidateCache(pattern: string): number {
    return this.client.invalidateCache(pattern);
  }

  getCacheStats() {
    return this.client.getCacheStats();
  }
}

export default new TMDBService();
