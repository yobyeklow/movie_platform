"use client";
import { MovieCatalog } from "@/components/movie";
import { useMovies } from "@/hooks/useMovies";
import { useRouter } from "next/navigation";

const tickerText =
  "LIVE_NOW: NEON_PROTOCOL ★ NEW_RELEASE: SHADOW_OS ★ TRENDING: QUANTUM_HOP ★ POPULAR: STELLAR_DRIFT ★ EXCLUSIVE: CODE_REV";

export default function Home() {
  const router = useRouter();
  const {movies,genres,loading} = useMovies()

  return (
    <main className="pt-32 pb-24 flex flex-col items-center justify-center">
      <section className="w-full max-w-[1400px] px-6 mb-20">
        <div className="relative overflow-hidden border-2 border-[#222]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:h-[500px]">
            <div className="relative h-[400px] lg:h-[500px] overflow-hidden img-noise">
              <img
                src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&h=1800&fit=crop"
                alt="Featured"
                className="absolute inset-0 w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/50 to-transparent" />  
            </div>

            <div className="p-8 lg:p-12 flex flex-col bg-[#0a0a0a] relative justify-center">
              <div style={{ marginLeft: "16px" }}>
                <div className="flex items-center gap-3 mb-6">
                  <span className="font-mono text-[10px] tracking-[0.3em] text-[#ff6b35] animate-pulse">
                    ● LIVE NOW
                  </span>
                  <span className="font-mono text-[10px] text-[#e5e5e5]/40 tracking-wider">
                    / PREMIERE
                  </span>
                </div>

                <h2 className="font-display font-black text-5xl lg:text-6xl mb-6 text-white leading-none tracking-tight">
                  NEON
                  <br />
                  <span className="gradient-text">PROTOCOL</span>
                </h2>

                <p className="font-mono text-sm text-[#e5e5e5]/60 mb-8 leading-relaxed max-w-md">
                  Digital consciousness meets ancient algorithms in this
                  groundbreaking exploration of human-machine interfaces. The
                  line between real and synthetic dissolves.
                </p>
              </div>
              <div className="border-t border-[#222] my-4"></div>
              <div style={{ marginLeft: "16px" }} className="pb-4">
                <div className="grid grid-cols-3 gap-4 font-mono text-[10px]">
                  <div>
                    <span className="text-[#e5e5e5]/40 block mb-1">
                      Category
                    </span>
                    <span className="text-white">SCI-FI</span>
                  </div>
                  <div>
                    <span className="text-[#e5e5e5]/40 block mb-1">
                      DURATION
                    </span>
                    <span className="text-white">135_MIN</span>
                  </div>
                  <div>
                    <span className="text-[#e5e5e5]/40 block mb-1">
                      RATING
                    </span>
                    <span className="text-[#cfff04]">★ 8.9</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 font-mono text-[10px] mt-2">
                  <div>
                    <span className="text-[#e5e5e5]/40 block mb-1">
                      DIRECTOR
                    </span>
                    <span className="text-white">AI_CHEN</span>
                  </div>
                  <div>
                    <span className="text-[#e5e5e5]/40 block mb-1">
                      QUALITY
                    </span>
                    <span className="text-[#cfff04]">4K_HDR</span>
                  </div>
                  <div>
                    <span className="text-[#e5e5e5]/40 block mb-1">
                      AUDIO
                    </span>
                    <span className="text-white">DOLBY_ATMOS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full max-w-[1400px] overflow-hidden border-y-2 border-[#222] bg-[#0a0a0a] mb-20">
        <div className="py-4 marquee whitespace-nowrap font-mono text-xs text-[#e5e5e5]/40 tracking-wider">
          <span className="inline-block">{tickerText}</span>
          <span className="inline-block">{tickerText}</span>
          <span className="inline-block">{tickerText}</span>
          <span className="inline-block">{tickerText}</span>
        </div>
      </div>

      <section className="w-full max-w-[1400px] px-6 mb-20">
        <div className="min-h-screen diagonal-fractions">  
          <MovieCatalog movies={movies} genres={genres} loading={loading} onMovieClick={(movie)=>router.push(`/movie/${movie.id}`)}></MovieCatalog>
        </div>
      </section>

      <section className="w-full max-w-[1400px] px-6">
        <div className="brutal-border bg-[#0a0a0a] p-8 lg:p-12 relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative p-6 border border-[#222] hover:border-[#ff6b35] transition-colors group">
              <div className="text-3xl group-hover:scale-110 transition-transform">
                ⚡
              </div>
              <h4 className="font-display font-bold text-lg mb-2 text-white">
                INSTANT
              </h4>
              <p className="font-mono text-[10px] text-[#e5e5e5]/40 leading-relaxed">
                Zero confirmation transactions. No waiting. No buffering. Pure
                decentralized streaming powered by Solana's L1.
              </p>
            </div>

            <div className="relative p-6 border border-[#222] hover:border-[#00d9ff] transition-colors group">
              <div className="text-3xl group-hover:scale-110 transition-transform">
                🔒
              </div>
              <h4 className="font-display font-bold text-lg mb-2 text-white">
                SECURE
              </h4>
              <p className="font-mono text-[10px] text-[#e5e5e5]/40 leading-relaxed">
                Smart contract protected payments. Your keys, your content. No
                intermediaries. Trustless architecture.
              </p>
            </div>

            <div className="relative p-6 border border-[#222] hover:border-[#cfff04] transition-colors group">
              <div className="text-3xl group-hover:scale-110 transition-transform">
                🎬
              </div>
              <h4 className="font-display font-bold text-lg mb-2 text-white">
                PREMIUM
              </h4>
              <p className="font-mono text-[10px] text-[#e5e5e5]/40 leading-relaxed">
                4K HDR streaming. Dolby Atmos audio. Exclusive originals. The
                future of decentralized entertainment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trending CTA */}
      <section className="w-full max-w-[1400px] px-6">
        <div className="brutal-border bg-[#ff6b35]/10 p-8 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-24 h-24 border-l-2 border-b-2 border-[#ff6b35]" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="font-display font-black text-2xl text-white mb-4 tracking-tight">
                TRENDING_NOW
              </h3>
              <p className="font-mono text-sm text-[#e5e5e5]/80 leading-relaxed max-w-md mb-6">
                Discover what the world is watching right now. Updated daily based on global engagement metrics.
              </p>
              <a
                href="/trending"
                className="inline-block px-8 py-4 font-mono text-xs font-bold bg-[#ff6b35] text-black border-2 border-[#ff6b35] hover:bg-[#e55a2a] hover:border-[#e55a2a] transition-colors brutal-border"
              >
                VIEW TRENDING →
              </a>
            </div>
            <div className="text-right">
              <div className="font-display text-6xl font-black text-[#ff6b35]">
                🔥
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
