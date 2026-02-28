"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type {
  MovieDetail as MovieDetailType,
  Video,
  Genre,
} from "./types";
import VideoPlayerComponent from "./VideoPlayer";
import tmdbService from "@/api/tmdb_service";
import {
  saveWatchProgress,
  getWatchProgress,
  addToWatchHistory,
  debugVideoData,
} from "@/utils";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
const TMDB_POSTER_SIZE = "w500";

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="cursor-pointer flex items-center gap-2 px-6 py-3 font-mono text-xs font-bold bg-[#0a0a0a] text-white border-2 border-[#222] hover:border-[#ff6b35] hover:text-[#ff6b35] transition-all brutal-border tracking-wider"
  >
    <span>◄</span>
    <span>BACK</span>
  </button>
);

const RatingBadge: React.FC<{ rating: number }> = ({ rating }) => {
  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "text-[#cfff04]";
    if (rating >= 6) return "text-[#ff6b35]";
    return "text-[#e5e5e5]";
  };

  return (
    <div className={`flex items-center gap-2 ${getRatingColor(rating)}`}>
      <span className="text-xl">★</span>
      <span className="font-display font-black text-lg">{rating.toFixed(1)}</span>
    </div>
  );
};

const GenreBadge: React.FC<{ genre: Genre }> = ({ genre }) => (
  <span className="px-4 py-2 font-mono text-[10px] tracking-wider bg-[#111] text-[#e5e5e5] border border-[#222] hover:border-[#00d9ff] hover:text-[#00d9ff] transition-colors">
    {genre.name.toUpperCase()}
  </span>
);

const MovieInfo: React.FC<{
  label: string;
  value: string | number | undefined;
  highlight?: boolean;
}> = ({ label, value, highlight }) => (
  <div>
    <span className="text-[#e5e5e5]/40 block mb-1 font-mono text-[10px] tracking-wider">
      {label}
    </span>
    <span
      className={`block font-mono text-xs ${
        highlight ? "text-[#cfff04]" : "text-white"
      }`}
    >
      {value || "N/A"}
    </span>
  </div>
);

interface MovieDetailProps {
  movieId: number;
  onBack?: () => void;
}

