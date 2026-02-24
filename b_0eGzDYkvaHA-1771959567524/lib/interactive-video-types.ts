export type InteractionType = "multiple-choice" | "true-false" | "info-note"

export interface Option {
  id: string
  text: string
  isCorrect: boolean
}

export interface Interaction {
  id: string
  type: InteractionType
  timestamp: number // seconds
  question: string
  options: Option[]
  explanation: string
  correctFeedback?: string
  incorrectFeedback?: string
}

export interface VideoSource {
  type: "file" | "url"
  src: string
  name?: string
}

export interface ProjectData {
  videoSource: VideoSource | null
  interactions: Interaction[]
}

export type AppMode = "editor" | "preview"
export type EditorTab = "upload" | "interactions"
