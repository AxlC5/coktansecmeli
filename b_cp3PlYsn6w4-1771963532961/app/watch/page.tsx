"use client"

import { useEffect, useState } from "react"
import { PreviewMode } from "@/components/interactive-video/preview-mode"
import { decodeShareData, type SharedData } from "@/lib/share-utils"
import { Video, AlertCircle } from "lucide-react"

export default function WatchPage() {
  const [sharedData, setSharedData] = useState<SharedData | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Read data from hash fragment: /watch#d=...
    const hash = window.location.hash
    if (!hash) {
      setError(true)
      setLoading(false)
      return
    }

    // Parse hash: #d=ENCODED_DATA
    const params = new URLSearchParams(hash.substring(1))
    const encoded = params.get("d")

    if (!encoded) {
      setError(true)
      setLoading(false)
      return
    }

    const data = decodeShareData(encoded)
    if (!data || !data.videoSource) {
      setError(true)
      setLoading(false)
      return
    }

    setSharedData(data)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Yukleniyor...</p>
        </div>
      </div>
    )
  }

  if (error || !sharedData || !sharedData.videoSource) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            Gecersiz Paylasim Linki
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Bu link gecersiz veya suresi dolmus olabilir. Lutfen videoyu paylasan
            kisiden yeni bir link isteyin.
          </p>
          <a
            href="/"
            className="mt-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Ana Sayfaya Don
          </a>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl p-4 md:p-8">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Video className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">
            Interaktif Video
          </h1>
          <span className="text-xs text-muted-foreground">
            {sharedData.interactions.filter((i) => i.type !== "info-note").length}{" "}
            soru
          </span>
        </div>

        <PreviewMode
          videoSource={sharedData.videoSource}
          interactions={sharedData.interactions}
          isEmbedded
        />
      </div>
    </main>
  )
}
