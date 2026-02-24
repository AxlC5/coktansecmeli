"use client"

import { useCallback, useRef, useState } from "react"
import { Upload, Link, X, Film } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { VideoSource } from "@/lib/interactive-video-types"

interface VideoUploadTabProps {
  videoSource: VideoSource | null
  onVideoSourceChange: (source: VideoSource | null) => void
}

export function VideoUploadTab({ videoSource, onVideoSourceChange }: VideoUploadTabProps) {
  const [url, setUrl] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [urlError, setUrlError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file && (file.type === "video/mp4" || file.type === "video/webm")) {
        const objectUrl = URL.createObjectURL(file)
        onVideoSourceChange({ type: "file", src: objectUrl, name: file.name })
      }
    },
    [onVideoSourceChange]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        const objectUrl = URL.createObjectURL(file)
        onVideoSourceChange({ type: "file", src: objectUrl, name: file.name })
      }
    },
    [onVideoSourceChange]
  )

  const handleUrlInsert = useCallback(() => {
    if (!url.trim()) {
      setUrlError("Lutfen bir URL girin")
      return
    }

    // Check for YouTube URL
    const youtubeRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    const youtubeMatch = url.match(youtubeRegex)

    if (youtubeMatch) {
      const videoId = youtubeMatch[1]
      onVideoSourceChange({
        type: "url",
        src: `https://www.youtube.com/embed/${videoId}?enablejsapi=1`,
        name: `YouTube Video (${videoId})`,
      })
      setUrl("")
      setUrlError("")
      return
    }

    // Check for direct video URL
    if (url.match(/\.(mp4|webm)(\?.*)?$/i) || url.includes("blob:")) {
      onVideoSourceChange({ type: "url", src: url, name: url })
      setUrl("")
      setUrlError("")
      return
    }

    // Try as generic URL
    onVideoSourceChange({ type: "url", src: url, name: url })
    setUrl("")
    setUrlError("")
  }, [url, onVideoSourceChange])

  const handleRemoveVideo = useCallback(() => {
    onVideoSourceChange(null)
  }, [onVideoSourceChange])

  if (videoSource) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 px-6 py-4">
          <Film className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {videoSource.name || videoSource.src}
          </span>
          <Button variant="ghost" size="icon" onClick={handleRemoveVideo} className="ml-2 h-8 w-8">
            <X className="h-4 w-4" />
            <span className="sr-only">Videoyu kaldir</span>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Video yuklendi. Soru eklemek icin &quot;2. Etkilesim Ekle&quot; sekmesine gecin.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* Drag & Drop Area */}
      <div
        className={`flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-card hover:border-primary/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-base font-medium text-foreground">
            Videoyu surukleyip birakin
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            veya dosya secmek icin tiklayin (MP4, WebM)
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="mt-2"
        >
          Dosya Sec
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm font-medium text-muted-foreground">VEYA</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* URL Input */}
      <div className="flex flex-col gap-3">
        <Label htmlFor="video-url" className="flex items-center gap-2 text-sm font-medium">
          <Link className="h-4 w-4" />
          YouTube veya Video URL
        </Label>
        <div className="flex gap-2">
          <Input
            id="video-url"
            placeholder="https://www.youtube.com/watch?v=... veya video linki"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setUrlError("")
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUrlInsert()
            }}
            className="flex-1"
          />
          <Button onClick={handleUrlInsert} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Ekle
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setUrl("")
              setUrlError("")
            }}
          >
            Temizle
          </Button>
        </div>
        {urlError && <p className="text-sm text-destructive">{urlError}</p>}
      </div>
    </div>
  )
}
