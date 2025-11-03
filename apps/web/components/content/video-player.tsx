"use client";

import { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  hlsUrl: string;
  title: string;
  userId: string;
  description?: string;
  height?: string;
  autoplay?: boolean;
  muted?: boolean;
  thumbnail?: string;
}

export default function VideoPlayer({
  hlsUrl,
  title,
  userId,
  description = "",
  height = "67vh",
  autoplay = false,
  muted = false,
  thumbnail = "",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(muted);
  const [qualities, setQualities] = useState<
    Array<{ height: number; bitrate: number }>
  >([]);

  const isMountedRef = useRef(true);

  // Format time helper
  const formatTime = (time: number) => {
    if (!isFinite(time)) return "00:00";
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Initialize HLS
  useEffect(() => {
    isMountedRef.current = true;

    const initializePlayer = async () => {
      try {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
        script.async = true;

        script.onload = () => {
          if (!isMountedRef.current || !videoRef.current) return;

          const Hls = (window as any).Hls;

          if (!Hls?.isSupported()) {
            videoRef.current.src = hlsUrl;
            setIsLoading(false);
            return;
          }

          const hls = new Hls({
            debug: false,
            enableWorker: true,
            lowLatencyMode: true,
            maxBufferLength: 30,
          });

          hlsRef.current = hls;

          hls.on("hlsManifestParsed", () => {
            if (!isMountedRef.current) return;

            // Extract available qualities
            const levelQualities = hls.levels.map((level: any) => ({
              height: level.height,
              bitrate: level.bitrate,
            }));

            setQualities(levelQualities);
            setSelectedQuality(hls.currentLevel);
            setIsLoading(false);

            if (autoplay) {
              videoRef.current?.play().catch(() => {});
            }
          });

          hls.on("hlsError", (_event: any, data: any) => {
            if (!isMountedRef.current) return;
            if (data.fatal) {
              setError("Failed to load video");
            }
          });

          hls.loadSource(hlsUrl);
          hls.attachMedia(videoRef.current);
        };

        document.body.appendChild(script);

        return () => {
          if (hlsRef.current) {
            hlsRef.current.destroy();
          }
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
        };
      } catch (err) {
        setError("Player initialization failed");
      }
    };

    initializePlayer();

    return () => {
      isMountedRef.current = false;
    };
  }, [hlsUrl, autoplay]);

  // Handle quality change
  const handleQualityChange = (levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setSelectedQuality(levelIndex);
      setShowSettings(false);
    }
  };

  // Handle fullscreen
  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  // Handle speed change
  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSettings(false);
    }
  };

  return (
    <div className="w-full bg-black">
      <div
        ref={containerRef}
        className="relative overflow-hidden bg-black rounded-lg shadow-2xl border border-gray-800"
        style={{ height }}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={() =>
            setCurrentTime(videoRef.current?.currentTime || 0)
          }
          onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
          onVolumeChange={() => setVolume(videoRef.current?.volume || 0)}
          title={title}
          poster={thumbnail}
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-purple-600 border-t-pink-600 rounded-full animate-spin" />
              <p className="text-white text-sm font-medium">Loading video...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-center">
              <p className="text-red-500 text-lg font-bold">
                ⚠️ Playback Error
              </p>
              <p className="text-gray-200 text-sm mt-2">{error}</p>
            </div>
          </div>
        )}

        {/* Premium Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 opacity-0 hover:opacity-100 transition-opacity duration-300 group">
          {/* Progress Bar */}
          <div
            className="mb-4 group/progress cursor-pointer"
            onClick={(e) => {
              if (videoRef.current) {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                videoRef.current.currentTime = percent * duration;
              }
            }}
          >
            <div className="bg-gray-700 h-1.5 rounded-full overflow-hidden group-hover/progress:h-2 transition-all">
              <div
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-full rounded-full transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <button
                onClick={() => {
                  if (videoRef.current) {
                    isPlaying
                      ? videoRef.current.pause()
                      : videoRef.current.play();
                  }
                }}
                className="text-white hover:text-purple-400 transition text-2xl flex-shrink-0"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>

              {/* Volume Control */}
              <div className="flex items-center gap-2 group/volume">
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.muted = !isMuted;
                    }
                  }}
                  className="text-white hover:text-purple-400 transition text-lg flex-shrink-0"
                >
                  {isMuted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => {
                    const vol = parseFloat(e.target.value);
                    if (videoRef.current) {
                      videoRef.current.volume = vol;
                      videoRef.current.muted = vol === 0;
                    }
                  }}
                  className="w-20 h-1 bg-gray-700 rounded-full cursor-pointer opacity-0 group-hover/volume:opacity-100 transition-opacity"
                />
              </div>

              {/* Time Display */}
              <span className="text-white text-xs font-mono ml-2 flex-shrink-0">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Settings Menu */}
              <div className="relative group/settings">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-white hover:text-purple-400 transition text-lg flex-shrink-0"
                  title="Settings"
                >
                  ⚙️
                </button>

                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden min-w-max">
                    {/* Quality Selection */}
                    {qualities.length > 0 && (
                      <div>
                        <div className="px-4 py-2 text-gray-400 text-xs font-semibold border-b border-gray-700">
                          QUALITY
                        </div>
                        <button
                          onClick={() => handleQualityChange(-1)}
                          className={`w-full text-left px-4 py-2 text-sm transition ${
                            selectedQuality === -1
                              ? "bg-purple-600 text-white"
                              : "text-gray-300 hover:bg-gray-800"
                          }`}
                        >
                          Auto
                        </button>
                        {qualities.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleQualityChange(idx)}
                            className={`w-full text-left px-4 py-2 text-sm transition ${
                              selectedQuality === idx
                                ? "bg-purple-600 text-white"
                                : "text-gray-300 hover:bg-gray-800"
                            }`}
                          >
                            {q.height}p
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Playback Speed */}
                    <div
                      className={
                        qualities.length > 0 ? "border-t border-gray-700" : ""
                      }
                    >
                      <div className="px-4 py-2 text-gray-400 text-xs font-semibold border-b border-gray-700">
                        SPEED
                      </div>
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          className={`w-full text-left px-4 py-2 text-sm transition ${
                            playbackSpeed === speed
                              ? "bg-purple-600 text-white"
                              : "text-gray-300 hover:bg-gray-800"
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={handleFullscreen}
                className="text-white hover:text-purple-400 transition text-lg flex-shrink-0"
                title="Fullscreen"
              >
                {isFullscreen ? "⛶" : "⛶"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
