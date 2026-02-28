"use client";

import React, { useState, useEffect } from "react";
import MovieCard from "./MovieCard";
import type { Movie, Genre } from "./types";

interface MovieCatalogProps {
  movies: Movie[];
  genres?: Genre[];
  initialPage?: number;
  itemsPerPage?: number;
  showFilters?: boolean;
  showSearch?: boolean;
  showPagination?: boolean;
  onMovieClick?: (movie: Movie) => void;
  onPageChange?: (page: number) => void;
  onFilterChange?: (filter: string) => void;
  onSearch?: (query: string) => void;
  loading?: boolean;
  emptyMessage?: string;
}

const MovieCatalog: React.FC<MovieCatalogProps> = ({
  movies,
  genres = [],
  initialPage = 1,
  itemsPerPage = 6,
  showFilters = true,
  showSearch = true,
  showPagination = true,
  onMovieClick,
  onPageChange,
  onFilterChange,
  onSearch,
  loading = false,
  emptyMessage = "// NO_RESULTS_FOUND",
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const availableGenreIds = Array.from(
    new Set(movies.flatMap((movie) => movie.genreIds))
  );

  const availableGenres = [
    { id: 0, name: "ALL" },
    ...availableGenreIds
      .map((id) => genres.find((g) => g.id === id))
      .filter(Boolean) as Genre[],
  ];

  const filteredMovies = movies.filter((movie) => {
    const matchesCategory =
      selectedCategory === "ALL" ||
      movie.genreIds.includes(parseInt(selectedCategory));
    const matchesSearch =
      searchQuery === "" ||
      movie.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);
  const paginatedMovies = filteredMovies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    onPageChange?.(page);
  };

  const handleCategoryChange = (category: string | number) => {
    setSelectedCategory(String(category));
    onFilterChange?.(String(category));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <div className="w-full">
      {(showFilters || showSearch) && (
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
          <div>
            <h3 className="font-display font-black text-2xl lg:text-3xl mb-2 text-white">
              CATALOG
            </h3>
            <p className="font-mono text-xs text-[#e5e5e5]/40 tracking-wider">
              {filteredMovies.length} {filteredMovies.length === 1 ? "RESULT" : "RESULTS"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {showFilters && availableGenres.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {availableGenres.slice(0, 8).map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => handleCategoryChange(genre.id)}
                    className={`px-4 py-2 font-mono text-[10px] tracking-wider brutal-border transition-all ${
                      selectedCategory === String(genre.id)
                        ? "bg-[#ff6b35] text-black border-[#ff6b35]"
                        : "bg-transparent text-[#e5e5e5]/60 border-[#222] hover:border-[#00d9ff] hover:text-white"
                    }`}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            )}

            {showSearch && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="SEARCH_DB..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-48 px-4 py-2 font-mono text-xs bg-transparent border-2 border-[#222] text-white placeholder-[#e5e5e5]/20 focus:outline-none focus:border-[#ff6b35] transition-colors tracking-wider"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#e5e5e5]/40 hover:text-[#ff6b35] text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: itemsPerPage }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="brutal-border bg-[#0a0a0a] overflow-hidden animate-pulse"
            >
              <div className="aspect-[2/3] bg-[#111]" />
              <div className="p-4">
                <div className="h-4 bg-[#222] mb-2 w-3/4" />
                <div className="h-3 bg-[#111] w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredMovies.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-[#222] brutal-border bg-[#0a0a0a]">
          <div className="font-display font-black text-4xl text-[#e5e5e5]/20 mb-4">
            NO_RESULTS
          </div>
          <p className="font-mono text-sm text-[#e5e5e5]/40 tracking-wider">
            {emptyMessage}
          </p>
        </div>
      )}

      {!loading && paginatedMovies.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedMovies.map((movie, index) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                genres={genres}
                onClick={() => onMovieClick?.(movie)}
                index={index}
              />
            ))}
          </div>

          {showPagination && totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-6 py-3 font-mono text-xs tracking-wider brutal-border transition-all ${
                  currentPage === 1
                    ? "bg-transparent text-[#e5e5e5]/20 border-[#222] cursor-not-allowed"
                    : "bg-[#0a0a0a] text-white border-[#222] hover:border-[#ff6b35] hover:text-[#ff6b35]"
                }`}
              >
                ◄ PREV
              </button>

              <div className="flex items-center gap-2">
                {(() => {
                  const pages = [];
                  const maxVisible = 5;
                  let startPage = Math.max(
                    1,
                    currentPage - Math.floor(maxVisible / 2)
                  );
                  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

                  if (endPage - startPage < maxVisible - 1) {
                    startPage = Math.max(1, endPage - maxVisible + 1);
                  }

                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(i);
                  }

                  return (
                    <>
                      {startPage > 1 && (
                        <>
                          <button
                            onClick={() => handlePageChange(1)}
                            className={`w-10 h-10 font-mono text-xs tracking-wider brutal-border transition-all ${
                              currentPage === 1
                                ? "bg-[#ff6b35] text-black border-[#ff6b35]"
                                : "bg-[#0a0a0a] text-[#e5e5e5]/60 border-[#222] hover:border-[#00d9ff] hover:text-white"
                            }`}
                          >
                            1
                          </button>
                          {startPage > 2 && (
                            <span className="w-10 h-10 font-mono text-xs tracking-wider text-[#e5e5e5]/40 flex items-center justify-center">
                              ...
                            </span>
                          )}
                        </>
                      )}

                      {pages.map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-10 h-10 font-mono text-xs tracking-wider brutal-border transition-all ${
                            currentPage === page
                              ? "bg-[#ff6b35] text-black border-[#ff6b35]"
                              : "bg-[#0a0a0a] text-[#e5e5e5]/60 border-[#222] hover:border-[#00d9ff] hover:text-white"
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      {endPage < totalPages && (
                        <>
                          {endPage < totalPages - 1 && (
                            <span className="w-10 h-10 font-mono text-xs tracking-wider text-[#e5e5e5]/40 flex items-center justify-center">
                              ...
                            </span>
                          )}
                          <button
                            onClick={() => handlePageChange(totalPages)}
                            className={`w-10 h-10 font-mono text-xs tracking-wider brutal-border transition-all ${
                              currentPage === totalPages
                                ? "bg-[#ff6b35] text-black border-[#ff6b35]"
                                : "bg-[#0a0a0a] text-[#e5e5e5]/60 border-[#222] hover:border-[#00d9ff] hover:text-white"
                            }`}
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-6 py-3 font-mono text-xs tracking-wider brutal-border transition-all ${
                  currentPage === totalPages
                    ? "bg-transparent text-[#e5e5e5]/20 border-[#222] cursor-not-allowed"
                    : "bg-[#0a0a0a] text-white border-[#222] hover:border-[#ff6b35] hover:text-[#ff6b35]"
                }`}
              >
                NEXT ►
              </button>
            </div>
          )}

          <div className="mt-6 text-center font-mono text-[10px] text-[#e5e5e5]/30 tracking-wider">
            SHOWING {((currentPage - 1) * itemsPerPage) + 1}-
            {Math.min(currentPage * itemsPerPage, filteredMovies.length)} OF{" "}
            {filteredMovies.length} {filteredMovies.length === 1 ? "RESULT" : "RESULTS"}
          </div>
        </>
      )}
    </div>
  );
};

export default MovieCatalog;
