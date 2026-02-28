"use client";

import React, { useEffect, useState, useRef } from "react";
import type { VideoPlayerProps } from "./types";

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  title,
  autoplay = false,
  startTime = 0,
  onTimeUpdate,
  onEnded,
  onError,
}) => {

  const playerInstanceRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!mounted) return;

    console.log("[VideoPlayer] Loading YouTube API, videoId:", videoId);

    // Check if API is already loaded
    const yt = (window as any).YT;
    if (yt) {
      console.log("[VideoPlayer] YouTube API already loaded, initializing player");
      createPlayer();
      return;
    }

    console.log("[VideoPlayer] YouTube API not loaded, starting load...");
    setLoading(true);

    // Load the YouTube IFrame API
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;


    // Set up the global callback
    const originalCallback = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      console.log("[VideoPlayer] onYouTubeIframeAPIReady callback fired!");
      createPlayer();

      // Call existing callback if any (for multiple players on page)
      if (originalCallback && typeof originalCallback === "function") {
        console.log("[VideoPlayer] Calling existing callback");
        originalCallback();
      }
    };

    // Script event handlers
    script.onload = () => {
      console.log("[VideoPlayer] Script onload event fired");
    };

    script.onerror = () => {
      console.error("[VideoPlayer] Script onerror event fired");
      console.error("[VideoPlayer] Failed to load YouTube IFrame API script");
      setError("Failed to load YouTube API script");
      setLoading(false);
    };

    // Add script to DOM
    document.head.appendChild(script);
    console.log("[VideoPlayer] Script appended to document.head");

    return () => {
      console.log("[VideoPlayer] Cleanup - destroying player");
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.destroy();
        } catch (err) {
          console.error("[VideoPlayer] Error destroying player:", err);
        }
      }
      // Restore original callback
      if (originalCallback && typeof originalCallback === "function") {
        (window as any).onYouTubeIframeAPIReady = originalCallback;
      }
    };
  }, [mounted, videoId, autoplay, startTime]);

  // Create YouTube player
  function createPlayer() {
    console.log("[VideoPlayer] createPlayer() called, videoId:", videoId);

    // Don't create player if no valid video ID
    if (!videoId || videoId.length === 0) {
      console.log("[VideoPlayer] No valid video ID, skipping player creation");
      return;
    }

    const container = document.getElementById("youtube-player-" + videoId);
    if (!container) {
      console.error("[VideoPlayer] iframe container not found!");
      setError("iframe not available");
      setLoading(false);
      return;
    }

    const YT = (window as any).YT;
    if (!YT) {
      console.error("[VideoPlayer] YT object not available!");
      setError("YouTube API not available");
      setLoading(false);
      return;
    }

    console.log("[VideoPlayer] Creating YT.Player instance...");

    try {
      playerInstanceRef.current = new YT.Player(container, {
        videoId,
        height: "100%",
        width: "100%",
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          start: startTime,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          cc_load_policy: 1,
          fs: 0,
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            const player = event.target;
            const state = player?.getPlayerState?.() || "unknown";
            console.log("[VideoPlayer] Player ready! State:", state);
            handlePlayerReady(event);
          },
          onStateChange: (event: any) => {
            console.log("[VideoPlayer] Player state changed:", event.data);
            handleStateChange(event);
          },
          onError: (event: any) => {
            console.error("[VideoPlayer] Player error:", event.data);
            handlePlayerError(event);
          },
          onPlaybackRateChange: (event: any) => {
            console.log("[VideoPlayer] Playback rate changed:", event.data);
            const player = event.target;
            if (player.getPlaybackRate) {
              setPlaybackRate(player.getPlaybackRate());
            }
          },
        },
      });
      console.log("[VideoPlayer] YT.Player created (waiting for ready event)");
    } catch (err) {
      console.error("[VideoPlayer] Error creating player:", err);
      setError("Failed to create player");
      setLoading(false);
    }
  }

  // Handle player ready event
  function handlePlayerReady(event: any) {
    const player = event.target;
    playerInstanceRef.current = player;

    console.log("[VideoPlayer] handlePlayerReady, getting duration");

    setLoading(false);
    setError(null);

    if (player.setVolume) {
      player.setVolume(volume);
    }

    if (player.getDuration) {
      const dur = player.getDuration();
      setDuration(dur || 0);
      console.log("[VideoPlayer] Duration:", dur);
    }

    if (startTime > 0 && player.seekTo) {
      player.seekTo(startTime, true);
      console.log("[VideoPlayer] Seeking to:", startTime);
    }
  }

  // Handle player state change
  function handleStateChange(event: any) {
    const player = event.target;
    const state = player.getPlayerState();

    // YT PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
    console.log("[VideoPlayer] State:", state, getStateName(state));

    switch (state) {
      case 1: // Playing
        setIsPlaying(true);
        setLoading(false);
        break;
      case 2: // Paused
        setIsPlaying(false);
        setLoading(false);
        break;
      case 0: // Ended
        setIsPlaying(false);
        setLoading(false);
        onEnded?.();
        break;
      case 3: // Buffering
        setLoading(true);
        break;
      case -1: // Unstarted
        setLoading(true);
        break;
      case 5: // Cued
        setLoading(false);
        break;
      default:
        setLoading(false);
    }
  }

  // Handle player error
  function handlePlayerError(event: any) {
    const errorCode = event.data;
    console.error("[VideoPlayer] Error code:", errorCode);

    const errorDetails: Record<number, { message: string; suggestion: string }> = {
      2: {
        message: "Invalid parameter value",
        suggestion: "Video ID is malformed. Check the video ID format.",
      },
      5: {
        message: "HTML5 player error",
        suggestion: "Try reloading the page or using a different browser.",
      },
      100: {
        message: "Video not found",
        suggestion: "The video may have been removed from YouTube. Try a different video.",
      },
      101: {
        message: "Embed not allowed by owner",
        suggestion: "The video owner has disabled embedding. Try a different video from the list.",
      },
      150: {
        message: "Embed forbidden",
        suggestion: "This video cannot be embedded. Try selecting a different video from the list below.",
      },
    };

    const errorDetail = errorDetails[errorCode] || {
      message: "Unknown error (" + errorCode + ")",
      suggestion: "Try reloading the page or selecting a different video.",
    };

    setError(errorDetail.message + ". " + errorDetail.suggestion);
    setLoading(false);

    // Notify parent component about error (so they can try next video)
    if (errorCode === 150 || errorCode === 101) {
      console.warn("[VideoPlayer] Embed disabled - notify parent to try next video");
      onError?.(errorCode);
    }
  }

  // Get state name for logging
  function getStateName(state: number): string {
    const states: Record<number, string> = {
      "-1": "unstarted",
      0: "ended",
      1: "playing",
      2: "paused",
      3: "buffering",
      5: "cued",
    };
    return states[state] || "unknown (" + state + ")";
  }

  // Time tracking
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (isPlaying && playerInstanceRef.current) {
      intervalRef.current = setInterval(() => {
        if (playerInstanceRef.current?.getCurrentTime) {
          const time = playerInstanceRef.current.getCurrentTime();
          setCurrentTime(time);
          onTimeUpdate?.(time);
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, onTimeUpdate]);

  // Control functions
  function togglePlayPause() {
    const player = playerInstanceRef.current;
    if (!player) return;

    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  }

  function handleSeek(time: number) {
    const player = playerInstanceRef.current;
    if (!player || !player.seekTo) return;

    player.seekTo(time, true);
    setCurrentTime(time);
    console.log("[VideoPlayer] Seeked to:", time);
  }

  function handleSeekChange(e: React.ChangeEvent<HTMLInputElement>) {
    const time = parseFloat(e.target.value);
    handleSeek(time);
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newVolume = parseInt(e.target.value);
    const player = playerInstanceRef.current;
    if (player && player.setVolume) {
      player.setVolume(newVolume);
    }
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }

  function toggleMute() {
    const player = playerInstanceRef.current;
    if (!player) return;

    if (isMuted) {
      player.unMute();
      player.setVolume(volume || 100);
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  }

  function handleSpeedChange(rate: number) {
    const player = playerInstanceRef.current;
    if (player && player.setPlaybackRate) {
      player.setPlaybackRate(rate);
    }
    setPlaybackRate(rate);
  }

  function toggleFullscreen() {
    const container = document.getElementById("youtube-player-" + videoId)?.parentElement;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  }

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement
      );
      setIsFullscreen(isFull);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Mouse move for controls visibility
  function handleMouseMove() {
    setShowControls(true);

    const timeout = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlayPause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleSeek(Math.max(0, currentTime - 5));
          break;
        case "ArrowRight":
          e.preventDefault();
          handleSeek(Math.min(duration, currentTime + 5));
          break;
        case "ArrowUp":
          e.preventDefault();
          const newVolumeUp = Math.min(100, volume + 10);
          if (playerInstanceRef.current?.setVolume) {
            playerInstanceRef.current.setVolume(newVolumeUp);
          }
          setVolume(newVolumeUp);
          break;
        case "ArrowDown":
          e.preventDefault();
          const newVolumeDown = Math.max(0, volume - 10);
          if (playerInstanceRef.current?.setVolume) {
            playerInstanceRef.current.setVolume(newVolumeDown);
          }
          setVolume(newVolumeDown);
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          e.preventDefault();
          const rate = e.key === "0" ? 1 : parseInt(e.key) * 0.25;
          handleSpeedChange(rate);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentTime, duration, volume, togglePlayPause, handleSeek, toggleFullscreen, toggleMute, handleSpeedChange]);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
    console.log("[VideoPlayer] Component mounted");
  }, []);

  // Show loading state until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="font-mono text-xs text-[#e5e5e5]/60">Loading player...</div>
      </div>
    );
  }

  // Format time helper
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ":" + secs.toString().padStart(2, "0");
  }

  // Check if videoId is valid
  const isValidVideoId = videoId && videoId.length > 0;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={"relative w-full brutal-border bg-black overflow-hidden group " + (isFullscreen ? "fixed inset-0 z-50" : "")}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* YouTube Iframe */}
      <div className="relative aspect-video w-full bg-black">
        <div
          id={"youtube-player-" + (videoId || "empty")}
          className="w-full h-full"
        />

        {/* No video ID warning - shown as overlay, not early return */}
        {!isValidVideoId && !error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="text-center max-w-md p-8 brutal-border bg-[#0a0a0a]">
              <div className="font-display font-black text-3xl text-[#ff6b35] mb-4">
                NO VIDEO
              </div>
              <p className="font-mono text-sm text-[#e5e5e5]/80 mb-6">
                No valid video ID provided
              </p>
            </div>
          </div>
        )}

        {/* Video Loading State */}
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="text-center">
              <div className="font-display font-black text-4xl text-[#ff6b35] mb-4 animate-pulse">
                LOADING
              </div>
              <p className="font-mono text-xs text-[#e5e5e5]/60 tracking-wider">
                BUFFERING_STREAM...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="text-center max-w-md p-8 brutal-border bg-[#0a0a0a]">
              <div className="font-display font-black text-3xl text-[#ff6b35] mb-4">
                ERROR
              </div>
              <p className="font-mono text-sm text-[#e5e5e5]/80 mb-6">
                {error}
              </p>
              <p className="font-mono text-xs text-[#e5e5e5]/40 mb-6">
                Video ID: {videoId}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 font-mono text-xs font-bold bg-[#ff6b35] text-black border-2 border-[#ff6b35] hover:bg-[#e55a2a] transition-colors"
              >
                RETRY
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {showControls && !loading && !error && isValidVideoId && (
        <div
          className={"absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 transition-opacity duration-300 " + (isPlaying ? "opacity-100 group-hover:opacity-100" : "opacity-100")}
        >
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeekChange}
              className="w-full h-1 appearance-none bg-[#222] cursor-pointer hover:bg-[#333] focus:outline-none relative"
              style={{ WebkitAppearance: "none" }}
            />
            <div
              className="absolute top-[72px] left-0 h-1 bg-[#ff6b35] pointer-events-none"
              style={{ width: progressPercent + "%" }}
            />

            <div className="flex justify-between items-center mt-2">
              <span className="font-mono text-[10px] text-[#e5e5e5]/60">
                {formatTime(currentTime)}
              </span>
              <span className="font-mono text-[10px] text-[#e5e5e5]/60">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlayPause}
                className="w-12 h-12 flex items-center justify-center bg-[#0a0a0a] border-2 border-[#222] hover:border-[#ff6b35] hover:text-[#ff6b35] transition-colors brutal-border"
              >
                <span className="font-mono text-lg">{isPlaying ? "❚❚" : "▶"}</span>
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="w-10 h-10 flex items-center justify-center bg-[#0a0a0a] border-2 border-[#222] hover:border-[#ff6b35] hover:text-[#ff6b35] transition-colors brutal-border"
                >
                  <span className="font-mono text-sm">
                    {isMuted ? "×" : volume > 50 ? "🔊" : volume > 0 ? "🔉" : "🔇"}
                  </span>
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 appearance-none bg-[#222] cursor-pointer hover:bg-[#333] focus:outline-none"
                  style={{ WebkitAppearance: "none" }}
                />
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#e5e5e5]/60">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative group/speed">
                <button className="px-3 py-2 font-mono text-[10px] bg-[#0a0a0a] border-2 border-[#222] hover:border-[#00d9ff] hover:text-[#00d9ff] transition-colors brutal-border">
                  {playbackRate}x
                </button>
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover/speed:block">
                  <div className="bg-[#0a0a0a] border-2 border-[#222] brutal-border">
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handleSpeedChange(rate)}
                        className={"px-4 py-2 font-mono text-[10px] text-left hover:bg-[#222] transition-colors " + (playbackRate === rate ? "text-[#ff6b35]" : "text-[#e5e5e5]")}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={toggleFullscreen}
                className="w-10 h-10 flex items-center justify-center bg-[#0a0a0a] border-2 border-[#222] hover:border-[#ff6b35] hover:text-[#ff6b35] transition-colors brutal-border"
              >
                <span className="font-mono text-sm">{isFullscreen ? "⤢" : "⛶"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Title overlay */}
      {title && !showControls && !error && isValidVideoId && (
        <div className="absolute top-4 left-4 px-4 py-2 bg-black/80 backdrop-blur-sm brutal-border opacity-0 group-hover:opacity-100 transition-opacity">
          <h3 className="font-mono text-xs text-white tracking-wider">
            {title}
          </h3>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
