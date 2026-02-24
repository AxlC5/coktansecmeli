"use client"

import { PreviewMode } from "@/components/interactive-video/preview-mode"
import { ThemeToggle } from "@/components/theme-toggle"
import { Video } from "lucide-react"
import type { Interaction, VideoSource } from "@/lib/interactive-video-types"

interface LibraryWatchClientProps {
  project: {
    id: string
    title: string
    videoUrl: string
    videoType: string
    interactions: Interaction[]
  }
}

export function LibraryWatchClient({ project }: LibraryWatchClientProps) {
  const videoSource: VideoSource = {
    type: project.videoType as "file" | "url",
    src: project.videoUrl,
    name: project.title,
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl p-4 md:p-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/library"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary"
            >
              <Video className="h-4 w-4 text-primary-foreground" />
            </a>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {project.title}
              </h1>
              <p className="text-xs text-muted-foreground">
                {project.interactions.filter((i) => i.type !== "info-note").length} soru
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <PreviewMode
          videoSource={videoSource}
          interactions={project.interactions}
          onBack={() => window.history.back()}
        />
      </div>
    </main>
  )
}
