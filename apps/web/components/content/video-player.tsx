"use client";

import { Button } from "@workspace/ui/components/button";
import { Slider } from "@workspace/ui/components/slider";
import {
  Check,
  Expand,
  Gauge,
  Pause,
  Play,
  Settings,
  Shrink,
  SkipBack,
  SkipForward,
  Volume,
  Volume2,
  VolumeX,
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
  height = "75vh",
  autoplay = false,
  muted = false,
  thumbnail = "",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const previousVolumeRef = useRef(1);
  const timeoutRef = useRef<{
    controls?: NodeJS.Timeout;
    mouseMove?: NodeJS.Timeout;
  }>({});

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
    Array<{ height: number; bitrate: number; originalIndex: number }>
  >([]);
  const [showControls, setShowControls] = useState(true);
  const [isQualityOpen, setIsQualityOpen] = useState(false);
  const [isSpeedOpen, setIsSpeedOpen] = useState(false);

  const isMountedRef = useRef(true);
  const isAnyMenuOpen = isQualityOpen || isSpeedOpen;

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
    if (timeoutRef.current.mouseMove)
      clearTimeout(timeoutRef.current.mouseMove);

    setShowControls(true);
    if (timeoutRef.current.controls) clearTimeout(timeoutRef.current.controls);

    if (isPlaying && !isAnyMenuOpen) {
      timeoutRef.current.mouseMove = setTimeout(() => {
        timeoutRef.current.controls = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }, 100);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      isPlaying ? videoRef.current.pause() : videoRef.current.play();
    }
  };

  const handleSkipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(
        videoRef.current.currentTime + 10,
        duration,
      );
    }
  };

  const handleSkipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        videoRef.current.currentTime - 10,
        0,
      );
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
            maxBufferLength: 3,
            maxMaxBufferLength: 30,
            maxBufferSize: 60 * 1000 * 1000,
            maxBufferHoleDuration: 0.5,
            abrEwmaDefaultEstimate: 800000,
            abrEwmaFastVoD: 2,
            abrEwmaSlowVoD: 5,
            abrBandWidthFactor: 0.95,
            abrBandWidthUpFactor: 0.9,
            startLevel: -1,
            testBandwidth: false,
            progressive: false,
            startFragPrefetch: true,
            backBufferLength: 10,
            fragLoadingMaxRetry: 3,
            manifestLoadingMaxRetry: 3,
            levelLoadingMaxRetry: 2,
          });

          hlsRef.current = hls;

          hls.on("hlsManifestParsed", () => {
            if (!isMountedRef.current) return;

            const levelQualities = hls.levels
              .map((level: any, idx: number) => ({
                height: level.height,
                bitrate: level.bitrate,
                originalIndex: idx,
              }))
              .reverse();

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
      if (timeoutRef.current.controls)
        clearTimeout(timeoutRef.current.controls);
      if (timeoutRef.current.mouseMove)
        clearTimeout(timeoutRef.current.mouseMove);
    };
  }, [hlsUrl, autoplay]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleQualityChange = (reversedIndex: number) => {
    if (reversedIndex === -1) {
      if (hlsRef.current) {
        hlsRef.current.currentLevel = -1;
        setSelectedQuality(-1);
      }
    } else if (hlsRef.current && qualities[reversedIndex]) {
      const originalIndex = qualities[reversedIndex].originalIndex;
      hlsRef.current.currentLevel = originalIndex;
      setSelectedQuality(originalIndex);
    }
    setIsQualityOpen(false);
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
    setIsSpeedOpen(false);
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      if (!isMuted) {
        previousVolumeRef.current = volume;
        videoRef.current.volume = 0;
        setVolume(0);
      } else {
        videoRef.current.volume = previousVolumeRef.current;
        setVolume(previousVolumeRef.current);
      }
      videoRef.current.muted = !isMuted;
    }
  };

  return (
    <div className="w-full ">
      <div
        ref={containerRef}
        className="relative overflow-hidden bg-black shadow-lg border-b "
        style={{ height }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() =>
          isPlaying && !isAnyMenuOpen && setShowControls(false)
        }
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

        {/* Clickable Video Area - Pause/Play on Click Anywhere */}
        <div
          className="absolute inset-0 z-20"
          onClick={handlePlayPause}
          style={{
            cursor: "pointer",
          }}
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10">
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
          ref={controlsRef}
          className={cn(
            "absolute bottom-0 left-0 right-0 transition-opacity duration-300 z-40",
            showControls || isAnyMenuOpen ? "opacity-100" : "opacity-0",
          )}
          onMouseEnter={() => {
            setShowControls(true);
            if (timeoutRef.current.controls)
              clearTimeout(timeoutRef.current.controls);
          }}
        >
          {/* Gradient Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />

          {/* Progress Bar */}
          <div className="px-4 pt-6">
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
              <div className="relative h-1.5 bg-secondary overflow-hidden group-hover/progress:h-2 transition-all ">
                <div
                  className="h-full bg-foreground transition-all"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="relative p-4 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {/* Play/Pause */}
              <Button
                size="icon"
                variant="ghost"
                onClick={handlePlayPause}
                className="hover:bg-primary/20 size-11"
              >
                {isPlaying ? (
                  <Pause className="size-7 fill-white text-white" />
                ) : (
                  <Play className="size-7 fill-white text-white" />
                )}
              </Button>

              {/* Skip Backward 10s */}
              <Button
                size="icon"
                variant="ghost"
                onClick={handleSkipBackward}
                className="hover:bg-primary/20 size-11"
              >
                <SkipBack className="size-6 text-white" />
              </Button>

              {/* Skip Forward 10s */}
              <Button
                size="icon"
                variant="ghost"
                onClick={handleSkipForward}
                className="hover:bg-primary/20 size-11"
              >
                <SkipForward className="size-6 text-white" />
              </Button>

              {/* Time Display */}
              <span className="text-sm text-foreground ml-4">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              {/* Volume Control */}
              <div className="flex items-center gap-2 group/volume ml-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleMuteToggle}
                  className="hover:bg-primary/20 size-11"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="size-7 text-white" />
                  ) : volume < 0.5 ? (
                    <Volume className="size-7 text-white" />
                  ) : (
                    <Volume2 className="size-7 text-white" />
                  )}
                </Button>

                <Slider
                  value={[volume]}
                  onValueChange={(val) => {
                    const vol = val[0];
                    if (videoRef.current) {
                      videoRef.current.volume = vol ?? 0;
                      setVolume(vol ?? 0);
                      if (vol === 0) {
                        videoRef.current.muted = true;
                      } else if (videoRef.current.muted) {
                        videoRef.current.muted = false;
                      }
                    }
                  }}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-20 cursor-pointer opacity-0 group-hover/volume:opacity-100 transition-opacity duration-300"
                />
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Quality Menu */}
              {qualities.length > 0 && (
                <div className="relative group">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="hover:bg-primary/20 size-11"
                    onClick={() => {
                      setIsQualityOpen(!isQualityOpen);
                      setIsSpeedOpen(false);
                      if (!isQualityOpen) {
                        setShowControls(true);
                        if (timeoutRef.current.controls)
                          clearTimeout(timeoutRef.current.controls);
                      }
                    }}
                  >
                    <Settings className="size-7 text-white" />
                  </Button>

                  {isQualityOpen && (
                    <div className="absolute bottom-full right-0 mb-4 w-40 bg-background/70 backdrop-blur-lg border border-border shadow-lg z-50 overflow-hidden ">
                      <div className="px-3 py-2 text-xs uppercase tracking-wide font-semibold text-foreground/70">
                        Quality
                      </div>
                      <div className="border-t border-border" />

                      {qualities.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQualityChange(idx)}
                          className={cn(
                            "w-full text-left px-3 cursor-pointer py-2 text-sm hover:bg-primary/10 transition-colors",
                            selectedQuality === q.originalIndex &&
                              "bg-primary/20",
                          )}
                        >
                          <span className="flex items-center justify-between">
                            {q.height}p
                            {selectedQuality === q.originalIndex && (
                              <Check className="size-4" />
                            )}
                          </span>
                        </button>
                      ))}

                      <button
                        onClick={() => handleQualityChange(-1)}
                        className={cn(
                          "w-full text-left cursor-pointer px-3 py-2 text-sm hover:bg-primary/10 transition-colors",
                          selectedQuality === -1 && "bg-primary/20",
                        )}
                      >
                        <span className="flex items-center justify-between">
                          Auto
                          {selectedQuality === -1 && (
                            <Check className="size-4" />
                          )}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Speed Menu */}
              <div className="relative group">
                <Button
                  size="icon"
                  variant="ghost"
                  className="hover:bg-primary/20 size-11"
                  onClick={() => {
                    setIsSpeedOpen(!isSpeedOpen);
                    setIsQualityOpen(false);
                    if (!isSpeedOpen) {
                      setShowControls(true);
                      if (timeoutRef.current.controls)
                        clearTimeout(timeoutRef.current.controls);
                    }
                  }}
                >
                  <Gauge className="size-7 text-white" />
                </Button>

                {isSpeedOpen && (
                  <div className="absolute bottom-full right-0 mb-4 w-40 bg-background/70 backdrop-blur-lg border border-border shadow-lg z-50 overflow-hidden ">
                    <div className="px-3 py-2 text-xs uppercase tracking-wide font-semibold text-foreground/70">
                      Speed
                    </div>
                    <div className="border-t border-border" />
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => handleSpeedChange(speed)}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm hover:bg-primary/10 transition-colors",
                          playbackSpeed === speed && "bg-primary/20",
                        )}
                      >
                        <span className="flex items-center justify-between">
                          {speed}x
                          {playbackSpeed === speed && (
                            <Check className="size-4" />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen Button */}
              <Button
                size="icon"
                variant="ghost"
                onClick={handleFullscreen}
                className="hover:bg-primary/20 size-11"
              >
                {isFullscreen ? (
                  <Shrink className="size-7 text-white" />
                ) : (
                  <Expand className="size-7 text-white" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
