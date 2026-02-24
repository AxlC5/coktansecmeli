"use client"

import { useCallback, useRef } from "react"
import { FileText, HelpCircle, CheckCircle, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Interaction, InteractionType } from "@/lib/interactive-video-types"

interface VideoTimelineProps {
  currentTime: number
  duration: number
  interactions: Interaction[]
  onSeek: (time: number) => void
  onAddInteraction: (type: InteractionType, timestamp: number) => void
  onEditInteraction: (interaction: Interaction) => void
  onDeleteInteraction: (id: string) => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

const INTERACTION_COLORS: Record<InteractionType, string> = {
  "multiple-choice": "bg-primary",
  "true-false": "bg-success",
  "info-note": "bg-info",
}

const INTERACTION_ICONS: Record<InteractionType, typeof HelpCircle> = {
  "multiple-choice": HelpCircle,
  "true-false": CheckCircle,
  "info-note": FileText,
}

export function VideoTimeline({
  currentTime,
  duration,
  interactions,
  onSeek,
  onAddInteraction,
  onEditInteraction,
  onDeleteInteraction,
}: VideoTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null)

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!timelineRef.current || duration <= 0) return
      const rect = timelineRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percent = x / rect.width
      onSeek(percent * duration)
    },
    [duration, onSeek]
  )

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="flex flex-col gap-2">
      {/* Timeline bar */}
      <div
        ref={timelineRef}
        className="group relative h-10 cursor-pointer rounded-lg bg-secondary"
        onClick={handleTimelineClick}
        role="slider"
        aria-label="Video zaman cizelgesi"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        tabIndex={0}
      >
        {/* Progress fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-lg bg-primary/20 transition-all"
          style={{ width: `${progress}%` }}
        />

        {/* Playhead */}
        <div
          className="absolute top-0 h-full w-0.5 bg-primary shadow-sm transition-all"
          style={{ left: `${progress}%` }}
        >
          <div className="absolute -left-1.5 -top-1 h-3 w-3 rounded-full border-2 border-primary bg-card" />
        </div>

        {/* Interaction dots */}
        {interactions.map((interaction) => {
          const leftPercent = duration > 0 ? (interaction.timestamp / duration) * 100 : 0
          const Icon = INTERACTION_ICONS[interaction.type]

          return (
            <Popover key={interaction.id}>
              <PopoverTrigger asChild>
                <button
                  className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full ${INTERACTION_COLORS[interaction.type]} text-card shadow-md ring-2 ring-card transition-transform hover:scale-125 z-10`}
                  style={{ left: `${leftPercent}%` }}
                  onClick={(e) => e.stopPropagation()}
                  title={`${interaction.question} (${formatTime(interaction.timestamp)})`}
                >
                  <Icon className="h-3 w-3" />
                  <span className="sr-only">{interaction.question}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="center">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-foreground line-clamp-2">
                    {interaction.question}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(interaction.timestamp)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditInteraction(interaction)}
                      className="flex-1"
                    >
                      <Pencil className="mr-1 h-3 w-3" />
                      Duzenle
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDeleteInteraction(interaction.id)}
                      className="flex-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Sil
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )
        })}
      </div>

      {/* Time display and add interaction menu */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" className="text-xs">
              + Etkilesim Ekle ({formatTime(currentTime)})
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-2" align="end">
            <div className="flex flex-col gap-1">
              <button
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary transition-colors text-left"
                onClick={() => onAddInteraction("multiple-choice", currentTime)}
              >
                <HelpCircle className="h-4 w-4 text-primary" />
                Coktan Secmeli
              </button>
              <button
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary transition-colors text-left"
                onClick={() => onAddInteraction("true-false", currentTime)}
              >
                <CheckCircle className="h-4 w-4 text-success" />
                Dogru/Yanlis
              </button>
              <button
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary transition-colors text-left"
                onClick={() => onAddInteraction("info-note", currentTime)}
              >
                <FileText className="h-4 w-4 text-info" />
                Bilgi Notu
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
