import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { LibraryWatchClient } from "./watch-client"

export const dynamic = "force-dynamic"

export default async function LibraryWatchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const rows = await sql`SELECT * FROM projects WHERE id = ${id}`

  if (rows.length === 0) {
    notFound()
  }

  const project = rows[0]

  return (
    <LibraryWatchClient
      project={{
        id: project.id as string,
        title: project.title as string,
        videoUrl: project.video_url as string,
        videoType: project.video_type as string,
        interactions: (project.interactions ?? []) as Array<{
          id: string
          type: "multiple-choice" | "true-false" | "info-note"
          timestamp: number
          question: string
          options: Array<{ id: string; text: string; isCorrect: boolean }>
          explanation: string
        }>,
      }}
    />
  )
}
