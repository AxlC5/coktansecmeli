import type { Interaction, VideoSource } from "./interactive-video-types"

export interface SharedData {
  v: number
  videoSource: VideoSource | null
  interactions: Interaction[]
}

export function encodeShareData(
  videoSource: VideoSource | null,
  interactions: Interaction[]
): string {
  const data: SharedData = {
    v: 1,
    videoSource: videoSource?.type === "url" ? videoSource : null,
    interactions,
  }
  const json = JSON.stringify(data)
  // Use base64url encoding (safe for URL params)
  const encoded = btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
  return encoded
}

export function decodeShareData(encoded: string): SharedData | null {
  try {
    // Restore base64 from base64url
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/")
    // Add padding
    while (base64.length % 4 !== 0) {
      base64 += "="
    }
    const json = decodeURIComponent(escape(atob(base64)))
    const data = JSON.parse(json) as SharedData
    if (data.interactions && Array.isArray(data.interactions)) {
      return data
    }
    return null
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
  return `${baseUrl}/watch?d=${encoded}`
}
