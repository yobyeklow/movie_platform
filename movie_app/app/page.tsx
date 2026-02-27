"use client";

import Catalog from "@/components/catalog";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import React, { useState, useEffect } from "react";

const movies = [
  {
    id: 1,
    title: "NEON_PROTOCOL",
    year: 2024,
    rating: 8.9,
    genre: "SCI-FI",
    duration: "135_MIN",
    price: "0.5_SOL",
    image:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&h=900&fit=crop",
    description: "Digital consciousness meets ancient algorithms",
  },
  {
    id: 2,
    title: "SHADOW_OS",
    year: 2024,
    rating: 7.8,
    genre: "THRILLER",
    duration: "118_MIN",
    price: "0.35_SOL",
    image:
      "https://images.unsplash.com/photo-1478720568477-152d9b164e63?w=600&h=900&fit=crop",
    description: "System corruption runs deep",
  },
  {
    id: 3,
    title: "QUANTUM_HOP",
    year: 2023,
    rating: 9.1,
    genre: "ADVENTURE",
    duration: "150_MIN",
    price: "0.45_SOL",
    image:
      "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&h=900&fit=crop",
    description: "Reality bends at your fingertips",
  },
  {
    id: 4,
    title: "STELLAR_DRIFT",
    year: 2024,
    rating: 8.5,
    genre: "SPACE",
    duration: "165_MIN",
    price: "0.6_SOL",
    image:
      "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=600&h=900&fit=crop",
    description: "Beyond the event horizon",
  },
  {
    id: 5,
    title: "CODE_REV",
    year: 2023,
    rating: 8.2,
    genre: "DRAMA",
    duration: "125_MIN",
    price: "0.4_SOL",
    image:
      "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=600&h=900&fit=crop",
    description: "When humanity becomes obsolete",
  },
  {
    id: 6,
    title: "ECHO_LOOP",
    year: 2024,
    rating: 7.6,
    genre: "MYSTERY",
    duration: "112_MIN",
    price: "0.3_SOL",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=900&fit=crop",
    description: "Time is a construct",
  },
  {
    id: 7,
    title: "ECHO_LOOP",
    year: 2024,
    rating: 7.6,
    genre: "MYSTERY",
    duration: "112_MIN",
    price: "0.3_SOL",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=900&fit=crop",
    description: "Time is a construct",
  },
];

const categories = [
  "ALL",
  "SCI-FI",
  "THRILLER",
  "ADVENTURE",
  "SPACE",
  "DRAMA",
  "MYSTERY",
];

const tickerText =
  "LIVE_NOW: NEON_PROTOCOL ★ NEW_RELEASE: SHADOW_OS ★ TRENDING: QUANTUM_HOP ★ POPULAR: STELLAR_DRIFT ★ EXCLUSIVE: CODE_REV";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const { connected, disconnect, publicKey,wallet } = useWallet();
  const { setVisible } = useWalletModal();
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const filteredMovies = movies.filter((movie) => {
    const matchesCategory =
      selectedCategory === "ALL" || movie.genre === selectedCategory;
    const matchesSearch = movie.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);
  const paginatedMovies = filteredMovies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
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
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#050505] diagonal-stripes relative">
      <div
        className="cursor"
        style={{ left: cursorPosition.x - 10, top: cursorPosition.y - 10 }}
      />
      <div
        className="cursor-dot"
        style={{ left: cursorPosition.x - 2, top: cursorPosition.y - 2 }}
      />

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
                  DECENTRALIZED_CINEMA
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
                className={`px-6 py-3 font-mono text-xs font-bold ${
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
                      className="w-full  font-mono text-xs font-bold bg-transparent text-[#ff6b35] border-[#222]"
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
            <div className="absolute top-0 right-0 w-32 h-32 border-l-2 border-b-2 border-[#ff6b35]" />
            <div className="absolute bottom-0 left-0 w-32 h-32 border-r-2 border-t-2 border-[#00d9ff]" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
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
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
            <div>
              <h3 className="font-display font-black text-3xl lg:text-4xl mb-2 text-white">
                CATALOG
              </h3>
              <p className="font-mono text-xs text-[#e5e5e5]/40 tracking-wider">
                EXPLORE_THE_DECOLLECTION
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 font-mono text-[10px] tracking-wider brutal-border transition-all ${
                      selectedCategory === category
                        ? "bg-[#ff6b35] text-black border-[#ff6b35]"
                        : "bg-transparent text-[#e5e5e5]/60 border-[#222] hover:border-[#00d9ff] hover:text-white"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="relative hidden sm:block">
                <input
                  type="text"
                  placeholder="SEARCH_DB..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 px-4 py-2 font-mono text-xs bg-transparent border-2 border-[#222] text-white placeholder-[#e5e5e5]/20 focus:outline-none focus:border-[#ff6b35] transition-colors tracking-wider"
                />
              </div>
            </div>
          </div>

          <Catalog movies={paginatedMovies}></Catalog>

          {filteredMovies.length > itemsPerPage && (
            <div className="mt-12 flex items-center justify-center gap-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                  let endPage = Math.min(
                    totalPages,
                    startPage + maxVisible - 1
                  );

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
                            onClick={() => setCurrentPage(1)}
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
                          onClick={() => setCurrentPage(page)}
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
                            onClick={() => setCurrentPage(totalPages)}
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
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
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

          {filteredMovies.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-[#222] brutal-border">
              <p className="font-mono text-sm text-[#e5e5e5]/40 tracking-wider">
                // NO_RESULTS_FOUND
              </p>
            </div>
          )}
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

      <footer className="border-t-2 border-[#222] bg-[#0a0a0a] py-12 flex items-center justify-center">
        <div className="w-full max-w-[1400px] px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 brutal-border bg-[#050505] flex items-center justify-center">
                <span className="font-display text-lg font-black text-[#ff6b35]">
                  S
                </span>
              </div>
              <div>
                <h5 className="font-display font-black text-white">
                  SOL//STREAM
                </h5>
                <p className="font-mono text-[9px] text-[#00d9ff] tracking-[0.2em]">
                  DECENTRALIZED_CINEMA
                </p>
              </div>
            </div>

            <p className="font-mono text-[10px] text-[#e5e5e5]/40 tracking-wider text-center lg:text-left">
              © 2024 SOL//STREAM. ALL RIGHTS RESERVED. POWERED BY
              SOLANA_BLOCKCHAIN.
            </p>

            <div className="flex gap-6 font-mono text-[10px]">
              <a
                href="#"
                className="text-[#e5e5e5]/40 hover:text-[#ff6b35] transition-colors tracking-wider"
              >
                TERMS
              </a>
              <a
                href="#"
                className="text-[#e5e5e5]/40 hover:text-[#00d9ff] transition-colors tracking-wider"
              >
                PRIVACY
              </a>
              <a
                href="#"
                className="text-[#e5e5e5]/40 hover:text-[#cfff04] transition-colors tracking-wider"
              >
                SUPPORT
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-[#222]">
            <div className="font-mono text-[9px] text-[#e5e5e5]/20 tracking-wider flex flex-wrap gap-2 justify-center lg:justify-start">
              <span>[</span>
              <span className="text-[#ff6b35]">SYSTEM_STATUS:</span>
              <span>OPERATIONAL</span>
              <span>//</span>
              <span className="text-[#00d9ff]">NETWORK:</span>
              <span>SOLANA_MAINNET</span>
              <span>//</span>
              <span className="text-[#cfff04]">TPS:</span>
              <span>4,582</span>
              <span>//</span>
              <span>UPTIME:</span>
              <span>99.97%</span>
              <span>]</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
