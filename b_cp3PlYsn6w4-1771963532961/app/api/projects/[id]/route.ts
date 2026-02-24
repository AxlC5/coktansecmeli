import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

// GET single project
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const rows =
      await sql`SELECT * FROM projects WHERE id = ${id}`

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Proje bulunamadi" },
        { status: 404 }
      )
    }

    return NextResponse.json({ project: rows[0] })
  } catch (error) {
    console.error("Error fetching project:", error)
    return NextResponse.json(
      { error: "Proje yuklenemedi" },
      { status: 500 }
    )
  }
}

// PUT update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, videoUrl, videoType, interactions } = body

    const interactionsJson = JSON.stringify(interactions || [])

    const result = await sql`
      UPDATE projects
      SET title = ${title},
          video_url = ${videoUrl},
          video_type = ${videoType},
          interactions = ${interactionsJson}::jsonb,
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Proje bulunamadi" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json(
      { error: "Proje guncellenemedi" },
      { status: 500 }
    )
  }
}

// DELETE project
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await sql`DELETE FROM projects WHERE id = ${id} RETURNING id`

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Proje bulunamadi" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json(
      { error: "Proje silinemedi" },
      { status: 500 }
    )
  }
}
