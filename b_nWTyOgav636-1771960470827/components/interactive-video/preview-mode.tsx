"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  RotateCcw,
  Trophy,
  CheckCircle,
  XCircle,
  Info,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import type { Interaction, VideoSource } from "@/lib/interactive-video-types"

interface PreviewModeProps {
  videoSource: VideoSource
  interactions: Interaction[]
  onBack?: () => void
  isEmbedded?: boolean
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "00:00"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

interface AnswerRecord {
  interactionId: string
  selectedOptionId: string | null
  isCorrect: boolean
}

// Detect if a URL is a YouTube embed
function isYouTubeUrl(src: string): boolean {
  return src.includes("youtube.com/embed") || src.includes("youtube.com/watch") || src.includes("youtu.be")
}

// Extract YouTube video ID
function getYouTubeVideoId(src: string): string | null {
  const embedMatch = src.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/)
  if (embedMatch) return embedMatch[1]
  const watchMatch = src.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/)
  if (watchMatch) return watchMatch[1]
  const shortMatch = src.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return shortMatch[1]
  return null
}

// ==========================================
// YouTube Player Hook
// ==========================================
function useYouTubePlayer(
  containerRef: React.RefObject<HTMLDivElement | null>,
  videoId: string | null,
  enabled: boolean
) {
  const playerRef = useRef<YT.Player | null>(null)
  const [ready, setReady] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!enabled || !videoId) return

    // Load the YouTube IFrame API if not loaded
    if (!(window as Record<string, unknown>).YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      document.head.appendChild(tag)
    }

    const createPlayer = () => {
      if (!containerRef.current) return
      // Create a child div for the player
      const playerDiv = document.createElement("div")
      playerDiv.id = `yt-player-${videoId}-${Date.now()}`
      containerRef.current.innerHTML = ""
      containerRef.current.appendChild(playerDiv)

      playerRef.current = new window.YT.Player(playerDiv.id, {
        videoId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 0,
          playsinline: 1,
          iv_load_policy: 3,
        },
        events: {
          onReady: () => {
            setReady(true)
            const d = playerRef.current?.getDuration() ?? 0
            setDuration(d)
          },
          onStateChange: (event: YT.OnStateChangeEvent) => {
            // YT.PlayerState: PLAYING=1, PAUSED=2, ENDED=0, BUFFERING=3
            if (event.data === 1) {
              setIsPlaying(true)
            } else {
              setIsPlaying(false)
            }
            if (event.data === 0) {
              // Ended
              setIsPlaying(false)
            }
          },
        },
      })
    }

    if ((window as Record<string, unknown>).YT && window.YT.Player) {
      createPlayer()
    } else {
      ;(window as Record<string, unknown>).onYouTubeIframeAPIReady = createPlayer
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      try {
        playerRef.current?.destroy()
      } catch {
        // ignore
      }
      playerRef.current = null
      setReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, enabled])

  // Poll current time
  useEffect(() => {
    if (!ready) return
    pollRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
        const t = playerRef.current.getCurrentTime()
        setCurrentTime(t)
        const d = playerRef.current.getDuration()
        if (d && d > 0) setDuration(d)
      }
    }, 200)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [ready])

  const play = useCallback(() => playerRef.current?.playVideo(), [])
  const pause = useCallback(() => playerRef.current?.pauseVideo(), [])
  const seekTo = useCallback((t: number) => playerRef.current?.seekTo(t, true), [])
  const setVolumeFn = useCallback((v: number) => {
    playerRef.current?.setVolume(v)
  }, [])
  const mute = useCallback(() => playerRef.current?.mute(), [])
  const unMute = useCallback(() => playerRef.current?.unMute(), [])
  const isMutedFn = useCallback(() => playerRef.current?.isMuted() ?? false, [])

  return {
    player: playerRef,
    ready,
    currentTime,
    duration,
    isPlaying,
    play,
    pause,
    seekTo,
    setVolume: setVolumeFn,
    mute,
    unMute,
    isMuted: isMutedFn,
  }
}

// YouTube IFrame API type declarations
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId: string
          playerVars?: Record<string, number | string>
          events?: {
            onReady?: () => void
            onStateChange?: (event: YT.OnStateChangeEvent) => void
          }
        }
      ) => YT.Player
    }
    onYouTubeIframeAPIReady?: () => void
  }
  namespace YT {
    interface Player {
      playVideo(): void
      pauseVideo(): void
      seekTo(seconds: number, allowSeekAhead: boolean): void
      getCurrentTime(): number
      getDuration(): number
      setVolume(volume: number): void
      getVolume(): number
      mute(): void
      unMute(): void
      isMuted(): boolean
      destroy(): void
    }
    interface OnStateChangeEvent {
      data: number
    }
  }
}

