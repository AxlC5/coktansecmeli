import { sql } from "@/lib/db"
import { LibraryClient } from "./library-client"

export const dynamic = "force-dynamic"

export default async function LibraryPage() {
  let projects: Array<{
    id: string
    title: string
    video_url: string
    video_type: string
    interaction_count: number
    created_at: string
    updated_at: string
  }> = []

  try {
    const rows = await sql`
      SELECT id, title, video_url, video_type, 
             jsonb_array_length(COALESCE(interactions, '[]'::jsonb)) as interaction_count,
             created_at, updated_at 
      FROM projects 
      ORDER BY updated_at DESC
    `
    projects = rows as typeof projects
  } catch (error) {
    console.error("Error fetching projects:", error)
  }

  return <LibraryClient initialProjects={projects} />
}
