"use client";

import React from "react";
import Image from "next/image";
import type { Movie, Genre } from "./types";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
const TMDB_POSTER_SIZE = "w500";

interface MovieCardProps {
  movie: Movie;
  genres?: Genre[];
  onClick?: () => void;
  showYear?: boolean;
  showRating?: boolean;
  showGenre?: boolean;
  index?: number; 
}

const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  genres = [],
  onClick,
  showYear = true,
  showRating = true,
  showGenre = true,
  index = 0,
}) => {

  const getYear = (date: string): string => {
    if (!date) return "";
    return date.split("-")[0];
  };

  const getMovieGenres = (): string[] => {
    return movie.genreIds
      .map((genreId) => {
        const genre = genres.find((g) => g.id === genreId);
        return genre?.name || "";
      })
      .filter(Boolean);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "text-[#cfff04]";
    if (rating >= 6) return "text-[#ff6b35]";
    return "text-[#e5e5e5]";
  };

  const animationDelay = `${index * 0.1}s`;

  return (
    <button
      onClick={onClick}
      className={`movie-card brutal-border bg-[#0a0a0a] group relative overflow-hidden animate-stagger cursor-pointer`}
      style={{ animationDelay }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
      <div className="relative aspect-[2/3] overflow-hidden bg-[#111] img-noise">
        {movie.posterPath ? (
          <>
            <Image
              src={`${TMDB_IMAGE_BASE_URL}/${TMDB_POSTER_SIZE}${movie.posterPath}`}
              alt={movie.title}
              fill
              className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-[#e5e5e5]/20">
            <span className="font-display text-2xl">NO_POSTER</span>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="px-6 py-3 brutal-border bg-[#ff6b35] text-black font-mono text-xs font-bold tracking-wider">
            VIEW
          </div>
        </div>

        {movie.popularity > 20 && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-[#cfff04] text-black font-mono text-[9px] font-bold tracking-wider">
            TRENDING
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-display font-bold text-sm text-white mb-2 leading-tight line-clamp-2 group-hover:text-[#ff6b35] transition-colors">
          {movie.title}
        </h3>
        <div className="flex items-center justify-between mb-2">
          {showYear && movie.releaseDate && (
            <span className="font-mono text-[10px] text-[#e5e5e5]/40">
              {getYear(movie.releaseDate)}
            </span>
          )}

          {showRating && (
            <div className={`flex items-center gap-1 ${getRatingColor(movie.rating)}`}>
              <span className="text-base">★</span>
              <span className="font-display font-bold text-base">
                {movie.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {showGenre && getMovieGenres().length > 0 && (
          <div className="flex flex-wrap gap-1">
            {getMovieGenres().slice(0, 2).map((genre) => (
              <span
                key={genre}
                className="px-2 py-0.5 font-mono text-[9px] bg-[#111] text-[#e5e5e5]/60 border border-[#222] hover:border-[#00d9ff] hover:text-[#00d9ff] transition-colors"
              >
                {genre.toUpperCase()}
              </span>
            ))}
          </div>
        )}

        {movie.popularity > 0 && (
          <div className="mt-3 pt-2 border-t border-[#222]">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-[#222] overflow-hidden">
                <div
                  className="h-full bg-[#ff6b35]"
                  style={{ width: `${Math.min(movie.popularity, 100)}%` }}
                />
              </div>
              <span className="font-mono text-[9px] text-[#e5e5e5]/40">
                {movie.popularity.toFixed(1)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="absolute -bottom-1 -right-1 w-8 h-8 border-l-2 border-t-2 border-[#ff6b35] opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};

export default MovieCard;
