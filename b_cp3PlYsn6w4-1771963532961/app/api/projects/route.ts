import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"

// GET all projects
export async function GET() {
  try {
    const projects =
      await sql`SELECT id, title, video_url, video_type, jsonb_array_length(COALESCE(interactions, '[]'::jsonb)) as interaction_count, created_at, updated_at FROM projects ORDER BY updated_at DESC`
    return NextResponse.json({ projects })
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json(
      { error: "Projeler yuklenemedi" },
      { status: 500 }
    )
  }
}

// POST create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, videoUrl, videoType, interactions } = body

    if (!title || !videoUrl || !videoType) {
      return NextResponse.json(
        { error: "Baslik, video URL ve video tipi gerekli" },
        { status: 400 }
      )
    }

    const id = nanoid(10)
    const interactionsJson = JSON.stringify(interactions || [])

    await sql`
      INSERT INTO projects (id, title, video_url, video_type, interactions)
      VALUES (${id}, ${title}, ${videoUrl}, ${videoType}, ${interactionsJson}::jsonb)
    `

    return NextResponse.json({ id, title })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      { error: "Proje olusturulamadi" },
      { status: 500 }
    )
  }
}
