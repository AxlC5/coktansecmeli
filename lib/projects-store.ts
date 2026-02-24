// Client-side localStorage-based project store (replaces Neon DB)

export interface Project {
    id: string
    title: string
    video_url: string
    video_type: string
    interactions: Array<{
        id: string
        type: "multiple-choice" | "true-false" | "info-note"
        timestamp: number
        question: string
        options: Array<{ id: string; text: string; isCorrect: boolean }>
        explanation: string
    }>
    interaction_count: number
    created_at: string
    updated_at: string
}

const LIBRARY_KEY = "interactive-video-library"

export function getProjects(): Project[] {
    if (typeof window === "undefined") return []
    try {
        const data = localStorage.getItem(LIBRARY_KEY)
        if (!data) return []
        const projects: Project[] = JSON.parse(data)
        return projects.sort(
            (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
    } catch {
        return []
    }
}

export function getProject(id: string): Project | null {
    const projects = getProjects()
    return projects.find((p) => p.id === id) ?? null
}

export function saveProject(
    id: string,
    title: string,
    videoUrl: string,
    videoType: string,
    interactions: Project["interactions"]
): Project {
    const projects = getProjects()
    const now = new Date().toISOString()
    const index = projects.findIndex((p) => p.id === id)
    const project: Project = {
        id,
        title,
        video_url: videoUrl,
        video_type: videoType,
        interactions,
        interaction_count: interactions.length,
        created_at: index >= 0 ? projects[index].created_at : now,
        updated_at: now,
    }
    if (index >= 0) {
        projects[index] = project
    } else {
        projects.push(project)
    }
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(projects))
    return project
}

export function deleteProject(id: string): boolean {
    const projects = getProjects()
    const filtered = projects.filter((p) => p.id !== id)
    if (filtered.length === projects.length) return false
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(filtered))
    return true
}