export function PreviewMode({
  videoSource,
  interactions,
  onBack,
  isEmbedded = false,
}: PreviewModeProps) {
  const isYT = isYouTubeUrl(videoSource.src)
  const youtubeVideoId = isYT ? getYouTubeVideoId(videoSource.src) : null

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const ytContainerRef = useRef<HTMLDivElement>(null)

  // Common state
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(80)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [activeInteraction, setActiveInteraction] = useState<Interaction | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [triggeredIds, setTriggeredIds] = useState<Set<string>>(new Set())
  const [showScore, setShowScore] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)

  // YouTube player hook
  const yt = useYouTubePlayer(ytContainerRef, youtubeVideoId, isYT)

  const sortedInteractions = [...interactions].sort((a, b) => a.timestamp - b.timestamp)
  const questionInteractions = interactions.filter((i) => i.type !== "info-note")
  const totalQuestions = questionInteractions.length

  // ==========================================
  // Unified getters/setters for HTML5 vs YouTube
  // ==========================================
  const getCurrentTime = useCallback((): number => {
    if (isYT) return yt.currentTime
    return videoRef.current?.currentTime ?? 0
  }, [isYT, yt.currentTime])

  const getDuration = useCallback((): number => {
    if (isYT) return yt.duration
    return videoRef.current?.duration ?? 0
  }, [isYT, yt.duration])

  const getIsPlaying = useCallback((): boolean => {
    if (isYT) return yt.isPlaying
    return !videoRef.current?.paused
  }, [isYT, yt.isPlaying])

  const doPlay = useCallback(() => {
    if (isYT) {
      yt.play()
    } else {
      videoRef.current?.play()
    }
  }, [isYT, yt])

  const doPause = useCallback(() => {
    if (isYT) {
      yt.pause()
    } else {
      videoRef.current?.pause()
    }
  }, [isYT, yt])

  const doSeek = useCallback(
    (t: number) => {
      if (isYT) {
        yt.seekTo(t)
      } else if (videoRef.current) {
        videoRef.current.currentTime = t
      }
    },
    [isYT, yt]
  )

  // ==========================================
  // Sync state from HTML5 video
  // ==========================================
  useEffect(() => {
    if (isYT) return
    const video = videoRef.current
    if (!video) return

    const onTimeUpdate = () => setCurrentTime(video.currentTime)
    const onDurationChange = () => setDuration(video.duration)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => {
      setIsPlaying(false)
      setVideoEnded(true)
    }

    video.addEventListener("timeupdate", onTimeUpdate)
    video.addEventListener("durationchange", onDurationChange)
    video.addEventListener("loadedmetadata", onDurationChange)
    video.addEventListener("play", onPlay)
    video.addEventListener("pause", onPause)
    video.addEventListener("ended", onEnded)

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate)
      video.removeEventListener("durationchange", onDurationChange)
      video.removeEventListener("loadedmetadata", onDurationChange)
      video.removeEventListener("play", onPlay)
      video.removeEventListener("pause", onPause)
      video.removeEventListener("ended", onEnded)
    }
  }, [isYT, videoSource])

  // Sync state from YouTube
  useEffect(() => {
    if (!isYT) return
    setCurrentTime(yt.currentTime)
    setDuration(yt.duration)
    setIsPlaying(yt.isPlaying)
  }, [isYT, yt.currentTime, yt.duration, yt.isPlaying])

  // ==========================================
  // Interaction triggering
  // ==========================================
  useEffect(() => {
    const ct = isYT ? yt.currentTime : currentTime
    const playing = isYT ? yt.isPlaying : isPlaying

    if (!playing) return

    for (const interaction of sortedInteractions) {
      if (
        !triggeredIds.has(interaction.id) &&
        ct >= interaction.timestamp &&
        ct < interaction.timestamp + 0.8
      ) {
        doPause()
        setTriggeredIds((prev) => new Set([...prev, interaction.id]))
        setActiveInteraction(interaction)
        setSelectedOption(null)
        setShowFeedback(false)
        setIsAnimating(true)
        setShowControls(true)
        setTimeout(() => setIsAnimating(false), 300)
        break
      }
    }
  }, [currentTime, yt.currentTime, isYT, yt.isPlaying, isPlaying, sortedInteractions, triggeredIds, doPause])

  // Show score when video ends
  useEffect(() => {
    if (videoEnded && totalQuestions > 0) {
      setShowScore(true)
    }
  }, [videoEnded, totalQuestions])

  // ==========================================
  // Controls visibility
  // ==========================================
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => {
      if (!activeInteraction) setShowControls(false)
    }, 3000)
  }, [activeInteraction])

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (activeInteraction) setShowControls(true)
  }, [activeInteraction])

  // Fullscreen
  useEffect(() => {
    const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handleFSChange)
    return () => document.removeEventListener("fullscreenchange", handleFSChange)
  }, [])

  // ==========================================
  // Player actions
  // ==========================================
  const togglePlayPause = useCallback(() => {
    if (activeInteraction) return
    if (getIsPlaying()) doPause()
    else doPlay()
    resetControlsTimeout()
  }, [activeInteraction, getIsPlaying, doPlay, doPause, resetControlsTimeout])

  const toggleMute = useCallback(() => {
    if (isYT) {
      if (yt.isMuted()) {
        yt.unMute()
        setIsMuted(false)
      } else {
        yt.mute()
        setIsMuted(true)
      }
    } else {
      const video = videoRef.current
      if (!video) return
      video.muted = !video.muted
      setIsMuted(video.muted)
    }
  }, [isYT, yt])

  const handleVolumeChange = useCallback(
    (val: number[]) => {
      const v = val[0]
      setVolume(v)
      if (isYT) {
        yt.setVolume(v)
        if (v === 0) {
          yt.mute()
          setIsMuted(true)
        } else if (yt.isMuted()) {
          yt.unMute()
          setIsMuted(false)
        }
      } else {
        const video = videoRef.current
        if (!video) return
        video.volume = v / 100
        if (v === 0) {
          video.muted = true
          setIsMuted(true)
        } else if (video.muted) {
          video.muted = false
          setIsMuted(false)
        }
      }
    },
    [isYT, yt]
  )

  const handleSeek = useCallback(
    (val: number[]) => {
      const d = getDuration()
      if (d <= 0) return
      const seekTo = (val[0] / 100) * d
      doSeek(seekTo)
      setCurrentTime(seekTo)
    },
    [getDuration, doSeek]
  )

  const skipBack = useCallback(() => {
    const ct = getCurrentTime()
    doSeek(Math.max(0, ct - 10))
    resetControlsTimeout()
  }, [getCurrentTime, doSeek, resetControlsTimeout])

  const skipForward = useCallback(() => {
    const ct = getCurrentTime()
    const d = getDuration()
    doSeek(Math.min(d, ct + 10))
    resetControlsTimeout()
  }, [getCurrentTime, getDuration, doSeek, resetControlsTimeout])

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeInteraction) return
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault()
          togglePlayPause()
          break
        case "ArrowLeft":
          e.preventDefault()
          skipBack()
          break
        case "ArrowRight":
          e.preventDefault()
          skipForward()
          break
        case "m":
          e.preventDefault()
          toggleMute()
          break
        case "f":
          e.preventDefault()
          toggleFullscreen()
          break
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeInteraction, togglePlayPause, skipBack, skipForward, toggleMute, toggleFullscreen])

  // ==========================================
  // Quiz logic
  // ==========================================
  const handleSelectOption = useCallback((optionId: string) => {
    setSelectedOption(optionId)
  }, [])

  const handleSubmitAnswer = useCallback(() => {
    if (!activeInteraction || !selectedOption) return
    const option = activeInteraction.options.find((o) => o.id === selectedOption)
    const isCorrect = option?.isCorrect ?? false
    setAnswers((prev) => [
      ...prev,
      { interactionId: activeInteraction.id, selectedOptionId: selectedOption, isCorrect },
    ])
    setShowFeedback(true)
  }, [activeInteraction, selectedOption])

  const handleContinue = useCallback(() => {
    setActiveInteraction(null)
    setSelectedOption(null)
    setShowFeedback(false)
    doPlay()
  }, [doPlay])

  const handleRestart = useCallback(() => {
    doSeek(0)
    setTimeout(() => doPlay(), 300)
    setAnswers([])
    setTriggeredIds(new Set())
    setActiveInteraction(null)
    setSelectedOption(null)
    setShowFeedback(false)
    setShowScore(false)
    setVideoEnded(false)
  }, [doSeek, doPlay])

  const correctCount = answers.filter((a) => a.isCorrect).length
  const d = getDuration()
  const progress = d > 0 ? (currentTime / d) * 100 : 0

  // ==========================================
  // Score Screen
  // ==========================================
  if (showScore) {
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12 px-4">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <Trophy className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Sonuclariniz</h2>
        <div className="text-center">
          <p className="text-5xl font-bold text-primary">{percentage}%</p>
          <p className="mt-2 text-lg text-muted-foreground">
            {totalQuestions} sorudan {correctCount} tanesini dogru cevapladiniz
          </p>
        </div>
        {percentage === 100 && (
          <p className="text-lg font-medium text-green-600">Tebrikler! Mukemmel skor!</p>
        )}
        {percentage >= 50 && percentage < 100 && (
          <p className="text-lg font-medium text-primary">Iyi is! Biraz daha calisabilirsiniz.</p>
        )}
        {percentage < 50 && (
          <p className="text-lg font-medium text-destructive">Tekrar denemeyi dusunun.</p>
        )}
        <div className="flex flex-wrap gap-3 justify-center">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Editore Don
            </Button>
          )}
          <Button onClick={handleRestart} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <RotateCcw className="mr-2 h-4 w-4" />
            Tekrar Dene
          </Button>
        </div>
      </div>
    )
  }

  // ==========================================
  // Main Render
  // ==========================================
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      {!isEmbedded && (
        <div className="flex items-center justify-between">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Editore Don
            </Button>
          )}
          {totalQuestions > 0 && (
            <span className="text-sm text-muted-foreground">
              {answers.length}/{totalQuestions} soru cevaplanmis
            </span>
          )}
        </div>
      )}

      {/* Video container with controls */}
      <div
        ref={containerRef}
        className={`relative overflow-hidden rounded-xl bg-black group ${
          isFullscreen ? "flex items-center justify-center" : ""
        }`}
        onMouseMove={resetControlsTimeout}
        onMouseEnter={() => setShowControls(true)}
      >
        {/* Video element: HTML5 or YouTube */}
        {isYT ? (
          <div className="aspect-video w-full relative">
            <div ref={ytContainerRef} className="absolute inset-0" />
            {/* Transparent overlay to capture clicks */}
            <div
              className="absolute inset-0 z-[1] cursor-pointer"
              onClick={togglePlayPause}
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={videoSource.src}
            className={`w-full bg-black ${isFullscreen ? "max-h-screen" : "aspect-video"}`}
            playsInline
            onClick={togglePlayPause}
            crossOrigin="anonymous"
          />
        )}

        {/* Big play button center overlay (when paused and no interaction) */}
        {!isPlaying && !activeInteraction && (
          <button
            onClick={togglePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity z-[2]"
            aria-label="Oynat"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-110">
              <Play className="h-7 w-7 ml-1" />
            </div>
          </button>
        )}

        {/* Interaction overlay */}
        {activeInteraction && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 z-20">
            <div
              className={`w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all duration-300 max-h-[80vh] overflow-y-auto ${
                isAnimating ? "scale-95 opacity-0" : "scale-100 opacity-100"
              }`}
            >
              {/* Question type badge */}
              <div className="mb-4 flex items-center gap-2">
                {activeInteraction.type === "info-note" ? (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                    Bilgi Notu
                  </span>
                ) : activeInteraction.type === "true-false" ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    Dogru/Yanlis
                  </span>
                ) : (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Coktan Secmeli
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatTime(activeInteraction.timestamp)}
                </span>
              </div>

              {/* Question text */}
              <p className="mb-5 text-lg font-medium text-foreground leading-relaxed">
                {activeInteraction.question}
              </p>

              {/* Info note */}
              {activeInteraction.type === "info-note" ? (
                <div className="flex flex-col gap-4">
                  {activeInteraction.explanation && (
                    <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                      <p className="text-sm text-foreground">{activeInteraction.explanation}</p>
                    </div>
                  )}
                  <Button onClick={handleContinue} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    Devam Et
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Options */}
                  {!showFeedback && (
                    <>
                      <div className="flex flex-col gap-2">
                        {activeInteraction.options.map((option, i) => {
                          const labels = ["A", "B", "C", "D", "E", "F"]
                          const isSelected = selectedOption === option.id
                          return (
                            <button
                              key={option.id}
                              onClick={() => handleSelectOption(option.id)}
                              className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all ${
                                isSelected
                                  ? "border-primary bg-primary/5"
                                  : "border-border bg-card hover:border-primary/30"
                              }`}
                            >
                              <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm font-semibold ${
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-secondary-foreground"
                                }`}
                              >
                                {labels[i]}
                              </span>
                              <span className="text-sm text-foreground">{option.text}</span>
                            </button>
                          )
                        })}
                      </div>
                      <Button
                        onClick={handleSubmitAnswer}
                        disabled={!selectedOption}
                        className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Cevapla
                      </Button>
                    </>
                  )}

                  {/* Feedback */}
                  {showFeedback && (
                    <div className="flex flex-col gap-3">
                      {answers[answers.length - 1]?.isCorrect ? (
                        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-700">Dogru Cevap!</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3">
                          <XCircle className="h-5 w-5 text-red-600" />
                          <span className="font-medium text-red-700">Yanlis Cevap</span>
                        </div>
                      )}
                      {activeInteraction.explanation && (
                        <div className="rounded-lg bg-secondary/50 px-4 py-3">
                          <p className="text-sm text-foreground">{activeInteraction.explanation}</p>
                        </div>
                      )}
                      <Button onClick={handleContinue} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                        Devam Et
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Video Controls Bar */}
        <div
          className={`absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-3 pt-10 transition-opacity duration-300 ${
            showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Seek bar with interaction markers */}
          <div className="relative mb-2 group/seek">
            {sortedInteractions.map((interaction) => {
              const pos = d > 0 ? (interaction.timestamp / d) * 100 : 0
              const answered = answers.find((a) => a.interactionId === interaction.id)
              return (
                <div
                  key={interaction.id}
                  className="absolute top-1/2 -translate-y-1/2 z-10 pointer-events-none"
                  style={{ left: `${pos}%` }}
                >
                  <div
                    className={`h-3 w-3 rounded-full border-2 border-white shadow ${
                      answered
                        ? answered.isCorrect
                          ? "bg-green-500"
                          : "bg-red-500"
                        : "bg-yellow-400"
                    }`}
                  />
                </div>
              )
            })}
            <Slider
              value={[progress]}
              min={0}
              max={100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer [&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-track]]:bg-white/30 [&_[data-slot=slider-range]]:bg-primary [&_[data-slot=slider-thumb]]:h-4 [&_[data-slot=slider-thumb]]:w-4 [&_[data-slot=slider-thumb]]:opacity-0 group-hover/seek:[&_[data-slot=slider-thumb]]:opacity-100 [&_[data-slot=slider-thumb]]:transition-opacity"
            />
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlayPause}
              className="flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/20 transition-colors"
              aria-label={isPlaying ? "Duraklat" : "Oynat"}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </button>

            <button
              onClick={skipBack}
              className="flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/20 transition-colors"
              aria-label="10 saniye geri"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            <button
              onClick={skipForward}
              className="flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/20 transition-colors"
              aria-label="10 saniye ileri"
            >
              <SkipForward className="h-4 w-4" />
            </button>

            <span className="text-xs font-mono text-white/90 tabular-nums select-none px-1">
              {formatTime(currentTime)} / {formatTime(d)}
            </span>

            <div className="flex-1" />

            {/* Volume */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={toggleMute}
                className="flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/20 transition-colors"
                aria-label={isMuted ? "Sesi ac" : "Sesi kapat"}
              >
                {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <Slider
                value={[isMuted ? 0 : volume]}
                min={0}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="w-20 cursor-pointer [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-track]]:bg-white/30 [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:h-3 [&_[data-slot=slider-thumb]]:w-3 [&_[data-slot=slider-thumb]]:border-white"
              />
            </div>

            <button
              onClick={toggleFullscreen}
              className="flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/20 transition-colors"
              aria-label={isFullscreen ? "Tam ekrandan cik" : "Tam ekran"}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Question progress below video */}
      {!isFullscreen && totalQuestions > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-card border border-border px-4 py-2">
          <span className="text-sm text-muted-foreground">
            {answers.length}/{totalQuestions} soru cevaplanmis
          </span>
          <div className="flex gap-1.5">
            {sortedInteractions
              .filter((i) => i.type !== "info-note")
              .map((interaction) => {
                const answered = answers.find((a) => a.interactionId === interaction.id)
                return (
                  <div
                    key={interaction.id}
                    className={`h-2.5 w-2.5 rounded-full ${
                      answered
                        ? answered.isCorrect
                          ? "bg-green-500"
                          : "bg-red-500"
                        : triggeredIds.has(interaction.id)
                          ? "bg-muted-foreground/40"
                          : "bg-primary/30"
                    }`}
                    title={`${formatTime(interaction.timestamp)} - ${interaction.question}`}
                  />
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
