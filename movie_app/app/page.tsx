"use client";

import { MovieCatalog } from "@/components/movie";
import { useMovies } from "@/hooks/useMovies";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";



const tickerText =
  "LIVE_NOW: NEON_PROTOCOL ★ NEW_RELEASE: SHADOW_OS ★ TRENDING: QUANTUM_HOP ★ POPULAR: STELLAR_DRIFT ★ EXCLUSIVE: CODE_REV";

export default function Home() {
  const router = useRouter();

  const {movies,genres,loading} = useMovies()
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const { connected, disconnect, publicKey,wallet } = useWallet();
  const { setVisible } = useWalletModal();

  const handleConnect = async () => {
    if (!connected) {
      setVisible(true);
      await wallet?.adapter.connect();
    }
  };

  const toggleWalletMenu = () => {
    setShowWalletMenu(!showWalletMenu);
  };
  
  const disconnectWallet = async () => {
    await disconnect();
    setShowWalletMenu(false);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };


  return (
    <div className="min-h-screen bg-[#050505] diagonal-stripes relative">
      <div className="shape shape-1" />
      <div className="shape shape-2" />
      <div className="shape shape-3" />

      <nav className="fixed top-0 left-0 right-0 z-50 border-b-2 border-[#222] bg-[#050505]/90 backdrop-blur-sm flex items-center justify-center">
        <div className="max-w-[1400px] w-full px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 brutal-border bg-[#0a0a0a] flex items-center justify-center">
                <span className="font-display text-xl font-black text-[#ff6b35]">
                  S
                </span>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-display font-black text-lg tracking-tight text-white">
                  SOL//STREAM
                </h1>
                <p className="font-mono text-[10px] text-[#00d9ff] tracking-[0.2em]">
                  TRAILER_PLATFORM
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="hidden lg:flex items-center gap-6 font-mono text-xs">
                <a
                  href="#"
                  className="text-[#e5e5e5]/60 hover:text-[#ff6b35] transition-colors tracking-wider"
                >
                  BROWSE
                </a>
                <a
                  href="#"
                  className="text-[#e5e5e5]/60 hover:text-[#ff6b35] transition-colors tracking-wider"
                >
                  LIBRARY
                </a>
                <a
                  href="#"
                  className="text-[#e5e5e5]/60 hover:text-[#ff6b35] transition-colors tracking-wider"
                >
                  TRENDING
                </a>
                <a
                  href="#"
                  className="text-[#e5e5e5]/60 hover:text-[#ff6b35] transition-colors tracking-wider"
                >
                  NEW
                </a>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={connected ? toggleWalletMenu : handleConnect}
                className={`cursor-pointer px-6 py-3 font-mono text-xs font-bold ${
                  connected
                    ? "bg-[#ff6b35] text-black border-[#ff6b35]"
                    : "bg-transparent text-white border-[#222] tracking-wider brutal-border glitch-hover"
                }`}
              >
                {connected
                  ? `${truncateAddress(publicKey?.toString() || "")} ▼`
                  : "CONNECT_WALLET"}
              </button>

              {connected && showWalletMenu && (
                <div className="absolute top-full right-0 mt-2 w-[148px] bg-[#0a0a0a] border-2 border-[#222] z-50 shadow-xl">
                  <div className="px-2 py-2">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await disconnectWallet();
                      }}
                      className="w-full  font-mono text-xs font-bold bg-transparent text-[#ff6b35] border-[#222] cursor-pointer"
                    >
                      DISCONNECT
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

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
            <div className="absolute -top-4 -right-4 w-24 h-24 border-l-2 border-b-2 border-[#cfff04]" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 border-r-2 border-t-2 border-[#ff6b35]" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="relative p-6 border border-[#222] hover:border-[#ff6b35] transition-colors group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
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
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
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
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
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
      </main>
    </div>
  );
}
