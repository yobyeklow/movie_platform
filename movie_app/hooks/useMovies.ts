import type { Genre, Movie } from "@/components/movie/types";
import { useCallback, useEffect, useState } from "react";
import tmdb_service from "@/api/tmdb_service";
import TransformMovie from "@/utils/TransformMovie";

export function useMovies(){
    const [movies,setMovies] = useState<Movie[]>([]);
    const [genres,setGenres] = useState<Genre[]>([]);
    const [loading,setLoading] = useState(false);
    const [error,setError] = useState<string|null>(null);
    const [currentPage,setCurrentPage] = useState(1);

    useEffect(()=>{
        const fetchInitialData = async()=>{
            const [genreList,movieList] = await Promise.all([
                tmdb_service.getGenres(),
                tmdb_service.getPopularMovies(1)
            ])
            setGenres(genreList)
            setMovies(movieList.map(TransformMovie));
            setCurrentPage(1);
        }
        fetchInitialData();
    },[])

    const refreshMovie = useCallback(async(page:number = 1)=>{
        setLoading(true);
        setError(null);
        try {
            const result = await tmdb_service.getPopularMovies(page);
            setMovies(result.map(TransformMovie));
            setCurrentPage(page);
        } catch (error) {
            setError("Failed to fetch movies");
        }finally{
            setLoading(false);
        }
    },[])

    const searchMovies = useCallback(async (query:string,page:number)=>{
        setLoading(true);
        setError(null);
        try {
            const result = await tmdb_service.searchMovies(query,page);
            setMovies(result.map(TransformMovie));
            setCurrentPage(page);
        } catch (error) {
            setError("Search Movie Failed");
        }finally{
            setLoading(false);
        }
    },[])

    const filterByGenres = useCallback(async (genresId:number,page:number)=>{
        setLoading(true);
        setError(null);
        try {
            const result = await tmdb_service.getMoviesByGenre(genresId,page);
            setMovies(result.map(TransformMovie));
            setCurrentPage(page);
        } catch (error) {
            setError("Failed to filter genres!")
        }finally{
            setLoading(false);
        }
    },[])

    const clearCache = useCallback(()=>{
        tmdb_service.clearCache()
    },[])
    return {
        movies,
        genres,
        loading,
        error,
        currentPage,
        refreshMovie,
        filterByGenres,
        searchMovies,
        clearCache
    }
}

