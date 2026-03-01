import type { Genre, Movie } from "@/components/movie/types";
import { useCallback, useEffect, useState } from "react";
import tmdb_service from "@/api/tmdb_service";
import TransformMovie from "@/utils/TransformMovie";

export function useTrending() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [timeWindow, setTimeWindow] = useState<"day" | "week">("day");

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [genreList, movieList] = await Promise.all([
          tmdb_service.getGenres(),
          tmdb_service.getTrendingMovies(timeWindow, 1),
        ]);
        setGenres(genreList);
        setMovies(movieList.map(TransformMovie));
        setCurrentPage(1);
      } catch (error) {
        setError("Failed to fetch trending movies");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [timeWindow]);

  const refreshTrending = useCallback(
    async (page: number = 1, window?: "day" | "week") => {
      setLoading(true);
      setError(null);
      try {
        const result = await tmdb_service.getTrendingMovies(
          window || timeWindow,
          page
        );
        setMovies(result.map(TransformMovie));
        setCurrentPage(page);
        if (window) {
          setTimeWindow(window);
        }
      } catch (error) {
        setError("Failed to fetch trending movies");
      } finally {
        setLoading(false);
      }
    },
    [timeWindow]
  );

  const switchTimeWindow = useCallback(
    (window: "day" | "week") => {
      setTimeWindow(window);
    },
    []
  );

  return {
    movies,
    genres,
    loading,
    error,
    currentPage,
    timeWindow,
    refreshTrending,
    switchTimeWindow,
  };
}
