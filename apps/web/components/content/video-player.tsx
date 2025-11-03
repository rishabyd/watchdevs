"use client";

import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Expand,
  Pause,
  Play,
  Settings,
  Shrink,
  Volume,
  Volume2,
  VolumeX,
  Gauge,
  Zap,
} from "@workspace/ui/icons";
import { useEffect, useRef, useState } from "react";
import { cn } from "@workspace/ui/lib/utils";

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
  height = "72vh",
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
  const [selectedQuality, setSelectedQuality] = useState<number>(-1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(muted);
  const [qualities, setQualities] = useState<
    Array<{ height: number; bitrate: number }>
  >([]);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>(null);

  const isMountedRef = useRef(true);

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

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

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
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [hlsUrl, autoplay]);

  const handleQualityChange = (levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setSelectedQuality(levelIndex);
    }
  };

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

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  return (
    <div className="w-full bg-background">
      <div
        ref={containerRef}
        className="relative overflow-hidden bg-black  shadow-lg border border-border"
        style={{ height }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        {/* Video Element */}
        <video
          autoPlay
          ref={videoRef}
          className="w-full h-full"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={() =>
            setCurrentTime(videoRef.current?.currentTime || 0)
          }
          onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
          onVolumeChange={() => {
            setVolume(videoRef.current?.volume || 0);
            setIsMuted(videoRef.current?.muted || false);
          }}
          title={title}
          poster={thumbnail}
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="text-center space-y-3">
              <div className="text-2xl">⚠️</div>
              <p className="text-destructive font-semibold">{error}</p>
              <p className="text-muted-foreground text-sm">
                Please try again later
              </p>
            </div>
          </div>
        )}

        {/* Controls Container */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 transition-opacity duration-300",
            showControls ? "opacity-100" : "opacity-0",
          )}
        >
          {/* Progress Bar */}
          <div className="px-4 pt-6 pb-2">
            <div
              className="group/progress cursor-pointer"
              onClick={(e) => {
                if (videoRef.current) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  videoRef.current.currentTime = percent * duration;
                }
              }}
            >
              <div className="relative h-1 bg-secondary rounded-full overflow-hidden group-hover/progress:h-1.5 transition-all">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Gradient Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />

          {/* Control Buttons */}
          <div className="relative px-4 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {/* Play/Pause */}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  if (videoRef.current) {
                    isPlaying
                      ? videoRef.current.pause()
                      : videoRef.current.play();
                  }
                }}
                className="hover:bg-primary/20"
              >
                {isPlaying ? (
                  <Pause className="size-5 fill-white text-white" />
                ) : (
                  <Play className="size-5 fill-white text-white" />
                )}
              </Button>

              {/* Time Display */}
              <span className="text-sm font-mono text-  foreground ml-4">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              {/* Volume Control */}
              <div className="flex items-center gap-2 group/volume ml-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.muted = !isMuted;
                    }
                  }}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="size-5 text-white" />
                  ) : volume < 0.5 ? (
                    <Volume className="size-5 text-white" />
                  ) : (
                    <Volume2 className="size-5 text-white" />
                  )}
                </Button>

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
                      if (vol === 0) {
                        videoRef.current.muted = true;
                      } else if (videoRef.current.muted) {
                        videoRef.current.muted = false;
                      }
                    }
                  }}
                  className="w-20 h-1 opacity-0 group-hover/volume:opacity-100 transition-opacity duration-300 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Quality Menu */}
              {qualities.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="hover:bg-primary/20"
                    >
                      <Settings className="size-5 text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    side="top"
                    className="w-40 bg-background/50 backdrop-blur-lg z-[9999] fixed"
                  >
                    <DropdownMenuLabel className="text-xs uppercase tracking-wide">
                      Quality
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleQualityChange(-1)}
                      className={cn(
                        "cursor-pointer",
                        selectedQuality === -1 && "bg-primary/20",
                      )}
                    >
                      <span className="flex-1">Auto</span>
                    </DropdownMenuItem>
                    {qualities.map((q, idx) => (
                      <DropdownMenuItem
                        key={idx}
                        onClick={() => handleQualityChange(idx)}
                        className={cn(
                          "cursor-pointer",
                          selectedQuality === idx && "bg-primary/20",
                        )}
                      >
                        <span className="flex-1">{q.height}p</span>
                        {selectedQuality === idx && (
                          <span className="text-xs">✓</span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Speed Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="hover:bg-primary/20"
                  >
                    <Zap className="size-5 text-white" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  side="top"
                  className="w-40 bg-background/50 backdrop-blur-lg z-[9999] fixed" // ← Add z-[9999] fixed
                >
                  <DropdownMenuLabel className="text-xs uppercase tracking-wide">
                    Speed
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                    <DropdownMenuItem
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={cn(
                        "cursor-pointer",
                        playbackSpeed === speed && "bg-primary/20",
                      )}
                    >
                      <span className="flex-1">{speed}x</span>
                      {playbackSpeed === speed && (
                        <span className="text-xs">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Fullscreen Button */}
              <Button
                size="icon"
                variant="ghost"
                onClick={handleFullscreen}
                className="hover:bg-primary/20"
              >
                {isFullscreen ? (
                  <Shrink className="size-5 text-white" />
                ) : (
                  <Expand className="size-5 text-white" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
