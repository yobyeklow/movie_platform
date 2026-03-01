"use client";
import MovieCard from "@/components/movie/MovieCard";
import { useTrending } from "@/hooks/useTrending";
import { useRouter } from "next/navigation";

const tickerText =
  "TRENDING_NOW: CYBER_CHRONICLES ★ HOT: NEON_PROTOCOL ★ RISING: STELLAR_DRIFT ★ POPULAR: QUANTUM_HOP ★ VIRAL: SHADOW_OS ★ BUZZING: CODE_REV";

export default function TrendingPage() {
    const {movies,genres,loading,switchTimeWindow,timeWindow,error,refreshTrending,currentPage} = useTrending();
    const itemsPerPage = 20;
    const showPagination = true;
    const router = useRouter();
    const totalPages = Math.ceil(500 / itemsPerPage);

    const handlePageChange = (page: number) => {
        refreshTrending(page, timeWindow);
    };

  return (
      <main className="pt-32 pb-24">
        <div className="max-w-[1400px] mx-auto px-6">
          {/* Hero Section */}
          <section className="mb-12 brutal-border bg-[#0a0a0a] p-8 lg:p-12 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="font-mono text-[10px] tracking-[0.3em] text-[#ff6b35] animate-pulse">
                    ● HOT NOW
                  </span>
                  <span className="font-mono text-[10px] text-[#e5e5e5]/40 tracking-wider">
                    / TRENDING
                  </span>
                </div>

                <h2 className="font-display font-black text-5xl lg:text-6xl mb-6 text-white leading-none tracking-tight">
                  TRENDING
                  <br />
                  <span className="gradient-text">NOW</span>
                </h2>

                <p className="font-mono text-sm text-[#e5e5e5]/60 mb-8 leading-relaxed max-w-md">
                  Discover what the world is watching right now. Real-time trending movies
                  updated daily based on global engagement.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-mono text-[10px] text-[#e5e5e5]/40 block mb-1">
                      UPDATE FREQUENCY
                    </span>
                    <span className="font-display font-bold text-lg text-white">
                      DAILY
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-[#e5e5e5]/40 block mb-1">
                      METRIC
                    </span>
                    <span className="font-display font-bold text-lg text-white">
                      POPULARITY
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative h-64 lg:h-80 overflow-hidden brutal-border">
                <img
                  src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=600&fit=crop"
                  alt="Trending Movies"
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 img-noise"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="px-4 py-2 brutal-border bg-[#ff6b35] text-black font-mono text-xs font-bold tracking-wider">
                    {totalPages*movies.length} MOVIES TRENDING
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Time Window Toggle */}
          <section className="mb-12">
            <div className="flex items-center gap-4 mb-8">
              <h3 className="font-display font-black text-2xl text-white tracking-tight">
                TIME WINDOW
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => switchTimeWindow("day")}
                  className={`
                    px-6 py-3 font-mono text-xs font-bold brutal-border transition-all
                    ${timeWindow === "day"
                      ? "bg-[#ff6b35] text-black border-[#ff6b35]"
                      : "bg-transparent text-[#e5e5e5]/60 border-[#222] hover:border-[#ff6b35] hover:text-[#ff6b35]"
                    }
                  `}
                >
                  TODAY
                </button>
                <button
                  onClick={() => switchTimeWindow("week")}
                  className={`
                    px-6 py-3 font-mono text-xs font-bold brutal-border transition-all
                    ${timeWindow === "week"
                      ? "bg-[#ff6b35] text-black border-[#ff6b35]"
                      : "bg-transparent text-[#e5e5e5]/60 border-[#222] hover:border-[#ff6b35] hover:text-[#ff6b35]"
                    }
                  `}
                >
                  THIS WEEK
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-20">
                <div className="inline-block w-16 h-16 border-4 border-[#222] border-t-[#ff6b35] rounded-full animate-spin mb-4"></div>
                <p className="font-mono text-sm text-[#e5e5e5]/60">
                  LOADING_TRENDING_MOVIES...
                </p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="p-8 brutal-border bg-[#ff6b35]/10 border-l-2 border-[#ff6b35]">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <span className="font-mono text-sm text-[#ff6b35]">
                    {error}
                  </span>
                </div>
              </div>
            )}

            {!loading && movies.length > 0 && (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6">
                        {movies.map((movie, index) => (
                        <MovieCard
                            key={movie.id}
                            movie={movie}
                            genres={genres}
                            onClick={()=>router.push(`/movie/${movie.id}`)}
                            index={index}
                        />
                        ))}
                    </div>

                    {showPagination && totalPages > 1 && (
                        <div className="mt-12 flex items-center justify-center gap-4">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`cursor-pointer px-6 py-3 font-mono text-xs tracking-wider brutal-border transition-all ${
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
                                        className={`cursor-pointer w-10 h-10 font-mono text-xs tracking-wider brutal-border transition-all ${
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
                                    className={`cursor-pointer w-10 h-10 font-mono text-xs tracking-wider brutal-border transition-all ${
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
                                        className={`cursor-pointer w-10 h-10 font-mono text-xs tracking-wider brutal-border transition-all ${
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
                            className={`cursor-pointer px-6 py-3 font-mono text-xs tracking-wider brutal-border transition-all ${
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
                        PAGE {currentPage} OF {totalPages} • SHOWING {movies.length} RESULTS
                    </div>
                </>
            )}

            {!loading && !error && movies.length === 0 && (
              <div className="text-center py-20">
                <span className="text-6xl mb-4 block">📺</span>
                <p className="font-mono text-sm text-[#e5e5e5]/60 mb-4">
                  NO TRENDING MOVIES FOUND!
                </p>
                <button
                  onClick={() => refreshTrending()}
                  className="px-8 py-3 font-mono text-xs font-bold brutal-border bg-[#ff6b35] text-black border-[#ff6b35] hover:bg-[#e55a2a] transition-colors"
                >
                  REFRESH
                </button>
              </div>
            )}
          </section>

          {/* Stats Section */}
          <section className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="brutal-border bg-[#0a0a0a] p-6 hover:border-[#ff6b35] transition-colors group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl group-hover:scale-110 transition-transform">🔥</span>
                  <span className="font-mono text-[10px] text-[#e5e5e5]/40">REAL TIME</span>
                </div>
                <h4 className="font-display font-bold text-lg mb-2 text-white">
                  UPDATED DAILY
                </h4>
                <p className="font-mono text-[10px] text-[#e5e5e5]/60 leading-relaxed">
                  Trending data refreshed every 24 hours based on global viewership and engagement.
                </p>
              </div>

              <div className="brutal-border bg-[#0a0a0a] p-6 hover:border-[#00d9ff] transition-colors group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl group-hover:scale-110 transition-transform">🌍</span>
                  <span className="font-mono text-[10px] text-[#e5e5e5]/40">GLOBAL</span>
                </div>
                <h4 className="font-display font-bold text-lg mb-2 text-white">
                  WORLDWIDE
                </h4>
                <p className="font-mono text-[10px] text-[#e5e5e5]/60 leading-relaxed">
                  Rankings based on global audience engagement across all regions and platforms.
                </p>
              </div>

              <div className="brutal-border bg-[#0a0a0a] p-6 hover:border-[#cfff04] transition-colors group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl group-hover:scale-110 transition-transform">⚡</span>
                  <span className="font-mono text-[10px] text-[#e5e5e5]/40">FAST</span>
                </div>
                <h4 className="font-display font-bold text-lg mb-2 text-white">
                  INSTANT ACCESS
                </h4>
                <p className="font-mono text-[10px] text-[#e5e5e5]/60 leading-relaxed">
                  One-click access to trending movies. No delays, just pure entertainment.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Ticker */}
        <div className="fixed bottom-0 left-0 right-0 border-y-2 border-[#222] bg-[#0a0a0a]">
          <div className="py-4 marquee whitespace-nowrap font-mono text-xs text-[#e5e5e5]/40 tracking-wider">
            <span className="inline-block">{tickerText}</span>
            <span className="inline-block">{tickerText}</span>
            <span className="inline-block">{tickerText}</span>
            <span className="inline-block">{tickerText}</span>
          </div>
        </div>
      </main>

  );
}
