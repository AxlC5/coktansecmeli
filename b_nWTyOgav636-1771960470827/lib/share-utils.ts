import type { Interaction, VideoSource } from "./interactive-video-types"

export interface SharedData {
  v: number
  videoSource: VideoSource | null
  interactions: Interaction[]
}

// Compact the data before encoding to reduce size
function compactInteractions(interactions: Interaction[]): unknown[] {
  return interactions.map((i) => ({
    i: i.id,
    t: i.type === "multiple-choice" ? "mc" : i.type === "true-false" ? "tf" : "in",
    s: i.timestamp,
    q: i.question,
    o: i.options.map((o) => ({
      i: o.id,
      t: o.text,
      c: o.isCorrect ? 1 : 0,
    })),
    e: i.explanation || "",
  }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function expandInteractions(compact: any[]): Interaction[] {
  return compact.map((c) => ({
    id: c.i,
    type: c.t === "mc" ? "multiple-choice" : c.t === "tf" ? "true-false" : "info-note",
    timestamp: c.s,
    question: c.q,
    options: (c.o || []).map((o: { i: string; t: string; c: number }) => ({
      id: o.i,
      text: o.t,
      isCorrect: o.c === 1,
    })),
    explanation: c.e || "",
  }))
}

export function encodeShareData(
  videoSource: VideoSource | null,
  interactions: Interaction[]
): string {
  const data = {
    v: 1,
    vs: videoSource ? { s: videoSource.src, n: videoSource.name || "" } : null,
    ix: compactInteractions(interactions),
  }
  const json = JSON.stringify(data)
  try {
    const encoded = btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
    return encoded
  } catch {
    return ""
  }
}

export function decodeShareData(encoded: string): SharedData | null {
  try {
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/")
    while (base64.length % 4 !== 0) {
      base64 += "="
    }
    const json = decodeURIComponent(escape(atob(base64)))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = JSON.parse(json) as any

    if (!data.ix || !Array.isArray(data.ix)) return null

    const interactions = expandInteractions(data.ix)
    const videoSource: VideoSource | null = data.vs
      ? { type: "url", src: data.vs.s, name: data.vs.n || "" }
      : null

    return { v: 1, videoSource, interactions }
  } catch {
    return null
  }
}

export function generateShareUrl(
  videoSource: VideoSource | null,
  interactions: Interaction[]
): string {
  const encoded = encodeShareData(videoSource, interactions)
  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  // Use hash fragment to avoid URL length limits
  return `${baseUrl}/watch#d=${encoded}`
}
