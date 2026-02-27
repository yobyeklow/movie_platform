import React from "react";

interface Movie {
  id: number;
  title: string;
  year: number;
  rating: number;
  genre: string;
  duration: string;
  price: string;
  image: string;
  description: string;
}

interface CatalogProps {
  movies: Movie[];
}

export default function Catalog({ movies: paginatedMovies }: CatalogProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {paginatedMovies.map((movie, index) => (
        <div
          key={movie.id}
          className="movie-card brutal-border bg-[#0a0a0a] group animate-stagger"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="relative aspect-[2/3] overflow-hidden">
            <img
              src={movie.image}
              alt={movie.title}
              className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 img-noise"
            />

            <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start">
              <span className="font-mono text-[9px] px-2 py-1 bg-[#ff6b35] text-black font-bold tracking-wider">
                {movie.genre}
              </span>
              <span className="font-mono text-[9px] px-2 py-1 bg-black/80 border border-[#cfff04] text-[#cfff04] tracking-wider">
                {movie.price}
              </span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent">
              <h4 className="font-display font-black text-lg mb-2 text-white tracking-tight">
                {movie.title}
              </h4>
              <p className="font-mono text-[10px] text-[#e5e5e5]/60 mb-3 line-clamp-2 leading-relaxed">
                {movie.description}
              </p>
              <div className="flex items-center justify-between font-mono text-[9px] text-[#e5e5e5]/40 tracking-wider">
                <span>{movie.year}</span>
                <span>{movie.duration}</span>
                <span className="text-[#cfff04]">★ {movie.rating}</span>
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60">
              <button className="btn-brutal px-6 py-3 font-display font-bold text-xs tracking-wider text-white transform translate-y-4 group-hover:translate-y-0 transition-transform">
                WATCH NOW
              </button>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#222] overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#ff6b35] via-[#00d9ff] to-[#cfff04] w-0 group-hover:w-full transition-all duration-500" />
          </div>
        </div>
      ))}
    </div>
  );
}
