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
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

interface AnswerRecord {
  interactionId: string
  selectedOptionId: string | null
  isCorrect: boolean
}

export function PreviewMode({
  videoSource,
  interactions,
  onBack,
  isEmbedded = false,
}: PreviewModeProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
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

  const sortedInteractions = [...interactions].sort((a, b) => a.timestamp - b.timestamp)
  const questionInteractions = interactions.filter((i) => i.type !== "info-note")
  const totalQuestions = questionInteractions.length

  // Show/hide controls on mouse activity
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (!activeInteraction) {
        setShowControls(false)
      }
    }, 3000)
  }, [activeInteraction])

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    }
  }, [])

  // Always show controls when there's an active interaction
  useEffect(() => {
    if (activeInteraction) {
      setShowControls(true)
    }
  }, [activeInteraction])

  // Video events
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)

      for (const interaction of sortedInteractions) {
        if (
          !triggeredIds.has(interaction.id) &&
          video.currentTime >= interaction.timestamp &&
          video.currentTime < interaction.timestamp + 0.5
        ) {
          video.pause()
          setIsPlaying(false)
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
    }

    const handleDurationChange = () => setDuration(video.duration)
    const handleEnded = () => {
      setIsPlaying(false)
      if (totalQuestions > 0) {
        setShowScore(true)
      }
    }
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("durationchange", handleDurationChange)
    video.addEventListener("loadedmetadata", handleDurationChange)
    video.addEventListener("ended", handleEnded)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("durationchange", handleDurationChange)
      video.removeEventListener("loadedmetadata", handleDurationChange)
      video.removeEventListener("ended", handleEnded)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
    }
  }, [sortedInteractions, triggeredIds, totalQuestions])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeInteraction) return
      const video = videoRef.current
      if (!video) return

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault()
          if (video.paused) video.play()
          else video.pause()
          break
        case "ArrowLeft":
          e.preventDefault()
          video.currentTime = Math.max(0, video.currentTime - 10)
          break
        case "ArrowRight":
          e.preventDefault()
          video.currentTime = Math.min(video.duration, video.currentTime + 10)
          break
        case "m":
          e.preventDefault()
          video.muted = !video.muted
          setIsMuted(video.muted)
          break
        case "f":
          e.preventDefault()
          toggleFullscreen()
          break
      }
      resetControlsTimeout()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeInteraction, resetControlsTimeout])

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current
    if (!video || activeInteraction) return
    if (video.paused) video.play()
    else video.pause()
  }, [activeInteraction])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }, [])

  const handleVolumeChange = useCallback((val: number[]) => {
    const video = videoRef.current
    if (!video) return
    const v = val[0]
    setVolume(v)
    video.volume = v / 100
    if (v === 0) {
      video.muted = true
      setIsMuted(true)
    } else if (video.muted) {
      video.muted = false
      setIsMuted(false)
    }
  }, [])

  const handleSeek = useCallback(
    (val: number[]) => {
      const video = videoRef.current
      if (!video) return
      const seekTo = (val[0] / 100) * duration
      video.currentTime = seekTo
      setCurrentTime(seekTo)
    },
    [duration]
  )

  const skipBack = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(0, video.currentTime - 10)
    resetControlsTimeout()
  }, [resetControlsTimeout])

  const skipForward = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.min(video.duration, video.currentTime + 10)
    resetControlsTimeout()
  }, [resetControlsTimeout])

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }, [])

  const handleSelectOption = useCallback((optionId: string) => {
    setSelectedOption(optionId)
  }, [])

  const handleSubmitAnswer = useCallback(() => {
    if (!activeInteraction || !selectedOption) return
    const option = activeInteraction.options.find((o) => o.id === selectedOption)
    const isCorrect = option?.isCorrect ?? false
    setAnswers((prev) => [
      ...prev,
      {
        interactionId: activeInteraction.id,
        selectedOptionId: selectedOption,
        isCorrect,
      },
    ])
    setShowFeedback(true)
  }, [activeInteraction, selectedOption])

  const handleContinue = useCallback(() => {
    setActiveInteraction(null)
    setSelectedOption(null)
    setShowFeedback(false)
    const video = videoRef.current
    if (video) {
      video.play()
    }
  }, [])

  const handleRestart = useCallback(() => {
    const video = videoRef.current
    if (video) {
      video.currentTime = 0
      video.play()
    }
    setAnswers([])
    setTriggeredIds(new Set())
    setActiveInteraction(null)
    setSelectedOption(null)
    setShowFeedback(false)
    setShowScore(false)
  }, [])

  const correctCount = answers.filter((a) => a.isCorrect).length
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // Score Screen
  if (showScore) {
    const percentage =
      totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
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
          <p className="text-lg font-medium text-success">
            Tebrikler! Mukemmel skor!
          </p>
        )}
        {percentage >= 50 && percentage < 100 && (
          <p className="text-lg font-medium text-info">
            Iyi is! Biraz daha calisabilirsiniz.
          </p>
        )}
        {percentage < 50 && (
          <p className="text-lg font-medium text-destructive">
            Tekrar denemeyi dusunun.
          </p>
        )}
        <div className="flex flex-wrap gap-3 justify-center">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Editore Don
            </Button>
          )}
          <Button
            onClick={handleRestart}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Tekrar Dene
          </Button>
        </div>
      </div>
    )
  }

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
        className={`relative overflow-hidden rounded-xl bg-foreground/5 group ${
          isFullscreen ? "flex items-center justify-center" : ""
        }`}
        onMouseMove={resetControlsTimeout}
        onMouseEnter={() => setShowControls(true)}
      >
        {/* Video element */}
        <video
          ref={videoRef}
          src={videoSource.src}
          className={`w-full bg-black ${isFullscreen ? "max-h-screen" : "aspect-video"}`}
          playsInline
          onClick={togglePlayPause}
          crossOrigin="anonymous"
        />

        {/* Big play button center overlay (when paused and no interaction) */}
        {!isPlaying && !activeInteraction && (
          <button
            onClick={togglePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity"
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
              className={`w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all duration-300 ${
                isAnimating ? "scale-95 opacity-0" : "scale-100 opacity-100"
              }`}
            >
              {/* Question type badge */}
              <div className="mb-4 flex items-center gap-2">
                {activeInteraction.type === "info-note" ? (
                  <span className="rounded-full bg-info/10 px-3 py-1 text-xs font-medium text-info">
                    Bilgi Notu
                  </span>
                ) : activeInteraction.type === "true-false" ? (
                  <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
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
                    <div className="flex items-start gap-2 rounded-lg bg-info/5 p-3">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
                      <p className="text-sm text-foreground">
                        {activeInteraction.explanation}
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={handleContinue}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
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
                              <span className="text-sm text-foreground">
                                {option.text}
                              </span>
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
                        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span className="font-medium text-success">
                            Dogru Cevap!
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3">
                          <XCircle className="h-5 w-5 text-destructive" />
                          <span className="font-medium text-destructive">
                            Yanlis Cevap
                          </span>
                        </div>
                      )}
                      {activeInteraction.explanation && (
                        <div className="rounded-lg bg-secondary/50 px-4 py-3">
                          <p className="text-sm text-foreground">
                            {activeInteraction.explanation}
                          </p>
                        </div>
                      )}
                      <Button
                        onClick={handleContinue}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      >
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
            {/* Interaction marker dots on the seek bar */}
            {sortedInteractions.map((interaction) => {
              const pos = duration > 0 ? (interaction.timestamp / duration) * 100 : 0
              const answered = answers.find(
                (a) => a.interactionId === interaction.id
              )
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
            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              className="flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/20 transition-colors"
              aria-label={isPlaying ? "Duraklat" : "Oynat"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </button>

            {/* Skip back 10s */}
            <button
              onClick={skipBack}
              className="flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/20 transition-colors"
              aria-label="10 saniye geri"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            {/* Skip forward 10s */}
            <button
              onClick={skipForward}
              className="flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/20 transition-colors"
              aria-label="10 saniye ileri"
            >
              <SkipForward className="h-4 w-4" />
            </button>

            {/* Time display */}
            <span className="text-xs font-mono text-white/90 tabular-nums select-none px-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Volume */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={toggleMute}
                className="flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/20 transition-colors"
                aria-label={isMuted ? "Sesi ac" : "Sesi kapat"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
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

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/20 transition-colors"
              aria-label={isFullscreen ? "Tam ekrandan cik" : "Tam ekran"}
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Question progress below video (only when not fullscreen) */}
      {!isFullscreen && totalQuestions > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-card border border-border px-4 py-2">
          <span className="text-sm text-muted-foreground">
            {answers.length}/{totalQuestions} soru cevaplanmis
          </span>
          <div className="flex gap-1.5">
            {sortedInteractions
              .filter((i) => i.type !== "info-note")
              .map((interaction) => {
                const answered = answers.find(
                  (a) => a.interactionId === interaction.id
                )
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
