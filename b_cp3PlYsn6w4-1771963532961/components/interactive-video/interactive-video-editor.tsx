"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Upload,
  Layers,
  Play,
  Download,
  Upload as ImportIcon,
  Save,
  Video,
  Share2,
  Check,
  Link,
  Library,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { VideoUploadTab } from "./video-upload-tab"
import { InteractionsTab } from "./interactions-tab"
import { PreviewMode } from "./preview-mode"
import { ThemeToggle } from "@/components/theme-toggle"
import type {
  AppMode,
  EditorTab,
  Interaction,
  ProjectData,
  VideoSource,
} from "@/lib/interactive-video-types"
import { generateShareUrl } from "@/lib/share-utils"

const STORAGE_KEY = "interactive-video-editor-data"

export function InteractiveVideoEditor() {
  const [mode, setMode] = useState<AppMode>("editor")
  const [activeTab, setActiveTab] = useState<EditorTab>("upload")
  const [videoSource, setVideoSource] = useState<VideoSource | null>(null)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [saveMessage, setSaveMessage] = useState("")
  const [shareCopied, setShareCopied] = useState(false)
  const [savingToLibrary, setSavingToLibrary] = useState(false)
  const fileImportRef = useRef<HTMLInputElement>(null)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data: ProjectData = JSON.parse(stored)
        if (data.videoSource && data.videoSource.type === "url") {
          setVideoSource(data.videoSource)
        }
        if (data.interactions) {
          setInteractions(data.interactions)
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  // Auto-save to localStorage
  useEffect(() => {
    try {
      const data: ProjectData = {
        videoSource: videoSource?.type === "url" ? videoSource : null,
        interactions,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // Ignore storage errors
    }
  }, [videoSource, interactions])

  const handleSave = useCallback(() => {
    try {
      const data: ProjectData = {
        videoSource: videoSource?.type === "url" ? videoSource : null,
        interactions,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      setSaveMessage("Kaydedildi!")
      setTimeout(() => setSaveMessage(""), 2000)
    } catch {
      setSaveMessage("Kaydetme hatasi")
      setTimeout(() => setSaveMessage(""), 2000)
    }
  }, [videoSource, interactions])

  const handleExportJSON = useCallback(() => {
    const data = {
      version: 1,
      interactions,
      videoSource: videoSource?.type === "url" ? videoSource : null,
      exportDate: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `interactive-video-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [interactions, videoSource])

  const handleImportJSON = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (data.interactions && Array.isArray(data.interactions)) {
          setInteractions(data.interactions)
        }
        if (data.videoSource) {
          setVideoSource(data.videoSource)
        }
        setSaveMessage("Basariyla iceri aktarildi!")
        setTimeout(() => setSaveMessage(""), 2000)
      } catch {
        setSaveMessage("Gecersiz JSON dosyasi")
        setTimeout(() => setSaveMessage(""), 2000)
      }
    }
    reader.readAsText(file)
    // Reset input
    e.target.value = ""
  }, [])

  const handleShare = useCallback(async () => {
    if (!videoSource || interactions.length === 0) return
    if (videoSource.type === "file") {
      setSaveMessage("Paylasim icin YouTube/URL kullanin. Dosya yuklemeleri paylasilamaz.")
      setTimeout(() => setSaveMessage(""), 4000)
      return
    }
    const url = generateShareUrl(videoSource, interactions)
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 3000)
    } catch {
      // Fallback: open in new tab
      window.open(url, "_blank")
    }
  }, [videoSource, interactions])

  const handleVideoSourceChange = useCallback((source: VideoSource | null) => {
    setVideoSource(source)
    if (source) {
      setActiveTab("interactions")
    }
  }, [])

  const handleSaveToLibrary = useCallback(async () => {
    if (!videoSource || interactions.length === 0) return
    if (videoSource.type === "file") {
      setSaveMessage("Kutuphaneye kaydetmek icin YouTube/URL kullanin.")
      setTimeout(() => setSaveMessage(""), 4000)
      return
    }

    const title = window.prompt("Proje basligini girin:", videoSource.name || "Interaktif Video")
    if (!title) return

    setSavingToLibrary(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          videoUrl: videoSource.src,
          videoType: videoSource.type,
          interactions,
        }),
      })
      if (!res.ok) throw new Error("Kaydetme hatasi")
      setSaveMessage("Kutuphaneye kaydedildi!")
      setTimeout(() => setSaveMessage(""), 3000)
    } catch {
      setSaveMessage("Kutuphaneye kaydetme hatasi")
      setTimeout(() => setSaveMessage(""), 3000)
    } finally {
      setSavingToLibrary(false)
    }
  }, [videoSource, interactions])

  // Preview mode
  if (mode === "preview" && videoSource) {
    return (
      <div className="mx-auto min-h-screen max-w-4xl p-4 md:p-8">
        <PreviewMode
          videoSource={videoSource}
          interactions={interactions}
          onBack={() => setMode("editor")}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl p-4 md:p-8">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Video className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Interactive Video Editor</h1>
            <p className="text-sm text-muted-foreground">
              Videolariniza interaktif sorular ekleyin
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href="/library">
            <Button variant="outline" size="sm">
              <Library className="mr-1 h-4 w-4" />
              Kutuphane
            </Button>
          </a>
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            disabled={interactions.length === 0}
          >
            <Download className="mr-1 h-4 w-4" />
            JSON Indir
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileImportRef.current?.click()}
          >
            <ImportIcon className="mr-1 h-4 w-4" />
            JSON Yukle
          </Button>
          <input
            ref={fileImportRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportJSON}
          />
          {videoSource && interactions.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveToLibrary}
                disabled={savingToLibrary}
              >
                <Library className="mr-1 h-4 w-4" />
                {savingToLibrary ? "Kaydediliyor..." : "Kutuphaneye Kaydet"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className={shareCopied ? "border-success text-success" : ""}
              >
                {shareCopied ? (
                  <>
                    <Check className="mr-1 h-4 w-4" />
                    Link Kopyalandi!
                  </>
                ) : (
                  <>
                    <Share2 className="mr-1 h-4 w-4" />
                    Paylas
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => setMode("preview")}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Play className="mr-1 h-4 w-4" />
                Onizle
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="mb-6 flex rounded-lg border border-border bg-card p-1">
        <button
          onClick={() => setActiveTab("upload")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "upload"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">1. Video Yukle</span>
          <span className="sm:hidden">1. Video</span>
        </button>
        <button
          onClick={() => setActiveTab("interactions")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "interactions"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span className="hidden sm:inline">2. Etkilesim Ekle</span>
          <span className="sm:hidden">2. Etkilesim</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-border bg-card p-4 md:p-6 shadow-sm">
        {activeTab === "upload" ? (
          <VideoUploadTab
            videoSource={videoSource}
            onVideoSourceChange={handleVideoSourceChange}
          />
        ) : (
          <InteractionsTab
            videoSource={videoSource}
            interactions={interactions}
            onInteractionsChange={setInteractions}
          />
        )}
      </div>

      {/* Save Button */}
      <div className="mt-6 flex items-center justify-between">
        <span
          className={`text-sm font-medium transition-opacity ${
            saveMessage ? "opacity-100" : "opacity-0"
          } ${saveMessage === "Kaydedildi!" || saveMessage === "Basariyla iceri aktarildi!" ? "text-success" : "text-destructive"}`}
        >
          {saveMessage || "\u00A0"}
        </span>
        <Button
          onClick={handleSave}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Save className="mr-2 h-4 w-4" />
          Kaydet
        </Button>
      </div>
    </div>
  )
}
