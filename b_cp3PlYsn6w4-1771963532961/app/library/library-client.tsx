"use client"

import { useState } from "react"
import {
  Video,
  Play,
  Trash2,
  ArrowLeft,
  Library,
  Layers,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

interface Project {
  id: string
  title: string
  video_url: string
  video_type: string
  interaction_count: number
  created_at: string
  updated_at: string
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diff < 60) return "Az once"
  if (diff < 3600) return `${Math.floor(diff / 60)} dk once`
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat once`
  if (diff < 2592000) return `${Math.floor(diff / 86400)} gun once`
  return date.toLocaleDateString("tr-TR")
}

function getYouTubeThumbnail(url: string): string | null {
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/)
  if (embedMatch) return `https://img.youtube.com/vi/${embedMatch[1]}/mqdefault.jpg`
  const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/)
  if (watchMatch) return `https://img.youtube.com/vi/${watchMatch[1]}/mqdefault.jpg`
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return `https://img.youtube.com/vi/${shortMatch[1]}/mqdefault.jpg`
  return null
}

export function LibraryClient({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("Bu projeyi silmek istediginize emin misiniz?")) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id))
      }
    } catch {
      // ignore
    } finally {
      setDeleting(null)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl p-4 md:p-8">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <a href="/">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Geri</span>
              </Button>
            </a>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Library className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Kutuphane</h1>
              <p className="text-sm text-muted-foreground">
                Kaydedilmis interaktif videolar
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a href="/">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Video className="mr-1 h-4 w-4" />
                Yeni Video
              </Button>
            </a>
          </div>
        </header>

        {/* Empty state */}
        {projects.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Library className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Henuz proje yok
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
              Editorden bir video projesi olusturup kutuphaneye kaydedin.
              Kaydedilen projeler burada gorunecek.
            </p>
            <a href="/">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Video className="mr-1 h-4 w-4" />
                Editore Git
              </Button>
            </a>
          </div>
        )}

        {/* Project grid */}
        {projects.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const thumbnail = getYouTubeThumbnail(project.video_url)
              return (
                <div
                  key={project.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-muted">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={project.title}
                        className="h-full w-full object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Video className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                    {/* Play overlay */}
                    <a
                      href={`/library/${project.id}`}
                      className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg">
                        <Play className="h-5 w-5 ml-0.5" />
                      </div>
                    </a>
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="font-semibold text-foreground line-clamp-2 text-balance">
                      {project.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {project.interaction_count} etkilesim
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo(project.updated_at)}
                      </span>
                    </div>
                    <div className="mt-auto flex items-center gap-2 pt-2">
                      <a href={`/library/${project.id}`} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Play className="mr-1 h-3.5 w-3.5" />
                          Izle
                        </Button>
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(project.id)}
                        disabled={deleting === project.id}
                        aria-label="Sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
