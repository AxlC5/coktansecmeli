"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VideoTimeline } from "./video-timeline"
import { InteractionForm } from "./interaction-form"
import type { Interaction, InteractionType, VideoSource } from "@/lib/interactive-video-types"

interface InteractionsTabProps {
  videoSource: VideoSource | null
  interactions: Interaction[]
  onInteractionsChange: (interactions: Interaction[]) => void
}

export function InteractionsTab({
  videoSource,
  interactions,
  onInteractionsChange,
}: InteractionsTabProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [formState, setFormState] = useState<{
    open: boolean
    type: InteractionType
    timestamp: number
    editing: Interaction | null
  }>({
    open: false,
    type: "multiple-choice",
    timestamp: 0,
    editing: null,
  })

  const isYouTube = videoSource?.src.includes("youtube.com/embed")

  // Video time update
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleDurationChange = () => setDuration(video.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("durationchange", handleDurationChange)
    video.addEventListener("loadedmetadata", handleDurationChange)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("durationchange", handleDurationChange)
      video.removeEventListener("loadedmetadata", handleDurationChange)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
    }
  }, [videoSource])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
    } else {
      video.pause()
    }
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(!isMuted)
  }, [isMuted])

  const handleSeek = useCallback((time: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = time
    setCurrentTime(time)
  }, [])

  const handleAddInteraction = useCallback(
    (type: InteractionType, timestamp: number) => {
      const video = videoRef.current
      if (video && !video.paused) video.pause()
      setFormState({ open: true, type, timestamp, editing: null })
    },
    []
  )

  const handleEditInteraction = useCallback((interaction: Interaction) => {
    const video = videoRef.current
    if (video && !video.paused) video.pause()
    setFormState({
      open: true,
      type: interaction.type,
      timestamp: interaction.timestamp,
      editing: interaction,
    })
  }, [])

  const handleDeleteInteraction = useCallback(
    (id: string) => {
      onInteractionsChange(interactions.filter((i) => i.id !== id))
    },
    [interactions, onInteractionsChange]
  )

  const handleSaveInteraction = useCallback(
    (interaction: Interaction) => {
      const exists = interactions.find((i) => i.id === interaction.id)
      if (exists) {
        onInteractionsChange(
          interactions.map((i) => (i.id === interaction.id ? interaction : i))
        )
      } else {
        onInteractionsChange([...interactions, interaction])
      }
      setFormState({ open: false, type: "multiple-choice", timestamp: 0, editing: null })
    },
    [interactions, onInteractionsChange]
  )

  const handleCancelForm = useCallback(() => {
    setFormState({ open: false, type: "multiple-choice", timestamp: 0, editing: null })
  }, [])

  if (!videoSource) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <Play className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-center text-muted-foreground">
          Oncelikle bir video yukleyin veya URL ekleyin.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Video Player */}
      <div className="relative overflow-hidden rounded-xl bg-foreground/5">
        {isYouTube ? (
          <div className="aspect-video">
            <iframe
              src={videoSource.src}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="YouTube video"
            />
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={videoSource.src}
              className="aspect-video w-full bg-foreground/10"
              playsInline
              onClick={togglePlay}
            />
            {/* Video controls */}
            <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 border-t border-border">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="h-8 w-8"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span className="sr-only">{isPlaying ? "Duraklat" : "Oynat"}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="h-8 w-8"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
                <span className="sr-only">{isMuted ? "Sesi ac" : "Sesi kapat"}</span>
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Timeline (only for non-YouTube) */}
      {!isYouTube && (
        <VideoTimeline
          currentTime={currentTime}
          duration={duration}
          interactions={interactions}
          onSeek={handleSeek}
          onAddInteraction={handleAddInteraction}
          onEditInteraction={handleEditInteraction}
          onDeleteInteraction={handleDeleteInteraction}
        />
      )}

      {/* YouTube fallback: add interaction button */}
      {isYouTube && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-3 text-sm text-muted-foreground">
            YouTube videolari icin zaman cizelgesi desteklenmez. Saniye bazinda etkilesim ekleyebilirsiniz.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddInteraction("multiple-choice", 0)}
            >
              Coktan Secmeli Ekle
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddInteraction("true-false", 0)}
            >
              Dogru/Yanlis Ekle
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddInteraction("info-note", 0)}
            >
              Bilgi Notu Ekle
            </Button>
          </div>
        </div>
      )}

      {/* Interaction Form */}
      {formState.open && (
        <InteractionForm
          type={formState.type}
          timestamp={formState.timestamp}
          existingInteraction={formState.editing}
          onSave={handleSaveInteraction}
          onCancel={handleCancelForm}
        />
      )}

      {/* Interactions List */}
      {interactions.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Eklenen Etkilesimler ({interactions.length})
          </h3>
          <div className="flex flex-col gap-2">
            {interactions
              .sort((a, b) => a.timestamp - b.timestamp)
              .map((interaction) => {
                const formatTime = (s: number) => {
                  const m = Math.floor(s / 60)
                  const sec = Math.floor(s % 60)
                  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
                }
                const typeLabel =
                  interaction.type === "multiple-choice"
                    ? "Coktan Secmeli"
                    : interaction.type === "true-false"
                      ? "D/Y"
                      : "Bilgi"
                return (
                  <div
                    key={interaction.id}
                    className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2"
                  >
                    <span className="text-xs font-mono text-muted-foreground w-12">
                      {formatTime(interaction.timestamp)}
                    </span>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {typeLabel}
                    </span>
                    <span className="flex-1 truncate text-sm text-foreground">
                      {interaction.question}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditInteraction(interaction)}
                      className="h-7 px-2 text-xs"
                    >
                      Duzenle
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteInteraction(interaction.id)}
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    >
                      Sil
                    </Button>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
