import axios from "axios";

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
  private instance = axios.create({
    baseURL: "https://api.themoviedb.org/3",
    timeout: 10000,
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
      Accept: "application/json",
    },
  });

  async getPopularMovies(page: number): Promise<Movie[]> {
    try {
      let res = await this.instance.get(`/discover/movie`, {
        params: {
          include_adult: false,
          include_video: false,
          language: "en-US",
          page,
          sort_by: "popularity.desc",
        },
      });
      if (res.status == 200 && res.data?.results) {
        return res.data.results;
      }
      return [];
    } catch (error: any) {
      console.error(error.response?.data?.status_message || error.message);
      return [];
    }
  }
  async getMoviesByGenre(genreId: number, page: number): Promise<Movie[]> {
    try {
      let res = await this.instance.get(`/movie/${genreId}/similar`, {
        params: {
          language: "en-US",
          page,
        },
      });
      if (res.status == 200 && res.data?.results) {
        return res.data.results;
      }
      return [];
    } catch (error: any) {
      console.error(error.response?.data?.status_message || error.message);
      return [];
    }
  }
  async searchMovies(query: string, page: number): Promise<Movie[]> {
    try {
      let res = await this.instance.get(`/search/movie`, {
        params: {
          query,
          page,
        },
      });
      if (res.status == 200 && res.data?.results) {
        return res.data.results;
      }
      return [];
    } catch (error: any) {
      console.error(error.response?.data?.status_message || error.message);
      return [];
    }
  }
  async getMovieDetails(id: number): Promise<MovieDetail | undefined> {
    try {
      let res = await this.instance.get(`/movie/${id}`);
      if (res.status == 200 && res.data) {
        return res.data;
      }
      return undefined;
    } catch (error: any) {
      console.error(error.response?.data?.status_message || error.message);
      return undefined;
    }
  }
  async getMovieVideos(id: number): Promise<Video[]> {
    try {
      let res = await this.instance.get(`/movie/${id}/videos`);
      if (res.status == 200 && res.data?.results) {
        return res.data.results;
      }
      return [];
    } catch (error: any) {
      console.error(error.response?.data?.status_message || error.message);
      return [];
    }
  }
  async getGenres(): Promise<Genre[]> {
    try {
      let res = await this.instance.get(`/genre/movie/list`);
      if (res.status == 200 && res.data?.genres) {
        return res.data.genres;
      }
      return [];
    } catch (error: any) {
      console.error(error.response?.data?.status_message || error.message);
      return [];
    }
  }
}
export default new TMDBService();