const MovieDetail: React.FC<MovieDetailProps> = ({ movieId, onBack }) => {
  const [movie, setMovie] = useState<MovieDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const fetchMovieData = async () => {
      setLoading(true);
      setError(null);

      try {
        const movieDetails = await tmdbService.getMovieDetails(movieId);
        if (movieDetails) {
          const transformedMovie: MovieDetailType = {
            id: movieDetails.id,
            title: movieDetails.title,
            originalTitle: movieDetails.original_title,
            overview: movieDetails.overview || "",
            posterPath: movieDetails.poster_path || "",
            backdropPath: movieDetails.backdrop_path || "",
            releaseDate: movieDetails.release_date || "",
            rating: movieDetails.vote_average || 0,
            voteCount: movieDetails.vote_count || 0,
            popularity: movieDetails.popularity || 0,
            adult: movieDetails.adult || false,
            runtime: movieDetails.runtime || 0,
            budget: movieDetails.budget || 0,
            revenue: movieDetails.revenue || 0,
            status: movieDetails.status || "",
            tagline: movieDetails.tagline || "",
            imdbId: movieDetails.imdb_id || "",
            originalLanguage: movieDetails.original_language || "",
            genres: movieDetails.genres || [],
            productionCompanies: (movieDetails.production_companies || []).map(
              (pc: any) => ({
                id: pc.id,
                logoPath: pc.logo_path,
                name: pc.name,
                originCountry: pc.origin_country,
              })
            ),
            productionCountries: (movieDetails.production_countries || []).map(
              (pc: any) => ({
                iso_3166_1: pc.iso_3166_1,
                name: pc.name,
              })
            ),
            spokenLanguages: (movieDetails.spoken_languages || []).map(
              (sl: any) => ({
                englishName: sl.english_name,
                iso_639_1: sl.iso_639_1,
                name: sl.name,
              })
            ),
            cast: [],
            crew: [],
            videos: [],
          };

          // Fetch videos
          const videos = await tmdbService.getMovieVideos(movieId);
          transformedMovie.videos = (videos || []).map((v: any) => ({
            id: v.id,
            key: v.key,
            name: v.name,
            site: v.site,
            size: v.size,
            type: v.type,
            official: v.official,
            publishedAt: v.published_at,
          }));

          // Debug: Log video data to help identify issues
          console.log(`=== Fetched ${videos?.length || 0} videos for movie ${movieId} ===`);
          if (transformedMovie.videos.length > 0) {
            debugVideoData(transformedMovie.videos);
          } else {
            console.warn("No videos found for this movie");
          }

          // Set first video as selected
          if (transformedMovie.videos.length > 0) {
            const firstVideo = transformedMovie.videos[0];
            setSelectedVideo(firstVideo);
          } else {
            console.warn("No videos available to select");
            setSelectedVideo(null);
          }

          // Load saved watch progress
          const savedProgress = getWatchProgress(movieId);
          setCurrentTime(savedProgress);

          setMovie(transformedMovie);
        } else {
          setError("Movie not found");
        }
      } catch (err) {
        console.error("Error fetching movie details:", err);
        setError("Failed to load movie details");
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      fetchMovieData();
    }
  }, [movieId]);


  const formatRuntime = (minutes: number): string => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}H ${mins}MIN` : `${mins}MIN`;
  };


  const formatCurrency = (amount: number): string => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };


  const formatDate = (dateString: string): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };



  const handleTimeUpdate = (time: number): void => {
    setCurrentTime(time);
    // Save progress every 5 seconds
    if (movie && Math.floor(time) % 5 === 0) {
      saveWatchProgress(movie.id, time);
    }
  };

  const handleVideoEnd = (): void => {
    if (movie) {
      addToWatchHistory(movie);
      console.log(`Added ${movie.title} to watch history`);
    }
  };

  const handleVideoError = (errorCode: number): void => {
    console.log("Video error occurred:", errorCode);

    const errorMessages: Record<number, { title: string; message: string }> = {
      100: {
        title: "Video Not Found",
        message: "This video may have been removed from YouTube. Try selecting a different trailer from the list below.",
      },
      2: {
        title: "Invalid Parameter",
        message: "There was an error with the video parameters. Please try again.",
      },
      5: {
        title: "Player Error",
        message: "There was an error loading the video player. Please refresh the page.",
      },
      101: {
        title: "Embed Not Allowed",
        message: "The video owner has disabled embedding. Try selecting a different trailer from the list below.",
      },
      150: {
        title: "Embed Forbidden",
        message: "This video cannot be embedded. Try selecting a different trailer from the list below.",
      },
    };

    const errorDetail = errorMessages[errorCode] || {
      title: "Unknown Error",
      message: "An error occurred. Please try a different video or refresh the page.",
    };

    setError(errorDetail.message);
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] diagonal-stripes relative flex items-center justify-center">
        <div className="text-center">
          <div className="font-display font-black text-4xl text-[#ff6b35] mb-4 animate-pulse">
            LOADING
          </div>
          <p className="font-mono text-xs text-[#e5e5e5]/40 tracking-wider">
            FETCHING_DATA_FROM_DATABASE...
          </p>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-[#050505] diagonal-stripes relative flex items-center justify-center">
        <div className="max-w-md text-center p-8 brutal-border bg-[#0a0a0a]">
          <div className="font-display font-black text-4xl text-[#ff6b35] mb-4">
            ERROR
          </div>
          <p className="font-mono text-sm text-[#e5e5e5]/60 mb-6">
            {error || "Movie not found"}
          </p>
          {onBack && <BackButton onClick={onBack} />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] diagonal-stripes relative">
      {/* Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b-2 border-[#222] bg-[#050505]/90 backdrop-blur-sm flex items-center justify-center">
        <div className="max-w-[1400px] w-full px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              {onBack && <BackButton onClick={onBack} />}
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

            <div className="font-mono text-xs">
              <span className="text-[#e5e5e5]/40">ID:</span>
              <span className="text-[#ff6b35] ml-2">{movie.id}</span>
            </div>
          </div>
        </div>
      </div>

      <main className="pt-32 pb-24">
        {/* Platform Info Banner */}
        <section className="w-full max-w-[1400px] mx-auto px-6 mb-8">
          <div className="p-4 bg-[#00d9ff]/10 border-l-2 border-[#00d9ff] brutal-border">
            <div className="flex items-start gap-4">
              <div className="text-2xl">🎬</div>
              <div>
                <p className="font-mono text-xs text-[#00d9ff] mb-1">
                  TRAILER PLATFORM - DISCOVER MOVIES & WATCH TRAILERS
                </p>
                <p className="font-mono text-[10px] text-[#e5e5e5]/60">
                  Browse our catalog of movies with official trailers from YouTube.
                  Add to your watchlist and track your progress.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="w-full max-w-[1400px] mx-auto px-6 mb-12">
          <div className="relative overflow-hidden border-2 border-[#222]">
            <div className="absolute top-0 right-0 w-32 h-32 border-l-2 border-b-2 border-[#ff6b35] z-10" />  

            <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-0">
              <div className="relative h-[650px] overflow-hidden bg-[#0a0a0a] img-noise">
                {movie.posterPath ? (
                  <Image
                    src={`${TMDB_IMAGE_BASE_URL}/${TMDB_POSTER_SIZE}${movie.posterPath}`}
                    alt={movie.title}
                    fill
                    className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-[#e5e5e5]/20">
                    <span className="font-display text-4xl">NO_POSTER</span>
                  </div>
                )}
              </div>

              {/* Movie Info */}
              <div className="p-8 lg:p-12 bg-[#0a0a0a] flex flex-col">

                <div className="flex items-center gap-3 mb-4">
                  {movie.status && (
                    <span className="font-mono text-[10px] tracking-[0.3em] text-[#cfff04]">
                      {movie.status.toUpperCase()}
                    </span>
                  )}
                  {movie.releaseDate && (
                    <>
                      <span className="text-[#e5e5e5]/20">/</span>
                      <span className="font-mono text-[10px] text-[#e5e5e5]/40 tracking-wider">
                        {formatDate(movie.releaseDate)}
                      </span>
                    </>
                  )}
                </div>


                <h2 className="font-display font-black text-4xl lg:text-5xl mb-4 text-white leading-none tracking-tight">
                  {movie.title.toUpperCase()}
                </h2>


                {movie.tagline && (
                  <p className="font-mono text-sm text-[#ff6b35] mb-6 italic">
                    "{movie.tagline}"
                  </p>
                )}


                <div className="flex items-center gap-6 mb-6">
                  <RatingBadge rating={movie.rating} />
                  <span className="font-mono text-xs text-[#e5e5e5]/40">
                    {movie.voteCount?.toLocaleString()} VOTES
                  </span>
                </div>

                {movie.genres && movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8">
                    {movie.genres.slice(0, 5).map((genre) => (
                      <GenreBadge key={genre.id} genre={genre} />
                    ))}
                  </div>
                )}

                {/* Overview */}
                <div className="mb-8">
                  <h3 className="font-mono text-[10px] text-[#e5e5e5]/40 mb-3 tracking-wider">
                    SYNOPSIS
                  </h3>
                  <p className="font-mono text-sm text-[#e5e5e5]/80 leading-relaxed">
                    {movie.overview || "No synopsis available."}
                  </p>
                </div>

                <div className="border-t border-[#222] my-6" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  <MovieInfo
                    label="RUNTIME"
                    value={formatRuntime(movie.runtime)}
                  />
                  <MovieInfo
                    label="ORIGINAL_LANGUAGE"
                    value={movie.originalLanguage?.toUpperCase()}
                  />
                  <MovieInfo
                    label="BUDGET"
                    value={formatCurrency(movie.budget)}
                  />
                  <MovieInfo
                    label="REVENUE"
                    value={formatCurrency(movie.revenue)}
                  />
                </div>

                {movie.productionCompanies &&
                  movie.productionCompanies.length > 0 && (
                    <div className="border-t border-[#222] pt-6">
                      <h3 className="font-mono text-[10px] text-[#e5e5e5]/40 mb-3 tracking-wider">
                        PRODUCTION
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {movie.productionCompanies.slice(0, 3).map((company) => (
                          <span
                            key={company.id}
                            className="font-mono text-xs text-[#e5e5e5]/60"
                          >
                            {company.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </section>

        {/* Video Player Section */}
        {selectedVideo && (
          <section id="video-player-section" className="w-full max-w-[1400px] mx-auto px-6 mb-12">
            <div className="brutal-border bg-[#0a0a0a] overflow-hidden">
              <div className="border-b-2 border-[#222] p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-white">
                    {selectedVideo.type.toUpperCase()}
                  </h3>
                  <p className="font-mono text-[10px] text-[#e5e5e5]/40">
                    {selectedVideo.name}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {selectedVideo.official && (
                    <span className="px-2 py-0.5 font-mono text-[9px] bg-[#ff6b35] text-black">
                      OFFICIAL
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-[#e5e5e5]/40">
                    {currentTime > 0 && movie.runtime ? (
                      `${Math.floor(currentTime / 60)}:${String(Math.floor(currentTime % 60)).padStart(2, "0")} / ${formatRuntime(movie.runtime).replace("MIN", "").trim()}`
                    ) : (
                      "PLAY"
                    )}
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-[#ff6b35]/10 border-l-2 border-[#ff6b35]">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <p className="font-mono text-sm text-[#ff6b35] font-bold">
                        {error}
                      </p>
                      <p className="font-mono text-[10px] text-[#e5e5e5]/60 mt-2">
                        Try selecting a different trailer from the list below.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <VideoPlayerComponent
                key={selectedVideo?.key}
                videoId={selectedVideo?.key || ""}
                title={selectedVideo ? `${movie.title} - ${selectedVideo.name}` : "No video selected"}
                autoplay={false}
                startTime={currentTime}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnd}
                onError={handleVideoError}
              />
            </div>
          </section>
        )}

        
      </main>
    </div>
  );
};

export default MovieDetail;
