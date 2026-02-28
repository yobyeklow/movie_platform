import type { Movie } from "@/components/movie/types";
export default function TransformMovie(apiMovie:any):Movie{
    return {
        id: apiMovie.id,
        title: apiMovie.title,
        originalTitle: apiMovie.original_title,
        overview: apiMovie.overview||"",
        posterPath: apiMovie.poster_path||"",
        backdropPath: apiMovie.backdrop_path|| "",  
        releaseDate: apiMovie.release_date || "",
        rating: apiMovie.vote_average || 0,
        voteCount: apiMovie.vote_count || 0,
        genreIds: apiMovie.genre_ids || [],
        popularity: apiMovie.popularity || 0,
        adult: apiMovie.adult || false,
    }
}